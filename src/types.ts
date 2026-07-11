export type Language = "uz" | "en" | "ru";

export interface ServiceCategory {
  id: string;
  name: {
    uz: string;
    en: string;
    ru: string;
  };
  icon: string;
  color: string;
  badge?: string;
}

export interface Booking {
  id: string;
  type: "taxi" | "delivery" | "cargo" | "parking" | "ev_charge";
  title: {
    uz: string;
    en: string;
    ru: string;
  };
  subtitle: {
    uz: string;
    en: string;
    ru: string;
  };
  price: number;
  date: string;
  status: "active" | "completed" | "scheduled";
  statusText: {
    uz: string;
    en: string;
    ru: string;
  };
  from?: string;
  to?: string;
  driverName?: string;
  carName?: string;
  carNumber?: string;
  rating?: number;
  duration?: string;
  distance?: string;
  userRating?: number;
  userFeedbackTags?: string[];
  userComment?: string;
  fromCoords?: { latitude: number; longitude: number };
  toCoords?: { latitude: number; longitude: number };
  driverNotes?: string;
  ridePhase?: "searching" | "accepted" | "arriving" | "in_ride";
  driverPhone?: string;
  driverFirstName?: string;
  driverLastName?: string;
  etaMinutes?: number;
  driverChat?: DriverChatMessage[];
  scheduledAt?: string;
  driverTrips?: number;
  driverVerified?: boolean;
  paymentProvider?: PaymentProvider;
  driverDistanceKm?: number;
  cancelFee?: number;
  tripDistanceKm?: number;
  tripDurationMin?: number;
  driverCoords?: { latitude: number; longitude: number };
  driverStartCoords?: { latitude: number; longitude: number };
  dispatchTotalKm?: number;
  serverOrderId?: string;
}
export interface DriverChatMessage {
  id: string;
  sender: "user" | "driver";
  content: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface TransitRoute {
  id: string;
  from: string;
  to: string;
  lines: string[];
  type: "bus" | "metro" | "tram" | "train";
  timeMin: number;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  birthDate: string;
  photoUrl: string | null;
}

export interface AuthSession {
  phone: string;
  verifiedAt: string;
  token: string;
  verifyMethod: "screen";
  displayName?: string;
}

export interface VerifiedUserRecord {
  phone: string;
  displayName?: string;
  verifiedAt: string;
}

export interface SavedAddress {
  id: string;
  label: { uz: string; en: string; ru: string };
  address: string;
  coords?: { latitude: number; longitude: number };
  icon: "home" | "work" | "custom";
}

export interface AppNotification {
  id: string;
  title: { uz: string; en: string; ru: string };
  body: { uz: string; en: string; ru: string };
  type: "order" | "payment" | "promo" | "safety" | "system";
  read: boolean;
  createdAt: string;
  orderId?: string;
}

export type PaymentProvider = "payme" | "click" | "uzum" | "card";

