import React, { useEffect, useRef, useState } from "react";
import { Navigation, Loader2, MapPin } from "lucide-react";
import { EV_STATIONS, PARKING_LOTS } from "../servicePoints";

// Predefined landmark coordinates for Uzbekistan Super App
export const TASHKENT_LOCATIONS = [
  { id: "chorsu", name: { uz: "Chorsu bozori", en: "Chorsu Bazaar", ru: "Базар Чорсу" }, lat: 41.3216, lng: 69.2285 },
  { id: "magic_city", name: { uz: "Magic City bog'i", en: "Magic City Park", ru: "Парк Magic City" }, lat: 41.3031, lng: 69.2486 },
  { id: "amir_temur", name: { uz: "Amir Temur xiyoboni", en: "Amir Temur Square", ru: "Сквер Амира Темура" }, lat: 41.3113, lng: 69.2797 },
  { id: "tashkent_city", name: { uz: "Tashkent City", en: "Tashkent City", ru: "Ташкент Сити" }, lat: 41.3111, lng: 69.2405 },
  { id: "mustaqillik", name: { uz: "Mustaqillik maydoni", en: "Mustaqillik Square", ru: "Площадь Независимости" }, lat: 41.3121, lng: 69.2612 },
  { id: "sebzor", name: { uz: "Sebzor dahasi", en: "Sebzor District", ru: "Массив Себзор" }, lat: 41.3323, lng: 69.2523 },
  { id: "chilonzor", name: { uz: "Chilonzor metro", en: "Chilonzor Metro", ru: "Метро Чиланзар" }, lat: 41.2778, lng: 69.2014 },
  { id: "yunusobod", name: { uz: "Yunusobod bozori", en: "Yunusobod Bazaar", ru: "Юнусабадский базар" }, lat: 41.3621, lng: 69.2821 },
  { id: "sergeli", name: { uz: "Sergeli-4", en: "Sergeli-4", ru: "Сергели-4" }, lat: 41.2225, lng: 69.2225 },
  { id: "minor", name: { uz: "Minor masjidi", en: "Minor Mosque", ru: "Мечеть Минор" }, lat: 41.3331, lng: 69.2811 },
  { id: "oybek", name: { uz: "Oybek metro", en: "Oybek Metro", ru: "Метро Ойбек" }, lat: 41.2985, lng: 69.2735 },
];

// Geographical Bounding Box for our mock interactive Tashkent canvas
const latMin = 41.20;
const latMax = 41.38;
const lngMin = 69.18;
const lngMax = 69.32;

interface MapComponentProps {
  activeFrom?: string;
  activeTo?: string;
  driverName?: string;
  driverStatus?: string;
  showRoute?: boolean;
  lang?: string;
  onMapClick?: (lat: number, lng: number, name: string) => void;
  pinMode?: "from" | "to" | null;
  customFromCoords?: { latitude: number; longitude: number } | null;
  customToCoords?: { latitude: number; longitude: number } | null;
  serviceMode?: "taxi" | "delivery" | "cargo" | "parking" | "ev_charge" | null;
  selectedServicePointId?: string | null;
  liveUserCoords?: { latitude: number; longitude: number } | null;
  driverCoords?: { latitude: number; longitude: number } | null;
  etaMinutes?: number | null;
  liveTracking?: boolean;
}

export default function MapComponent({
  activeFrom = "Chorsu",
  activeTo = "Magic City",
  driverName = "Azizbek",
  driverStatus = "Haydovchi yetib kelmoqda",
  showRoute = true,
  lang = "uz",
  onMapClick,
  pinMode = null,
  customFromCoords = null,
  customToCoords = null,
  serviceMode = null,
  selectedServicePointId = null,
  liveUserCoords = null,
  driverCoords = null,
  etaMinutes = null,
  liveTracking = false,
}: MapComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [trafficMode, setTrafficMode] = useState<"tez" | "ortacha" | "sekin">("tez");
  const [carProgress, setCarProgress] = useState(0);
  const [internalUserCoords, setInternalUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const userCoords = liveUserCoords ?? internalUserCoords;

  // Tashqi live GPS yoki bir martalik aniqlash
  useEffect(() => {
    if (liveUserCoords || liveTracking) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setInternalUserCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {},
        { timeout: 4000 }
      );
    }
  }, [liveUserCoords, liveTracking]);

  useEffect(() => {
    if (!liveTracking || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) =>
        setInternalUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [liveTracking]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setInternalUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Convert Tashkent Lat/Lng coordinates to Canvas X/Y pixels
  const getCanvasXY = (name: string, coords: { latitude: number; longitude: number } | null, w: number, h: number) => {
    if (coords) {
      const x = ((coords.longitude - lngMin) / (lngMax - lngMin)) * w;
      const y = h - (((coords.latitude - latMin) / (latMax - latMin)) * h);
      return { x, y };
    }

    const lowercase = name.toLowerCase();
    if (lowercase.includes("chorsu")) {
      return { x: w * 0.22, y: h * 0.65 };
    } else if (lowercase.includes("magic city")) {
      return { x: w * 0.72, y: h * 0.45 };
    } else if (lowercase.includes("amir temur") || lowercase.includes("xiyoboni")) {
      return { x: w * 0.68, y: h * 0.32 };
    } else if (lowercase.includes("mustaqillik") || lowercase.includes("maydoni")) {
      return { x: w * 0.55, y: h * 0.35 };
    } else if (lowercase.includes("tashkent city")) {
      return { x: w * 0.48, y: h * 0.44 };
    } else if (lowercase.includes("sebzor")) {
      return { x: w * 0.42, y: h * 0.22 };
    } else if (lowercase.includes("chilonzor")) {
      return { x: w * 0.18, y: h * 0.85 };
    } else if (lowercase.includes("yunusobod")) {
      return { x: w * 0.58, y: h * 0.12 };
    } else if (lowercase.includes("sergeli")) {
      return { x: w * 0.35, y: h * 0.92 };
    } else if (lowercase.includes("minor")) {
      return { x: w * 0.62, y: h * 0.20 };
    } else if (lowercase.includes("oybek")) {
      return { x: w * 0.64, y: h * 0.55 };
    }

    // Default hashed mock pixel
    return { x: w * 0.35, y: h * 0.55 };
  };

  // Handle canvas clicks and map back to real geographical coordinates
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const w = rect.width;
    const h = rect.height;

    // Convert pixels to Lng and Lat inside Tashkent bounds
    const lng = lngMin + (x / w) * (lngMax - lngMin);
    const lat = latMin + ((h - y) / h) * (latMax - latMin);

    // Look up closest landmark to snapping within 1.5km coordinate range
    let closestLandmark = null;
    let minDist = Infinity;
    for (const loc of TASHKENT_LOCATIONS) {
      const dist = Math.sqrt(Math.pow(loc.lat - lat, 2) + Math.pow(loc.lng - lng, 2));
      if (dist < minDist) {
        minDist = dist;
        closestLandmark = loc;
      }
    }

    let resolvedName = "";
    if (minDist < 0.012 && closestLandmark) {
      resolvedName = closestLandmark.name[lang as "uz" | "en" | "ru"] || closestLandmark.name.uz;
    } else {
      resolvedName = lang === "uz"
        ? `Nuqta (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        : lang === "ru"
          ? `Точка (${lat.toFixed(4)}, ${lng.toFixed(4)})`
          : `Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }

    if (onMapClick) {
      onMapClick(lat, lng, resolvedName);
    }
  };

  // Animate mock vehicle progress along the path
  useEffect(() => {
    const interval = setInterval(() => {
      setCarProgress((prev) => {
        if (prev >= 1) return 0;
        return prev + 0.003;
      });
    }, 45);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Primary HTML5 Canvas Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = rect.width;
    const h = rect.height;

    const drawMap = () => {
      // Background — deep space with subtle teal wash
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "#070d18");
      bgGrad.addColorStop(0.45, "#0c111d");
      bgGrad.addColorStop(1, "#050810");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Soft center glow
      const glow = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.65);
      glow.addColorStop(0, "rgba(20, 184, 166, 0.06)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Cyberpunk background mesh grid lines
      ctx.strokeStyle = "rgba(20, 184, 166, 0.02)";
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Predefined Cyberpunk Roadways
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 3.5;
      
      // Horizontal Parkway
      ctx.beginPath();
      ctx.moveTo(10, h * 0.45);
      ctx.lineTo(w - 10, h * 0.45);
      ctx.stroke();

      // Vertical Freeway
      ctx.beginPath();
      ctx.moveTo(w * 0.5, 10);
      ctx.lineTo(w * 0.5, h - 10);
      ctx.stroke();

      // Diagonal Boulevard
      ctx.beginPath();
      ctx.moveTo(15, h * 0.8);
      ctx.lineTo(w - 15, h * 0.2);
      ctx.stroke();

      // Real-time Traffic overlays (Green, Amber, Red)
      ctx.strokeStyle = trafficMode === "tez" ? "#14b8a6" : "rgba(20, 184, 166, 0.25)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, h * 0.45);
      ctx.lineTo(w * 0.5, h * 0.45);
      ctx.stroke();

      ctx.strokeStyle = trafficMode === "ortacha" ? "#f59e0b" : "rgba(245, 158, 11, 0.25)";
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.45);
      ctx.lineTo(w - 10, h * 0.45);
      ctx.stroke();

      ctx.strokeStyle = trafficMode === "sekin" ? "#ef4444" : "rgba(239, 68, 68, 0.25)";
      ctx.beginPath();
      ctx.moveTo(w * 0.5, 10);
      ctx.lineTo(w * 0.5, h * 0.45);
      ctx.stroke();

      // Service-specific POIs (parking / EV only on map)
      if (serviceMode === "parking") {
        PARKING_LOTS.forEach((lot) => {
          const p = getCanvasXY(lot.name.uz, { latitude: lot.lat, longitude: lot.lng }, w, h);
          const selected = lot.id === selectedServicePointId;
          ctx.fillStyle = selected ? "#22d3ee" : "rgba(34, 211, 238, 0.35)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, selected ? 9 : 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = selected ? "#ffffff" : "rgba(34, 211, 238, 0.9)";
          ctx.font = selected ? "bold 8px sans-serif" : "7px sans-serif";
          const label = lot.name[lang as "uz" | "en" | "ru"] || lot.name.uz;
          ctx.fillText(`P ${label}`, p.x + 8, p.y + 2);
        });
      } else if (serviceMode === "ev_charge") {
        EV_STATIONS.forEach((st) => {
          const p = getCanvasXY(st.name.uz, { latitude: st.lat, longitude: st.lng }, w, h);
          const selected = st.id === selectedServicePointId;
          ctx.fillStyle = selected ? "#a855f7" : "rgba(168, 85, 247, 0.35)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, selected ? 9 : 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = selected ? "#ffffff" : "rgba(196, 181, 253, 0.95)";
          ctx.font = selected ? "bold 8px sans-serif" : "7px sans-serif";
          const label = st.name[lang as "uz" | "en" | "ru"] || st.name.uz;
          ctx.fillText(`⚡ ${label}`, p.x + 8, p.y + 2);
        });
      } else {
        // General landmarks (taxi / delivery / cargo routes)
        TASHKENT_LOCATIONS.forEach((loc) => {
          const p = getCanvasXY(loc.name.uz, { latitude: loc.lat, longitude: loc.lng }, w, h);
          ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(156, 163, 175, 0.4)";
          ctx.font = "7px sans-serif";
          const label = loc.name[lang as "uz" | "en" | "ru"] || loc.name.uz;
          ctx.fillText(label, p.x + 5, p.y + 2);
        });
      }

      // Route Display (Starts when either manual pins or active orders are loaded)
      if (showRoute) {
        const fromPos = getCanvasXY(activeFrom, customFromCoords, w, h);
        const toPos = getCanvasXY(activeTo, customToCoords, w, h);
        const ax = fromPos.x;
        const ay = fromPos.y;
        const bx = toPos.x;
        const by = toPos.y;

        // Curve control point (gives a realistic bent road look)
        const tx = (ax + bx) / 2 + (by - ay) * 0.15;
        const ty = (ay + by) / 2 + (ax - bx) * 0.15;

        // Draw neon trace line behind path
        const routeGlow =
          serviceMode === "cargo"
            ? "rgba(59, 130, 246, 0.15)"
            : serviceMode === "delivery"
              ? "rgba(249, 115, 22, 0.15)"
              : "rgba(20, 184, 166, 0.15)";
        const routeLine =
          serviceMode === "cargo" ? "#3b82f6" : serviceMode === "delivery" ? "#f97316" : "#14b8a6";
        const vehicleColor =
          serviceMode === "cargo" ? "#3b82f6" : serviceMode === "delivery" ? "#f97316" : "#14b8a6";

        ctx.strokeStyle = routeGlow;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(tx, ty, bx, by);
        ctx.stroke();

        ctx.strokeStyle = routeLine;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(tx, ty, bx, by);
        ctx.stroke();

        // Pin A starting point (Green)
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(ax, ay, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ax, ay, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 8px sans-serif";
        ctx.fillText("A", ax - 3, ay + 3);

        // Pin B terminal point (Cyan)
        ctx.fillStyle = "#22d3ee";
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 8px sans-serif";
        ctx.fillText("B", bx - 3, by + 3);

        // Haydovchi — GPS koordinata bo'lsa aniq nuqta
        let cx: number;
        let cy: number;
        if (driverCoords) {
          const dp = getCanvasXY("", driverCoords, w, h);
          cx = dp.x;
          cy = dp.y;
        } else {
          const t = carProgress;
          cx = Math.pow(1 - t, 2) * ax + 2 * (1 - t) * t * tx + Math.pow(t, 2) * bx;
          cy = Math.pow(1 - t, 2) * ay + 2 * (1 - t) * t * ty + Math.pow(t, 2) * by;
        }

        // Radar waves
        const wave = (Date.now() % 1200) / 1200;
        ctx.strokeStyle = `rgba(20, 184, 166, ${1 - wave})`;
        if (serviceMode === "cargo") ctx.strokeStyle = `rgba(59, 130, 246, ${1 - wave})`;
        if (serviceMode === "delivery") ctx.strokeStyle = `rgba(249, 115, 22, ${1 - wave})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 5 + 15 * wave, 0, Math.PI * 2);
        ctx.stroke();

        // Driver pinpoint bubble
        ctx.fillStyle = vehicleColor;
        ctx.beginPath();
        ctx.arc(cx, cy - 10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy - 6);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + 4, cy - 6);
        ctx.fill();

        ctx.fillStyle = "#0c111d";
        ctx.beginPath();
        ctx.arc(cx, cy - 10, 3, 0, Math.PI * 2);
        ctx.fill();

        // Label details for origins next to pins
        ctx.fillStyle = "#9ca3af";
        ctx.font = "8px sans-serif";
        ctx.fillText(activeFrom, ax + 10, ay + 4);
        ctx.fillText(activeTo, bx + 10, by + 4);
      }

      // Draw client GPS marker if live user coords exist
      if (userCoords) {
        const p = getCanvasXY("", userCoords, w, h);
        
        ctx.strokeStyle = `rgba(59, 130, 246, 0.4)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#3b82f6";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    };

    drawMap();
    let animId = requestAnimationFrame(function loop() {
      drawMap();
      animId = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [trafficMode, carProgress, showRoute, activeFrom, activeTo, customFromCoords, customToCoords, userCoords, liveUserCoords, driverCoords, lang, serviceMode, selectedServicePointId]);

  return (
    <div className="relative w-full h-full min-h-[220px] rounded-xl overflow-hidden border border-slate-800 bg-[#0c111d] flex flex-col group">
      {/* Real-time map canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full flex-grow block cursor-crosshair"
      />

      {/* Pin Mode Instruction Overlay */}
      {pinMode && (
        <div className="absolute top-14 left-3 right-3 bg-teal-400 text-slate-950 p-2 rounded-lg text-[10px] font-bold leading-tight shadow-xl flex items-center gap-2 animate-bounce border border-teal-300 z-30">
          <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
          <span>
            {pinMode === "from"
              ? (lang === "uz" ? "A nuqtani tanlash uchun xarita ustiga bosing" : lang === "ru" ? "Нажмите на карту для выбора точки отправления A" : "Click on map to select starting point A")
              : (lang === "uz" ? "B nuqtani tanlash uchun xarita ustiga bosing" : lang === "ru" ? "Нажмите на карту для выбора точки назначения B" : "Click on map to select destination point B")
            }
          </span>
        </div>
      )}

      {/* Geolocation Controls */}
      <div className="absolute top-3 left-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button
          onClick={handleGetLocation}
          className="bg-slate-950/90 backdrop-blur-md p-2 rounded-lg border border-slate-800 hover:border-teal-500 hover:text-white transition-all flex items-center gap-1.5 text-[10px] text-gray-300 font-semibold shadow-lg group"
          title={lang === "uz" ? "Mening joylashuvim" : lang === "ru" ? "Мое местоположение" : "My Location"}
        >
          {locating ? (
            <Loader2 className="w-3.5 h-3.5 text-teal-400 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
          )}
          <span>
            {locating 
              ? (lang === "uz" ? "Aniqlanmoqda..." : lang === "ru" ? "Определение..." : "Locating...")
              : (lang === "uz" ? "Geolokatsiya" : lang === "ru" ? "Геолокация" : "Geolocation")}
          </span>
        </button>

        {userCoords && (
          <div className="bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-blue-500/40 text-[9px] font-mono text-blue-300 flex items-center gap-1.5 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span>
              {lang === "uz" ? "Siz:" : lang === "ru" ? "Вы:" : "You:"}{" "}
              {userCoords.latitude.toFixed(5)}, {userCoords.longitude.toFixed(5)}
            </span>
          </div>
        )}
      </div>

      {/* Haydovchi ETA */}
      {etaMinutes != null && etaMinutes >= 0 && (
        <div className="absolute bottom-3 left-3 right-3 z-20 flex justify-center pointer-events-none">
          <div className="bg-teal-500/95 text-slate-950 px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-2 animate-pulse">
            <Navigation className="w-3 h-3" />
            {lang === "uz"
              ? `Haydovchi ~${etaMinutes} daqiqada yetib keladi`
              : lang === "ru"
                ? `Водитель через ~${etaMinutes} мин`
                : `Driver arriving in ~${etaMinutes} min`}
          </div>
        </div>
      )}

      {/* Map floating controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 bg-slate-950/80 backdrop-blur-sm p-1.5 rounded-lg border border-slate-800 text-[10px] text-gray-400">
        <button
          onClick={() => setTrafficMode("tez")}
          className={`px-2 py-0.5 rounded transition ${
            trafficMode === "tez" ? "bg-emerald-500/20 text-emerald-400 font-medium" : "hover:text-gray-200"
          }`}
        >
          ● Tez (Green)
        </button>
        <button
          onClick={() => setTrafficMode("ortacha")}
          className={`px-2 py-0.5 rounded transition ${
            trafficMode === "ortacha" ? "bg-amber-500/20 text-amber-400 font-medium" : "hover:text-gray-200"
          }`}
        >
          ● O'rtacha (Amber)
        </button>
        <button
          onClick={() => setTrafficMode("sekin")}
          className={`px-2 py-0.5 rounded transition ${
            trafficMode === "sekin" ? "bg-red-500/20 text-red-400 font-medium" : "hover:text-gray-200"
          }`}
        >
          ● Sekin (Red)
        </button>
      </div>

      {/* Bottom overlay status */}
      <div className="absolute bottom-3 left-3 bg-slate-950/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 max-w-[85%]">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <div className="text-[10px] leading-tight text-gray-300">
          <p className="font-semibold text-white truncate max-w-[150px]">{driverName}</p>
          <p className="text-gray-400 text-[9px]">{driverStatus}</p>
        </div>
      </div>
    </div>
  );
}
