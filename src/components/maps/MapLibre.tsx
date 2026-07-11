import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Loader2 } from "lucide-react";
import { fetchOsrmRoute } from "../../services/platformApi";

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
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
  className?: string;
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
  className = "",
}: MapLibreProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [loading, setLoading] = useState(true);

  const from = customFromCoords ?? { latitude: 41.3216, longitude: 69.2285 };
  const to = customToCoords ?? { latitude: 41.3031, longitude: 69.2486 };

  useEffect(() => {
    if (!containerRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    mapRef.current?.remove();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [(from.longitude + to.longitude) / 2, (from.latitude + to.latitude) / 2],
      zoom: 13,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on("load", async () => {
      const addMarker = (lng: number, lat: number, color: string, label: string) => {
        const el = document.createElement("div");
        el.style.width = "14px";
        el.style.height = "14px";
        el.style.borderRadius = "50%";
        el.style.background = color;
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 0 6px rgba(0,0,0,0.5)";
        el.title = label;
        const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
        markersRef.current.push(marker);
      };

      addMarker(from.longitude, from.latitude, "#2dd4bf", activeFrom);
      addMarker(to.longitude, to.latitude, "#f59e0b", activeTo);
      if (driverCoords) addMarker(driverCoords.longitude, driverCoords.latitude, "#38bdf8", driverName);

      if (showRoute) {
        try {
          const route = await fetchOsrmRoute(from.latitude, from.longitude, to.latitude, to.longitude);
          if (map.getSource("route")) {
            (map.getSource("route") as maplibregl.GeoJSONSource).setData({
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: route.geometry },
            });
          } else {
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
          }

          const bounds = new maplibregl.LngLatBounds();
          route.geometry.forEach(([lng, lat]) => bounds.extend([lng, lat]));
          map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
        } catch {
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

      setLoading(false);
    });

    if (onMapClick) {
      map.on("click", (e) => onMapClick(e.lngLat.lat, e.lngLat.lng, "Tanlangan nuqta"));
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      map.remove();
    };
  }, [from.latitude, from.longitude, to.latitude, to.longitude, showRoute, activeFrom, activeTo]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !driverCoords) return;
    if (markersRef.current[2]) {
      markersRef.current[2].setLngLat([driverCoords.longitude, driverCoords.latitude]);
    }
  }, [driverCoords?.latitude, driverCoords?.longitude]);

  return (
    <div className={`relative w-full h-full min-h-[8rem] bg-slate-950 ${className}`}>
      <div ref={containerRef} className="absolute inset-0" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10">
          <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
        </div>
      )}
      <div className="absolute top-1 right-1 text-[7px] font-mono text-emerald-400 bg-slate-950/80 px-1.5 py-0.5 rounded z-10">
        OSM · MapLibre
      </div>
    </div>
  );
}
