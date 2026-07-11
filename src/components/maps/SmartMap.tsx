import React, { useCallback, useState } from "react";
import MapComponent from "../MapComponent";
import MapLibre from "./MapLibre";

type MapProps = React.ComponentProps<typeof MapComponent> & {
  driverCoords?: { latitude: number; longitude: number } | null;
  liveUserCoords?: { latitude: number; longitude: number } | null;
  etaMinutes?: number | null;
  compact?: boolean;
  /** Taksi tanlash kabi interaktiv oqimlarda barqaror canvas xarita */
  interactive?: boolean;
  /** A nuqta pinini surganda */
  onFromMoved?: (lat: number, lng: number) => void;
  /** B nuqta pinini surganda */
  onToMoved?: (lat: number, lng: number) => void;
};

export default function SmartMap({
  compact = true,
  interactive = false,
  liveUserCoords,
  etaMinutes,
  driverCoords,
  onFromMoved,
  onToMoved,
  ...props
}: MapProps) {
  const [useFallback, setUseFallback] = useState(false);

  const handleFailed = useCallback(() => {
    setUseFallback(true);
  }, []);

  const shared = {
    ...props,
    liveUserCoords,
    driverCoords,
    etaMinutes,
    liveTracking: props.liveTracking ?? !!liveUserCoords,
  };

  // Interaktiv tanlash — tarmoq xatosiz barqaror canvas
  if (interactive || compact || useFallback) {
    return <MapComponent {...shared} />;
  }

  return (
    <MapLibre
      activeFrom={props.activeFrom}
      activeTo={props.activeTo}
      driverName={props.driverName}
      showRoute={props.showRoute}
      onMapClick={props.onMapClick}
      onFromMoved={onFromMoved}
      onToMoved={onToMoved}
      customFromCoords={props.customFromCoords}
      customToCoords={props.customToCoords}
      driverCoords={driverCoords}
      liveUserCoords={liveUserCoords}
      etaMinutes={etaMinutes}
      lang={props.lang}
      onFailed={handleFailed}
    />
  );
}
