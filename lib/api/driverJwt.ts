import crypto from "crypto";

function jwtSecret(): string {
  return process.env.GO404_JWT_SECRET || process.env.JWT_SECRET || "404go-dev-jwt-change-in-production";
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64url");
}

function b64urlJson(obj: object): string {
  return b64url(JSON.stringify(obj));
}

export function signDriverToken(driverId: string, ttlSec = 7 * 24 * 3600): string {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: driverId,
    role: "driver",
    exp: Math.floor(Date.now() / 1000) + ttlSec,
  };
  const data = `${b64urlJson(header)}.${b64urlJson(payload)}`;
  const sig = crypto.createHmac("sha256", jwtSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyDriverToken(token: string): { sub: string; exp: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sig] = parts;
    const data = `${headerB64}.${payloadB64}`;
    const expected = crypto.createHmac("sha256", jwtSecret()).update(data).digest("base64url");
    if (sig.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8")) as {
      sub?: string;
      role?: string;
      exp?: number;
    };
    if (payload.role !== "driver" || !payload.sub || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { sub: payload.sub, exp: payload.exp };
  } catch {
    return null;
  }
}
