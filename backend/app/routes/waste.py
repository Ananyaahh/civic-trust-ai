from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional
from app.services.gemini_service import analyze_waste_image

router = APIRouter(prefix="/api/waste", tags=["waste"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 10
EXT_TO_MIME = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


def _detect_mime_from_bytes(data: bytes) -> Optional[str]:
    if len(data) >= 3 and data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if len(data) >= 8 and data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def _resolve_content_type(file: UploadFile, contents: bytes) -> Optional[str]:
    incoming = (file.content_type or "").lower().strip()
    if incoming == "image/jpg":
        incoming = "image/jpeg"
    if incoming in ALLOWED_TYPES:
        return incoming

    filename = (file.filename or "").lower()
    for ext, mime in EXT_TO_MIME.items():
        if filename.endswith(ext):
            return mime

    return _detect_mime_from_bytes(contents)

@router.post("/analyze")
async def analyze_waste(file: UploadFile = File(...)):
    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"File too large. Max {MAX_SIZE_MB}MB.")
    resolved_content_type = _resolve_content_type(file, contents)
    if resolved_content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Unsupported file type. Use JPEG, PNG, or WebP.")
    try:
        result = await analyze_waste_image(contents, resolved_content_type)
        return result
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {str(e)}")

@router.get("/health")
async def health():
    return {"status": "ok", "service": "Civic Trust AI"}
