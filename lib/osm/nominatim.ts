import { cacheGet, cacheSet } from "../cache/redis";

export interface GeocodeResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

const NOMINATIM_URL = process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org";
const USER_AGENT = process.env.NOMINATIM_USER_AGENT || "404-GO-Mobility/1.0 (contact@404go.app)";

/** Nominatim — bepul manzil qidirish https://nominatim.org */
export async function geocodeNominatim(query: string, lat = 41.311, lon = 69.2797): Promise<GeocodeResult[]> {
  const cacheKey = `geo:${query.toLowerCase()}:${lat}:${lon}`;
  const cached = await cacheGet<GeocodeResult[]>(cacheKey);
  if (cached) return cached;

  const q = query.includes("Toshkent") || query.includes("Tashkent") ? query : `${query}, Tashkent, Uzbekistan`;
  const url = new URL(`${NOMINATIM_URL}/search`);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "8");
  url.searchParams.set("countrycodes", "uz");
  url.searchParams.set("viewbox", `${lon - 0.5},${lat + 0.5},${lon + 0.5},${lat - 0.5}`);
  url.searchParams.set("bounded", "0");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);

  const data = (await res.json()) as Array<{
    display_name?: string;
    lat?: string;
    lon?: string;
    name?: string;
  }>;

  const results = data.map((item) => ({
    name: item.name || item.display_name?.split(",")[0] || query,
    address: item.display_name || query,
    latitude: parseFloat(item.lat || String(lat)),
    longitude: parseFloat(item.lon || String(lon)),
  }));

  if (results.length) await cacheSet(cacheKey, results, 3600);
  return results.length ? results : fallbackGeocode(query);
}

function fallbackGeocode(query: string): GeocodeResult[] {
  const landmarks = [
    { name: "Chorsu bozori", address: "Toshkent, Chorsu", latitude: 41.3216, longitude: 69.2285 },
    { name: "Magic City", address: "Toshkent, Magic City", latitude: 41.3031, longitude: 69.2486 },
    { name: "Amir Temur xiyoboni", address: "Toshkent, Amir Temur", latitude: 41.3113, longitude: 69.2797 },
    { name: "Tashkent City", address: "Tashkent City", latitude: 41.3111, longitude: 69.2405 },
    { name: "Yunusobod", address: "Yunusobod tumani", latitude: 41.3621, longitude: 69.2821 },
    { name: "Chilonzor metro", address: "Chilonzor", latitude: 41.2778, longitude: 69.2014 },
  ];
  const q = query.toLowerCase();
  return landmarks.filter(
    (l) => l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q) || q.includes("toshkent")
  );
}
