import os
import json
import google.generativeai as genai

from app.core.config import settings
from app.models.waste import WasteAnalysisResult


# =========================
# INIT CLIENT (ONCE)
# =========================

MODEL_NAME = os.getenv("GEMINI_MODEL", "").strip()
MODEL_CANDIDATES = [
    name
    for name in [
        MODEL_NAME or None,
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
        "gemini-1.5-pro-latest",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
    ]
    if name
]
AVAILABLE_MODELS_CACHE = None

genai.configure(api_key=settings.GEMINI_API_KEY)


# =========================
# CONSTANTS
# =========================

EMISSION_FACTORS = {
    "organic": 0.45,
    "plastic": 2.1,
    "hazardous": 3.8,
    "mixed": 1.2,
}

DECOMPOSITION_DAYS = {
    "organic": 30,
    "plastic": 164250,
    "hazardous": None,
    "mixed": 90,
}

SYSTEM_PROMPT = """You are an environmental audit AI.
Analyze the uploaded urban waste image and return ONLY valid JSON with no markdown:

{
  "waste_type": "organic | plastic | hazardous | mixed",
  "estimated_volume_kg": <number>,
  "confidence_score": <0-100>,
  "reasoning_summary": "<explanation>"
}
"""

SYSTEM_INSTRUCTION = (
    "You are an environmental audit AI. Return only valid JSON and no markdown."
)


def _extract_json_text(raw_text: str) -> str:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and start < end:
        return cleaned[start:end + 1]
    return cleaned


def _get_available_models():
    global AVAILABLE_MODELS_CACHE
    if AVAILABLE_MODELS_CACHE is not None:
        return AVAILABLE_MODELS_CACHE

    discovered = []
    for m in genai.list_models():
        methods = getattr(m, "supported_generation_methods", []) or []
        if "generateContent" not in methods:
            continue
        name = getattr(m, "name", "")
        if not name:
            continue
        if name.startswith("models/"):
            name = name.split("/", 1)[1]
        discovered.append(name)

    AVAILABLE_MODELS_CACHE = discovered
    return discovered


def _ordered_model_candidates():
    priority = [
        MODEL_NAME or None,
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
        "gemini-1.5-pro-latest",
    ]
    ordered = [m for m in priority if m]

    try:
        available = _get_available_models()
    except Exception:
        # If model listing fails, use static fallbacks.
        available = []

    if available:
        selected = [m for m in ordered if m in available]
        remaining = [m for m in available if m.startswith("gemini-") and m not in selected]
        return selected + remaining

    return ordered


def _generate_response_with_fallback(image_bytes: bytes, content_type: str):
    last_error = None
    attempted = []
    for model_name in _ordered_model_candidates():
        attempted.append(model_name)
        try:
            model = genai.GenerativeModel(
                model_name,
                system_instruction=SYSTEM_INSTRUCTION,
            )
            return model.generate_content(
                contents=[
                    SYSTEM_PROMPT,
                    {"mime_type": content_type, "data": image_bytes},
                ],
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0,
                },
            )
        except Exception as e:
            last_error = e
            message = str(e)
            if "404" not in message and "not found" not in message.lower():
                raise

    raise ValueError(
        f"No available Gemini model from candidates {attempted}. "
        f"Last error: {last_error}"
    )


# =========================
# CALCULATIONS
# =========================

def calculate_emissions(waste_type, volume_kg):
    factor = EMISSION_FACTORS.get(waste_type, 1.2)
    co2e = round(volume_kg * factor, 3)
    methane = round(co2e * 0.15, 3) if waste_type in ["organic", "mixed"] else None

    return {
        "co2e_kg": co2e,
        "methane_potential": methane,
        "decomposition_days": DECOMPOSITION_DAYS.get(waste_type),
    }


def calculate_trust_score(confidence, volume_kg, waste_type):
    score = confidence
    flags = []
    anomaly = False

    if volume_kg > 1000:
        flags.append("Unusually high volume — manual verification recommended")
        score = max(0, score - 15)
        anomaly = True

    if confidence < 40:
        flags.append("Low AI confidence — image quality may be insufficient")
        anomaly = True

    if waste_type == "hazardous":
        flags.append("Hazardous waste detected — escalate to municipal authority")

    grade = (
        "A" if score >= 80
        else "B" if score >= 65
        else "C" if score >= 50
        else "D"
    )

    return {
        "score": round(score, 1),
        "grade": grade,
        "anomaly_detected": anomaly,
        "flags": flags,
    }


def get_recommendations(waste_type, volume_kg, trust_score):
    recs = []

    if waste_type == "organic":
        recs.append("Deploy composting unit within 48 hours to prevent methane release.")
        recs.append("Alert municipal organic waste collection team.")

    elif waste_type == "plastic":
        recs.append("Initiate plastic segregation and recycling pickup.")
        recs.append("Tag location for EPR reporting.")

    elif waste_type == "hazardous":
        recs.append("URGENT: Dispatch certified hazardous waste disposal team immediately.")
        recs.append("Cordon area and notify environmental protection authority.")

    else:
        recs.append("Schedule mixed waste collection and sorting facility delivery.")

    if volume_kg > 100:
        recs.append(f"High volume ({volume_kg}kg) — consider bulk collection vehicle.")

    if trust_score["anomaly_detected"]:
        recs.append("Anomaly detected — cross-verify with satellite imagery.")

    return recs


# =========================
# MAIN FUNCTION
# =========================

async def analyze_waste_image(image_bytes: bytes, content_type: str) -> dict:

    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is missing in backend/.env")

    response = _generate_response_with_fallback(image_bytes, content_type)

    raw_text = (getattr(response, "text", "") or "").strip()
    if not raw_text:
        raise ValueError("Gemini returned an empty response")
    raw_text = _extract_json_text(raw_text)

    try:
        analysis_data = json.loads(raw_text)
    except json.JSONDecodeError:
        raise ValueError(f"Model returned invalid JSON:\n{raw_text}")

    analysis = WasteAnalysisResult(**analysis_data)

    emissions = calculate_emissions(
        analysis.waste_type,
        analysis.estimated_volume_kg
    )

    trust = calculate_trust_score(
        analysis.confidence_score,
        analysis.estimated_volume_kg,
        analysis.waste_type
    )

    recs = get_recommendations(
        analysis.waste_type,
        analysis.estimated_volume_kg,
        trust
    )

    ward_impact = (
        f"This deposit contributes approximately {emissions['co2e_kg']}kg CO₂e "
        f"to ward-level emissions. "
        f"{analysis.estimated_volume_kg}kg of {analysis.waste_type} waste "
        f"represents {round(analysis.estimated_volume_kg / 2000 * 100, 2)}% "
        f"of average monthly ward capacity."
    )

    return {
        "analysis": analysis.model_dump(),
        "emissions": emissions,
        "trust": trust,
        "ward_impact": ward_impact,
        "recommendations": recs,
    }
