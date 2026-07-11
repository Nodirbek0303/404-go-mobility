const DRIVER_TOKEN_KEY = "404GO_DRIVER_SESSION";

export function loadDriverToken(): string | null {
  try {
    return localStorage.getItem(DRIVER_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveDriverToken(token: string) {
  localStorage.setItem(DRIVER_TOKEN_KEY, token);
}

export function clearDriverToken() {
  localStorage.removeItem(DRIVER_TOKEN_KEY);
}

export interface DriverLoginResult {
  token: string;
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    carName: string;
    carNumber: string;
    status: string;
    rating: number;
  };
}

export async function loginDriverByPhone(phone: string): Promise<DriverLoginResult> {
  const res = await fetch("/api/driver-auth?action=login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const data = (await res.json()) as DriverLoginResult & { error?: string };
  if (!res.ok) throw new Error(data.error || res.statusText);
  saveDriverToken(data.token);
  return data;
}

export async function fetchDriverSession(): Promise<{ driver: import("../../lib/store/types").DriverRecord; order: import("../../lib/store/types").OrderRecord | null } | null> {
  const token = loadDriverToken();
  if (!token) return null;
  const res = await fetch("/api/driver-auth?action=me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 401) clearDriverToken();
    return null;
  }
  return res.json();
}
