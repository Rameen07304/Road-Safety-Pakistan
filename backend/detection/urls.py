from django.urls import path
from .views import AnalyzeImageView, DetectAnalyzeView

app_name = 'detection'

urlpatterns = [
    path('analyze/', AnalyzeImageView.as_view(), 
         name='analyze-image'),
    path('detect/', DetectAnalyzeView.as_view(),
         name='detect-analyze'),
]
