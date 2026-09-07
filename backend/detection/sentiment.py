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


# Urdu-script equivalents. Voice dictation returns Urdu script, not Roman
# transliteration, so without these an injury reported by speech scored
# neutral and was triaged well below the same report typed in Roman Urdu.
URDU_EMERGENCY_KEYWORDS = [
    "حادثہ",
    "زخمی",
    "ہلاک",
    "موت",
    "مر گیا",
    "خون",
    "ایمبولینس",
    "ہسپتال",
    "ایمرجنسی",
    "فوری",
    "گر گیا",
]

URDU_DANGER_KEYWORDS = [
    "خطرہ",
    "خطرناک",
    "اندھیرا",
    "رات کو",
    "نظر نہیں",
    "گرا",
    "پھسل",
    "بچے",
    "اسکول",
    "سکول",
    "موٹر سائیکل",
    "گڑھا",
]

URDU_FRUSTRATION_KEYWORDS = [
    "ہفتے",
    "مہینہ",
    "سال",
    "کوئی نہیں آتا",
    "شکایت",
    "بار بار",
    "پہلے بھی",
    "کوئی پرواہ نہیں",
]

EMERGENCY_WEIGHT = 30
DANGER_WEIGHT = 15
FRUSTRATION_WEIGHT = 10

# (keywords, weight, category name), highest severity first.
KEYWORD_CATEGORIES = [
    (EMERGENCY_KEYWORDS + URDU_EMERGENCY_KEYWORDS, EMERGENCY_WEIGHT, "emergency"),
    (DANGER_KEYWORDS + URDU_DANGER_KEYWORDS, DANGER_WEIGHT, "danger"),
    (FRUSTRATION_KEYWORDS + URDU_FRUSTRATION_KEYWORDS, FRUSTRATION_WEIGHT, "frustration"),
]


def _build_matchers():
    """
    Pre-compile one word-boundary regex per keyword.

    Plain substring matching produced false escalations: "smarared" contains
    "mara" and pushed a harmless report to `emergency` (a 2.0x urgency
    multiplier).  \\b anchors each term to whole words while still allowing
    the multi-word Roman-Urdu phrases ("gir gaya", "bus palat").

    A keyword is also assigned to its highest-severity category only, so a
    term appearing in two lists -- or twice in the same list -- is counted
    once instead of silently doubling that category's score.
    """
    matchers = []
    claimed = set()
    for keywords, weight, category in KEYWORD_CATEGORIES:
        for keyword in keywords:
            if keyword in claimed:
                continue
            claimed.add(keyword)
            pattern = re.compile(r"\b" + re.escape(keyword) + r"\b")
            matchers.append((keyword, pattern, weight, category))
    return matchers


_MATCHERS = _build_matchers()


def analyze_text(text):
    """Analyze raw description text for sentiment and keyword signals."""
    if not text:
        return {"sentiment": "neutral", "score": 0, "keywords_found": [], "multiplier": 1.0}

    normalized = re.sub(r"\s+", " ", text.lower()).strip()
    keywords_found = []
    totals = {"emergency": 0, "danger": 0, "frustration": 0}

    for keyword, pattern, weight, category in _MATCHERS:
        if pattern.search(normalized):
            keywords_found.append(keyword)
            totals[category] += weight

    emergency_score = totals["emergency"]
    danger_score = totals["danger"]
    frustration_score = totals["frustration"]

    if emergency_score >= EMERGENCY_WEIGHT:
        sentiment = "emergency"
        score = min(emergency_score, 100)
        multiplier = 2.0
    elif danger_score >= 20:
        sentiment = "frustrated"
        score = min(danger_score, 100)
        multiplier = 1.5
    elif frustration_score >= FRUSTRATION_WEIGHT:
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
