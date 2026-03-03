# CivicTrust AI

AI-powered, map-first civic intelligence platform for garbage dump and complaint management across India.

CivicTrust AI converts on-ground image evidence into actionable municipal intelligence through a drilldown workflow:

`India -> State -> City -> Ward -> Dump Site`

It combines geotagged uploads, AI waste analysis, complaint intensity heatmaps, trust scoring, and a policy simulation layer.

---

## Why This Project Matters

Urban complaints often fail due to disconnected systems: one app for reporting, another for field ops, no unified geospatial truth, and no transparent confidence score.

CivicTrust AI solves this by linking every uploaded complaint to:
- exact geography (state/city/ward)
- AI-derived waste insights (type, confidence, emissions)
- map drilldown and verification status
- decision support (simulation + ESG metrics)

---

## Core Features

### 1) Upload-to-Map Incident Pipeline
- User uploads image evidence.
- User maps complaint manually to state/city/ward.
- Optional location assist via:
  - browser GPS (if permission granted)
  - IP/VPN fallback (IP geolocation)
- Complaint is pinned to map and linked to metadata.

### 2) Real Interactive Map (Not Static Polygons)
- Leaflet-based slippy map with pan/zoom.
- Satellite-style tiles.
- Drilldown flow:
  - click state marker -> zoom to state
  - click city marker -> zoom to city
  - click ward marker -> near building-level zoom
- Uploaded complaint marker opens image/details popup.

### 3) Complaint Intensity Heatmap Layer
- Toggleable heatmap overlay (`Complaint Heatmap`).
- Intensity derived from complaint risk signals (methane, trust, status) and upload-priority boost.
- Designed for fast hotspot scanning and allocation decisions.

### 4) Trust + Emissions Intelligence
- Per-ward methane risk and trust score.
- Emission rollups (CO2e, CH4, N2O).
- Status lifecycle (`Reported`, `Verified`, `Resolved`).

### 5) Scenario Simulation + ESG
- Policy sliders for composting, collection, and drone assistance.
- Projected reductions and budget efficiency.
- Investor-facing operational snapshot.

### 6) Civic Concierge AI Layer
- Query by state/city/ward/upload context.
- Fast explanation of alerts, trust, and recommended actions.

---

## Technical Architecture

```mermaid
flowchart LR
  A[Citizen/Field Upload] --> B[Frontend React App]
  B --> C[FastAPI Backend]
  C --> D[Gemini Analysis Engine]
  C --> E[Fallback Analyzer]
  C --> F[Emission + Trust Calculators]
  B --> G[Leaflet Real Map + Heat Layer]
  G --> H[State/City/Ward Drilldown]
  F --> B
  D --> B
  E --> B
```

### Frontend
- React 18 + Vite
- Layered UX (Upload -> Map Explorer -> Simulation -> Concierge)
- Leaflet via CDN in `index.html`
- Heatmap via `leaflet.heat` plugin
- Landing video hero + premium dashboard styling

### Backend
- FastAPI + Uvicorn
- Endpoint-driven image analysis pipeline
- Pydantic models for structured outputs
- Gemini integration for AI analysis
- Robust fallback mode when AI dependency/key unavailable

### AI/Analytics
- Waste classification (`organic`, `plastic`, `hazardous`, `mixed`)
- Confidence scoring
- CO2e + methane potential estimation
- Trust scoring and anomaly flags
- Rule-based recommendations for disposal action

---

## Tech Stack

### Frontend
- `react` 18
- `react-dom` 18
- `vite`
- Leaflet (CDN)
- Leaflet Heat plugin (CDN)

### Backend
- `fastapi`
- `uvicorn[standard]`
- `python-multipart`
- `pydantic`
- `pydantic-settings`
- `python-dotenv`
- `google-generativeai`

---

## Repository Structure

```text
civic-trust-ai/
├─ backend/
│  ├─ app/
│  │  ├─ core/config.py
│  │  ├─ models/waste.py
│  │  ├─ routes/waste.py
│  │  └─ services/gemini_service.py
│  ├─ requirements.txt
│  └─ main.py
├─ frontend/
│  ├─ public/media/landing-bg.mp4
│  ├─ src/App.jsx
│  ├─ src/index.css
│  ├─ src/services/api.js
│  ├─ index.html
│  └─ package.json
└─ README.md
```

---

## Setup & Run (Submission Rules)

## Prerequisites
- Python `3.9+`
- Node.js `18+`
- npm `9+`
- Internet connection (for map tiles/CDN scripts and IP geolocation fallback)

## 1) Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
GEMINI_API_KEY=your_key_here
APP_NAME=Civic Trust AI
DEBUG=true
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

Run backend:

```bash
uvicorn main:app --reload --port 8000
```

Health check:

- `http://localhost:8000/`
- `http://localhost:8000/api/waste/health`

## 2) Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open:
- `http://localhost:5173`

---

## Environment & Network Notes

- If Gemini key is missing/unavailable, backend uses fallback analysis so demo still works.
- Map tiles and Leaflet CDN require internet.
- "Use Current Location" behavior:
  - Primary: browser GPS
  - Fallback: IP geolocation (can reflect VPN exit region)

---

## API Endpoints

### `POST /api/waste/analyze`
Uploads image and returns analysis payload.

Supported types:
- `image/jpeg`
- `image/png`
- `image/webp`

Max size:
- `10 MB`

### `GET /api/waste/health`
Simple service heartbeat.

---

## Demo Flow (Recommended for Judges)

1. Open Layer 1.
2. Click `Use Current Location (GPS/VPN)`.
3. Upload a garbage dump image.
4. Auto-jump to Layer 2 map explorer.
5. Enable `Complaint Heatmap`.
6. Drill state -> city -> ward and open uploaded marker popup.
7. Show trust/emission card + status lifecycle.
8. Move to Layer 3 and run policy simulation.
9. Move to Layer 4 and query concierge with location-specific prompts.

---


**Key Features**
1. **Evidence-to-Action Upload Pipeline**: Users upload garbage/complaint images and map them to exact `State -> City -> Ward`, creating a structured, location-linked incident record.
2. **Real Interactive Geo Explorer**: Leaflet-based slippy map with zoom/pan, state/city/ward drilldown, and map marker interactions tied to live incident data.
3. **Complaint Intensity Heatmap**: Toggleable heat layer visualizing concentration and severity of dumps/complaints for faster hotspot detection.
4. **Building-Level Focus Navigation**: City and ward clicks trigger map fly-to transitions, helping operators move from national oversight to local dump-site context quickly.
5. **Uploaded Evidence on Map**: The uploaded image is pinned to its mapped ward and shown in map popups with analysis metadata (type, confidence, emissions).
6. **AI Waste Analysis Layer**: Image-based waste classification with confidence scores and structured response payload for downstream civic workflows.
7. **Trust & Verification Signals**: Ward-level trust scoring, status lifecycle (`Reported/Verified/Resolved`), and anomaly-style flags to support credible decision-making.
8. **Emission Intelligence**: CO2e/CH4/N2O contextual metrics for operational impact and environmental accountability.
9. **Policy Simulation + ESG View**: What-if controls (composting, collection acceleration, drone assist) with projected impact and budget efficiency outputs.
10. **Civic Concierge Query Interface**: Context-aware assistant for state/city/ward-level issue lookup, explanation, and mitigation guidance.
11. **Location Assist Mode**: Landing page supports manual location selection plus auto-detection via browser geolocation and IP/VPN fallback to reduce reporting friction.
12. **Operational Resilience**: Graceful backend/AI fallback mode keeps demo and workflow functional even if model dependencies or keys are unavailable.

**Innovation Highlights**
1. **Geo-Linked AI Governance Loop**: Combines image intelligence + map drilldown + trust scoring in one closed loop from citizen evidence to municipal action.
2. **India-First Multi-Scale Civic Intelligence**: Designed around Indian administrative hierarchy and local operational needs rather than generic global dashboards.
3. **Dual-Mode Location Intelligence**: Manual mapping plus automated GPS/IP-assisted mapping improves usability while preserving operator control.
4. **Heatmap + Drilldown Fusion**: Macro-intensity awareness (heat layer) and micro-investigation (ward/building zoom) in a single continuous interface.
5. **Evidence-Backed Transparency**: Every mapped incident can carry visual proof and confidence metadata, reducing ambiguity in closure and compliance reporting.
6. **Submission-Ready Reliability Design**: System remains demonstrable and useful under partial outages through deterministic fallback paths, critical for real civic deployments.
