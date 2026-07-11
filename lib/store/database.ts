import fs from "fs";
import path from "path";
import { INITIAL_DRIVER_FLEET } from "../drivers/fleet";
import { pgFindNearestDriver } from "../db/postgres";
import { publishEvent } from "../realtime/bus";
import type {
  DriverRecord,
  GeoPoint,
  OrderRecord,
  PaymentRecord,
  PlatformDatabase,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "404go-db.json");

declare global {
  // eslint-disable-next-line no-var
  var __404GO_DB__: PlatformDatabase | undefined;
}

function emptyDb(): PlatformDatabase {
  return { orders: [], drivers: [...INITIAL_DRIVER_FLEET], payments: [] };
}

function readFileDb(): PlatformDatabase | null {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw) as PlatformDatabase;
      if (!parsed.drivers?.length) parsed.drivers = [...INITIAL_DRIVER_FLEET];
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeFileDb(db: PlatformDatabase) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not persist DB to file:", e);
  }
}

export function getDb(): PlatformDatabase {
  if (global.__404GO_DB__) return global.__404GO_DB__;

  const fromFile = typeof process !== "undefined" && !process.env.VERCEL ? readFileDb() : null;
  global.__404GO_DB__ = fromFile ?? emptyDb();
  return global.__404GO_DB__;
}

export function saveDb(db: PlatformDatabase) {
  global.__404GO_DB__ = db;
  if (typeof process !== "undefined" && !process.env.VERCEL) {
    writeFileDb(db);
  }
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const h =
    s1 * s1 +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      s2 *
      s2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function createOrder(input: Omit<OrderRecord, "id" | "createdAt" | "updatedAt" | "status" | "driverId" | "paymentId" | "paymentStatus">): OrderRecord {
  const db = getDb();
  const order: OrderRecord = {
    ...input,
    id: `ord-${Date.now()}`,
    status: "pending",
    driverId: null,
    paymentId: null,
    paymentStatus: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.orders.unshift(order);
  saveDb(db);
  return order;
}

export function getOrder(id: string): OrderRecord | undefined {
  return getDb().orders.find((o) => o.id === id);
}

export function updateOrder(id: string, patch: Partial<OrderRecord>): OrderRecord | null {
  const db = getDb();
  const idx = db.orders.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  db.orders[idx] = { ...db.orders[idx], ...patch, updatedAt: new Date().toISOString() };
  saveDb(db);
  return db.orders[idx];
}

export function listOrders(customerPhone?: string): OrderRecord[] {
  const orders = getDb().orders;
  if (!customerPhone) return orders;
  return orders.filter((o) => o.customerPhone === customerPhone);
}

export function listDrivers(): DriverRecord[] {
  return getDb().drivers;
}

export function getDriver(id: string): DriverRecord | undefined {
  return getDb().drivers.find((d) => d.id === id);
}

export function updateDriver(id: string, patch: Partial<DriverRecord>): DriverRecord | null {
  const db = getDb();
  const idx = db.drivers.findIndex((d) => d.id === id);
  if (idx < 0) return null;
  db.drivers[idx] = { ...db.drivers[idx], ...patch };
  saveDb(db);
  return db.drivers[idx];
}

/** Eng yaqin bo'sh haydovchini topish va tayinlash (PostGIS yoki Haversine) */
export async function dispatchNearestDriver(orderId: string): Promise<{ order: OrderRecord; driver: DriverRecord } | null> {
  const db = getDb();
  const order = db.orders.find((o) => o.id === orderId);
  if (!order || !order.fromCoords) return null;

  let best: DriverRecord | null = null;
  let bestKm = Infinity;

  // PostGIS — eng yaqin haydovchi
  if (order.type === "taxi" || order.type === "delivery" || order.type === "cargo") {
    const pgHit = await pgFindNearestDriver(order.fromCoords.latitude, order.fromCoords.longitude, order.type);
    if (pgHit) {
      const d = db.drivers.find((x) => x.id === pgHit.id);
      if (d && d.status === "online" && !d.currentOrderId) {
        best = d;
        bestKm = pgHit.distanceKm;
      }
    }
  }

  if (!best) {
    const eligible = db.drivers.filter(
      (d) =>
        d.status === "online" &&
        !d.currentOrderId &&
        (d.serviceTypes.includes(order.type as "taxi" | "delivery" | "cargo") ||
          order.type === "parking" ||
          order.type === "ev_charge")
    );
    if (!eligible.length) return null;

    best = eligible[0];
    bestKm = haversineKm(order.fromCoords, best.location);
    for (const d of eligible.slice(1)) {
      const km = haversineKm(order.fromCoords, d.location);
      if (km < bestKm) {
        bestKm = km;
        best = d;
      }
    }
  }

  if (!best) return null;

  order.driverId = best.id;
  order.status = "dispatched";
  order.driverStartCoords = { ...best.location };
  order.driverCoords = { ...best.location };
  order.driverDistanceKm = 0;
  order.updatedAt = new Date().toISOString();

  best.status = "busy";
  best.currentOrderId = order.id;

  saveDb(db);
  publishEvent({ type: "order_updated", orderId: order.id, payload: order });
  return { order, driver: best };
}

export function driverAcceptOrder(driverId: string, orderId: string): OrderRecord | null {
  const db = getDb();
  const order = db.orders.find((o) => o.id === orderId && o.driverId === driverId);
  const driver = db.drivers.find((d) => d.id === driverId);
  if (!order || !driver) return null;
  order.status = "accepted";
  order.updatedAt = new Date().toISOString();
  saveDb(db);
  return order;
}

export function driverUpdateLocation(driverId: string, location: GeoPoint, orderId?: string): DriverRecord | null {
  const db = getDb();
  const driver = db.drivers.find((d) => d.id === driverId);
  if (!driver) return null;

  driver.location = location;
  saveDb(db);

  if (orderId) {
    const order = db.orders.find((o) => o.id === orderId);
    if (order) {
      order.driverCoords = location;
      if (order.driverStartCoords) {
        order.driverDistanceKm = Math.round(haversineKm(order.driverStartCoords, location) * 100) / 100;
      }
      order.updatedAt = new Date().toISOString();
      saveDb(db);
      publishEvent({ type: "driver_location", driverId, payload: { location, orderId } });
      publishEvent({ type: "order_updated", orderId, payload: order });
    }
  }

  publishEvent({ type: "driver_location", driverId, payload: { location } });

  return driver;
}

export function createPaymentRecord(payment: PaymentRecord): PaymentRecord {
  const db = getDb();
  db.payments.unshift(payment);
  saveDb(db);
  return payment;
}

export function updatePayment(id: string, patch: Partial<PaymentRecord>): PaymentRecord | null {
  const db = getDb();
  const idx = db.payments.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  db.payments[idx] = { ...db.payments[idx], ...patch };
  saveDb(db);
  return db.payments[idx];
}

export function getPayment(id: string): PaymentRecord | undefined {
  return getDb().payments.find((p) => p.id === id);
}
