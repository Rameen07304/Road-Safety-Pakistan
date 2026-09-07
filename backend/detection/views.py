from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from PIL import Image
import io

from .detector import analyze_image
from .sentiment import analyze_text
from .urgency import calculate_urgency


class AnalyzeImageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        image_url = request.data.get("image_url")
        description = request.data.get("description", "")

        if not image_url:
            return Response(
                {"detail": "image_url is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        analysis = analyze_image(image_url)
        sentiment = analyze_text(description)
        urgency = calculate_urgency(analysis.get("detected_classes", []), sentiment)

        return Response(
            {
                "analysis": analysis,
                "sentiment": sentiment,
                "urgency": urgency,
            },
            status=status.HTTP_200_OK,
        )


class DetectAnalyzeView(APIView):
    """Public endpoint for testing the AI model without creating a complaint"""
    permission_classes = [AllowAny]

    def post(self, request):
        image_file = request.FILES.get("image")

        if not image_file:
            return Response(
                {"detail": "Image file is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Read image file
            image_data = image_file.read()
            
            # Convert file to PIL Image for analysis
            image = Image.open(io.BytesIO(image_data))
            
            # Save to temporary location for analysis
            temp_path = f"/tmp/{image_file.name}"
            image.save(temp_path)
            
            # Run detection
            analysis = analyze_image(temp_path)
            
            # Check if any detections were made
            has_detections = len(analysis.get("detected_classes", [])) > 0
            
            return Response(
                {
                    "has_detections": has_detections,
                    "detected_classes": analysis.get("detected_classes", []),
                    "confidence_scores": analysis.get("confidence_scores", {}),
                    "annotated_image_base64": analysis.get("annotated_image_base64", ""),
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"detail": f"Error analyzing image: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
