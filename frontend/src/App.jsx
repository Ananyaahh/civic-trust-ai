import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeWasteImage } from "./services/api";
import "./index.css";

const LAYERS = [
  "1. Upload Verification",
  "2. India Twin Explorer",
  "3. Simulation + ESG",
  "4. Concierge + Controls",
];

const INDIA_STATES = [
  { id: "tn", name: "Tamil Nadu", risk: "medium", unread: 3, lat: 11.1271, lng: 78.6569 },
  { id: "mh", name: "Maharashtra", risk: "high", unread: 9, lat: 19.7515, lng: 75.7139 },
  { id: "ka", name: "Karnataka", risk: "medium", unread: 4, lat: 15.3173, lng: 75.7139 },
  { id: "dl", name: "Delhi", risk: "low", unread: 1, lat: 28.7041, lng: 77.1025 },
  { id: "wb", name: "West Bengal", risk: "high", unread: 5, lat: 22.9868, lng: 87.855 },
  { id: "gj", name: "Gujarat", risk: "medium", unread: 3, lat: 22.2587, lng: 71.1924 },
];

const CITY_BY_STATE = {
  tn: [
    { id: "tn-che", name: "Chennai", incidents: 11, lat: 13.0827, lng: 80.2707 },
    { id: "tn-cjb", name: "Coimbatore", incidents: 5, lat: 11.0168, lng: 76.9558 },
    { id: "tn-mdu", name: "Madurai", incidents: 6, lat: 9.9252, lng: 78.1198 },
  ],
  mh: [
    { id: "mh-mum", name: "Mumbai", incidents: 16, lat: 19.076, lng: 72.8777 },
    { id: "mh-pun", name: "Pune", incidents: 7, lat: 18.5204, lng: 73.8567 },
  ],
  ka: [
    { id: "ka-blr", name: "Bengaluru", incidents: 10, lat: 12.9716, lng: 77.5946 },
    { id: "ka-mys", name: "Mysuru", incidents: 4, lat: 12.2958, lng: 76.6394 },
  ],
  dl: [
    { id: "dl-nd", name: "New Delhi", incidents: 7, lat: 28.6139, lng: 77.209 },
  ],
  wb: [
    { id: "wb-kol", name: "Kolkata", incidents: 13, lat: 22.5726, lng: 88.3639 },
    { id: "wb-hwh", name: "Howrah", incidents: 6, lat: 22.5958, lng: 88.2636 },
  ],
  gj: [
    { id: "gj-ahd", name: "Ahmedabad", incidents: 9, lat: 23.0225, lng: 72.5714 },
    { id: "gj-sur", name: "Surat", incidents: 5, lat: 21.1702, lng: 72.8311 },
  ],
};

const WARDS_BY_CITY = {
  "tn-che": [
    { id: "tn-che-z05", name: "Zone-05 Perungudi", x: 60, y: 62, methane: 41, trust: 76, status: "Verified", lat: 12.9716, lng: 80.2432 },
    { id: "tn-che-z08", name: "Zone-08 Kodambakkam", x: 40, y: 36, methane: 36, trust: 81, status: "Resolved", lat: 13.0542, lng: 80.2324 },
    { id: "tn-che-z13", name: "Zone-13 Tondiarpet", x: 72, y: 28, methane: 52, trust: 63, status: "Reported", lat: 13.1307, lng: 80.2921 },
  ],
  "tn-cjb": [
    { id: "tn-cjb-n", name: "Coimbatore North", x: 52, y: 30, methane: 29, trust: 84, status: "Verified", lat: 11.0401, lng: 76.9558 },
    { id: "tn-cjb-w", name: "Coimbatore West", x: 36, y: 52, methane: 33, trust: 78, status: "Resolved", lat: 11.015, lng: 76.9397 },
  ],
  "tn-mdu": [
    { id: "tn-mdu-c", name: "Madurai Core", x: 49, y: 49, methane: 38, trust: 73, status: "Verified", lat: 9.9252, lng: 78.1198 },
  ],
  "mh-mum": [
    { id: "mh-mum-ke", name: "K-East", x: 61, y: 52, methane: 74, trust: 66, status: "Reported", lat: 19.1136, lng: 72.8697 },
    { id: "mh-mum-hw", name: "H-West", x: 43, y: 44, methane: 45, trust: 71, status: "Verified", lat: 19.1048, lng: 72.8401 },
  ],
  "mh-pun": [
    { id: "mh-pun-sw", name: "SW Pune", x: 55, y: 58, methane: 39, trust: 82, status: "Resolved", lat: 18.5204, lng: 73.8567 },
  ],
  "ka-blr": [
    { id: "ka-blr-e7", name: "East-07 Mahadevapura", x: 58, y: 53, methane: 49, trust: 81, status: "Resolved", lat: 12.9855, lng: 77.7393 },
    { id: "ka-blr-s2", name: "South-02", x: 42, y: 70, methane: 35, trust: 78, status: "Verified", lat: 12.9141, lng: 77.6101 },
  ],
  "ka-mys": [
    { id: "ka-mys-c", name: "Mysuru Central", x: 50, y: 46, methane: 22, trust: 86, status: "Verified", lat: 12.2958, lng: 76.6394 },
  ],
  "dl-nd": [
    { id: "dl-nd-03", name: "ND-03", x: 49, y: 45, methane: 32, trust: 88, status: "Verified", lat: 28.6139, lng: 77.209 },
  ],
  "wb-kol": [
    { id: "wb-kol-19", name: "Borough-19", x: 58, y: 56, methane: 68, trust: 58, status: "Reported", lat: 22.5726, lng: 88.3639 },
  ],
  "wb-hwh": [
    { id: "wb-hwh-4", name: "Howrah-04", x: 50, y: 46, methane: 54, trust: 66, status: "Reported", lat: 22.5958, lng: 88.2636 },
  ],
  "gj-ahd": [
    { id: "gj-ahd-11", name: "Ward-11 Sabarmati", x: 47, y: 43, methane: 37, trust: 79, status: "Resolved", lat: 23.0225, lng: 72.5714 },
  ],
  "gj-sur": [
    { id: "gj-sur-6", name: "Surat-06", x: 54, y: 56, methane: 44, trust: 72, status: "Verified", lat: 21.1702, lng: 72.8311 },
  ],
};

const STATUS_FLOW = ["Reported", "Verified", "Resolved"];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatCoords(lat, lng) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getWardComplaintCount(ward) {
  const statusLoad = ward.status === "Reported" ? 26 : ward.status === "Verified" ? 12 : 5;
  return Math.round(ward.methane * 1.1 + (100 - ward.trust) * 0.55 + statusLoad);
}

export default function App() {
  const [activeLayer, setActiveLayer] = useState(0);
  const [unlockedLayer, setUnlockedLayer] = useState(0);

  const [selectedStateId, setSelectedStateId] = useState("tn");
  const [selectedCityId, setSelectedCityId] = useState("tn-che");
  const [selectedWardId, setSelectedWardId] = useState("tn-che-z05");
  const [mapDepth, setMapDepth] = useState("india");

  const [timelineDays, setTimelineDays] = useState(90);
  const [showCo2e, setShowCo2e] = useState(true);
  const [showCh4, setShowCh4] = useState(true);
  const [showN2o, setShowN2o] = useState(false);
  const [showHeatLayer, setShowHeatLayer] = useState(true);

  const [composting, setComposting] = useState(35);
  const [collectionBoost, setCollectionBoost] = useState(20);
  const [droneAssist, setDroneAssist] = useState(true);

  const [chatQuery, setChatQuery] = useState("");
  const [chatLog, setChatLog] = useState([
    { role: "assistant", text: "Ask by state/city/ward. Example: alerts in TN, methane in Chennai Zone-05." },
  ]);

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadedCase, setUploadedCase] = useState(null);

  const [uploadStateId, setUploadStateId] = useState("tn");
  const [uploadCityId, setUploadCityId] = useState("tn-che");
  const [uploadWardId, setUploadWardId] = useState("tn-che-z05");
  const [currentPosition, setCurrentPosition] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [locating, setLocating] = useState(false);

  const fileRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const heatLayerRef = useRef(null);

  const selectedState = useMemo(
    () => INDIA_STATES.find((state) => state.id === selectedStateId) || INDIA_STATES[0],
    [selectedStateId]
  );

  const selectedCity = useMemo(() => {
    const list = CITY_BY_STATE[selectedStateId] || [];
    return list.find((city) => city.id === selectedCityId) || list[0] || null;
  }, [selectedStateId, selectedCityId]);

  const wardsForCity = useMemo(() => WARDS_BY_CITY[selectedCityId] || [], [selectedCityId]);

  const selectedWard = useMemo(
    () => wardsForCity.find((ward) => ward.id === selectedWardId) || wardsForCity[0] || null,
    [wardsForCity, selectedWardId]
  );

  const emissions = useMemo(() => {
    const multiplier = timelineDays / 30;
    return {
      co2e: Math.round(740 * multiplier * (showCo2e ? 1 : 0)),
      ch4: Math.round(211 * multiplier * (showCh4 ? 1 : 0)),
      n2o: Math.round(39 * multiplier * (showN2o ? 1 : 0)),
    };
  }, [timelineDays, showCo2e, showCh4, showN2o]);

  const trustBreakdown = useMemo(() => {
    const base = selectedWard?.trust || 70;
    return {
      verification: clamp(base + 5, 0, 100),
      emissionMatch: clamp(base - 8, 0, 100),
      responsiveness: clamp(base - 14, 0, 100),
    };
  }, [selectedWard]);

  const scenario = useMemo(() => {
    const reduction = composting * 0.22 + collectionBoost * 0.4 + (droneAssist ? 9 : 0);
    const projected5y = clamp(Math.round(reduction * 2.9), 0, 100);
    const budgetScore = clamp(Math.round(100 - (collectionBoost * 0.6 + (droneAssist ? 14 : 0))), 10, 100);
    return { reduction: clamp(Math.round(reduction), 0, 100), projected5y, budgetScore };
  }, [composting, collectionBoost, droneAssist]);

  const canGoNext = activeLayer < LAYERS.length - 1 && (activeLayer !== 0 || Boolean(uploadResult));

  function syncUploadLocation(stateId, cityId, wardId) {
    setSelectedStateId(stateId);
    setSelectedCityId(cityId);
    setSelectedWardId(wardId);
    setMapDepth("state");
  }

  function onChangeUploadState(stateId) {
    setUploadStateId(stateId);
    const firstCity = (CITY_BY_STATE[stateId] || [])[0];
    const nextCityId = firstCity?.id || "";
    setUploadCityId(nextCityId);
    const firstWard = (WARDS_BY_CITY[nextCityId] || [])[0];
    setUploadWardId(firstWard?.id || "");
  }

  function onChangeUploadCity(cityId) {
    setUploadCityId(cityId);
    const firstWard = (WARDS_BY_CITY[cityId] || [])[0];
    setUploadWardId(firstWard?.id || "");
  }

  function mapNearestLocation(lat, lng, sourceLabel) {
    const allWards = Object.entries(WARDS_BY_CITY).flatMap(([cityId, wards]) =>
      wards.map((ward) => ({ cityId, ward }))
    );
    if (!allWards.length) return;

    let best = allWards[0];
    let bestDistance = haversineKm(lat, lng, best.ward.lat, best.ward.lng);
    for (const item of allWards) {
      const d = haversineKm(lat, lng, item.ward.lat, item.ward.lng);
      if (d < bestDistance) {
        best = item;
        bestDistance = d;
      }
    }

    const stateId =
      Object.keys(CITY_BY_STATE).find((sid) => (CITY_BY_STATE[sid] || []).some((city) => city.id === best.cityId)) || "tn";

    setUploadStateId(stateId);
    setUploadCityId(best.cityId);
    setUploadWardId(best.ward.id);
    setSelectedStateId(stateId);
    setSelectedCityId(best.cityId);
    setSelectedWardId(best.ward.id);
    setCurrentPosition({ lat, lng });
    setLocationMessage(
      `${sourceLabel}: nearest mapped ward is ${best.ward.name} (${bestDistance.toFixed(1)} km away).`
    );
  }

  async function detectCurrentLocation() {
    setLocating(true);
    setLocationMessage("Detecting your location...");
    try {
      if (navigator.geolocation) {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 9000,
            maximumAge: 120000,
          });
        });
        mapNearestLocation(pos.coords.latitude, pos.coords.longitude, "GPS location");
        setLocating(false);
        return;
      }
    } catch (_err) {
      // fallback to IP lookup below
    }

    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      if (typeof data.latitude === "number" && typeof data.longitude === "number") {
        mapNearestLocation(data.latitude, data.longitude, "IP/VPN location");
      } else {
        setLocationMessage("Could not resolve location from IP.");
      }
    } catch (_err) {
      setLocationMessage("Location detection failed. Please choose manually.");
    } finally {
      setLocating(false);
    }
  }

  async function runAuditUpload() {
    if (!uploadFile) return;
    setUploadLoading(true);
    setUploadError("");

    let analysisData;
    try {
      analysisData = await analyzeWasteImage(uploadFile);
      setUploadResult(analysisData);
    } catch (err) {
      analysisData = {
        analysis: { waste_type: "mixed municipal waste", confidence_score: 76 },
        emissions: { co2e_kg: 1740 },
      };
      setUploadResult(analysisData);
      setUploadError("Backend audit unavailable. Demo analysis loaded.");
    } finally {
      setUploadLoading(false);
    }

    const previewUrl = URL.createObjectURL(uploadFile);
    setUploadedCase({
      stateId: uploadStateId,
      cityId: uploadCityId,
      wardId: uploadWardId,
      fileName: uploadFile.name,
      previewUrl,
      uploadedAt: new Date().toISOString(),
      analysis: analysisData.analysis,
      emissions: analysisData.emissions,
    });

    syncUploadLocation(uploadStateId, uploadCityId, uploadWardId);
    setUnlockedLayer(1);
    setActiveLayer(1);
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

  function handleStateSelect(stateId, drillDown = false) {
    setSelectedStateId(stateId);
    const stateCities = CITY_BY_STATE[stateId] || [];
    const preferredCity =
      uploadedCase && uploadedCase.stateId === stateId
        ? stateCities.find((city) => city.id === uploadedCase.cityId) || stateCities[0]
        : stateCities[0];
    if (preferredCity) {
      setSelectedCityId(preferredCity.id);
      const wardList = WARDS_BY_CITY[preferredCity.id] || [];
      const preferredWard =
        uploadedCase && uploadedCase.cityId === preferredCity.id
          ? wardList.find((ward) => ward.id === uploadedCase.wardId) || wardList[0]
          : wardList[0];
      if (preferredWard) setSelectedWardId(preferredWard.id);
    }
    if (drillDown) setMapDepth("state");
  }

  function handleCitySelect(cityId) {
    setSelectedCityId(cityId);
    const wardList = WARDS_BY_CITY[cityId] || [];
    const preferredWard =
      uploadedCase && uploadedCase.cityId === cityId
        ? wardList.find((ward) => ward.id === uploadedCase.wardId) || wardList[0]
        : wardList[0];
    if (preferredWard) setSelectedWardId(preferredWard.id);
    const city = Object.values(CITY_BY_STATE).flat().find((item) => item.id === cityId);
    if (mapRef.current && city) {
      mapRef.current.flyTo([city.lat, city.lng], 12, { duration: 0.8 });
    }
  }

  function handleWardSelect(wardId) {
    setSelectedWardId(wardId);
    const ward = Object.values(WARDS_BY_CITY).flat().find((item) => item.id === wardId);
    if (mapRef.current && ward) {
      mapRef.current.flyTo([ward.lat, ward.lng], 17, { duration: 0.9 });
    }
  }

  function submitChatQuery(raw) {
    const query = raw.trim();
    if (!query) return;
    const lower = query.toLowerCase();

    const stateMatch = INDIA_STATES.find((s) => lower.includes(s.name.toLowerCase()));
    const cityMatch = Object.values(CITY_BY_STATE).flat().find((c) => lower.includes(c.name.toLowerCase()));
    const wardMatch = Object.values(WARDS_BY_CITY).flat().find((w) => lower.includes(w.name.toLowerCase()));

    if (stateMatch) handleStateSelect(stateMatch.id, true);
    if (cityMatch) handleCitySelect(cityMatch.id);
    if (wardMatch) handleWardSelect(wardMatch.id);

    let response = `${selectedState.name} has ${selectedState.unread} unread alerts. Ask for methane/trust/details to drill deeper.`;
    if (lower.includes("picture") || lower.includes("image") || lower.includes("upload")) {
      response = uploadedCase
        ? `Latest uploaded evidence is mapped to ${uploadedCase.wardId}. Open state -> city -> ward to see image and metadata.`
        : "No uploaded picture yet. Upload from Layer 1 and choose state/city/ward.";
    } else if (lower.includes("methane") || lower.includes("emission")) {
      response = selectedWard
        ? `${selectedWard.name} methane risk is ${selectedWard.methane}% with trust ${selectedWard.trust}% (${selectedWard.status}).`
        : "Select a ward first to inspect methane and trust.";
    } else if (lower.includes("state") || lower.includes("city") || lower.includes("ward")) {
      response = `Current drilldown is ${selectedState.name} -> ${selectedCity?.name || "-"} -> ${selectedWard?.name || "-"}.`;
    }

    setChatLog((prev) => [...prev, { role: "user", text: query }, { role: "assistant", text: response }].slice(-10));
    setChatQuery("");
  }

  const uploadCities = CITY_BY_STATE[uploadStateId] || [];
  const uploadWards = WARDS_BY_CITY[uploadCityId] || [];

  useEffect(() => {
    if (activeLayer !== 1) return;
    const leaflet = window.L;
    if (!leaflet || !mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = leaflet.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([22.9734, 78.6569], 5);

      leaflet.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri",
      }).addTo(map);

      markerLayerRef.current = leaflet.layerGroup().addTo(map);
      mapRef.current = map;
    }

    const map = mapRef.current;
    const layer = markerLayerRef.current;
    layer.clearLayers();
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    const cityList = CITY_BY_STATE[selectedStateId] || [];
    const allWards = Object.values(WARDS_BY_CITY).flat();

    if (mapDepth === "india") {
      map.setView([22.9734, 78.6569], 5);
      INDIA_STATES.forEach((state) => {
        const marker = leaflet.circleMarker([state.lat, state.lng], {
          radius: state.id === selectedStateId ? 10 : 8,
          color: state.risk === "high" ? "#ff5d67" : state.risk === "medium" ? "#ffb13b" : "#37e08a",
          weight: 2,
          fillOpacity: 0.35,
        }).addTo(layer);
        marker.bindTooltip(`${state.name} (${state.unread} unread alerts)`);
        marker.on("click", () => {
          handleStateSelect(state.id, true);
          map.flyTo([state.lat, state.lng], 7, { duration: 0.8 });
        });
      });
    } else {
      map.setView([selectedState.lat, selectedState.lng], 7);

      cityList.forEach((city) => {
        const marker = leaflet.circleMarker([city.lat, city.lng], {
          radius: city.id === selectedCityId ? 10 : 8,
          color: "#39d7ff",
          weight: 2,
          fillOpacity: 0.35,
        }).addTo(layer);
        marker.bindTooltip(`${city.name} (${city.incidents} incidents)`);
        marker.on("click", () => handleCitySelect(city.id));
      });

      wardsForCity.forEach((ward) => {
        const marker = leaflet.circleMarker([ward.lat, ward.lng], {
          radius: ward.id === selectedWardId ? 9 : 7,
          color: ward.methane >= 60 ? "#ff5d67" : ward.methane >= 40 ? "#ffb13b" : "#37e08a",
          weight: 2,
          fillOpacity: 0.5,
        }).addTo(layer);
        marker.bindPopup(
          `<b>${ward.name}</b><br/>Methane: ${ward.methane}%<br/>Trust: ${ward.trust}%<br/>Status: ${ward.status}`
        );
        marker.on("click", () => handleWardSelect(ward.id));
      });

      if (showHeatLayer && leaflet.heatLayer) {
        const heatPoints = allWards.map((ward) => {
          const complaints = getWardComplaintCount(ward);
          let intensity = clamp(complaints / 140, 0.2, 1);
          if (uploadedCase && uploadedCase.wardId === ward.id) intensity = clamp(intensity + 0.25, 0.2, 1);
          return [ward.lat, ward.lng, intensity];
        });
        heatLayerRef.current = leaflet.heatLayer(heatPoints, {
          radius: 30,
          blur: 22,
          maxZoom: 17,
          minOpacity: 0.32,
          gradient: {
            0.2: "#2de08e",
            0.45: "#e4e951",
            0.7: "#ffb13b",
            1.0: "#ff3b4f",
          },
        }).addTo(map);
      }

      if (uploadedCase) {
        const uploadedWard = Object.values(WARDS_BY_CITY).flat().find((w) => w.id === uploadedCase.wardId);
        if (uploadedWard) {
          const uploadMarker = leaflet.marker([uploadedWard.lat, uploadedWard.lng]).addTo(layer);
          uploadMarker.bindPopup(
            `<div style=\"min-width:200px\"><strong>Uploaded Evidence</strong><br/><img src=\"${uploadedCase.previewUrl}\" style=\"width:100%;margin-top:6px;border-radius:6px\" /><br/>${uploadedCase.fileName}<br/>CO2e: ${uploadedCase.emissions.co2e_kg} kg</div>`
          );
          if (selectedWardId === uploadedWard.id) {
            uploadMarker.openPopup();
          }
        }
      }
    }

    if (currentPosition) {
      const me = leaflet.circleMarker([currentPosition.lat, currentPosition.lng], {
        radius: 7,
        color: "#4aa8ff",
        weight: 2,
        fillOpacity: 0.5,
      }).addTo(layer);
      me.bindTooltip("Your detected location");
    }

    setTimeout(() => map.invalidateSize(), 80);
  }, [activeLayer, mapDepth, selectedStateId, selectedCityId, selectedWardId, wardsForCity, uploadedCase, showHeatLayer, currentPosition]);

  return (
    <div className="phase2-app">
      <div className="bg-grid" />

      <header className="topbar">
        <div>
          <p className="eyebrow">CivicTrust AI</p>
          <h1>India Civic Digital Twin</h1>
        </div>
        <div className="topbar-tags">
          <span className="tag live">Live Twin</span>
          <span className="tag">Geo Drilldown Ready</span>
          <span className="tag">Upload-to-Map Link</span>
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
          <button className="nav-btn" onClick={goBackLayer} disabled={activeLayer === 0}>Back Layer</button>
          <button className="nav-btn primary" onClick={goNextLayer} disabled={!canGoNext}>
            {activeLayer === 0 && !uploadResult ? "Upload to continue" : "Next Layer"}
          </button>
        </div>
      </section>

      <main className="layer-page" key={activeLayer}>
        {activeLayer === 0 ? (
          <section className="panel first-step full-step">
            <div className="landing-video-shell">
              <video className="landing-video" src="/media/landing-bg.mp4" autoPlay muted loop playsInline />
              <div className="landing-video-overlay" />
              <div className="landing-video-content">
                <p className="eyebrow">CivicTrust AI</p>
                <h2>India Civic Digital Twin</h2>
                <p>Upload from any city, auto-pin the dump site, then zoom into state, city, and ward-level action.</p>
              </div>
            </div>
            <div className="panel-head">
              <h2>Upload Incident Evidence</h2>
              <p>Map picture to exact state, city, and ward before entering the twin explorer.</p>
            </div>

            <div className="upload-grid">
              <article className="card">
                <h3>Location Mapping</h3>
                <div className="location-actions">
                  <button className="nav-btn" disabled={locating} onClick={detectCurrentLocation}>
                    {locating ? "Detecting..." : "Use Current Location (GPS/VPN)"}
                  </button>
                </div>
                {locationMessage ? <p className="sub">{locationMessage}</p> : null}
                <label className="field-label">State</label>
                <select className="field-input" value={uploadStateId} onChange={(e) => onChangeUploadState(e.target.value)}>
                  {INDIA_STATES.map((state) => (
                    <option key={state.id} value={state.id}>{state.name}</option>
                  ))}
                </select>

                <label className="field-label">City</label>
                <select className="field-input" value={uploadCityId} onChange={(e) => onChangeUploadCity(e.target.value)}>
                  {uploadCities.map((city) => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>

                <label className="field-label">Ward</label>
                <select className="field-input" value={uploadWardId} onChange={(e) => setUploadWardId(e.target.value)}>
                  {uploadWards.map((ward) => (
                    <option key={ward.id} value={ward.id}>{ward.name}</option>
                  ))}
                </select>
              </article>

              <article className="card">
                <h3>Evidence Upload</h3>
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
                    {uploadLoading ? "Running Audit..." : "Upload & Analyze"}
                  </button>
                </div>
                <p className="sub">After upload, Layer 2 opens directly in the mapped state/city/ward.</p>
                {uploadError ? <p className="error">{uploadError}</p> : null}
              </article>
            </div>

            {uploadedCase ? (
              <article className="card evidence-card">
                <h3>Latest Uploaded Case</h3>
                <div className="evidence-layout">
                  <img src={uploadedCase.previewUrl} alt="Uploaded evidence" className="evidence-image" />
                  <div>
                    <p className="sub"><strong>File:</strong> {uploadedCase.fileName}</p>
                    <p className="sub"><strong>Mapped To:</strong> {uploadedCase.stateId.toUpperCase()} / {uploadedCase.cityId.toUpperCase()} / {uploadedCase.wardId.toUpperCase()}</p>
                    <p className="sub"><strong>Type:</strong> {uploadedCase.analysis.waste_type}</p>
                    <p className="sub"><strong>CO2e:</strong> {uploadedCase.emissions.co2e_kg} kg</p>
                    <p className="sub"><strong>Confidence:</strong> {uploadedCase.analysis.confidence_score}%</p>
                  </div>
                </div>
              </article>
            ) : null}
          </section>
        ) : null}

        {activeLayer === 1 ? (
          <section className="panel full-step">
            <div className="panel-head">
              <h2>India Twin Explorer</h2>
              <p>Click State to City to Ward. Uploaded image appears in matching ward detail.</p>
            </div>

            <div className="controls-row">
              <label className="switch"><input type="checkbox" checked={showCo2e} onChange={(e) => setShowCo2e(e.target.checked)} /> CO2e</label>
              <label className="switch"><input type="checkbox" checked={showCh4} onChange={(e) => setShowCh4(e.target.checked)} /> CH4</label>
              <label className="switch"><input type="checkbox" checked={showN2o} onChange={(e) => setShowN2o(e.target.checked)} /> N2O</label>
              <label className="switch"><input type="checkbox" checked={showHeatLayer} onChange={(e) => setShowHeatLayer(e.target.checked)} /> Complaint Heatmap</label>
              <label className="timeline">
                Timeline: {timelineDays} days
                <input type="range" min="30" max="365" step="30" value={timelineDays} onChange={(e) => setTimelineDays(Number(e.target.value))} />
              </label>
            </div>

            <div className="map-breadcrumbs">
              <button className={`crumb ${mapDepth === "india" ? "active" : ""}`} onClick={() => setMapDepth("india")}>India</button>
              <button className={`crumb ${mapDepth === "state" ? "active" : ""}`} onClick={() => setMapDepth("state")}>{selectedState.name}</button>
              <span className="crumb static">{selectedCity?.name || "No City"}</span>
            </div>

            <div className="twin-stage india-stage real-map-stage">
              <div ref={mapContainerRef} className="real-map" />
              <div className="camera-hud">{mapDepth === "india" ? "Map View: India (click state marker)" : "Map View: State/City/Ward (zoom enabled)"}</div>
            </div>

            <div className="state-strip">
              {(CITY_BY_STATE[selectedStateId] || []).map((city) => (
                <button key={city.id} className={`state-chip ${city.id === selectedCityId ? "on" : ""}`} onClick={() => handleCitySelect(city.id)}>
                  {city.name} <span>{city.incidents}</span>
                </button>
              ))}
            </div>

            <div className="grid-2">
              <article className="card">
                <h3>{selectedCity?.name} Ward Map</h3>
                <div className="ward-board">
                  {wardsForCity.map((ward) => (
                    <button
                      key={ward.id}
                      className={`hotspot ${ward.methane >= 60 ? "high" : ward.methane >= 40 ? "medium" : "low"} ${ward.id === selectedWardId ? "active" : ""}`}
                      style={{ left: `${ward.x}%`, top: `${ward.y}%` }}
                      onClick={() => handleWardSelect(ward.id)}
                    >
                      {ward.name}
                    </button>
                  ))}
                </div>
              </article>

              <article className="card">
                <h3>{selectedWard?.name || "Ward Detail"}</h3>
                {selectedWard ? (
                  <>
                    <p className="sub">Coordinates: {formatCoords(selectedWard.lat, selectedWard.lng)}</p>
                    <p className="sub">Methane Risk: {selectedWard.methane}%</p>
                    <p className="sub">Trust Score: {selectedWard.trust}%</p>
                    <div className="status-flow">
                      {STATUS_FLOW.map((step) => (
                        <span key={step} className={step === selectedWard.status ? "on" : ""}>{step}</span>
                      ))}
                    </div>
                    <ul className="mini-bars">
                      <li><label>Verification</label><progress max="100" value={trustBreakdown.verification} /></li>
                      <li><label>Emission Match</label><progress max="100" value={trustBreakdown.emissionMatch} /></li>
                      <li><label>Responsiveness</label><progress max="100" value={trustBreakdown.responsiveness} /></li>
                    </ul>
                  </>
                ) : (
                  <p className="sub">Select a ward to inspect details.</p>
                )}
              </article>

              <article className="card evidence-card">
                <h3>Uploaded Picture Linked to Ward</h3>
                {uploadedCase ? (
                  <div className="evidence-layout">
                    <img src={uploadedCase.previewUrl} alt="Ward evidence" className="evidence-image" />
                    <div>
                      <p className="sub"><strong>Mapped Ward:</strong> {uploadedCase.wardId}</p>
                      <p className="sub"><strong>Analysis:</strong> {uploadedCase.analysis.waste_type}</p>
                      <p className="sub"><strong>CO2e:</strong> {uploadedCase.emissions.co2e_kg} kg</p>
                      <p className="sub"><strong>Selected Ward:</strong> {selectedWard?.id || "-"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="sub">No image uploaded yet.</p>
                )}
              </article>

              <article className="card">
                <h3>Ward Emissions Summary</h3>
                <p className="metric">{emissions.co2e} kg CO2e</p>
                <p className="sub">CH4: {emissions.ch4} kg | N2O: {emissions.n2o} kg</p>
              </article>
            </div>
          </section>
        ) : null}

        {activeLayer === 2 ? (
          <div className="layout">
            <section className="panel">
              <div className="panel-head">
                <h2>Scenario Simulation Engine</h2>
                <p>What-if modeling for municipal policy</p>
              </div>
              <div className="sim-grid">
                <label>Composting: {composting}%<input type="range" min="0" max="100" value={composting} onChange={(e) => setComposting(Number(e.target.value))} /></label>
                <label>Faster Collection: {collectionBoost}%<input type="range" min="0" max="100" value={collectionBoost} onChange={(e) => setCollectionBoost(Number(e.target.value))} /></label>
                <label className="switch"><input type="checkbox" checked={droneAssist} onChange={(e) => setDroneAssist(e.target.checked)} /> Drone deployment enabled</label>
              </div>
              <div className="sim-cards">
                <article className="card compact"><h3>Emission Reduction</h3><p className="metric green">{scenario.reduction}%</p></article>
                <article className="card compact"><h3>5-Year GHG Impact</h3><p className="metric cyan">{scenario.projected5y}%</p></article>
                <article className="card compact"><h3>Budget Efficiency</h3><p className="metric amber">{scenario.budgetScore}/100</p></article>
              </div>
            </section>
            <section className="panel">
              <div className="panel-head"><h2>Investor / ESG View</h2><p>Export-ready operational ledger</p></div>
              <table className="ledger">
                <thead><tr><th>Scope</th><th>Region</th><th>Status</th><th>Confidence</th></tr></thead>
                <tbody>
                  <tr><td>State Twin</td><td>{selectedState.name}</td><td>Live</td><td>91%</td></tr>
                  <tr><td>City Twin</td><td>{selectedCity?.name || "-"}</td><td>Live</td><td>89%</td></tr>
                  <tr><td>Ward View</td><td>{selectedWard?.name || "-"}</td><td>{selectedWard?.status || "-"}</td><td>{selectedWard?.trust || 0}%</td></tr>
                </tbody>
              </table>
            </section>
          </div>
        ) : null}

        {activeLayer === 3 ? (
          <div className="layout">
            <section className="panel">
              <div className="panel-head"><h2>Citizen Concierge AI</h2><p>Query by state, city, ward, picture, alerts</p></div>
              <div className="chatbox">
                {chatLog.map((item, idx) => (
                  <p key={`${item.role}-${idx}`} className={item.role === "user" ? "user" : "bot"}>{item.role === "user" ? "User" : "Advisor"}: {item.text}</p>
                ))}
              </div>
              <form className="chat-query" onSubmit={(e) => { e.preventDefault(); submitChatQuery(chatQuery); }}>
                <input type="text" value={chatQuery} onChange={(e) => setChatQuery(e.target.value)} placeholder="Ask: show TN alerts, methane in Chennai Zone-05, show uploaded picture details" />
                <button type="submit">Ask</button>
              </form>
            </section>
            <section className="panel">
              <div className="panel-head"><h2>Credibility Controls</h2><p>Traceable from upload to ward action</p></div>
              <ul className="cred-list">
                <li>State to city to ward drilldown enforced</li>
                <li>Each uploaded image linked with exact location metadata</li>
                <li>Trust score and methane risk exposed to end users</li>
                <li>Analysis fallback preserves demo continuity</li>
              </ul>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
