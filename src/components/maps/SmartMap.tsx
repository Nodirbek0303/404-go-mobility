import React, { useState } from "react";
import MapComponent from "../MapComponent";
import MapLibre from "./MapLibre";

type MapProps = React.ComponentProps<typeof MapComponent> & {
  driverCoords?: { latitude: number; longitude: number } | null;
  /** Kichik embed — canvas xarita (buyurtma formasi) */
  compact?: boolean;
};

/**
 * compact=true — barqaror canvas xarita (buyurtma berish)
 * compact=false — MapLibre + OSM (faol safar), xato bo'lsa canvas
 */
export default function SmartMap({ compact = true, ...props }: MapProps) {
  const [useFallback, setUseFallback] = useState(false);

  if (compact || useFallback) {
    return <MapComponent {...props} />;
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
      driverCoords={props.driverCoords}
      onFailed={() => setUseFallback(true)}
    />
  );
}
