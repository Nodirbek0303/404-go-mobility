import { cacheGet, cacheSet } from "../cache/redis";

export interface OsrmRouteResult {
  distanceKm: number;
  durationMin: number;
  geometry: Array<[number, number]>; // [lng, lat]
}

const OSRM_URL = process.env.OSRM_URL || "https://router.project-osrm.org";

/** OSRM — bepul marshrut https://project-osrm.org */
export async function getOsrmRoute(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): Promise<OsrmRouteResult> {
  const cacheKey = `route:${fromLat},${fromLon}:${toLat},${toLon}`;
  const cached = await cacheGet<OsrmRouteResult>(cacheKey);
  if (cached) return cached;

  const url = `${OSRM_URL}/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson&steps=false`;

  const res = await fetch(url, {
    headers: { "User-Agent": "404-GO-Mobility/1.0" },
  });
  if (!res.ok) throw new Error(`OSRM ${res.status}`);

  const data = (await res.json()) as {
    code?: string;
    routes?: Array<{
      distance?: number;
      duration?: number;
      geometry?: { coordinates?: Array<[number, number]> };
    }>;
  };

  if (data.code !== "Ok" || !data.routes?.[0]) {
    throw new Error("OSRM route not found");
  }

  const route = data.routes[0];
  const result: OsrmRouteResult = {
    distanceKm: Math.round(((route.distance ?? 0) / 1000) * 100) / 100,
    durationMin: Math.max(1, Math.ceil((route.duration ?? 0) / 60)),
    geometry: route.geometry?.coordinates ?? [
      [fromLon, fromLat],
      [toLon, toLat],
    ],
  };

  await cacheSet(cacheKey, result, 1800);
  return result;
}
