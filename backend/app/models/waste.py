from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional

class WasteType(str, Enum):
    organic = "organic"
    plastic = "plastic"
    hazardous = "hazardous"
    mixed = "mixed"

class WasteAnalysisResult(BaseModel):
    waste_type: WasteType
    estimated_volume_kg: float = Field(..., ge=0)
    confidence_score: float = Field(..., ge=0, le=100)
    reasoning_summary: str

class EmissionData(BaseModel):
    co2e_kg: float
    methane_potential: Optional[float] = None
    decomposition_days: Optional[int] = None

class TrustScore(BaseModel):
    score: float = Field(..., ge=0, le=100)
    grade: str
    anomaly_detected: bool
    flags: list[str] = []