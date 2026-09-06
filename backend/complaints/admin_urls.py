from django.urls import path
from .views import (
    ComplaintStatusUpdateView,
    FlaggedComplaintListView,
    ApproveComplaintView,
    RejectFlaggedComplaintView,
)

urlpatterns = [
    path('complaints/<str:complaint_id>/status/',
         ComplaintStatusUpdateView.as_view(),
         name='admin-complaint-status'),
    path('complaints/flagged/',
         FlaggedComplaintListView.as_view(),
         name='admin-flagged-list'),
    path('complaints/<str:complaint_id>/approve/',
         ApproveComplaintView.as_view(),
         name='admin-complaint-approve'),
    path('complaints/<str:complaint_id>/reject/',
         RejectFlaggedComplaintView.as_view(),
         name='admin-complaint-reject'),
]
