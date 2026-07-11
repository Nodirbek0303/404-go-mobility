import type { Booking } from "../types";
import type { DriverRecord, GeoPoint, OrderRecord } from "../../lib/store/types";

const API = "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export interface PlatformConfig {
  googleMaps: boolean;
  googleMapsKey: string | null;
  payments: { payme: boolean; click: boolean; uzum: boolean };
}

export interface PaymentCreateResponse {
  paymentId: string;
  provider: string;
  amount: number;
  status: "pending" | "paid";
  checkoutUrl?: string;
  mode: "live" | "sandbox";
  message?: string;
}

export interface GeocodeHit {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export async function fetchPlatformConfig(): Promise<PlatformConfig> {
  return request<PlatformConfig>("/api/config");
}

export async function geocodeAddress(query: string, lat?: number, lon?: number): Promise<GeocodeHit[]> {
  const params = new URLSearchParams({ q: query });
  if (lat != null) params.set("lat", String(lat));
  if (lon != null) params.set("lon", String(lon));
  const data = await request<{ results: GeocodeHit[] }>(`/api/geocode?${params}`);
  return data.results;
}

export async function createPlatformOrder(input: {
  type: Booking["type"];
  customerPhone: string;
  customerName?: string;
  from: string;
  to?: string;
  fromCoords?: GeoPoint;
  toCoords?: GeoPoint;
  price: number;
  tripDistanceKm?: number;
  tripDurationMin?: number;
}): Promise<OrderRecord> {
  const data = await request<{ order: OrderRecord }>("/api/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.order;
}

export async function dispatchPlatformOrder(orderId: string): Promise<{ order: OrderRecord; driver: DriverRecord }> {
  return request(`/api/orders?id=${encodeURIComponent(orderId)}&action=dispatch`, {
    method: "POST",
    body: JSON.stringify({ autoAccept: true }),
  });
}

export async function getPlatformOrder(orderId: string): Promise<{ order: OrderRecord; driver: DriverRecord | null }> {
  return request(`/api/orders?id=${encodeURIComponent(orderId)}`);
}

export async function cancelPlatformOrder(orderId: string): Promise<OrderRecord> {
  const data = await request<{ order: OrderRecord }>(
    `/api/orders?id=${encodeURIComponent(orderId)}&action=cancel`,
    { method: "POST" }
  );
  return data.order;
}

export async function createPlatformPayment(
  orderId: string,
  provider: string,
  amount: number
): Promise<PaymentCreateResponse> {
  return request<PaymentCreateResponse>("/api/payments?action=create", {
    method: "POST",
    body: JSON.stringify({ orderId, provider, amount }),
  });
}

export async function confirmSandboxPlatformPayment(paymentId: string): Promise<PaymentCreateResponse> {
  return request<PaymentCreateResponse>("/api/payments?action=confirm", {
    method: "POST",
    body: JSON.stringify({ paymentId }),
  });
}

export async function listPlatformDrivers(): Promise<DriverRecord[]> {
  const data = await request<{ drivers: DriverRecord[] }>("/api/drivers");
  return data.drivers;
}

export async function getPlatformDriver(driverId: string): Promise<{ driver: DriverRecord; order: OrderRecord | null }> {
  return request(`/api/drivers?id=${encodeURIComponent(driverId)}`);
}

export async function setDriverStatus(driverId: string, status: "online" | "offline" | "busy") {
  return request(`/api/drivers?id=${encodeURIComponent(driverId)}&action=status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export async function driverAcceptPlatformOrder(driverId: string, orderId: string) {
  return request(`/api/drivers?id=${encodeURIComponent(driverId)}&action=accept`, {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
}

export async function updateDriverPlatformLocation(driverId: string, location: GeoPoint, orderId?: string) {
  return request(`/api/drivers?id=${encodeURIComponent(driverId)}&action=location`, {
    method: "POST",
    body: JSON.stringify({ location, orderId }),
  });
}

export function orderStatusToRidePhase(status: OrderRecord["status"]): Booking["ridePhase"] {
  if (status === "pending" || status === "dispatched") return "searching";
  if (status === "accepted") return "accepted";
  if (status === "arriving") return "arriving";
  if (status === "in_progress") return "in_ride";
  return "searching";
}

export function mapDriverToBooking(driver: DriverRecord) {
  return {
    driverId: driver.id,
    driverFirstName: driver.firstName,
    driverLastName: driver.lastName,
    driverName: `${driver.firstName} ${driver.lastName}`,
    driverPhone: driver.phone,
    carName: driver.carName,
    carNumber: driver.carNumber,
    rating: driver.rating,
    driverTrips: driver.trips,
    driverVerified: driver.verified,
  };
}
