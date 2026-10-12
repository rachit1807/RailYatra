ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('CONFIRMED', 'RAC', 'WAITLISTED', 'CANCELLED'));

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS queue_position integer;

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_queue_position_check;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_queue_position_check
  CHECK (
    (status IN ('RAC', 'WAITLISTED') AND queue_position >= 1 AND cardinality(seats) = 0)
    OR (status NOT IN ('RAC', 'WAITLISTED') AND queue_position IS NULL)
  );

CREATE INDEX IF NOT EXISTS bookings_queue_idx
  ON bookings (train_id, origin_date, travel_class, from_index, to_index, booked_at)
  WHERE status IN ('RAC', 'WAITLISTED');
