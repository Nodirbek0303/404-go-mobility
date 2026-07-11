import React, { useState } from "react";
import MapComponent from "../MapComponent";
import MapLibre from "./MapLibre";

type MapProps = React.ComponentProps<typeof MapComponent> & {
  driverCoords?: { latitude: number; longitude: number } | null;
  liveUserCoords?: { latitude: number; longitude: number } | null;
  etaMinutes?: number | null;
  compact?: boolean;
};

export default function SmartMap({ compact = true, liveUserCoords, etaMinutes, driverCoords, ...props }: MapProps) {
  const [useFallback, setUseFallback] = useState(false);

  const shared = {
    ...props,
    liveUserCoords,
    driverCoords,
    etaMinutes,
    liveTracking: props.liveTracking ?? !!liveUserCoords,
  };

  if (compact || useFallback) {
    return <MapComponent {...shared} />;
  }

  return (
    <MapLibre
      activeFrom={props.activeFrom}
      activeTo={props.activeTo}
      driverName={props.driverName}
      showRoute={props.showRoute}
      onMapClick={props.onMapClick}
      customFromCoords={props.customFromCoords}
      customToCoords={props.customToCoords}
      driverCoords={driverCoords}
      liveUserCoords={liveUserCoords}
      etaMinutes={etaMinutes}
      onFailed={() => setUseFallback(true)}
    />
  );
}
