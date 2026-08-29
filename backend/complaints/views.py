from PIL import Image, UnidentifiedImageError

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
import cloudinary.uploader
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.db.models import Count, Q

from django.db import IntegrityError, models

from .models import Complaint, ComplaintStatusHistory, ComplaintUpvote
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
            )

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
            res = cloudinary.uploader.upload(file, folder='complaints')
            url = res.get('secure_url') or res.get('url')
            if not url:
                return Response({'detail': 'Image upload returned no URL.'}, status=status.HTTP_502_BAD_GATEWAY)
            return Response({'image_url': url}, status=status.HTTP_201_CREATED)
        except UnidentifiedImageError:
            return Response({'detail': 'The uploaded file is not a valid image.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({'detail': 'Failed to upload image.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ComplaintListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = Complaint.objects.all()
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
            queryset = queryset.filter(detected_classes__contains=[detected_classes])
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
        data = []
        for complaint in complaints:
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
