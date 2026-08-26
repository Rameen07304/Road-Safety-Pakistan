from django.urls import path
from .views import ComplaintStatusUpdateView

urlpatterns = [
    path('complaints/<str:complaint_id>/status/',
         ComplaintStatusUpdateView.as_view(),
         name='admin-complaint-status'),
]
