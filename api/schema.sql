CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  name varchar(60) NOT NULL,
  email varchar(254) NOT NULL UNIQUE,
  password_salt text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash char(64) PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS seat_locks (
  train_id text NOT NULL,
  origin_date date NOT NULL,
  travel_class text NOT NULL,
  seat_no smallint NOT NULL CHECK (seat_no BETWEEN 1 AND 24),
  PRIMARY KEY (train_id, origin_date, travel_class, seat_no)
);

CREATE TABLE IF NOT EXISTS bookings (
  id text PRIMARY KEY,
  pnr char(10) NOT NULL UNIQUE,
  user_id text NOT NULL REFERENCES users(id),
  train_id text NOT NULL,
  train_name text NOT NULL,
  origin_date date NOT NULL,
  journey_date date NOT NULL,
  from_station text NOT NULL,
  to_station text NOT NULL,
  from_index smallint NOT NULL,
  to_index smallint NOT NULL,
  travel_class text NOT NULL,
  quota text NOT NULL,
  passengers jsonb NOT NULL,
  seats smallint[] NOT NULL,
  boarding text NOT NULL,
  boarding_time jsonb NOT NULL,
  departure jsonb NOT NULL,
  arrival jsonb NOT NULL,
  fare jsonb NOT NULL,
  payment_id text NOT NULL,
  payment_status text NOT NULL DEFAULT 'SIMULATED_SUCCESS',
  status text NOT NULL CHECK (status IN ('CONFIRMED', 'CANCELLED')),
  booked_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  refund integer NOT NULL DEFAULT 0,
  UNIQUE (user_id, payment_id),
  CHECK (from_index < to_index)
);
CREATE INDEX IF NOT EXISTS bookings_inventory_idx
  ON bookings(train_id, origin_date, travel_class, status);
CREATE INDEX IF NOT EXISTS bookings_user_date_idx
  ON bookings(user_id, journey_date DESC);

CREATE TABLE IF NOT EXISTS food_orders (
  id text PRIMARY KEY,
  booking_pnr char(10) NOT NULL REFERENCES bookings(pnr),
  user_id text NOT NULL REFERENCES users(id),
  station text NOT NULL,
  name text NOT NULL,
  price integer NOT NULL CHECK (price >= 0),
  status text NOT NULL CHECK (status IN ('PLACED', 'CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS food_orders_user_date_idx
  ON food_orders(user_id, created_at DESC);
