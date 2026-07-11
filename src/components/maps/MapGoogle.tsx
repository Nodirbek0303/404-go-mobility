import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (
          el: HTMLElement,
          opts: {
            center: { lat: number; lng: number };
            zoom: number;
            disableDefaultUI?: boolean;
            styles?: Array<{ featureType: string; elementType: string; stylers: Array<{ color: string }> }>;
          }
        ) => {
          fitBounds: (b: unknown) => void;
        };
        Marker: new (opts: {
          map: unknown;
          position: { lat: number; lng: number };
          title?: string;
          icon?: { path: unknown; scale: number; fillColor: string; fillOpacity: number; strokeColor: string; strokeWeight: number };
        }) => { setMap: (m: unknown | null) => void; setPosition: (p: { lat: number; lng: number }) => void };
        LatLngBounds: new () => { extend: (p: { lat: number; lng: number }) => void };
        Polyline: new (opts: {
          map: unknown;
          path: Array<{ lat: number; lng: number }>;
          strokeColor: string;
          strokeOpacity: number;
          strokeWeight: number;
        }) => { setMap: (m: unknown | null) => void };
        SymbolPath: { CIRCLE: unknown };
      };
    };
  }
}

const DARK_STYLE = [
  { featureType: "all", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#020617" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
];

function loadGoogleMaps(apiKey: string): Promise<NonNullable<typeof window.google>> {
  if (window.google?.maps) return Promise.resolve(window.google);

  return new Promise((resolve, reject) => {
    const id = "google-maps-script";
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => window.google && resolve(window.google));
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => (window.google ? resolve(window.google) : reject(new Error("Google Maps failed")));
    script.onerror = () => reject(new Error("Google Maps script load failed"));
    document.head.appendChild(script);
  });
}

interface MapGoogleProps {
  apiKey: string;
  activeFrom?: string;
  activeTo?: string;
  driverName?: string;
  showRoute?: boolean;
  onMapClick?: (lat: number, lng: number, name: string) => void;
  pinMode?: "from" | "to" | null;
  customFromCoords?: { latitude: number; longitude: number } | null;
  customToCoords?: { latitude: number; longitude: number } | null;
  driverCoords?: { latitude: number; longitude: number } | null;
  className?: string;
}

export default function MapGoogle({
  apiKey,
  activeFrom = "Chorsu",
  activeTo = "Magic City",
  driverName = "Haydovchi",
  showRoute = true,
  onMapClick,
  customFromCoords,
  customToCoords,
  driverCoords,
  className = "",
}: MapGoogleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<Array<{ setMap: (m: unknown | null) => void; setPosition?: (p: { lat: number; lng: number }) => void }>>([]);
  const polylineRef = useRef<{ setMap: (m: unknown | null) => void } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const from = customFromCoords ?? { latitude: 41.3216, longitude: 69.2285 };
  const to = customToCoords ?? { latitude: 41.3031, longitude: 69.2486 };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const g = await loadGoogleMaps(apiKey);
        if (cancelled || !containerRef.current) return;

        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
        polylineRef.current?.setMap(null);

        const centerLat = (from.latitude + to.latitude) / 2;
        const centerLng = (from.longitude + to.longitude) / 2;

        const map = new g.maps.Map(containerRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 13,
          disableDefaultUI: true,
          styles: DARK_STYLE,
        });
        mapRef.current = map;

        const makeMarker = (pos: { lat: number; lng: number }, title: string, color: string) =>
          new g.maps.Marker({
            map,
            position: pos,
            title,
            icon: {
              path: g.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            },
          });

        markersRef.current.push(makeMarker({ lat: from.latitude, lng: from.longitude }, activeFrom, "#2dd4bf"));
        markersRef.current.push(makeMarker({ lat: to.latitude, lng: to.longitude }, activeTo, "#f59e0b"));

        if (driverCoords) {
          markersRef.current.push(
            makeMarker({ lat: driverCoords.latitude, lng: driverCoords.longitude }, driverName, "#38bdf8")
          );
        }

        if (showRoute) {
          polylineRef.current = new g.maps.Polyline({
            map,
            path: [
              { lat: from.latitude, lng: from.longitude },
              { lat: to.latitude, lng: to.longitude },
            ],
            strokeColor: "#2dd4bf",
            strokeOpacity: 0.85,
            strokeWeight: 4,
          });
        }

        const bounds = new g.maps.LatLngBounds();
        bounds.extend({ lat: from.latitude, lng: from.longitude });
        bounds.extend({ lat: to.latitude, lng: to.longitude });
        if (driverCoords) bounds.extend({ lat: driverCoords.latitude, lng: driverCoords.longitude });
        map.fitBounds(bounds);

        if (onMapClick) {
          (map as { addListener?: (e: string, cb: (ev: { latLng: { lat: () => number; lng: () => number } }) => void) => void }).addListener?.(
            "click",
            (ev) => onMapClick(ev.latLng.lat(), ev.latLng.lng(), "Tanlangan nuqta")
          );
        }

        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Google Maps xato");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.setMap(null));
      polylineRef.current?.setMap(null);
    };
  }, [apiKey, activeFrom, activeTo, from.latitude, from.longitude, to.latitude, to.longitude, showRoute]);

  useEffect(() => {
    const driverMarker = markersRef.current[2];
    if (driverMarker?.setPosition && driverCoords) {
      driverMarker.setPosition({ lat: driverCoords.latitude, lng: driverCoords.longitude });
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
      {error && (
        <div className="absolute bottom-1 left-1 right-1 text-[8px] text-amber-400 bg-slate-950/90 px-2 py-1 rounded z-10">
          {error}
        </div>
      )}
      <div className="absolute top-1 right-1 text-[7px] font-mono text-blue-400 bg-slate-950/80 px-1.5 py-0.5 rounded z-10">
        Google Maps
      </div>
    </div>
  );
}
