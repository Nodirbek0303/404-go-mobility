import React from "react";
import MapComponent from "../MapComponent";
import MapLibre from "./MapLibre";

type MapProps = React.ComponentProps<typeof MapComponent> & {
  driverCoords?: { latitude: number; longitude: number } | null;
};

/** OpenStreetMap + MapLibre GL + OSRM — 100% bepul xarita */
export default function SmartMap(props: MapProps) {
  const [failed, setFailed] = React.useState(false);

  if (failed) return <MapComponent {...props} />;

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
    />
  );
}
