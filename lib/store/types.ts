export type OrderStatus = "pending" | "dispatched" | "accepted" | "arriving" | "in_progress" | "completed" | "cancelled";
export type DriverStatus = "online" | "busy" | "offline";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentProviderType = "payme" | "click" | "uzum" | "wallet";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface DriverRecord {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  carName: string;
  carNumber: string;
  rating: number;
  trips: number;
  serviceTypes: Array<"taxi" | "delivery" | "cargo">;
  status: DriverStatus;
  location: GeoPoint;
  currentOrderId: string | null;
  verified: boolean;
}

export interface OrderRecord {
  id: string;
  type: "taxi" | "delivery" | "cargo" | "parking" | "ev_charge";
  status: OrderStatus;
  customerPhone: string;
  customerName?: string;
  from: string;
  to?: string;
  fromCoords?: GeoPoint;
  toCoords?: GeoPoint;
  price: number;
  tripDistanceKm?: number;
  tripDurationMin?: number;
  driverId: string | null;
  driverDistanceKm?: number;
  driverCoords?: GeoPoint;
  driverStartCoords?: GeoPoint;
  paymentId: string | null;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  provider: PaymentProviderType;
  amount: number;
  status: PaymentStatus;
  externalId?: string;
  checkoutUrl?: string;
  createdAt: string;
  paidAt?: string;
}

export interface PlatformDatabase {
  orders: OrderRecord[];
  drivers: DriverRecord[];
  payments: PaymentRecord[];
}
