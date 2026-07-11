/** Redis (Upstash) + memory fallback — bepul keshlash */

const memoryCache = new Map<string, { value: unknown; exp: number }>();

function memGet<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.exp) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value as T;
}

function memSet(key: string, value: unknown, ttlSec: number) {
  memoryCache.set(key, { value, exp: Date.now() + ttlSec * 1000 });
}

async function upstashGet<T>(key: string): Promise<T | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: string | null };
  if (!data.result) return null;
  try {
    return JSON.parse(data.result) as T;
  } catch {
    return data.result as T;
  }
}

async function upstashSet(key: string, value: unknown, ttlSec: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;

  await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}?EX=${ttlSec}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const fromRedis = await upstashGet<T>(key);
  if (fromRedis != null) return fromRedis;
  return memGet<T>(key);
}

export async function cacheSet(key: string, value: unknown, ttlSec = 3600) {
  memSet(key, value, ttlSec);
  await upstashSet(key, value, ttlSec);
}

export function isRedisConfigured() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
