from PIL import Image, UnidentifiedImageError

import cv2
import hashlib
import io
import numpy as np
import requests

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
import cloudinary.uploader
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.db.models import Avg, Count, Q

from django.db import IntegrityError, models

from .models import Complaint, ComplaintCluster, ComplaintStatusHistory, ComplaintUpvote, haversine_meters, predict_resolution_days
from .serializers import (
    ComplaintDetailSerializer,
    ComplaintListSerializer,
    ComplaintStatusUpdateSerializer,
    ComplaintSubmitSerializer,
)
from accounts.permissions import IsAdminUser
from detection.detector import analyze_image
from detection.sentiment import analyze_text
from detection.urgency import calculate_urgency


# Duplicate-detection constants
DUPLICATE_RADIUS_METERS = 50
DUPLICATE_WINDOW_DAYS = 30
LINKED_URGENCY_BONUS = 5        # +5 per additional linked report
LINKED_URGENCY_BONUS_CAP = 20   # max bonus

# Image quality thresholds
BLUR_THRESHOLD = 100.0     # Laplacian variance below this = too blurry
DARK_THRESHOLD = 30.0      # Mean brightness below this = too dark (0-255 scale)

# Spam / fake detection constants
RATE_LIMIT_WINDOW_HOURS = 1
RATE_LIMIT_MAX_COMPLAINTS = 5


def _perceptual_image_hash(image_url):
    """
    Compute a simple average-hash (aHash) for duplicate image detection.
    Resize to 8x8, convert to grayscale, compare each pixel to the mean.
    Returns a 16-char hex string, or None on failure.
    """
    try:
        if image_url.startswith(("http://", "https://")):
            resp = requests.get(image_url, timeout=10)
            resp.raise_for_status()
            img = Image.open(io.BytesIO(resp.content))
        else:
            img = Image.open(image_url)
        img = img.convert("L").resize((8, 8), Image.LANCZOS)
        pixels = np.array(img, dtype=np.float64)
        avg = pixels.mean()
        bits = (pixels > avg).flatten()
        hash_int = 0
        for bit in bits:
            hash_int = (hash_int << 1) | int(bit)
        return f"{hash_int:016x}"
    except Exception:
        return None


def _check_spam_flags(user, image_hash):
    """
    Returns (should_flag, reason) by checking:
    1. Rate limit: >5 complaints in last hour
    2. Duplicate image hash
    """
    # Rate limit check
    cutoff = timezone.now() - timezone.timedelta(hours=RATE_LIMIT_WINDOW_HOURS)
    recent_count = Complaint.objects.filter(
        citizen=user,
        submitted_at__gte=cutoff,
    ).count()
    if recent_count >= RATE_LIMIT_MAX_COMPLAINTS:
        return True, f"Rate limit: more than {RATE_LIMIT_MAX_COMPLAINTS} complaints in {RATE_LIMIT_WINDOW_HOURS} hour(s)"

    # Duplicate image hash check
    if image_hash:
        dup = Complaint.objects.filter(image_hash=image_hash).exists()
        if dup:
            return True, "Duplicate image: same photo was already submitted"

    return False, None


def _check_image_quality(pil_image):
    """
    Run quick quality checks on a PIL image using OpenCV.
    Returns None if quality is acceptable, or an error message string.
    """
    try:
        gray = cv2.cvtColor(np.array(pil_image.convert("RGB")), cv2.COLOR_RGB2GRAY)

        # Blur check: Laplacian variance
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < BLUR_THRESHOLD:
            return "Photo is too blurry, please retake."

        # Dark check: mean brightness
        mean_brightness = gray.mean()
        if mean_brightness < DARK_THRESHOLD:
            return "Photo is too dark, please retake in better lighting."

    except Exception:
        # If quality check fails for any reason, allow the upload
        pass

    return None

# Auto-assignment: primary detected_class → responsible department
DEPARTMENT_MAP = {
    "pothole": "Roads & Infrastructure",
    "broken_manhole": "Roads & Infrastructure",
    "open_manhole": "Roads & Infrastructure",
    "garbage": "Solid Waste Management",
    "speed_bump": "Traffic Engineering",
}


def _auto_assign_department(complaint):
    """Set assigned_department based on the primary detected hazard class."""
    detected = complaint.detected_classes
    if isinstance(detected, list) and detected:
        dept = DEPARTMENT_MAP.get(detected[0])
        if dept:
            complaint.assigned_department = dept
            complaint.save(update_fields=["assigned_department"])


def _find_or_create_cluster(new_complaint):
    """
    Look for existing complaints within DUPLICATE_RADIUS_METERS that share
    the same primary detected_class and were submitted in the last 30 days.
    If matches are found, group them into a ComplaintCluster and apply an
    urgency bonus.  Returns (cluster_or_None, linked_count).
    """
    detected = new_complaint.detected_classes
    if not isinstance(detected, list) or not detected:
        return None, 0

    primary_class = detected[0]
    if not primary_class:
        return None, 0
    cutoff = timezone.now() - timezone.timedelta(days=DUPLICATE_WINDOW_DAYS)

    nearby = Complaint.objects.filter(
        submitted_at__gte=cutoff,
    ).exclude(pk=new_complaint.pk)

    matches = [
        c for c in nearby
        if isinstance(c.detected_classes, list)
        and primary_class in c.detected_classes
        and haversine_meters(
            float(new_complaint.latitude), float(new_complaint.longitude),
            float(c.latitude), float(c.longitude),
        ) <= DUPLICATE_RADIUS_METERS
    ]

    if not matches:
        return None, 0

    # Re-use an existing cluster if any match already belongs to one
    cluster = next((c.cluster for c in matches if c.cluster), None)
    if cluster is None:
        cluster = ComplaintCluster.objects.create(primary_class=primary_class)
        # Move all matched complaints into the new cluster
        for c in matches:
            c.cluster = cluster
            c.save(update_fields=["cluster"])

    # Attach the new complaint to the cluster
    new_complaint.cluster = cluster
    new_complaint.save(update_fields=["cluster"])

    linked_count = cluster.complaints.count()  # includes new_complaint
    return cluster, linked_count


def _apply_cluster_urgency_bonus(complaint, linked_count):
    """Add +5 per extra report in the cluster, capped at +20."""
    if linked_count <= 1:
        return
    bonus = min((linked_count - 1) * LINKED_URGENCY_BONUS, LINKED_URGENCY_BONUS_CAP)
    complaint.urgency_score = min(complaint.urgency_score + bonus, 100)
    complaint.save(update_fields=["urgency_score"])


class ComplaintSubmitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ComplaintSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        image_url = serializer.validated_data["image_url"]
        description = serializer.validated_data["description"]
        analysis = analyze_image(image_url)
        annotated_image_url = None
        annotated_image_base64 = analysis.get("annotated_image_base64")
        if annotated_image_base64:
            annotated_upload = cloudinary.uploader.upload(
                f"data:image/jpeg;base64,{annotated_image_base64}",
                folder="complaints/annotated",
                resource_type="image",
            )
            annotated_image_url = (
                annotated_upload.get("secure_url") or annotated_upload.get("url")
            )
        sentiment = analyze_text(description)
        urgency = calculate_urgency(analysis.get("detected_classes", []), sentiment)

        # --- Spam / fake detection ---
        img_hash = _perceptual_image_hash(image_url)
        should_flag, flag_reason = _check_spam_flags(request.user, img_hash)

        with transaction.atomic():
            complaint = Complaint.objects.create(
                citizen=request.user,
                image_url=image_url,
                description=description,
                latitude=serializer.validated_data["latitude"],
                longitude=serializer.validated_data["longitude"],
                address=serializer.validated_data.get("address", ""),
                ward=serializer.validated_data.get("ward", ""),
                landmark=serializer.validated_data.get("landmark"),
                detected_classes=analysis.get("detected_classes", []),
                confidence_scores=analysis.get("confidence_scores", {}),
                annotated_image_url=annotated_image_url,
                detection_raw=analysis,
                sentiment=sentiment.get("sentiment", "neutral"),
                sentiment_keywords=sentiment.get("keywords_found", []),
                urgency_score=urgency.get("urgency_score", 0),
                urgency_level=urgency.get("urgency_level", "low"),
                image_hash=img_hash,
                flagged=should_flag,
                flag_reason=flag_reason,
            )

            # --- Duplicate complaint detection ---
            _cluster, linked_count = _find_or_create_cluster(complaint)
            if linked_count > 1:
                _apply_cluster_urgency_bonus(complaint, linked_count)
                complaint.refresh_from_db()

            # --- Auto-assign department ---
            _auto_assign_department(complaint)

        return Response(
            {
                "complaint_id": complaint.complaint_id,
                "detected_classes": complaint.detected_classes,
                "confidence_scores": complaint.confidence_scores,
                "sentiment": complaint.sentiment,
                "urgency_score": complaint.urgency_score,
                "urgency_level": complaint.urgency_level,
                "analysis": analysis,
                "sentiment_analysis": sentiment,
                "urgency_analysis": urgency,
                "linked_count": linked_count if linked_count > 1 else 0,
                "assigned_department": complaint.assigned_department,
                "flagged": complaint.flagged,
                "flag_reason": complaint.flag_reason,
            },
            status=status.HTTP_201_CREATED,
        )


class UploadImageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('image')
        if not file:
            return Response({'detail': 'No image file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate size (max 10MB)
        if file.size > 10 * 1024 * 1024:
            return Response({'detail': 'File too large. Max size is 10MB.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            image = Image.open(file)
            image.verify()
            file.seek(0)

            # --- Image quality gate ---
            image_for_quality = Image.open(file)
            file.seek(0)
            quality_error = _check_image_quality(image_for_quality)
            if quality_error:
                return Response({'detail': quality_error}, status=status.HTTP_400_BAD_REQUEST)

            res = cloudinary.uploader.upload(file, folder='complaints')
            url = res.get('secure_url') or res.get('url')
            if not url:
                return Response({'detail': 'Image upload returned no URL.'}, status=status.HTTP_502_BAD_GATEWAY)

            # Run early detection so the frontend can show a description suggestion
            analysis = analyze_image(url)
            detected_classes = analysis.get('detected_classes', [])

            return Response({
                'image_url': url,
                'detected_classes': detected_classes,
            }, status=status.HTTP_201_CREATED)
        except UnidentifiedImageError:
            return Response({'detail': 'The uploaded file is not a valid image.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({'detail': 'Failed to upload image.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ComplaintListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = Complaint.objects.all()

        # Non-admin users should not see flagged complaints
        is_admin = request.user.is_authenticated and getattr(request.user, "role", None) == "admin"
        if not is_admin:
            queryset = queryset.filter(flagged=False)
        status_filter = request.query_params.get("status")
        urgency_filter = request.query_params.get("urgency_level")
        ward_filter = request.query_params.get("ward")
        detected_classes = request.query_params.get("detected_classes")
        ordering = request.query_params.get("ordering")

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if urgency_filter:
            queryset = queryset.filter(urgency_level=urgency_filter)
        if ward_filter:
            queryset = queryset.filter(ward__iexact=ward_filter)
        if detected_classes:
            # Use icontains for SQLite compatibility (JSON contains unsupported on SQLite)
            queryset = queryset.filter(detected_classes__icontains=detected_classes)
        if ordering in ["urgency_score", "submitted_at", "-urgency_score", "-submitted_at"]:
            queryset = queryset.order_by(ordering)

        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(queryset, request)
        serializer = ComplaintListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


URGENCY_PIN_COLORS = {
    "low": "#16A34A",
    "medium": "#D97706",
    "high": "#EA580C",
    "critical": "#DC2626",
}


class ComplaintMapView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        complaints = Complaint.objects.all()

        # Non-admin users should not see flagged complaints on the map
        is_admin = request.user.is_authenticated and getattr(request.user, "role", None) == "admin"
        if not is_admin:
            complaints = complaints.filter(flagged=False)
        data = []
        for complaint in complaints:
            linked_count = complaint.cluster.complaints.count() if complaint.cluster else 0
            data.append(
                {
                    "id": str(complaint.id),
                    "complaint_id": complaint.complaint_id,
                    "latitude": complaint.latitude,
                    "longitude": complaint.longitude,
                    "lat": complaint.latitude,
                    "lng": complaint.longitude,
                    "address": complaint.address,
                    "ward": complaint.ward,
                    "description": complaint.description,
                    "urgency_level": complaint.urgency_level,
                    "urgency_score": complaint.urgency_score,
                    "color": URGENCY_PIN_COLORS.get(complaint.urgency_level, "#2563EB"),
                    "detected_classes": complaint.detected_classes,
                    "status": complaint.status,
                    "submitted_at": complaint.submitted_at,
                    "upvotes": complaint.upvotes,
                    "linked_count": linked_count,
                    "assigned_department": complaint.assigned_department,
                    "cluster_progression": complaint.cluster.progression if complaint.cluster else None,
                    "has_upvoted": (
                        complaint.upvote_records.filter(user=request.user).exists()
                        if request.user.is_authenticated
                        else False
                    ),
                }
            )
        return Response({"complaints": data, "results": data}, status=status.HTTP_200_OK)


class ComplaintTrackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        complaint_id = request.query_params.get("complaint_id")
        phone = request.query_params.get("phone")
        query = request.query_params.get("q")

        if query and not complaint_id and not phone:
            if query.upper().startswith("RSP-"):
                complaint_id = query
            else:
                phone = query

        if complaint_id:
            complaint = get_object_or_404(Complaint, complaint_id=complaint_id)
            serializer = ComplaintDetailSerializer(complaint, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        if phone:
            complaints = Complaint.objects.filter(citizen__phone=phone)
            serializer = ComplaintDetailSerializer(complaints, many=True, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(
            {"detail": "Provide complaint_id or phone to track a complaint."},
            status=status.HTTP_400_BAD_REQUEST,
        )


class MyComplaintsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        complaints = Complaint.objects.filter(citizen=request.user).order_by("-submitted_at")
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(complaints, request)
        serializer = ComplaintListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class MyDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        complaints = Complaint.objects.filter(citizen=request.user)

        stats = complaints.aggregate(
            total=Count("id"),
            resolved=Count("id", filter=Q(status="resolved")),
            in_progress=Count("id", filter=Q(status="in_progress")),
            pending=Count(
                "id",
                filter=~Q(status__in=["resolved", "in_progress"]),
            ),
        )

        most_recent = complaints.order_by("-submitted_at").first()
        most_recent_data = (
            ComplaintListSerializer(most_recent, context={"request": request}).data
            if most_recent
            else None
        )

        locations = list(
            complaints.values(
                "complaint_id", "latitude", "longitude", "urgency_level", "status"
            )
        )

        return Response(
            {
                "stats": stats,
                "most_recent_complaint": most_recent_data,
                "locations": locations,
            },
            status=status.HTTP_200_OK,
        )


class ComplaintDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, complaint_id):
        complaint = get_object_or_404(Complaint, complaint_id=complaint_id)
        serializer = ComplaintDetailSerializer(complaint, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ComplaintStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, complaint_id):
        complaint = get_object_or_404(Complaint, complaint_id=complaint_id)
        serializer = ComplaintStatusUpdateSerializer(complaint, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        old_status = complaint.status
        complaint = serializer.save()
        ComplaintStatusHistory.objects.create(
            complaint=complaint,
            old_status=old_status,
            new_status=complaint.status,
            changed_by=request.user,
            note=request.data.get("admin_notes", ""),
        )
        return Response(
            ComplaintDetailSerializer(complaint, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class ComplaintUpvoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, complaint_id):
        complaint = get_object_or_404(Complaint, complaint_id=complaint_id)
        try:
            with transaction.atomic():
                ComplaintUpvote.objects.create(complaint=complaint, user=request.user)
                complaint.upvotes = models.F("upvotes") + 1
                complaint.save(update_fields=["upvotes"])
        except IntegrityError:
            return Response(
                {"detail": "You have already upvoted this complaint."},
                status=status.HTTP_409_CONFLICT,
            )

        complaint.refresh_from_db()
        return Response(
            {"complaint_id": complaint.complaint_id, "upvotes": complaint.upvotes, "has_upvoted": True},
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, complaint_id):
        complaint = get_object_or_404(Complaint, complaint_id=complaint_id)
        deleted, _ = ComplaintUpvote.objects.filter(complaint=complaint, user=request.user).delete()
        if not deleted:
            return Response(
                {"detail": "You have not upvoted this complaint."},
                status=status.HTTP_404_NOT_FOUND,
            )

        with transaction.atomic():
            complaint.upvotes = models.F("upvotes") - 1
            complaint.save(update_fields=["upvotes"])

        complaint.refresh_from_db()
        return Response(
            {"complaint_id": complaint.complaint_id, "upvotes": complaint.upvotes, "has_upvoted": False},
            status=status.HTTP_200_OK,
        )


# ---------- Admin flagged-complaint review queue ----------

class FlaggedComplaintListView(APIView):
    """Admin-only list of flagged complaints awaiting review."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        flagged = Complaint.objects.filter(flagged=True).order_by("-submitted_at")
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(flagged, request)
        serializer = ComplaintListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class ApproveComplaintView(APIView):
    """Admin approves a flagged complaint — removes the flag."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, complaint_id):
        complaint = get_object_or_404(Complaint, complaint_id=complaint_id)
        complaint.flagged = False
        complaint.flag_reason = None
        complaint.save(update_fields=["flagged", "flag_reason"])
        return Response(
            {"complaint_id": complaint.complaint_id, "flagged": False, "detail": "Complaint approved."},
            status=status.HTTP_200_OK,
        )


class RejectFlaggedComplaintView(APIView):
    """Admin rejects a flagged complaint — marks as rejected."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, complaint_id):
        complaint = get_object_or_404(Complaint, complaint_id=complaint_id)
        old_status = complaint.status
        complaint.status = "rejected"
        complaint.flagged = False
        complaint.admin_notes = (
            (complaint.admin_notes or "") + "\n[Auto] Rejected from flagged review queue."
        ).strip()
        complaint.save(update_fields=["status", "flagged", "admin_notes"])
        ComplaintStatusHistory.objects.create(
            complaint=complaint,
            old_status=old_status,
            new_status="rejected",
            changed_by=request.user,
            note="Rejected from flagged review queue.",
        )
        return Response(
            {"complaint_id": complaint.complaint_id, "status": "rejected", "detail": "Complaint rejected."},
            status=status.HTTP_200_OK,
        )
