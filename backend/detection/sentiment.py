import re

EMERGENCY_KEYWORDS = [
    "hadsa",
    "accident",
    "zakhmi",
    "mara",
    "halaak",
    "emergency",
    "fori",
    "khoon",
    "gir gaya",
    "motor cycle gira",
    "bus palat",
    "ambulance",
    "hospital",
    "died",
    "death",
    "knocked",
    "fell",
    "fatality",
]
DANGER_KEYWORDS = [
    "khatra",
    "khatarnak",
    "andhera",
    "raat ko",
    "nazar nahi",
    "slip",
    "gira",
    "tohfa",
    "bachay",
    "school",
    "motor cycle",
    "sara din",
    "bohot bura",
    "mushkil",
    "dangerous",
    "dark",
    "cannot see",
    "slipped",
    "children",
    "school",
    "risky",
    "hazardous",
    "bad condition",
    "terrible",
]
FRUSTRATION_KEYWORDS = [
    "teen hafte",
    "mahina",
    "saal",
    "koi nahi aata",
    "koi parwah nahi",
    "shikayat kar chuka",
    "pehle bhi",
    "kabs e",
    "kabe se",
    "kabse",
    "baar baar",
    "mushkil",
    "tang aa gaye",
    "bewakoof",
    "weeks",
    "months",
    "reported before",
    "nobody",
    "no one",
    "ignored",
    "still not",
    "again",
    "same issue",
    "useless",
    "pathetic",
]

KEYWORD_CATEGORIES = [
    (EMERGENCY_KEYWORDS, 30),
    (DANGER_KEYWORDS, 15),
    (FRUSTRATION_KEYWORDS, 10),
]


def analyze_text(text):
    """Analyze raw description text for sentiment and keyword signals."""
    if not text:
        return {"sentiment": "neutral", "score": 0, "keywords_found": [], "multiplier": 1.0}

    normalized = re.sub(r"\s+", " ", text.lower()).strip()
    keywords_found = []
    emergency_score = 0
    danger_score = 0
    frustration_score = 0

    for keyword in EMERGENCY_KEYWORDS:
        if keyword in normalized:
            keywords_found.append(keyword)
            emergency_score += 30
    for keyword in DANGER_KEYWORDS:
        if keyword in normalized:
            keywords_found.append(keyword)
            danger_score += 15
    for keyword in FRUSTRATION_KEYWORDS:
        if keyword in normalized:
            keywords_found.append(keyword)
            frustration_score += 10

    if emergency_score >= 30:
        sentiment = "emergency"
        score = min(emergency_score, 100)
        multiplier = 2.0
    elif danger_score >= 20:
        sentiment = "frustrated"
        score = min(danger_score, 100)
        multiplier = 1.5
    elif frustration_score >= 10:
        sentiment = "concerned"
        score = min(frustration_score, 100)
        multiplier = 1.2
    else:
        sentiment = "neutral"
        score = 0
        multiplier = 1.0

    return {
        "sentiment": sentiment,
        "score": score,
        "keywords_found": list(dict.fromkeys(keywords_found)),
        "multiplier": multiplier,
    }
