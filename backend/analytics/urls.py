from django.urls import path
from .views import (
    DashboardStatsView,
    WardAnalyticsView,
    HazardBreakdownView,
    TrendView,
    ReportPdfView,
)

app_name = 'analytics'

urlpatterns = [
    path('summary/', DashboardStatsView.as_view(),
         name='dashboard-stats'),
    path('wards/', WardAnalyticsView.as_view(),
         name='ward-analytics'),
    path('hazards/', HazardBreakdownView.as_view(),
         name='hazard-breakdown'),
    path('trends/', TrendView.as_view(),
         name='trends'),
    path('report/pdf/', ReportPdfView.as_view(),
         name='report-pdf'),
]
