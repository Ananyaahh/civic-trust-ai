import { useMemo, useRef, useState } from "react";
import { analyzeWasteImage } from "./services/api";
import "./index.css";

const HOTSPOTS = [
  { id: "W-12", ward: "Ward 12", methane: 74, trust: 66, status: "Verified", x: 28, y: 30, risk: "high", region: "North Ridge", lat: 19.1212, lng: 72.8421 },
  { id: "W-07", ward: "Ward 07", methane: 49, trust: 81, status: "Resolved", x: 60, y: 47, risk: "medium", region: "Central Basin", lat: 19.0948, lng: 72.8785 },
  { id: "W-03", ward: "Ward 03", methane: 21, trust: 91, status: "Verified", x: 74, y: 24, risk: "low", region: "Coastal East", lat: 19.1336, lng: 72.9211 },
  { id: "W-19", ward: "Ward 19", methane: 68, trust: 58, status: "Reported", x: 43, y: 68, risk: "high", region: "South Transfer Zone", lat: 19.0522, lng: 72.8649 },
];

const MAP_REGIONS = [
  { id: "north-ridge", label: "North Ridge", points: "80,90 280,70 330,210 170,260 70,180" },
  { id: "central-basin", label: "Central Basin", points: "300,110 520,80 590,250 410,340 260,250" },
  { id: "coastal-east", label: "Coastal East", points: "560,90 790,120 840,320 600,290" },
  { id: "south-transfer", label: "South Transfer", points: "190,280 430,360 360,520 140,470 80,360" },
];

const STATUS_FLOW = ["Reported", "Verified", "Resolved"];
const LEDGER = [
  { id: "evt-90012", ward: "Ward 12", proof: "SHA-256", confidence: 0.87 },
  { id: "evt-90018", ward: "Ward 19", proof: "SHA-256", confidence: 0.79 },
  { id: "evt-90023", ward: "Ward 07", proof: "SHA-256", confidence: 0.92 },
];

const LAYERS = [
  "1. Upload Verification",
  "2. Digital Twin Layer",
  "3. Simulation + ESG",
  "4. Concierge + Controls",
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatCoords(lat, lng) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export default function App() {
  const [selectedHotspotId, setSelectedHotspotId] = useState(HOTSPOTS[0].id);
  const [timelineDays, setTimelineDays] = useState(90);
  const [showCo2e, setShowCo2e] = useState(true);
  const [showCh4, setShowCh4] = useState(true);
  const [showN2o, setShowN2o] = useState(false);

  const [composting, setComposting] = useState(35);
  const [collectionBoost, setCollectionBoost] = useState(20);
  const [droneAssist, setDroneAssist] = useState(true);

  const [assistantInput, setAssistantInput] = useState("Show methane hotspots in Ward 12");
  const [assistantReply, setAssistantReply] = useState(
    "Ward 12 shows high methane risk and low resolution speed. Camera lock and policy preview are ready."
  );
  const [chatQuery, setChatQuery] = useState("");
  const [chatLog, setChatLog] = useState([
    { role: "assistant", text: "Ask me about any ward, region, methane issue, trust score, or action plan." },
  ]);

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadResult, setUploadResult] = useState(null);

  const [activeLayer, setActiveLayer] = useState(0);
  const [unlockedLayer, setUnlockedLayer] = useState(0);

  const fileRef = useRef(null);

  const selected = useMemo(
    () => HOTSPOTS.find((spot) => spot.id === selectedHotspotId) || HOTSPOTS[0],
    [selectedHotspotId]
  );

  const trustBreakdown = useMemo(() => {
    const base = selected.trust;
    return {
      verification: clamp(base + 5, 0, 100),
      emissionMatch: clamp(base - 8, 0, 100),
      responsiveness: clamp(base - 14, 0, 100),
      citizenVotes: clamp(base + 2, 0, 100),
    };
  }, [selected]);

  const scenario = useMemo(() => {
    const reduction = composting * 0.22 + collectionBoost * 0.4 + (droneAssist ? 9 : 0);
    const projected5y = clamp(Math.round(reduction * 2.9), 0, 100);
    const budgetScore = clamp(Math.round(100 - (collectionBoost * 0.6 + (droneAssist ? 14 : 0))), 10, 100);
    return { reduction: clamp(Math.round(reduction), 0, 100), projected5y, budgetScore };
  }, [composting, collectionBoost, droneAssist]);

  const emissions = useMemo(() => {
    const multiplier = timelineDays / 30;
    return {
      co2e: Math.round(740 * multiplier * (showCo2e ? 1 : 0)),
      ch4: Math.round(211 * multiplier * (showCh4 ? 1 : 0)),
      n2o: Math.round(39 * multiplier * (showN2o ? 1 : 0)),
    };
  }, [timelineDays, showCo2e, showCh4, showN2o]);

  async function runAuditUpload() {
    if (!uploadFile) return;
    setUploadLoading(true);
    setUploadError("");
    try {
      const data = await analyzeWasteImage(uploadFile);
      setUploadResult(data);
      setUnlockedLayer(1);
      setActiveLayer(1);
    } catch (err) {
      setUploadError(err.message || "Audit failed");
    } finally {
      setUploadLoading(false);
    }
  }

  function goNextLayer() {
    if (activeLayer === 0 && !uploadResult) return;
    const next = Math.min(activeLayer + 1, LAYERS.length - 1);
    setUnlockedLayer((prev) => Math.max(prev, next));
    setActiveLayer(next);
  }

  function goBackLayer() {
    setActiveLayer((prev) => Math.max(prev - 1, 0));
  }

  function generateChatReply(query) {
    const text = query.toLowerCase();
    const target =
      HOTSPOTS.find((spot) => text.includes(spot.ward.toLowerCase()) || text.includes(spot.id.toLowerCase())) || selected;

    if (text.includes("where") || text.includes("location") || text.includes("region") || text.includes("map")) {
      return `${target.ward} is in ${target.region} at map coordinate ${formatCoords(target.lat, target.lng)}. It is marked as ${target.risk} risk.`;
    }
    if (text.includes("methane") || text.includes("emission") || text.includes("co2")) {
      return `${target.ward} in ${target.region} reports methane risk ${target.methane}% with projected confidence ${Math.round((target.trust + target.methane) / 2)}%.`;
    }
    if (text.includes("trust") || text.includes("verify") || text.includes("proof")) {
      return `${target.ward} trust is ${target.trust}% and current resolution status is ${target.status}. Focus should be on faster response and verification trails.`;
    }
    if (text.includes("suggest") || text.includes("action") || text.includes("fix") || text.includes("improve")) {
      return `Recommended action for ${target.ward}: increase composting above 55%, keep drone assist active, and run ward-level verification drives in ${target.region}.`;
    }
    return `${target.ward} is currently the best match for your query. Ask for "location", "methane", "trust", or "action plan" to get issue-specific details.`;
  }

  function submitChatQuery(queryText) {
    const clean = queryText.trim();
    if (!clean) return;

    const text = clean.toLowerCase();
    const target = HOTSPOTS.find((spot) => text.includes(spot.ward.toLowerCase()) || text.includes(spot.id.toLowerCase()));
    if (target) setSelectedHotspotId(target.id);

    const reply = generateChatReply(clean);
    setAssistantInput(clean);
    setAssistantReply(reply);
    setChatLog((prev) => [...prev, { role: "user", text: clean }, { role: "assistant", text: reply }].slice(-8));
    setChatQuery("");
  }

  const canGoNext = activeLayer < LAYERS.length - 1 && (activeLayer !== 0 || Boolean(uploadResult));

  return (
    <div className="phase2-app">
      <div className="bg-grid" />

      <header className="topbar">
        <div>
          <p className="eyebrow">CivicTrust AI</p>
          <h1>Phase 2 Experience Layer</h1>
        </div>
        <div className="topbar-tags">
          <span className="tag live">Live Twin</span>
          <span className="tag">Latency Target: &lt;500ms</span>
          <span className="tag">60 FPS Camera</span>
        </div>
      </header>

      <section className="flow-nav panel">
        <div className="layer-tabs" role="tablist" aria-label="Phase layers">
          {LAYERS.map((label, idx) => {
            const isActive = idx === activeLayer;
            const isLocked = idx > unlockedLayer;
            return (
              <button
                key={label}
                role="tab"
                aria-selected={isActive}
                className={`layer-tab ${isActive ? "active" : ""}`}
                disabled={isLocked}
                onClick={() => setActiveLayer(idx)}
              >
                <span className="layer-dot" />
                {label}
              </button>
            );
          })}
        </div>
        <div className="layer-controls">
          <button className="nav-btn" onClick={goBackLayer} disabled={activeLayer === 0}>
            Back Layer
          </button>
          <button className="nav-btn primary" onClick={goNextLayer} disabled={!canGoNext}>
            {activeLayer === 0 && !uploadResult ? "Upload to continue" : "Next Layer"}
          </button>
        </div>
      </section>

      <main className="layer-page" key={activeLayer}>
        {activeLayer === 0 ? (
          <section className="panel first-step">
            <div className="panel-head">
              <h2>Step 1: Field Verification Upload</h2>
              <p>Upload first, then the next layers unlock automatically.</p>
            </div>
            <div className="upload upload-hero">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setUploadFile(e.target.files?.[0] || null);
                  setUploadError("");
                }}
              />
              <button disabled={!uploadFile || uploadLoading} onClick={runAuditUpload}>
                {uploadLoading ? "Running Audit..." : "Run Audit"}
              </button>
            </div>
            {uploadError ? <p className="error">{uploadError}</p> : null}
            <div className="card">
              <h3>Expected Flow</h3>
              <p className="sub">1. Upload evidence image.</p>
              <p className="sub">2. Open Digital Twin layer.</p>
              <p className="sub">3. Run policy simulation + ESG view.</p>
              <p className="sub">4. Finish with concierge actions and credibility controls.</p>
            </div>
            {uploadResult ? (
              <div className="audit-result">
                <p>Type: {uploadResult.analysis.waste_type}</p>
                <p>CO2e: {uploadResult.emissions.co2e_kg} kg</p>
                <p>Confidence: {uploadResult.analysis.confidence_score}%</p>
                <p className="sub">Layer 2 unlocked. Click "Next Layer".</p>
              </div>
            ) : null}
          </section>
        ) : null}

        {activeLayer === 1 ? (
          <section className="panel">
            <div className="panel-head">
              <h2>3D Digital Twin Dashboard</h2>
              <p>Layer 2 of 4: fly-through view with decay heatmap and trust overlays</p>
            </div>

            <div className="controls-row">
              <label className="switch"><input type="checkbox" checked={showCo2e} onChange={(e) => setShowCo2e(e.target.checked)} /> CO2e</label>
              <label className="switch"><input type="checkbox" checked={showCh4} onChange={(e) => setShowCh4(e.target.checked)} /> CH4</label>
              <label className="switch"><input type="checkbox" checked={showN2o} onChange={(e) => setShowN2o(e.target.checked)} /> N2O</label>
              <label className="timeline">
                Timeline: {timelineDays} days
                <input
                  type="range"
                  min="30"
                  max="365"
                  step="30"
                  value={timelineDays}
                  onChange={(e) => setTimelineDays(Number(e.target.value))}
                />
              </label>
            </div>

            <div className="twin-stage">
              <div className="city-layer" />
              <svg className="region-map" viewBox="0 0 900 560" aria-hidden="true">
                {MAP_REGIONS.map((region) => (
                  <g key={region.id}>
                    <polygon points={region.points} />
                    <text
                      x={region.id === "north-ridge" ? 145 : region.id === "central-basin" ? 380 : region.id === "coastal-east" ? 655 : 200}
                      y={region.id === "north-ridge" ? 170 : region.id === "central-basin" ? 220 : region.id === "coastal-east" ? 205 : 420}
                    >
                      {region.label}
                    </text>
                  </g>
                ))}
              </svg>
              {HOTSPOTS.map((spot) => (
                <button
                  key={spot.id}
                  className={`hotspot ${spot.risk} ${selectedHotspotId === spot.id ? "active" : ""}`}
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  onClick={() => setSelectedHotspotId(spot.id)}
                >
                  <span>{spot.ward}</span>
                </button>
              ))}
              <div className="camera-hud">Camera: Orbit / Fly-through</div>
            </div>

            <div className="grid-2">
              <article className="card">
                <h3>Ward Emissions Summary</h3>
                <p className="metric">{emissions.co2e} kg CO2e</p>
                <p className="sub">CH4: {emissions.ch4} kg | N2O: {emissions.n2o} kg</p>
              </article>
              <article className="card">
                <h3>Resolution Status Tracker</h3>
                <div className="status-flow">
                  {STATUS_FLOW.map((step) => (
                    <span key={step} className={step === selected.status ? "on" : ""}>{step}</span>
                  ))}
                </div>
              </article>
              <article className="card">
                <h3>{selected.ward} Trust Score</h3>
                <p className="metric">{selected.trust}%</p>
                <ul className="mini-bars">
                  <li><label>Verification</label><progress max="100" value={trustBreakdown.verification} /></li>
                  <li><label>Emission Match</label><progress max="100" value={trustBreakdown.emissionMatch} /></li>
                  <li><label>Responsiveness</label><progress max="100" value={trustBreakdown.responsiveness} /></li>
                  <li><label>Citizen Votes</label><progress max="100" value={trustBreakdown.citizenVotes} /></li>
                </ul>
              </article>
              <article className="card">
                <h3>Event Drill-in</h3>
                <p className="sub">Hotspot: {selected.id}</p>
                <p className="sub">Region: {selected.region}</p>
                <p className="sub">Coordinates: {formatCoords(selected.lat, selected.lng)}</p>
                <p className="sub">Methane Risk: {selected.methane}%</p>
                <p className="sub">Confidence: {Math.round((selected.trust + selected.methane) / 2)}%</p>
              </article>
            </div>
          </section>
        ) : null}

        {activeLayer === 2 ? (
          <div className="layout">
            <section className="panel">
              <div className="panel-head">
                <h2>Scenario Simulation Engine</h2>
                <p>Layer 3 of 4: what-if modeling for municipal policy</p>
              </div>
              <div className="sim-grid">
                <label>
                  Composting: {composting}%
                  <input type="range" min="0" max="100" value={composting} onChange={(e) => setComposting(Number(e.target.value))} />
                </label>
                <label>
                  Faster Collection: {collectionBoost}%
                  <input type="range" min="0" max="100" value={collectionBoost} onChange={(e) => setCollectionBoost(Number(e.target.value))} />
                </label>
                <label className="switch">
                  <input type="checkbox" checked={droneAssist} onChange={(e) => setDroneAssist(e.target.checked)} />
                  Drone deployment enabled
                </label>
              </div>
              <div className="sim-cards">
                <article className="card compact">
                  <h3>Emission Reduction</h3>
                  <p className="metric green">{scenario.reduction}%</p>
                </article>
                <article className="card compact">
                  <h3>5-Year GHG Impact</h3>
                  <p className="metric cyan">{scenario.projected5y}%</p>
                </article>
                <article className="card compact">
                  <h3>Budget Efficiency</h3>
                  <p className="metric amber">{scenario.budgetScore}/100</p>
                </article>
              </div>
              <p className="disclaimer">AI simulation output is predictive and should be validated against municipal field data.</p>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>Investor / ESG View</h2>
                <p>Institutional dashboard and export-ready ledger</p>
              </div>
              <div className="sim-cards">
                <article className="card compact"><h3>Carbon KPI</h3><p className="metric green">-18.4%</p></article>
                <article className="card compact"><h3>Trust Volatility</h3><p className="metric amber">6.9</p></article>
                <article className="card compact"><h3>Upload Proof</h3><p className="metric cyan">{uploadResult ? "Attached" : "Pending"}</p></article>
              </div>
              <table className="ledger">
                <thead>
                  <tr><th>Event</th><th>Ward</th><th>Proof</th><th>Confidence</th></tr>
                </thead>
                <tbody>
                  {LEDGER.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.ward}</td>
                      <td>{item.proof}</td>
                      <td>{Math.round(item.confidence * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        ) : null}

        {activeLayer === 3 ? (
          <div className="layout">
            <section className="panel">
              <div className="panel-head">
                <h2>Citizen Concierge AI</h2>
                <p>Layer 4 of 4: multilingual civic advisor for text and voice workflows</p>
              </div>
              <div className="chatbox">
                {chatLog.map((item, idx) => (
                  <p key={`${item.role}-${idx}`} className={item.role === "user" ? "user" : "bot"}>
                    {item.role === "user" ? "User" : "Advisor"}: {item.text}
                  </p>
                ))}
              </div>
              <form
                className="chat-query"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitChatQuery(chatQuery);
                }}
              >
                <input
                  type="text"
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  placeholder="Ask: Where is Ward 19? methane in Ward 12? suggest action..."
                />
                <button type="submit">Ask</button>
              </form>
              <div className="assistant-actions">
                <button onClick={() => {
                  submitChatQuery("Show methane hotspots in Ward 12");
                }}>Hotspot Query</button>
                <button onClick={() => {
                  submitChatQuery("Explain trust score for Ward 19");
                }}>Trust Explain</button>
                <button onClick={() => {
                  submitChatQuery("Suggest policy improvements for Ward 12");
                  setComposting(60);
                  setDroneAssist(true);
                }}>Policy Suggest</button>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>Credibility Controls</h2>
                <p>Transparent, auditable trust mechanics</p>
              </div>
              <ul className="cred-list">
                <li>Prediction disclaimer enabled</li>
                <li>Raw data toggle available</li>
                <li>Confidence score shown on all estimates</li>
                <li>Audit trail tag attached to every event</li>
                <li>Upload evidence linked to layer progression</li>
              </ul>
              {uploadResult ? (
                <div className="audit-result">
                  <p>Latest audit waste type: {uploadResult.analysis.waste_type}</p>
                  <p>Estimated CO2e: {uploadResult.emissions.co2e_kg} kg</p>
                </div>
              ) : (
                <p className="sub">No upload found. Go back to layer 1 and run an audit.</p>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
