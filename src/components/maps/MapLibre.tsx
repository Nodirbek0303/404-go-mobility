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
  onMapClick?: (lat: number, lng: number, name: string) => void;
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

export default function MapLibre({
  activeFrom = "A",
  activeTo = "B",
  driverName = "Haydovchi",
  showRoute = false,
  onMapClick,
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
  const markersRef = useRef<Partial<Record<"from" | "to" | "driver" | "user", maplibregl.Marker>>>({});
  const onMapClickRef = useRef(onMapClick);
  const loadedRef = useRef(false);
  const [loading, setLoading] = useState(true);

  onMapClickRef.current = onMapClick;

  // Xaritani faqat bir marta yaratish — qayta yuklanish yo'q
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let destroyed = false;
    let loadTimeout: ReturnType<typeof setTimeout> | null = null;

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
        zoom: 12,
        attributionControl: false,
      });
      mapRef.current = map;

      loadTimeout = setTimeout(() => {
        if (!destroyed && !loadedRef.current) {
          console.warn("MapLibre load timeout");
          onFailed?.();
        }
      }, 12000);

      map.on("error", (e) => {
        if (!destroyed && !loadedRef.current) {
          console.warn("MapLibre error:", e);
          onFailed?.();
        }
      });

      map.on("load", () => {
        if (destroyed) return;
        loadedRef.current = true;
        if (loadTimeout) clearTimeout(loadTimeout);
        setLoading(false);
      });

      map.on("click", (e) => {
        onMapClickRef.current?.(e.lngLat.lat, e.lngLat.lng, "Tanlangan nuqta");
      });
    } catch (e) {
      console.warn("MapLibre init failed:", e);
      onFailed?.();
    }

    return cleanup;
  }, [onFailed]);

  const setMarker = (
    key: "from" | "to" | "driver" | "user",
    coords: { latitude: number; longitude: number } | null | undefined,
    color: string,
    label: string
  ) => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    if (!coords) {
      markersRef.current[key]?.remove();
      delete markersRef.current[key];
      return;
    }

    const lngLat: [number, number] = [coords.longitude, coords.latitude];
    const existing = markersRef.current[key];
    if (existing) {
      existing.setLngLat(lngLat);
      return;
    }

    markersRef.current[key] = new maplibregl.Marker({ element: makeDot(color, label) })
      .setLngLat(lngLat)
      .addTo(map);
  };

  // Markerlar yangilanishi — xarita qayta yaratilmaydi
  useEffect(() => {
    if (!loadedRef.current) return;

    setMarker("from", customFromCoords, "#2dd4bf", activeFrom);
    setMarker("to", customToCoords, "#f59e0b", activeTo);
    setMarker("driver", driverCoords, "#38bdf8", driverName);
    setMarker("user", liveUserCoords, "#3b82f6", lang === "uz" ? "Siz" : "You");

    const map = mapRef.current;
    if (!map) return;

    if (customFromCoords && customToCoords) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([customFromCoords.longitude, customFromCoords.latitude]);
      bounds.extend([customToCoords.longitude, customToCoords.latitude]);
      map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 600 });
    } else if (customFromCoords) {
      map.flyTo({
        center: [customFromCoords.longitude, customFromCoords.latitude],
        zoom: 14,
        duration: 600,
      });
    } else if (customToCoords) {
      map.flyTo({
        center: [customToCoords.longitude, customToCoords.latitude],
        zoom: 14,
        duration: 600,
      });
    } else if (liveUserCoords) {
      map.flyTo({
        center: [liveUserCoords.longitude, liveUserCoords.latitude],
        zoom: 13,
        duration: 600,
      });
    }
  }, [
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
    loading,
  ]);

  // Yo'l chizig'i — source yangilanadi, xarita emas
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    const removeRoute = () => {
      if (map.getLayer("route-line")) map.removeLayer("route-line");
      if (map.getSource("route")) map.removeSource("route");
    };

    if (!showRoute || !customFromCoords || !customToCoords) {
      removeRoute();
      return;
    }

    let cancelled = false;

    const drawRoute = async () => {
      const from = customFromCoords;
      const to = customToCoords;
      let geometry: [number, number][] = [
        [from.longitude, from.latitude],
        [to.longitude, to.latitude],
      ];

      try {
        const route = await fetchOsrmRoute(from.latitude, from.longitude, to.latitude, to.longitude);
        if (!cancelled) geometry = route.geometry;
      } catch {
        /* straight line fallback */
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
    };

    void drawRoute();
    return () => {
      cancelled = true;
    };
  }, [
    showRoute,
    customFromCoords?.latitude,
    customFromCoords?.longitude,
    customToCoords?.latitude,
    customToCoords?.longitude,
    loading,
  ]);

  return (
    <div className={`maplibre-root relative w-full h-full min-h-[5rem] bg-slate-900 overflow-hidden isolate ${className}`}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full" style={{ contain: "strict" }} />
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
