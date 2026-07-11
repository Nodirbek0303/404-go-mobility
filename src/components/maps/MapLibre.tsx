import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Loader2 } from "lucide-react";
import { fetchOsrmRoute } from "../../services/platformApi";

/** Carto OSM — OSM tiles bilan barqarorroq */
const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap © CARTO",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const TASHKENT_CENTER = { latitude: 41.3111, longitude: 69.2797 };

interface MapLibreProps {
  activeFrom?: string;
  activeTo?: string;
  driverName?: string;
  showRoute?: boolean;
  /** true = foydalanuvchi xaritani erkin siljita oladi, avto-markazlash yo'q */
  lockCamera?: boolean;
  /** Bir martalik kamera — GPS yoki tanlangan nuqtaga */
  initialFlyTo?: { latitude: number; longitude: number } | null;
  initialFlyToKey?: number;
  onMapClick?: (lat: number, lng: number, name: string) => void;
  onFromMoved?: (lat: number, lng: number) => void;
  onToMoved?: (lat: number, lng: number) => void;
  customFromCoords?: { latitude: number; longitude: number } | null;
  customToCoords?: { latitude: number; longitude: number } | null;
  driverCoords?: { latitude: number; longitude: number } | null;
  liveUserCoords?: { latitude: number; longitude: number } | null;
  etaMinutes?: number | null;
  onFailed?: () => void;
  className?: string;
  lang?: string;
}

function makeDot(color: string, label: string) {
  const el = document.createElement("div");
  el.style.width = "16px";
  el.style.height = "16px";
  el.style.borderRadius = "50%";
  el.style.background = color;
  el.style.border = "2px solid white";
  el.style.boxShadow = "0 0 8px rgba(0,0,0,0.45)";
  el.style.cursor = "pointer";
  el.title = label;
  return el;
}

function makePin(color: string, letter: string, label: string) {
  const el = document.createElement("div");
  el.style.width = "28px";
  el.style.height = "28px";
  el.style.borderRadius = "50%";
  el.style.background = color;
  el.style.border = "3px solid white";
  el.style.boxShadow = "0 2px 10px rgba(0,0,0,0.55)";
  el.style.cursor = "grab";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.color = "#0f172a";
  el.style.fontWeight = "800";
  el.style.fontSize = "12px";
  el.style.fontFamily = "sans-serif";
  el.style.userSelect = "none";
  el.style.touchAction = "none";
  el.textContent = letter;
  el.title = label;
  return el;
}

type MarkerKey = "from" | "to" | "driver" | "user";

export default function MapLibre({
  activeFrom = "A",
  activeTo = "B",
  driverName = "Haydovchi",
  showRoute = false,
  lockCamera = false,
  initialFlyTo,
  initialFlyToKey = 0,
  onMapClick,
  onFromMoved,
  onToMoved,
  customFromCoords,
  customToCoords,
  driverCoords,
  liveUserCoords,
  etaMinutes,
  onFailed,
  className = "",
  lang = "uz",
}: MapLibreProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Partial<Record<MarkerKey, maplibregl.Marker>>>({});
  const draggingRef = useRef<MarkerKey | null>(null);
  const lastDragEndRef = useRef(0);
  const onMapClickRef = useRef(onMapClick);
  const onFromMovedRef = useRef(onFromMoved);
  const onToMovedRef = useRef(onToMoved);
  const onFailedRef = useRef(onFailed);
  const lockCameraRef = useRef(lockCamera);
  const loadedRef = useRef(false);
  const failedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  onMapClickRef.current = onMapClick;
  onFromMovedRef.current = onFromMoved;
  onToMovedRef.current = onToMoved;
  onFailedRef.current = onFailed;
  lockCameraRef.current = lockCamera;

  // Xaritani faqat bir marta yaratish
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let destroyed = false;
    let loadTimeout: ReturnType<typeof setTimeout> | null = null;

    const failOnce = () => {
      if (destroyed || failedRef.current || loadedRef.current) return;
      failedRef.current = true;
      onFailedRef.current?.();
    };

    const cleanup = () => {
      destroyed = true;
      loadedRef.current = false;
      if (loadTimeout) clearTimeout(loadTimeout);
      Object.values(markersRef.current).forEach((m) => m?.remove());
      markersRef.current = {};
      try {
        mapRef.current?.remove();
      } catch {
        /* ignore */
      }
      mapRef.current = null;
    };

    try {
      const map = new maplibregl.Map({
        container,
        style: OSM_STYLE,
        center: [TASHKENT_CENTER.longitude, TASHKENT_CENTER.latitude],
        zoom: 13,
        attributionControl: false,
      });
      mapRef.current = map;
      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();

      loadTimeout = setTimeout(() => {
        if (!destroyed && !loadedRef.current) {
          console.warn("MapLibre load timeout");
          failOnce();
        }
      }, 15000);

      map.on("error", (e) => {
        if (!destroyed && !loadedRef.current) {
          console.warn("MapLibre error:", e);
          failOnce();
        }
      });

      map.on("load", () => {
        if (destroyed) return;
        loadedRef.current = true;
        if (loadTimeout) clearTimeout(loadTimeout);
        setLoading(false);
        setReady(true);
      });

      map.on("click", (e) => {
        // Pin surilgandan keyin tasodifiy clickni e'tiborsiz qoldirish
        if (Date.now() - lastDragEndRef.current < 350) return;
        if (draggingRef.current) return;
        onMapClickRef.current?.(e.lngLat.lat, e.lngLat.lng, "Tanlangan nuqta");
      });
    } catch (e) {
      console.warn("MapLibre init failed:", e);
      failOnce();
    }

    return cleanup;
  }, []);

  // Markerlar — kamera harakatsiz
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const upsert = (
      key: MarkerKey,
      coords: { latitude: number; longitude: number } | null | undefined,
      color: string,
      label: string,
      draggable: boolean
    ) => {
      if (!coords) {
        markersRef.current[key]?.remove();
        delete markersRef.current[key];
        return;
      }

      const lngLat: [number, number] = [coords.longitude, coords.latitude];
      const existing = markersRef.current[key];

      if (existing) {
        if (draggingRef.current !== key) {
          existing.setLngLat(lngLat);
        }
        return;
      }

      const el =
        key === "from" || key === "to"
          ? makePin(color, key === "from" ? "A" : "B", label)
          : makeDot(color, label);

      const marker = new maplibregl.Marker({ element: el, draggable })
        .setLngLat(lngLat)
        .addTo(map);

      if (draggable) {
        marker.on("dragstart", () => {
          draggingRef.current = key;
        });
        marker.on("dragend", () => {
          draggingRef.current = null;
          lastDragEndRef.current = Date.now();
          const pos = marker.getLngLat();
          if (key === "from") onFromMovedRef.current?.(pos.lat, pos.lng);
          else if (key === "to") onToMovedRef.current?.(pos.lat, pos.lng);
        });
      }

      markersRef.current[key] = marker;
    };

    upsert("from", customFromCoords, "#2dd4bf", activeFrom, true);
    upsert("to", customToCoords, "#f59e0b", activeTo, true);
    upsert("driver", driverCoords, "#38bdf8", driverName, false);
    upsert("user", liveUserCoords, "#3b82f6", lang === "uz" ? "Siz" : "You", false);
  }, [
    ready,
    customFromCoords?.latitude,
    customFromCoords?.longitude,
    customToCoords?.latitude,
    customToCoords?.longitude,
    driverCoords?.latitude,
    driverCoords?.longitude,
    liveUserCoords?.latitude,
    liveUserCoords?.longitude,
    activeFrom,
    activeTo,
    driverName,
    lang,
  ]);

  // Kamera — faqat lockCamera=false bo'lganda va faqat birinchi marta ikkala nuqta paydo bo'lganda
  const didFitBothRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || lockCameraRef.current) return;

    if (customFromCoords && customToCoords && !didFitBothRef.current) {
      didFitBothRef.current = true;
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([customFromCoords.longitude, customFromCoords.latitude]);
      bounds.extend([customToCoords.longitude, customToCoords.latitude]);
      map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 600 });
    }
  }, [
    ready,
    lockCamera,
    customFromCoords?.latitude,
    customFromCoords?.longitude,
    customToCoords?.latitude,
    customToCoords?.longitude,
  ]);

  // lockCamera yoqilganda fit flag qayta tiklanadi (taksi qayta ochilganda)
  useEffect(() => {
    if (lockCamera) didFitBothRef.current = false;
  }, [lockCamera]);

  const lastFlownKeyRef = useRef(-1);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !initialFlyTo || initialFlyToKey <= 0) return;
    if (lastFlownKeyRef.current >= initialFlyToKey) return;
    lastFlownKeyRef.current = initialFlyToKey;
    map.easeTo({
      center: [initialFlyTo.longitude, initialFlyTo.latitude],
      zoom: 15,
      duration: 700,
    });
  }, [
    ready,
    initialFlyToKey,
    initialFlyTo?.latitude,
    initialFlyTo?.longitude,
  ]);

  // Yo'l chizig'i
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const removeRoute = () => {
      try {
        if (map.getLayer("route-line")) map.removeLayer("route-line");
        if (map.getSource("route")) map.removeSource("route");
      } catch {
        /* ignore */
      }
    };

    if (!showRoute || !customFromCoords || !customToCoords) {
      removeRoute();
      return;
    }

    let cancelled = false;
    const from = customFromCoords;
    const to = customToCoords;

    void (async () => {
      let geometry: [number, number][] = [
        [from.longitude, from.latitude],
        [to.longitude, to.latitude],
      ];
      try {
        const route = await fetchOsrmRoute(from.latitude, from.longitude, to.latitude, to.longitude);
        if (!cancelled) geometry = route.geometry;
      } catch {
        /* straight line */
      }
      if (cancelled || !mapRef.current) return;
      const m = mapRef.current;
      const data: GeoJSON.Feature = {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: geometry },
      };
      const source = m.getSource("route") as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(data);
      } else {
        m.addSource("route", { type: "geojson", data });
        m.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          paint: { "line-color": "#2dd4bf", "line-width": 4, "line-opacity": 0.85 },
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    ready,
    showRoute,
    customFromCoords?.latitude,
    customFromCoords?.longitude,
    customToCoords?.latitude,
    customToCoords?.longitude,
  ]);

  return (
    <div className={`maplibre-root relative w-full h-full min-h-[5rem] bg-slate-900 overflow-hidden isolate ${className}`}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full touch-pan-x touch-pan-y" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-[1] pointer-events-none">
          <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
        </div>
      )}
      {etaMinutes != null && etaMinutes >= 0 && (
        <div className="absolute bottom-2 left-2 right-2 z-[3] flex justify-center pointer-events-none">
          <div className="bg-teal-500/95 text-slate-950 px-3 py-1 rounded-full text-[9px] font-bold shadow-lg animate-pulse">
            {lang === "uz"
              ? `Haydovchi ~${etaMinutes} daqiqada`
              : lang === "ru"
                ? `Водитель ~${etaMinutes} мин`
                : `Driver ~${etaMinutes} min`}
          </div>
        </div>
      )}
      <div className="absolute top-1 right-1 text-[7px] font-mono text-emerald-400 bg-slate-950/80 px-1.5 py-0.5 rounded z-[2] pointer-events-none">
        OSM · MapLibre
      </div>
    </div>
  );
}
