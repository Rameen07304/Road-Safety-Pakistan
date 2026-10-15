from django.urls import path
from accounts.views import BlockUserView
from .views import (
    AdminComplaintDeleteView,
    AdminComplaintStatsView,
    ComplaintStatusUpdateView,
    FlaggedComplaintListView,
    ApproveComplaintView,
    RejectFlaggedComplaintView,
)

urlpatterns = [
    path('complaints/stats/',
         AdminComplaintStatsView.as_view(),
         name='admin-complaint-stats'),
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
    path('users/<uuid:user_id>/block/',
         BlockUserView.as_view(),
         name='admin-user-block'),
    # Last: it would otherwise swallow complaints/stats/ and complaints/flagged/.
    path('complaints/<str:complaint_id>/',
         AdminComplaintDeleteView.as_view(),
         name='admin-complaint-delete'),
]
