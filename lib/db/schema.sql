-- PostgreSQL + PostGIS schema (404-GO Taxi)
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  car_name TEXT,
  car_number TEXT,
  rating NUMERIC(3,2) DEFAULT 4.9,
  trips INT DEFAULT 0,
  service_types TEXT[] DEFAULT '{taxi}',
  status TEXT DEFAULT 'online',
  location GEOGRAPHY(POINT, 4326),
  current_order_id TEXT,
  verified BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  from_address TEXT,
  to_address TEXT,
  from_location GEOGRAPHY(POINT, 4326),
  to_location GEOGRAPHY(POINT, 4326),
  price INT NOT NULL,
  trip_distance_km NUMERIC(8,2),
  trip_duration_min INT,
  driver_id TEXT REFERENCES drivers(id),
  driver_distance_km NUMERIC(8,2),
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

-- Eng yaqin haydovchi (PostGIS)
-- SELECT id FROM drivers
-- WHERE status = 'online' AND current_order_id IS NULL
-- ORDER BY location <-> ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
-- LIMIT 1;
