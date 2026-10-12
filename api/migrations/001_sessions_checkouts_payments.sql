ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'traveller';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'users'::regclass AND conname = 'users_role_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('traveller', 'admin'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS checkout_sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  status text NOT NULL CHECK (status IN ('HELD', 'PAYMENT_PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED', 'CANCELLED')),
  request_payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  booking_pnr char(10) REFERENCES bookings(pnr),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS checkout_sessions_user_created_idx
  ON checkout_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS checkout_sessions_active_expiry_idx
  ON checkout_sessions(status, expires_at);

CREATE TABLE IF NOT EXISTS seat_holds (
  checkout_id text NOT NULL REFERENCES checkout_sessions(id) ON DELETE CASCADE,
  train_id text NOT NULL,
  origin_date date NOT NULL,
  travel_class text NOT NULL,
  from_index smallint NOT NULL,
  to_index smallint NOT NULL,
  seat_no smallint NOT NULL CHECK (seat_no BETWEEN 1 AND 24),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (checkout_id, seat_no),
  CHECK (from_index < to_index)
);
CREATE INDEX IF NOT EXISTS seat_holds_inventory_idx
  ON seat_holds(train_id, origin_date, travel_class, seat_no, from_index, to_index);

CREATE TABLE IF NOT EXISTS checkout_events (
  id bigserial PRIMARY KEY,
  checkout_id text NOT NULL REFERENCES checkout_sessions(id) ON DELETE CASCADE,
  status text NOT NULL,
  detail text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS checkout_events_checkout_created_idx
  ON checkout_events(checkout_id, created_at);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkout_id text REFERENCES checkout_sessions(id),
  booking_pnr char(10) REFERENCES bookings(pnr),
  kind text NOT NULL CHECK (kind IN ('PAYMENT', 'REFUND')),
  provider text NOT NULL DEFAULT 'SIMULATED',
  status text NOT NULL CHECK (status IN ('PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED')),
  amount integer NOT NULL CHECK (amount >= 0),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS payment_transactions_user_created_idx
  ON payment_transactions(user_id, created_at DESC);

