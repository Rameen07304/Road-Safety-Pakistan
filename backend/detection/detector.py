import base64
import io
import os
import re

from django.conf import settings
from PIL import Image

model = None
CLASS_NAMES = [
    "speed_bump",
    "broken_manhole",
    "open_manhole",
    "pothole",
    "garbage",
]
MODEL_PATH = os.path.join(
    settings.BASE_DIR, 
    'ml_models', 
    'best.pt'
)

try:
    from ultralytics import YOLO
    if os.path.exists(MODEL_PATH):
        model = YOLO(MODEL_PATH)
        print(f"YOLOv8 model loaded: {MODEL_PATH}")
    else:
        print(f"Model not found at {MODEL_PATH}")
        print("   Detection will return empty results")
except Exception as e:
    print(f"Could not load model: {e}")


def _encode_annotated_image(image):
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")


def analyze_image(image_input):
    """Analyze an image and return detection results with annotated output."""
    if model is None:
        return {
            "has_detections": False,
            "error": "Model not loaded",
            "detections": [],
            "detected_classes": [],
            "confidence_scores": {},
            "annotated_image_base64": None,
        }

    try:
        source = image_input
        if isinstance(image_input, str) and image_input.startswith("data:image"):
            image_data = re.sub(r"^data:image/[^;]+;base64,", "", image_input)
            source = Image.open(io.BytesIO(base64.b64decode(image_data))).convert("RGB")

        results = model.predict(
            source=source,
            conf=0.25,
            iou=0.45,
            device="cpu",
            imgsz=640,
        )
        if not results or not results[0].boxes:
            return {
                "has_detections": False,
                "detections": [],
                "detected_classes": [],
                "confidence_scores": {},
                "annotated_image_base64": None,
            }

        result = results[0]
        detections = []
        scores = {}
        for box in result.boxes:
            try:
                class_index = int(box.cls.cpu().numpy()) if hasattr(box, "cls") else int(box.cls)
            except Exception:
                class_index = int(box.cls)
            class_name = CLASS_NAMES[class_index] if class_index < len(CLASS_NAMES) else str(class_index)
            try:
                confidence = float(box.conf.cpu().numpy()) if hasattr(box, "conf") else float(box.conf)
            except Exception:
                confidence = float(box.conf)
            try:
                coords = box.xyxy.cpu().numpy().tolist()[0]
            except Exception:
                coords = [float(v) for v in box.xyxy]
            detections.append(
                {
                    "class": class_name,
                    "confidence": round(confidence, 2),
                    "bbox": [round(c, 2) for c in coords],
                }
            )
            scores[class_name] = max(scores.get(class_name, 0.0), round(confidence, 2))

        unique_classes = list({item["class"] for item in detections})
        annotated_image = result.plot() if hasattr(result, "plot") else None
        annotated_base64 = None
        if annotated_image is not None:
            if hasattr(annotated_image, "shape"):
                annotated_image = Image.fromarray(annotated_image)
            annotated_base64 = _encode_annotated_image(annotated_image)

        return {
            "has_detections": bool(detections),
            "detections": sorted(detections, key=lambda x: x["confidence"], reverse=True),
            "detected_classes": unique_classes,
            "confidence_scores": scores,
            "annotated_image_base64": annotated_base64,
        }
    except Exception as exc:
        return {
            "has_detections": False,
            "error": f"Image analysis failed: {exc}",
            "detections": [],
            "detected_classes": [],
            "confidence_scores": {},
            "annotated_image_base64": None,
        }
