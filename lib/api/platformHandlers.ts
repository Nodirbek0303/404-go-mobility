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
import { geocodeGoogle, getGoogleMapsKey } from "../google/geocode";
import { confirmSandboxPayment, getPaymentConfig, initiatePayment } from "../payments/service";

function json(res: Response, status: number, body: unknown) {
  res.status(status).json(body);
}

function mapProvider(p: string): PaymentProviderType {
  if (p === "card") return "wallet";
  if (p === "payme" || p === "click" || p === "uzum" || p === "wallet") return p;
  return "payme";
}

export async function handlePlatformConfig(_req: Request, res: Response) {
  json(res, 200, {
    googleMaps: !!getGoogleMapsKey(),
    googleMapsKey: getGoogleMapsKey(),
    payments: getPaymentConfig(),
  });
}

export async function handleGeocode(req: Request, res: Response) {
  const q = String(req.query.q || "");
  const lat = Number(req.query.lat) || 41.311;
  const lon = Number(req.query.lon) || 69.2797;
  if (!q.trim()) return json(res, 400, { error: "q required" });
  try {
    const results = await geocodeGoogle(q, lat, lon);
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
  const result = dispatchNearestDriver(id);
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

export async function handleDriversList(_req: Request, res: Response) {
  json(res, 200, { drivers: listDrivers() });
}

export async function handleDriverGet(req: Request, res: Response) {
  const driver = getDriver(String(req.params.id));
  if (!driver) return json(res, 404, { error: "Driver not found" });
  const order = driver.currentOrderId ? getOrder(driver.currentOrderId) : null;
  json(res, 200, { driver, order });
}

export async function handleDriverStatus(req: Request, res: Response) {
  const id = String(req.params.id);
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
  const { orderId } = req.body as { orderId?: string };
  if (!orderId) return json(res, 400, { error: "orderId required" });
  const order = driverAcceptOrder(driverId, orderId);
  if (!order) return json(res, 404, { error: "Order not found for driver" });
  updateOrder(orderId, { status: "accepted" });
  json(res, 200, { order });
}

export async function handleDriverLocation(req: Request, res: Response) {
  const driverId = String(req.params.id);
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
