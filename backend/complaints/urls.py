from django.urls import path
from .views import (
    ComplaintSubmitView,
    ComplaintListView,
    ComplaintMapView,
    ComplaintTrackView,
    MyComplaintsView,
    MyDashboardView,
    ComplaintDetailView,
    ComplaintUpvoteView,
     UploadImageView,
)

app_name = 'complaints'

urlpatterns = [
    path('submit/', ComplaintSubmitView.as_view(),
         name='complaint-submit'),
     path('upload-image/', UploadImageView.as_view(), name='complaint-upload-image'),
    path('', ComplaintListView.as_view(),
         name='complaint-list'),
    path('map/', ComplaintMapView.as_view(),
         name='complaint-map'),
    path('track/', ComplaintTrackView.as_view(),
         name='complaint-track'),
    path('my/', MyComplaintsView.as_view(),
         name='my-complaints'),
    path('my-dashboard/', MyDashboardView.as_view(),
         name='my-dashboard'),
    path('<str:complaint_id>/upvote/',
         ComplaintUpvoteView.as_view(),
         name='complaint-upvote'),
    path('<str:complaint_id>/',
         ComplaintDetailView.as_view(),
         name='complaint-detail'),
]
