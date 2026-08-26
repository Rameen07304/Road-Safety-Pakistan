HAZARD_BASE_SCORES = {
    "open_manhole": 40,
    "broken_manhole": 30,
    "pothole": 25,
    "garbage": 15,
    "speed_bump": 10,
}


def calculate_urgency(detected_classes, sentiment_result):
    """Calculate urgency score and level based on hazard detection and sentiment."""
    base_score = sum(HAZARD_BASE_SCORES.get(item, 0) for item in detected_classes)
    primary_hazard = None
    for hazard in detected_classes:
        if hazard in HAZARD_BASE_SCORES:
            primary_hazard = hazard
            break

    keyword_bonus = int(sentiment_result.get("score", 0) * 0.3)
    multiplier = sentiment_result.get("multiplier", 1.0)
    final_score = int(min((base_score * multiplier) + keyword_bonus, 100))

    if final_score >= 80:
        urgency_level = "critical"
    elif final_score >= 50:
        urgency_level = "high"
    elif final_score >= 25:
        urgency_level = "medium"
    else:
        urgency_level = "low"

    return {
        "urgency_score": final_score,
        "urgency_level": urgency_level,
        "primary_hazard": primary_hazard,
        "breakdown": {
            "base_score": base_score,
            "sentiment_multiplier": multiplier,
            "keyword_bonus": keyword_bonus,
            "final_score": final_score,
        },
    }
