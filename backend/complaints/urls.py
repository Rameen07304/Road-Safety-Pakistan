from django.urls import path
from .views import (
    ComplaintSubmitView,
    ComplaintListView,
    ComplaintMapView,
    ComplaintTrackView,
    MyComplaintsView,
    ComplaintDetailView,
)

app_name = 'complaints'

urlpatterns = [
    path('submit/', ComplaintSubmitView.as_view(), 
         name='complaint-submit'),
    path('', ComplaintListView.as_view(), 
         name='complaint-list'),
    path('map/', ComplaintMapView.as_view(), 
         name='complaint-map'),
    path('track/', ComplaintTrackView.as_view(), 
         name='complaint-track'),
    path('my/', MyComplaintsView.as_view(), 
         name='my-complaints'),
    path('<str:complaint_id>/', 
         ComplaintDetailView.as_view(), 
         name='complaint-detail'),
]
