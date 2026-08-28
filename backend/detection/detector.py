import base64
import io
import os
import re
import requests

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
HF_SPACE_BASE = "https://Trisram-road-safety-yolov8s.hf.space"
MODEL_PATH = os.path.join(
    settings.BASE_DIR, 
    settings.ML_MODEL_PATH,
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


def _prepare_local_source(image_input):
    if isinstance(image_input, str) and image_input.startswith(("http://", "https://")):
        response = requests.get(image_input, timeout=20)
        response.raise_for_status()
        return Image.open(io.BytesIO(response.content)).convert("RGB")

    if isinstance(image_input, str) and image_input.startswith("data:image"):
        image_data = re.sub(r"^data:image/[^;]+;base64,", "", image_input)
        return Image.open(io.BytesIO(base64.b64decode(image_data))).convert("RGB")

    return image_input


def _call_huggingface_space(image_input):
    source = _prepare_local_source(image_input)
    if isinstance(source, Image.Image):
        buffered = io.BytesIO()
        source.save(buffered, format="PNG")
        image_bytes = buffered.getvalue()
    else:
        with open(source, "rb") as image_file:
            image_bytes = image_file.read()

    response = requests.post(
        f"{HF_SPACE_BASE}/detect",
        files={"image": ("image.png", image_bytes, "image/png")},
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def analyze_image(image_input):
    """Analyze an image and return detection results with annotated output."""
    # First try the Hugging Face Spaces deployment
    try:
        data = _call_huggingface_space(image_input)
        if isinstance(data, dict):
            # Attempt to parse common Gradio/Spaces shapes
            detections = []
            scores = {}
            annotated_b64 = None

            # Case: response contains 'data' list with strings or dicts
            items = data.get("data") if isinstance(data, dict) else None
            if isinstance(items, list):
                for item in items:
                    # If item is a dict with detections
                    if isinstance(item, dict):
                        # look for keys
                        if "detections" in item and isinstance(item["detections"], list):
                            for det in item["detections"]:
                                # det expected to have class/confidence/bbox
                                cls = det.get("class") or det.get("label")
                                conf = det.get("confidence") or det.get("score") or 0.0
                                bbox = det.get("bbox") or det.get("box") or []
                                if cls:
                                    detections.append({"class": cls, "confidence": round(float(conf), 2), "bbox": bbox})
                                    scores[str(cls)] = max(scores.get(str(cls), 0.0), round(float(conf), 2))
                        # look for annotated image in base64 string fields
                        for v in item.values():
                            if isinstance(v, str) and v.startswith("data:image"):
                                annotated_b64 = re.sub(r"^data:image/[^;]+;base64,", "", v)
                    # If item is a string that contains base64 image
                    elif isinstance(item, str) and item.startswith("data:image"):
                        annotated_b64 = re.sub(r"^data:image/[^;]+;base64,", "", item)

            # Case: some spaces return top-level keys
            if not detections and isinstance(data, dict):
                response_detections = data.get("predictions") or data.get("detections")
                if isinstance(response_detections, list):
                    for det in response_detections:
                        if isinstance(det, dict):
                            cls = det.get("label") or det.get("class")
                            conf = det.get("conf_raw") or det.get("confidence") or det.get("score") or 0.0
                            if isinstance(conf, str):
                                conf = float(conf.rstrip("%")) / 100 if conf.endswith("%") else float(conf)
                            bbox = det.get("bbox") or det.get("box") or []
                            if cls:
                                detections.append({"class": cls, "confidence": round(float(conf), 2), "bbox": bbox})
                                scores[str(cls)] = max(scores.get(str(cls), 0.0), round(float(conf), 2))
                result_image = data.get("result_image")
                if isinstance(result_image, str) and result_image.startswith("data:image"):
                    annotated_b64 = re.sub(r"^data:image/[^;]+;base64,", "", result_image)

            unique_classes = list({item["class"] for item in detections})
            if detections or annotated_b64:
                return {
                    "has_detections": bool(detections),
                    "detections": sorted(detections, key=lambda x: x["confidence"], reverse=True),
                    "detected_classes": unique_classes,
                    "confidence_scores": scores,
                    "annotated_image_base64": annotated_b64,
                }
    except Exception:
        pass

    # If HF failed or returned nothing, fall back to local model if available
    if model is None:
        return {
            "has_detections": False,
            "error": "Model not loaded and external service unavailable",
            "detections": [],
            "detected_classes": [],
            "confidence_scores": {},
            "annotated_image_base64": None,
        }

    try:
        source = _prepare_local_source(image_input)

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
