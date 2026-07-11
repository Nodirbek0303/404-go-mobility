import type { Request, Response } from "express";
import {
  createOrder,
  dispatchNearestDriver,
  driverAcceptOrder,
  driverUpdateLocation,
  getDriver,
  getOrder,
  listDrivers,
  listOrders,
  updateDriver,
  updateOrder,
} from "../store/database";
import type { GeoPoint, OrderRecord, PaymentProviderType } from "../store/types";
import { geocodeNominatim } from "../osm/nominatim";
import { getOsrmRoute } from "../osm/osrm";
import { isRedisConfigured } from "../cache/redis";
import { isPostgresEnabled, pgHealthCheck } from "../db/postgres";
import { confirmSandboxPayment, getPaymentConfig, initiatePayment } from "../payments/service";
import { signDriverToken } from "./driverJwt";
import {
  authenticateDriverApi,
  authenticateServiceKey,
  isDriverApiProtectionEnabled,
  phonesMatch,
} from "./serviceAuth";

function json(res: Response, status: number, body: unknown) {
  res.status(status).json(body);
}

function mapProvider(p: string): PaymentProviderType {
  if (p === "card") return "wallet";
  if (p === "payme" || p === "click" || p === "uzum" || p === "wallet") return p;
  return "payme";
}

export async function handlePlatformConfig(_req: Request, res: Response) {
  const pgOk = isPostgresEnabled() ? await pgHealthCheck() : false;
  json(res, 200, {
    stack: "open-source",
    map: { provider: "OpenStreetMap", renderer: "MapLibre GL" },
    geocode: { provider: "Nominatim" },
    routing: { provider: "OSRM" },
    postgres: pgOk,
    redis: isRedisConfigured(),
    firebase: !!process.env.VITE_FIREBASE_API_KEY,
    payments: getPaymentConfig(),
    driverApiProtected: isDriverApiProtectionEnabled(),
  });
}

export async function handleDriverAuthLogin(req: Request, res: Response) {
  const { phone } = req.body as { phone?: string };
  if (!phone?.trim()) return json(res, 400, { error: "phone required" });

  const drivers = listDrivers();
  const driver = drivers.find((d) => phonesMatch(d.phone, phone));
  if (!driver) {
    return json(res, 404, { error: "Driver not found for this phone number" });
  }

  const token = signDriverToken(driver.id);
  json(res, 200, {
    token,
    driver: {
      id: driver.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      phone: driver.phone,
      carName: driver.carName,
      carNumber: driver.carNumber,
      status: driver.status,
      rating: driver.rating,
    },
  });
}

export async function handleDriverAuthMe(req: Request, res: Response) {
  const auth = authenticateDriverApi(req);
  if (!auth || auth.type !== "driver") {
    return json(res, 401, { error: "Valid driver session required" });
  }
  const driver = getDriver(auth.driverId);
  if (!driver) return json(res, 404, { error: "Driver not found" });
  const order = driver.currentOrderId ? getOrder(driver.currentOrderId) : null;
  json(res, 200, { driver, order });
}

export async function handleGeocode(req: Request, res: Response) {
  const q = String(req.query.q || "");
  const lat = Number(req.query.lat) || 41.311;
  const lon = Number(req.query.lon) || 69.2797;
  if (!q.trim()) return json(res, 400, { error: "q required" });
  try {
    const results = await geocodeNominatim(q, lat, lon);
    json(res, 200, { results });
  } catch (e: unknown) {
    json(res, 500, { error: e instanceof Error ? e.message : "Geocode failed" });
  }
}

export async function handleOrdersList(req: Request, res: Response) {
  const phone = req.query.phone ? String(req.query.phone) : undefined;
  json(res, 200, { orders: listOrders(phone) });
}

export async function handleOrderGet(req: Request, res: Response) {
  const order = getOrder(String(req.params.id));
  if (!order) return json(res, 404, { error: "Order not found" });
  const driver = order.driverId ? getDriver(order.driverId) : null;
  json(res, 200, { order, driver });
}

export async function handleOrderCreate(req: Request, res: Response) {
  const body = req.body as Partial<OrderRecord>;
  if (!body.type || !body.customerPhone || body.price == null) {
    return json(res, 400, { error: "type, customerPhone, price required" });
  }
  const order = createOrder({
    type: body.type,
    customerPhone: body.customerPhone,
    customerName: body.customerName,
    from: body.from || "",
    to: body.to,
    fromCoords: body.fromCoords,
    toCoords: body.toCoords,
    price: body.price,
    tripDistanceKm: body.tripDistanceKm,
    tripDurationMin: body.tripDurationMin,
  });
  json(res, 201, { order });
}

export async function handleOrderDispatch(req: Request, res: Response) {
  const id = String(req.params.id);
  const result = await dispatchNearestDriver(id);
  if (!result) return json(res, 404, { error: "No available driver" });

  if (req.body?.autoAccept !== false) {
    driverAcceptOrder(result.driver.id, id);
    updateOrder(id, { status: "accepted" });
    result.order.status = "accepted";
  }

  json(res, 200, result);
}

export async function handleOrderCancel(req: Request, res: Response) {
  const id = String(req.params.id);
  const order = updateOrder(id, { status: "cancelled" });
  if (!order) return json(res, 404, { error: "Order not found" });
  if (order.driverId) {
    updateDriver(order.driverId, { status: "online", currentOrderId: null });
  }
  json(res, 200, { order });
}

export async function handleOrderPatch(req: Request, res: Response) {
  const id = String(req.params.id);
  const order = updateOrder(id, req.body);
  if (!order) return json(res, 404, { error: "Order not found" });
  json(res, 200, { order });
}

export async function handleDriversList(req: Request, res: Response) {
  if (!authenticateServiceKey(req)) {
    return json(res, 401, { error: "Service API key required" });
  }
  json(res, 200, { drivers: listDrivers() });
}

export async function handleDriverGet(req: Request, res: Response) {
  const id = String(req.params.id);
  if (!authenticateDriverApi(req, id)) {
    return json(res, 401, { error: "Unauthorized — service key or driver session required" });
  }
  const driver = getDriver(id);
  if (!driver) return json(res, 404, { error: "Driver not found" });
  const order = driver.currentOrderId ? getOrder(driver.currentOrderId) : null;
  json(res, 200, { driver, order });
}

export async function handleDriverStatus(req: Request, res: Response) {
  const id = String(req.params.id);
  if (!authenticateDriverApi(req, id)) {
    return json(res, 401, { error: "Unauthorized — service key or driver session required" });
  }
  const { status } = req.body as { status?: string };
  if (!status || !["online", "offline", "busy"].includes(status)) {
    return json(res, 400, { error: "status must be online|offline|busy" });
  }
  const driver = updateDriver(id, { status: status as "online" | "offline" | "busy" });
  if (!driver) return json(res, 404, { error: "Driver not found" });
  json(res, 200, { driver });
}

export async function handleDriverAccept(req: Request, res: Response) {
  const driverId = String(req.params.id);
  if (!authenticateDriverApi(req, driverId)) {
    return json(res, 401, { error: "Unauthorized — service key or driver session required" });
  }
  const { orderId } = req.body as { orderId?: string };
  if (!orderId) return json(res, 400, { error: "orderId required" });
  const order = driverAcceptOrder(driverId, orderId);
  if (!order) return json(res, 404, { error: "Order not found for driver" });
  updateOrder(orderId, { status: "accepted" });
  json(res, 200, { order });
}

export async function handleDriverLocation(req: Request, res: Response) {
  const driverId = String(req.params.id);
  if (!authenticateDriverApi(req, driverId)) {
    return json(res, 401, { error: "Unauthorized — service key or driver session required" });
  }
  const { location, orderId } = req.body as { location?: GeoPoint; orderId?: string };
  if (!location?.latitude || !location?.longitude) {
    return json(res, 400, { error: "location required" });
  }
  const driver = driverUpdateLocation(driverId, location, orderId);
  if (!driver) return json(res, 404, { error: "Driver not found" });
  const order = orderId ? getOrder(orderId) : null;
  json(res, 200, { driver, order });
}

export async function handlePaymentCreate(req: Request, res: Response) {
  const { orderId, provider, amount } = req.body as {
    orderId?: string;
    provider?: string;
    amount?: number;
  };
  if (!orderId || !provider || amount == null) {
    return json(res, 400, { error: "orderId, provider, amount required" });
  }
  try {
    const result = await initiatePayment(orderId, mapProvider(provider), amount);
    json(res, 200, result);
  } catch (e: unknown) {
    json(res, 500, { error: e instanceof Error ? e.message : "Payment failed" });
  }
}

export async function handlePaymentConfirm(req: Request, res: Response) {
  const { paymentId } = req.body as { paymentId?: string };
  if (!paymentId) return json(res, 400, { error: "paymentId required" });
  const result = await confirmSandboxPayment(paymentId);
  if (!result) return json(res, 404, { error: "Payment not found or already paid" });
  json(res, 200, result);
}

export async function handlePaymentConfig(_req: Request, res: Response) {
  json(res, 200, getPaymentConfig());
}

export async function handleRoute(req: Request, res: Response) {
  const fromLat = Number(req.query.fromLat);
  const fromLon = Number(req.query.fromLon);
  const toLat = Number(req.query.toLat);
  const toLon = Number(req.query.toLon);
  if (![fromLat, fromLon, toLat, toLon].every(Number.isFinite)) {
    return json(res, 400, { error: "fromLat, fromLon, toLat, toLon required" });
  }
  try {
    const route = await getOsrmRoute(fromLat, fromLon, toLat, toLon);
    json(res, 200, { route });
  } catch (e: unknown) {
    json(res, 500, { error: e instanceof Error ? e.message : "Route failed" });
  }
}

/** SSE — real-time buyurtma kuzatuvi (Vercel + local) */
export async function handleRealtimeSSE(req: Request, res: Response) {
  const orderId = String(req.query.orderId || "");
  if (!orderId) return json(res, 400, { error: "orderId required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = () => {
    const order = getOrder(orderId);
    const driver = order?.driverId ? getDriver(order.driverId) : null;
    res.write(`data: ${JSON.stringify({ order, driver, ts: Date.now() })}\n\n`);
  };

  send();
  const interval = setInterval(send, 3000);
  req.on("close", () => clearInterval(interval));
}
