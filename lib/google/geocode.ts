export interface GeocodeResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

/** Google Geocoding API — https://developers.google.com/maps/documentation/geocoding */
export async function geocodeGoogle(query: string, lat = 41.311, lon = 69.2797): Promise<GeocodeResult[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return fallbackGeocode(query);
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query.includes("Toshkent") || query.includes("Tashkent") ? query : `${query}, Tashkent, Uzbekistan`);
  url.searchParams.set("key", key);
  url.searchParams.set("language", "uz");
  url.searchParams.set("region", "uz");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Google geocode ${res.status}`);

  const data = (await res.json()) as {
    status: string;
    results?: Array<{
      formatted_address?: string;
      geometry?: { location?: { lat: number; lng: number } };
    }>;
  };

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Google geocode: ${data.status}`);
  }

  return (data.results ?? []).slice(0, 8).map((item) => ({
    name: item.formatted_address?.split(",")[0] || query,
    address: item.formatted_address || query,
    latitude: item.geometry?.location?.lat ?? lat,
    longitude: item.geometry?.location?.lng ?? lon,
  }));
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

export function getGoogleMapsKey(): string | null {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || null;
}
