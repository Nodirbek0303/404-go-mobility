import { Language } from "../types";

export interface GeoCoord {
  latitude: number;
  longitude: number;
}

export const AVG_CITY_SPEED_KMH = 28;
export const CANCEL_RATE_PER_KM = 2500;
export const TAXI_BASE_UZS = 5000;
export const TAXI_PER_KM_UZS = 3500;
export const TAXI_PER_MIN_UZS = 400;

/** Haversine — GPS koordinatalar orasidagi aniq masofa (km) */
export function haversineKm(a: GeoCoord, b: GeoCoord): number;
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number;
export function haversineKm(
  a: GeoCoord | number,
  b?: GeoCoord | number,
  lat2?: number,
  lon2?: number
): number {
  let lat1: number;
  let lon1: number;
  let latB: number;
  let lonB: number;
  if (typeof a === "number" && typeof b === "number" && lat2 != null && lon2 != null) {
    lat1 = a;
    lon1 = b;
    latB = lat2;
    lonB = lon2;
  } else {
    const c1 = a as GeoCoord;
    const c2 = b as GeoCoord;
    lat1 = c1.latitude;
    lon1 = c1.longitude;
    latB = c2.latitude;
    lonB = c2.longitude;
  }
  const R = 6371;
  const dLat = ((latB - lat1) * Math.PI) / 180;
  const dLon = ((lonB - lon1) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const h = s1 * s1 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((latB * Math.PI) / 180) * s2 * s2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function interpolateCoords(from: GeoCoord, to: GeoCoord, t: number): GeoCoord {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * clamped,
    longitude: from.longitude + (to.longitude - from.longitude) * clamped,
  };
}

export function roundPrice(amount: number): number {
  return Math.max(0, Math.round(amount / 500) * 500);
}

export function durationFromDistanceKm(distanceKm: number): number {
  return Math.max(5, Math.ceil(distanceKm / (AVG_CITY_SPEED_KMH / 60)));
}

export function etaMinutesFromKm(distanceKm: number): number {
  return Math.max(0, Math.ceil(distanceKm / (AVG_CITY_SPEED_KMH / 60)));
}

export function formatDistance(km: number, lang: Language): string {
  if (km < 1) {
    const m = Math.round(km * 1000);
    return lang === "ru" ? `${m} м` : `${m} m`;
  }
  return lang === "ru" ? `${km.toFixed(2)} км` : `${km.toFixed(2)} km`;
}

export function formatDuration(min: number, lang: Language): string {
  if (lang === "uz") return `${min} daqiqa`;
  if (lang === "ru") return `${min} мин`;
  return `${min} min`;
}

export interface RoutePriceOptions {
  vehicleMultiplier?: number;
  parcelAdd?: number;
  truckMultiplier?: number;
  weightTon?: number;
  truckCapacityTon?: number;
  parkingHourly?: number;
  ev30Min?: number;
}

export interface RouteMetrics {
  distanceKm: number;
  durationMin: number;
  price: number;
}

export function computeRouteMetrics(
  from: GeoCoord | null | undefined,
  to: GeoCoord | null | undefined,
  serviceType: string,
  opts: RoutePriceOptions = {}
): RouteMetrics {
  if (!from || !to) {
    const price = computeServicePrice(serviceType, 0, 0, opts);
    return { distanceKm: 0, durationMin: 0, price };
  }

  const distanceKm = Math.round(haversineKm(from, to) * 100) / 100;
  const durationMin = durationFromDistanceKm(distanceKm);
  const price = computeServicePrice(serviceType, distanceKm, durationMin, opts);
  return { distanceKm, durationMin, price };
}

export function computeServicePrice(
  serviceType: string,
  distanceKm: number,
  durationMin: number,
  opts: RoutePriceOptions
): number {
  if (serviceType === "taxi") {
    return roundPrice(TAXI_BASE_UZS + distanceKm * TAXI_PER_KM_UZS + durationMin * TAXI_PER_MIN_UZS);
  }
  if (serviceType === "delivery") {
    const mult = opts.vehicleMultiplier ?? 1;
    const add = opts.parcelAdd ?? 0;
    return roundPrice(9000 + distanceKm * 2800 * mult + add);
  }
  if (serviceType === "cargo") {
    const mult = opts.truckMultiplier ?? 1;
    const cap = opts.truckCapacityTon ?? 1.5;
    const weight = opts.weightTon ?? 1.5;
    return roundPrice(150000 * mult * Math.max(1, weight / cap) + distanceKm * 8500);
  }
  if (serviceType === "parking") {
    return opts.parkingHourly ?? 8000;
  }
  if (serviceType === "ev_charge") {
    return opts.ev30Min ?? 15000;
  }
  return roundPrice(TAXI_BASE_UZS + distanceKm * TAXI_PER_KM_UZS);
}

const DRIVER_DEPOTS: GeoCoord[] = [
  { latitude: 41.2778, longitude: 69.2014 },
  { latitude: 41.3621, longitude: 69.2821 },
  { latitude: 41.2225, longitude: 69.2225 },
  { latitude: 41.2985, longitude: 69.2735 },
  { latitude: 41.3331, longitude: 69.2811 },
];

export function nearestDriverDepot(pickup: GeoCoord): { depot: GeoCoord; distanceKm: number } {
  let best = DRIVER_DEPOTS[0];
  let bestKm = haversineKm(pickup, best);
  for (const d of DRIVER_DEPOTS) {
    const km = haversineKm(pickup, d);
    if (km >= 0.6 && km < bestKm) {
      bestKm = km;
      best = d;
    }
  }
  return { depot: best, distanceKm: Math.round(bestKm * 100) / 100 };
}

export function driverTraveledKm(start: GeoCoord | undefined, current: GeoCoord | undefined): number {
  if (!start || !current) return 0;
  return Math.round(haversineKm(start, current) * 100) / 100;
}

export function remainingToPickupMeters(
  driver: GeoCoord | undefined,
  pickup: GeoCoord | undefined
): number | null {
  if (!driver || !pickup) return null;
  return Math.round(haversineKm(driver, pickup) * 1000);
}

export function getOrderDistanceKm(order: {
  tripDistanceKm?: number;
  fromCoords?: GeoCoord;
  toCoords?: GeoCoord;
  distance?: string;
}): number {
  if (order.tripDistanceKm != null) return order.tripDistanceKm;
  if (order.fromCoords && order.toCoords) {
    return Math.round(haversineKm(order.fromCoords, order.toCoords) * 100) / 100;
  }
  if (order.distance) {
    const n = parseFloat(order.distance.replace(/[^\d.]/g, ""));
    if (!isNaN(n)) return n;
  }
  return 0;
}

export function getOrderDurationMin(order: {
  tripDurationMin?: number;
  tripDistanceKm?: number;
  fromCoords?: GeoCoord;
  toCoords?: GeoCoord;
}): number {
  if (order.tripDurationMin != null) return order.tripDurationMin;
  const km = getOrderDistanceKm(order);
  if (km > 0) return durationFromDistanceKm(km);
  return 0;
}

export function displayOrderDistance(order: Parameters<typeof getOrderDistanceKm>[0], lang: Language): string {
  const km = getOrderDistanceKm(order);
  if (km <= 0) return "—";
  return formatDistance(km, lang);
}

export function displayOrderDuration(order: Parameters<typeof getOrderDurationMin>[0], lang: Language): string {
  const min = getOrderDurationMin(order);
  if (min <= 0) return "—";
  return formatDuration(min, lang);
}

export function kmStepForInterval(intervalMs: number, speedKmh = AVG_CITY_SPEED_KMH): number {
  return speedKmh * (intervalMs / 3_600_000);
}
