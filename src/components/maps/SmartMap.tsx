import React, { useEffect, useState } from "react";
import MapComponent from "../MapComponent";
import MapGoogle from "./MapGoogle";
import { fetchPlatformConfig } from "../../services/platformApi";

type MapProps = React.ComponentProps<typeof MapComponent> & {
  driverCoords?: { latitude: number; longitude: number } | null;
};

/** Google Maps kaliti bo'lsa haqiqiy xarita, aks holda canvas fallback */
export default function SmartMap(props: MapProps) {
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const [apiKey, setApiKey] = useState<string | null>(envKey || null);
  const [checked, setChecked] = useState(!!envKey);

  useEffect(() => {
    if (envKey) return;
    fetchPlatformConfig()
      .then((cfg) => {
        if (cfg.googleMapsKey) setApiKey(cfg.googleMapsKey);
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [envKey]);

  if (!checked) {
    return <div className="w-full h-full min-h-[8rem] bg-slate-950 animate-pulse rounded-xl" />;
  }

  if (apiKey) {
    return (
      <MapGoogle
        apiKey={apiKey}
        activeFrom={props.activeFrom}
        activeTo={props.activeTo}
        driverName={props.driverName}
        showRoute={props.showRoute}
        onMapClick={props.onMapClick}
        pinMode={props.pinMode}
        customFromCoords={props.customFromCoords}
        customToCoords={props.customToCoords}
        driverCoords={props.driverCoords}
      />
    );
  }

  return <MapComponent {...props} />;
}
