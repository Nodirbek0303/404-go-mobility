import pg from "pg";

let pool: pg.Pool | null = null;

export function isPostgresEnabled() {
  return !!process.env.DATABASE_URL;
}

export function getPool(): pg.Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

export async function pgHealthCheck(): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  try {
    await p.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

/** PostGIS — eng yaqin online haydovchi */
export async function pgFindNearestDriver(
  lat: number,
  lon: number,
  serviceType: string
): Promise<{ id: string; distanceKm: number } | null> {
  const p = getPool();
  if (!p) return null;

  const types = serviceType === "delivery" ? ["delivery"] : serviceType === "cargo" ? ["cargo"] : ["taxi", "delivery"];

  const { rows } = await p.query<{ id: string; distance_km: string }>(
    `SELECT id,
            ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000 AS distance_km
     FROM drivers
     WHERE status = 'online'
       AND current_order_id IS NULL
       AND service_types && $3::text[]
     ORDER BY location <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
     LIMIT 1`,
    [lon, lat, types]
  );

  if (!rows[0]) return null;
  return { id: rows[0].id, distanceKm: parseFloat(rows[0].distance_km) };
}
