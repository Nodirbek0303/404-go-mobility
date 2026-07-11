import type { Request } from "express";
import { verifyDriverToken } from "./driverJwt";

export type DriverApiAuth =
  | { type: "service" }
  | { type: "driver"; driverId: string };

export function getServiceApiKey(): string | undefined {
  return process.env.GO404_SERVICE_API_KEY || process.env["404GO_SERVICE_API_KEY"];
}

export function isDriverApiProtectionEnabled(): boolean {
  return Boolean(getServiceApiKey());
}

function extractBearerToken(req: Request): string | null {
  const raw = req.headers.authorization ?? req.headers.Authorization;
  if (typeof raw === "string" && raw.startsWith("Bearer ")) {
    return raw.slice(7).trim();
  }
  const headerKey = req.headers["x-404go-service-key"];
  if (typeof headerKey === "string" && headerKey.trim()) return headerKey.trim();
  return null;
}

/** Haydovchi API — service key yoki haydovchi JWT */
export function authenticateDriverApi(req: Request, targetDriverId?: string): DriverApiAuth | null {
  const serviceKey = getServiceApiKey();
  const token = extractBearerToken(req);

  if (token && serviceKey && token === serviceKey) {
    return { type: "service" };
  }

  if (token) {
    const claims = verifyDriverToken(token);
    if (claims) {
      if (targetDriverId && claims.sub !== targetDriverId) return null;
      return { type: "driver", driverId: claims.sub };
    }
  }

  if (!serviceKey) return { type: "service" };
  return null;
}

/** Faqat service key (masalan, alohida haydovchi ilova) */
export function authenticateServiceKey(req: Request): boolean {
  const serviceKey = getServiceApiKey();
  if (!serviceKey) return true;
  const token = extractBearerToken(req);
  return Boolean(token && token === serviceKey);
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function phonesMatch(a: string, b: string): boolean {
  const da = normalizePhone(a);
  const db = normalizePhone(b);
  if (!da || !db) return false;
  if (da === db) return true;
  const tail = (s: string) => (s.length >= 9 ? s.slice(-9) : s);
  return tail(da) === tail(db);
}
