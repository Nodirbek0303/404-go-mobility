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

export default function MapLibre({
  activeFrom = "Chorsu",
  activeTo = "Magic City",
  driverName = "Haydovchi",
  showRoute = true,
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
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [loading, setLoading] = useState(true);

  const from = customFromCoords ?? { latitude: 41.3216, longitude: 69.2285 };
  const to = customToCoords ?? { latitude: 41.3031, longitude: 69.2486 };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;
    let loadTimeout: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      destroyed = true;
      if (loadTimeout) clearTimeout(loadTimeout);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
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
        center: [(from.longitude + to.longitude) / 2, (from.latitude + to.latitude) / 2],
        zoom: 13,
        attributionControl: false,
      });
      mapRef.current = map;

      loadTimeout = setTimeout(() => {
        if (!destroyed && loading) {
          console.warn("MapLibre load timeout");
          onFailed?.();
        }
      }, 8000);

      map.on("error", (e) => {
        console.warn("MapLibre error:", e);
        if (!destroyed) onFailed?.();
      });

      map.on("load", async () => {
        if (destroyed) return;
        if (loadTimeout) clearTimeout(loadTimeout);

        const addMarker = (lng: number, lat: number, color: string, label: string) => {
          const el = document.createElement("div");
          el.style.width = "14px";
          el.style.height = "14px";
          el.style.borderRadius = "50%";
          el.style.background = color;
          el.style.border = "2px solid white";
          el.style.boxShadow = "0 0 6px rgba(0,0,0,0.5)";
          el.title = label;
          markersRef.current.push(
            new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map)
          );
        };

        addMarker(from.longitude, from.latitude, "#2dd4bf", activeFrom);
        addMarker(to.longitude, to.latitude, "#f59e0b", activeTo);
        if (driverCoords) {
          addMarker(driverCoords.longitude, driverCoords.latitude, "#38bdf8", driverName);
        }
        if (liveUserCoords) {
          addMarker(liveUserCoords.longitude, liveUserCoords.latitude, "#3b82f6", lang === "uz" ? "Siz" : "You");
        }

        if (showRoute) {
          try {
            const route = await fetchOsrmRoute(from.latitude, from.longitude, to.latitude, to.longitude);
            if (destroyed) return;
            map.addSource("route", {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates: route.geometry },
              },
            });
            map.addLayer({
              id: "route-line",
              type: "line",
              source: "route",
              paint: { "line-color": "#2dd4bf", "line-width": 4, "line-opacity": 0.85 },
            });
            const bounds = new maplibregl.LngLatBounds();
            route.geometry.forEach(([lng, lat]) => bounds.extend([lng, lat]));
            map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
          } catch {
            if (!destroyed) {
              map.addSource("route", {
                type: "geojson",
                data: {
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "LineString",
                    coordinates: [
                      [from.longitude, from.latitude],
                      [to.longitude, to.latitude],
                    ],
                  },
                },
              });
              map.addLayer({
                id: "route-line",
                type: "line",
                source: "route",
                paint: { "line-color": "#2dd4bf", "line-width": 3, "line-opacity": 0.7 },
              });
            }
          }
        }

        if (!destroyed) setLoading(false);
      });

      if (onMapClick) {
        map.on("click", (e) => onMapClick(e.lngLat.lat, e.lngLat.lng, "Tanlangan nuqta"));
      }
    } catch (e) {
      console.warn("MapLibre init failed:", e);
      onFailed?.();
    }

    return cleanup;
  }, [from.latitude, from.longitude, to.latitude, to.longitude, showRoute, activeFrom, activeTo]);

  useEffect(() => {
    if (markersRef.current[2] && driverCoords) {
      markersRef.current[2].setLngLat([driverCoords.longitude, driverCoords.latitude]);
    }
  }, [driverCoords?.latitude, driverCoords?.longitude]);

  useEffect(() => {
    if (liveUserCoords && mapRef.current && markersRef.current[3]) {
      markersRef.current[3].setLngLat([liveUserCoords.longitude, liveUserCoords.latitude]);
    }
  }, [liveUserCoords?.latitude, liveUserCoords?.longitude]);

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
