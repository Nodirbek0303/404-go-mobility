import { useCallback, useEffect, useRef, useState } from "react";

export interface LiveCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export function useLiveLocation() {
  const [coords, setCoords] = useState<LiveCoords | null>(null);
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    stopTracking();
    setTracking(true);
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        setError(err.message);
        setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
  }, [stopTracking]);

  const requestOnce = useCallback((): Promise<LiveCoords | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setCoords(c);
          resolve(c);
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  useEffect(() => () => stopTracking(), [stopTracking]);

  return { coords, tracking, error, startTracking, stopTracking, requestOnce };
}
