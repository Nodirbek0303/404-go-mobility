import type { AppNotification, AuthSession, SavedAddress, VerifiedUserRecord } from "../types";

export const STORAGE_KEYS = {
  AUTH: "404GO_AUTH_SESSION",
  NOTIFICATIONS: "404GO_NOTIFICATIONS",
  ADDRESSES: "404GO_SAVED_ADDRESSES",
  LOYALTY: "404GO_LOYALTY",
  VERIFIED_USERS: "404GO_VERIFIED_USERS",
} as const;

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...fallback, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return fallback;
}

export function saveJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadAuth(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuth(session: AuthSession) {
  saveJson(STORAGE_KEYS.AUTH, session);
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEYS.AUTH);
}

export function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNotifications(items: AppNotification[]) {
  saveJson(STORAGE_KEYS.NOTIFICATIONS, items.slice(0, 50));
}

export function loadSavedAddresses(): SavedAddress[] {
  const defaults: SavedAddress[] = [
    {
      id: "home",
      label: { uz: "Uy", en: "Home", ru: "Дом" },
      address: "Yunusobod, 4-mavze",
      coords: { latitude: 41.3621, longitude: 69.2821 },
      icon: "home",
    },
    {
      id: "work",
      label: { uz: "Ish", en: "Work", ru: "Работа" },
      address: "Amir Temur xiyoboni, 108",
      coords: { latitude: 41.3113, longitude: 69.2797 },
      icon: "work",
    },
  ];
  return loadJson(STORAGE_KEYS.ADDRESSES, defaults);
}

export function saveSavedAddresses(addresses: SavedAddress[]) {
  saveJson(STORAGE_KEYS.ADDRESSES, addresses);
}

/** Ekranda ko'rsatiladigan tasdiqlash kodi (SMS yuborilmaydi) */
export function generateVerificationCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** @deprecated use generateVerificationCode */
export function generateDemoOtp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 4) return digits.slice(-4);
  return generateVerificationCode();
}

export function loadVerifiedUsers(): VerifiedUserRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VERIFIED_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function registerVerifiedUser(phone: string, displayName?: string) {
  const users = loadVerifiedUsers();
  const existing = users.findIndex((u) => u.phone === phone);
  const record: VerifiedUserRecord = {
    phone,
    displayName,
    verifiedAt: new Date().toISOString(),
  };
  if (existing >= 0) users[existing] = record;
  else users.push(record);
  saveJson(STORAGE_KEYS.VERIFIED_USERS, users);
}

export function isPhoneVerified(phone: string): boolean {
  return loadVerifiedUsers().some((u) => u.phone === phone);
}

export function formatUzPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("998")) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length === 12) return `+${digits}`;
  return input.startsWith("+") ? input : `+998${digits}`;
}
