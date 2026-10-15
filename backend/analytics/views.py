from collections import Counter
from datetime import datetime, timedelta

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminUser
from complaints.models import Complaint, public_complaints

from .reports import build_report_pdf


class DashboardStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Public numbers: the same complaints the map shows.
        visible = public_complaints()
        total_complaints = visible.count()
        resolved_count = visible.filter(status="resolved").count()
        in_progress_count = visible.filter(status="in_progress").count()
        critical_count = visible.filter(urgency_level="critical").count()

        resolution_rate = 0.0
        if total_complaints:
            resolution_rate = round((resolved_count / total_complaints) * 100, 2)

        hazard_counter = Counter()
        for complaint in visible:
            hazard_counter.update(complaint.detected_classes or [])

        most_common_hazard = hazard_counter.most_common(1)
        most_common_hazard = most_common_hazard[0][0] if most_common_hazard else None

        # Shown on the public home page, which used to print a made-up "2.4 days".
        samples = [
            c.resolution_time_days
            for c in visible.filter(status="resolved", resolved_at__isnull=False)
            if c.resolution_time_days is not None
        ]
        avg_resolution_days = round(sum(samples) / len(samples), 1) if samples else None

        return Response(
            {
                "total_complaints": total_complaints,
                "resolved_count": resolved_count,
                "in_progress_count": in_progress_count,
                "critical_count": critical_count,
                "resolution_rate": resolution_rate,
                "most_common_hazard": most_common_hazard,
                "avg_resolution_days": avg_resolution_days,
            },
            status=status.HTTP_200_OK,
        )


class WardAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        ward_stats = {}
        for complaint in public_complaints():
            ward_name = complaint.ward or "Unknown"
            record = ward_stats.setdefault(
                ward_name,
                {
                    "ward": ward_name,
                    "total_complaints": 0,
                    "resolved_count": 0,
                    "pending_count": 0,
                    "critical_count": 0,
                    "resolution_days_total": 0.0,
                    "resolution_days_count": 0,
                },
            )

            record["total_complaints"] += 1
            if complaint.status == "resolved":
                record["resolved_count"] += 1
                if complaint.resolution_time_days is not None:
                    record["resolution_days_total"] += complaint.resolution_time_days
                    record["resolution_days_count"] += 1
            else:
                record["pending_count"] += 1

            if complaint.urgency_level == "critical":
                record["critical_count"] += 1

        response_data = []
        for record in ward_stats.values():
            avg_resolution_days = None
            if record["resolution_days_count"]:
                avg_resolution_days = round(
                    record["resolution_days_total"] / record["resolution_days_count"], 2
                )

            performance_score = round(
                (record["resolved_count"] / record["total_complaints"] * 50 if record["total_complaints"] else 0)
                + max(0, 10 - (avg_resolution_days or 10)) * 5,
                2,
            )
            response_data.append(
                {
                    "ward": record["ward"],
                    "total_complaints": record["total_complaints"],
                    "resolved_count": record["resolved_count"],
                    "pending_count": record["pending_count"],
                    "critical_count": record["critical_count"],
                    "avg_resolution_days": avg_resolution_days,
                    "performance_score": performance_score,
                }
            )

        response_data.sort(key=lambda item: item["performance_score"], reverse=True)
        return Response(response_data, status=status.HTTP_200_OK)


class HazardBreakdownView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        hazard_counter = Counter()
        for complaint in public_complaints():
            hazard_counter.update(complaint.detected_classes or [])

        return Response(
            {hazard: count for hazard, count in hazard_counter.items()},
            status=status.HTTP_200_OK,
        )


class TrendView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        days = request.query_params.get("days")
        try:
            days = int(days) if days else 30
        except ValueError:
            return Response(
                {"detail": "days must be an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        today = timezone.localdate()
        labels = []
        submitted = []
        resolved = []

        for delta in range(days - 1, -1, -1):
            target_date = today - timedelta(days=delta)
            submitted_count = Complaint.objects.filter(submitted_at__date=target_date).count()
            resolved_count = Complaint.objects.filter(resolved_at__date=target_date).count()
            labels.append(target_date.isoformat())
            submitted.append(submitted_count)
            resolved.append(resolved_count)

        return Response(
            {
                "labels": labels,
                "submitted": submitted,
                "resolved": resolved,
            },
            status=status.HTTP_200_OK,
        )


class ReportPdfView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        start_date = self._parse_date(request.query_params.get("start_date"))
        end_date = self._parse_date(request.query_params.get("end_date"))

        if request.query_params.get("start_date") and start_date is None:
            return Response(
                {"detail": "start_date must be in YYYY-MM-DD format."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if request.query_params.get("end_date") and end_date is None:
            return Response(
                {"detail": "end_date must be in YYYY-MM-DD format."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pdf_bytes = build_report_pdf(start_date=start_date, end_date=end_date)

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="road_safety_report.pdf"'
        return response

    @staticmethod
    def _parse_date(value):
        if not value:
            return None
        try:
            return datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError:
            return None
