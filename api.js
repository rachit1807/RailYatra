import {createHash, randomBytes, randomInt, randomUUID, scrypt as scryptCallback, timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import express from 'express';
import {CLASSES, STATIONS, TRAINS, addDays, fare, journeyTime, routeFor, today} from './dist/engine.js';

const scrypt = promisify(scryptCallback);
const SESSION_DAYS = 7;
const COOKIE_SECONDS = SESSION_DAYS * 24 * 60 * 60;
const COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Host-railyatra_session' : 'railyatra_session';
const FOOD_MENU = new Map([
  ['Homestyle veg thali', 180],
  ['Vegetable biryani', 150],
  ['Chai & snack combo', 80],
]);

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const wrap = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const digest = value => createHash('sha256').update(value).digest('hex');
const userDto = user => ({id: user.id, name: user.name, email: user.email, role: user.role ?? 'traveller'});
const dateText = value => value instanceof Date
  ? value.toISOString().slice(0, 10)
  : String(value).slice(0, 10);

function validJourneyDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) return false;
  return value >= today() && value <= addDays(today(), 120);
}

function bookingDto(row) {
  return {
    pnr: row.pnr,
    email: row.email,
    trainId: row.train_id,
    trainName: row.train_name,
    originDate: dateText(row.origin_date),
    date: dateText(row.journey_date),
    a: Number(row.from_index),
    b: Number(row.to_index),
    from: row.from_station,
    to: row.to_station,
    cls: row.travel_class,
    quota: row.quota,
    passengers: row.passengers,
    seats: row.seats.map(Number),
    boarding: row.boarding,
    boardingTime: row.boarding_time,
    departure: row.departure,
    arrival: row.arrival,
    fare: row.fare,
    paymentId: row.payment_id,
    paymentStatus: row.payment_status,
    status: row.status,
    bookedAt: new Date(row.booked_at).toISOString(),
    ...(row.cancelled_at ? {cancelledAt: new Date(row.cancelled_at).toISOString()} : {}),
    refund: Number(row.refund),
  };
}

async function passwordDigest(password, salt) {
  return scrypt(password, salt, 64, {N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024});
}

async function createSession(pool, userId) {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = digest(token);
  await pool.query(
    `INSERT INTO sessions(token_hash, user_id, expires_at)
     VALUES ($1, $2, now() + ($3 * interval '1 day'))`,
    [tokenHash, userId, SESSION_DAYS],
  );
  return token;
}

function sessionToken(req) {
  const cookieHeader = req.get('cookie') ?? '';
  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=');
    if (separator < 0 || cookie.slice(0, separator).trim() !== COOKIE_NAME) continue;
    const value = cookie.slice(separator + 1).trim();
    return /^[A-Za-z0-9_-]{32,}$/.test(value) ? value : null;
  }
  return null;
}

function writeSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = secure ? 'None' : 'Lax';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; Max-Age=${COOKIE_SECONDS}; Path=/; HttpOnly; SameSite=${sameSite}${secure ? '; Secure' : ''}`);
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = secure ? 'None' : 'Lax';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=${sameSite}${secure ? '; Secure' : ''}`);
}

function bookingInput(body, userId) {
  const train = TRAINS.find(item => item.id === body.trainId);
  const date = body.date;
  if (!train || !validJourneyDate(date)) throw new ApiError(400, 'Choose a valid sample train and journey date.');
  if (!STATIONS[body.from] || !STATIONS[body.to]) throw new ApiError(400, 'Choose valid stations.');
  if (!Object.hasOwn(CLASSES, body.cls)) throw new ApiError(400, 'Choose a valid travel class.');
  if (!['GENERAL', 'TATKAL'].includes(body.quota)) throw new ApiError(400, 'Choose a valid demo quota.');
  if (body.paymentId !== undefined && (typeof body.paymentId !== 'string' || body.paymentId.length < 8 || body.paymentId.length > 120)) {
    throw new ApiError(400, 'Payment reference is invalid. Restart checkout and try again.');
  }
  if (!Array.isArray(body.passengers) || body.passengers.length < 1 || body.passengers.length > 6) {
    throw new ApiError(400, 'Choose between one and six passengers.');
  }
  const passengers = body.passengers.map(passenger => {
    const name = String(passenger?.name ?? '').trim();
    const age = Number(passenger?.age);
    const gender = String(passenger?.gender ?? 'Other');
    if (name.length < 2 || name.length > 60 || !Number.isInteger(age) || age < 1 || age > 120 || !['Female', 'Male', 'Other'].includes(gender)) {
      throw new ApiError(400, 'Enter valid fictional passenger details.');
    }
    return {name, age, gender};
  });
  const seats = body.seats;
  if (!Array.isArray(seats) || seats.length !== passengers.length || new Set(seats).size !== seats.length || seats.some(seat => !Number.isInteger(seat) || seat < 1 || seat > 24)) {
    throw new ApiError(400, 'Select one different available seat for each passenger.');
  }
  const route = routeFor(train, body.from, body.to, date);
  if (!route) throw new ApiError(400, 'That sample train does not serve this route in that direction.');
  const boarding = body.boarding;
  const boardingIndex = train.stops.indexOf(boarding);
  if (boardingIndex < route.a || boardingIndex >= route.b) throw new ApiError(400, 'Choose a boarding station within the booked segment.');
  const departure = journeyTime(train, route, route.a);
  const arrival = journeyTime(train, route, route.b);
  if (Date.parse(departure.iso) <= Date.now()) throw new ApiError(400, 'This sample train has already departed. Choose a later date.');
  return {
    userId,
    train,
    route,
    passengers,
    seats: [...seats].sort((a, b) => a - b),
    boarding,
    boardingTime: journeyTime(train, route, boardingIndex),
    departure,
    arrival,
    travelClass: body.cls,
    quota: body.quota,
    paymentId: body.paymentId ?? null,
    fare: fare(train, route, body.cls, passengers.length, body.quota),
  };
}

async function insertBooking(client, booking, user, paymentId) {
  const pnr = String(randomInt(1_000_000_000, 9_999_999_999));
  const id = randomUUID();
  const inserted = await client.query(
    `INSERT INTO bookings(
      id, pnr, user_id, train_id, train_name, origin_date, journey_date,
      from_station, to_station, from_index, to_index, travel_class, quota,
      passengers, seats, boarding, boarding_time, departure, arrival, fare,
      payment_id, payment_status, status
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
      $14::jsonb,$15::smallint[],$16,$17::jsonb,$18::jsonb,$19::jsonb,$20::jsonb,
      $21,'SIMULATED_SUCCESS','CONFIRMED'
    ) RETURNING *`,
    [id, pnr, user.id, booking.train.id, booking.train.name, booking.route.originDate, booking.route.date,
      booking.route.from, booking.route.to, booking.route.a, booking.route.b, booking.travelClass, booking.quota,
      JSON.stringify(booking.passengers), booking.seats, booking.boarding, JSON.stringify(booking.boardingTime),
      JSON.stringify(booking.departure), JSON.stringify(booking.arrival), JSON.stringify(booking.fare), paymentId],
  );
  return inserted.rows[0];
}

export function createApi(pool, {checkoutHoldSeconds = 300} = {}) {
  const router = express.Router();

  const authenticate = wrap(async (req, res, next) => {
    const token = sessionToken(req);
    if (!token) {
      clearSessionCookie(res);
      throw new ApiError(401, 'Please sign in again.');
    }
    const tokenHash = digest(token);
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [tokenHash],
    );
    if (!result.rowCount) {
      clearSessionCookie(res);
      throw new ApiError(401, 'Your session has expired. Please sign in again.');
    }
    req.user = result.rows[0];
    req.sessionTokenHash = tokenHash;
    next();
  });

  router.get('/health', (_req, res) => {
    res.json({status: 'ok'});
  });

  router.get('/ready', wrap(async (_req, res) => {
    await pool.query('SELECT 1');
    res.json({status: 'ok', database: 'connected'});
  }));

  router.post('/auth/register', wrap(async (req, res) => {
    const name = String(req.body?.name ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    if (name.length < 2 || name.length > 60) throw new ApiError(400, 'Enter a name between 2 and 60 characters.');
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Enter a valid email address.');
    if (password.length < 8 || password.length > 100) throw new ApiError(400, 'Use a demo password between 8 and 100 characters.');
    const salt = randomBytes(16).toString('hex');
    const hash = (await passwordDigest(password, salt)).toString('hex');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query(
        'INSERT INTO users(id, name, email, password_salt, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
        [randomUUID(), name, email, salt, hash],
      );
      const token = randomBytes(32).toString('base64url');
      await client.query(
        `INSERT INTO sessions(token_hash, user_id, expires_at)
         VALUES ($1, $2, now() + ($3 * interval '1 day'))`,
        [digest(token), inserted.rows[0].id, SESSION_DAYS],
      );
      await client.query('COMMIT');
      writeSessionCookie(res, token);
      res.status(201).json({user: userDto(inserted.rows[0])});
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') throw new ApiError(409, 'This email already has an account. Sign in instead.');
      throw error;
    } finally {
      client.release();
    }
  }));

  router.post('/auth/login', wrap(async (req, res) => {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    const found = await pool.query('SELECT id, name, email, role, password_salt, password_hash FROM users WHERE email = $1', [email]);
    if (!found.rowCount) throw new ApiError(401, 'Email or password is incorrect.');
    const user = found.rows[0];
    const candidate = await passwordDigest(password, user.password_salt);
    const stored = Buffer.from(user.password_hash, 'hex');
    if (stored.length !== candidate.length || !timingSafeEqual(stored, candidate)) throw new ApiError(401, 'Email or password is incorrect.');
    await pool.query('DELETE FROM sessions WHERE expires_at < now()');
    const token = await createSession(pool, user.id);
    writeSessionCookie(res, token);
    res.json({user: userDto(user)});
  }));

  router.get('/auth/me', authenticate, (req, res) => res.json(userDto(req.user)));
  router.post('/auth/logout', authenticate, wrap(async (req, res) => {
    await pool.query('DELETE FROM sessions WHERE token_hash = $1', [req.sessionTokenHash]);
    clearSessionCookie(res);
    res.status(204).end();
  }));

  router.get('/availability', wrap(async (req, res) => {
    const {from, to, date} = req.query;
    if (!STATIONS[from] || !STATIONS[to] || !validJourneyDate(date)) throw new ApiError(400, 'Choose valid stations and a journey date.');
    const routes = TRAINS.map(train => ({train, route: routeFor(train, from, to, date)})).filter(item => item.route);
    if (!routes.length) return res.json({});
    const values = [];
    const rows = routes.map(({train, route}) => {
      values.push(train.id, route.originDate);
      return `($${values.length - 1}::text, $${values.length}::date)`;
    });
    const occupied = await pool.query(
      `SELECT b.train_id, b.origin_date::text AS origin_date, b.travel_class, b.from_index, b.to_index, b.seats
       FROM bookings b JOIN (VALUES ${rows.join(',')}) AS q(train_id, origin_date)
       ON q.train_id = b.train_id AND q.origin_date = b.origin_date
       WHERE b.status = 'CONFIRMED'
       UNION ALL
       SELECT h.train_id, h.origin_date::text AS origin_date, h.travel_class, h.from_index, h.to_index,
              ARRAY[h.seat_no]::smallint[] AS seats
       FROM seat_holds h
       JOIN checkout_sessions c ON c.id = h.checkout_id
       JOIN (VALUES ${rows.join(',')}) AS q(train_id, origin_date)
         ON q.train_id = h.train_id AND q.origin_date = h.origin_date
       WHERE c.status = 'HELD' AND c.expires_at > now()`,
      values,
    );
    const out = {};
    for (const {train, route} of routes) {
      const byClass = {};
      for (const cls of Object.keys(CLASSES)) {
        const used = new Set();
        for (const booking of occupied.rows) {
          if (booking.train_id !== train.id || dateText(booking.origin_date) !== route.originDate || booking.travel_class !== cls) continue;
          if (Number(booking.from_index) < route.b && route.a < Number(booking.to_index)) booking.seats.forEach(seat => used.add(Number(seat)));
        }
        byClass[cls] = Array.from({length: 24}, (_, i) => i + 1).filter(seat => !used.has(seat));
      }
      out[train.id] = {originDate: route.originDate, classes: byClass};
    }
    res.json(out);
  }));

  router.get('/bookings', authenticate, wrap(async (req, res) => {
    const result = await pool.query(
      `SELECT b.*, u.email FROM bookings b JOIN users u ON u.id = b.user_id
       WHERE b.user_id = $1 ORDER BY b.journey_date DESC, b.booked_at DESC`,
      [req.user.id],
    );
    res.json(result.rows.map(bookingDto));
  }));

  router.get('/pnr/:pnr', authenticate, wrap(async (req, res) => {
    const result = await pool.query(
      `SELECT b.*, u.email FROM bookings b JOIN users u ON u.id = b.user_id
       WHERE b.pnr = $1 AND b.user_id = $2`,
      [req.params.pnr, req.user.id],
    );
    if (!result.rowCount) throw new ApiError(404, 'PNR not found in this account.');
    res.json(bookingDto(result.rows[0]));
  }));

  router.post('/checkouts', authenticate, wrap(async (req, res) => {
    const idempotencyKey = req.get('idempotency-key') ?? '';
    if (!/^[A-Za-z0-9._:-]{12,128}$/.test(idempotencyKey)) throw new ApiError(400, 'A valid checkout request key is required. Please restart checkout.');
    const booking = bookingInput(req.body, req.user.id);
    const checkoutId = randomUUID();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [req.user.id + ':' + idempotencyKey]);
      const prior = await client.query(
        'SELECT id, status, expires_at, booking_pnr FROM checkout_sessions WHERE user_id=$1 AND idempotency_key=$2 FOR UPDATE',
        [req.user.id, idempotencyKey],
      );
      if (prior.rowCount) {
        if (prior.rows[0].status === 'HELD' && Date.parse(prior.rows[0].expires_at) <= Date.now()) {
          await client.query("UPDATE checkout_sessions SET status='EXPIRED', updated_at=now() WHERE id=$1", [prior.rows[0].id]);
          await client.query("INSERT INTO checkout_events(checkout_id,status,detail) VALUES ($1,'EXPIRED','Seat hold expired before payment.')", [prior.rows[0].id]);
          await client.query('DELETE FROM seat_holds WHERE checkout_id=$1', [prior.rows[0].id]);
          await client.query('COMMIT');
          throw new ApiError(409, 'That seat hold expired. Return to seat selection and start checkout again.');
        }
        await client.query('COMMIT');
        return res.status(200).json({id: prior.rows[0].id, status: prior.rows[0].status, expiresAt: new Date(prior.rows[0].expires_at).toISOString(), pnr: prior.rows[0].booking_pnr});
      }

      for (const seat of booking.seats) {
        await client.query(
          'INSERT INTO seat_locks(train_id, origin_date, travel_class, seat_no) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
          [booking.train.id, booking.route.originDate, booking.travelClass, seat],
        );
        await client.query(
          'SELECT seat_no FROM seat_locks WHERE train_id=$1 AND origin_date=$2 AND travel_class=$3 AND seat_no=$4 FOR UPDATE',
          [booking.train.id, booking.route.originDate, booking.travelClass, seat],
        );
      }
      const conflict = await client.query(
        [
          'SELECT 1 FROM bookings b',
          "WHERE b.train_id=$1 AND b.origin_date=$2 AND b.travel_class=$3 AND b.status='CONFIRMED'",
          'AND b.from_index < $4 AND b.to_index > $5 AND b.seats && $6::smallint[]',
          'UNION ALL',
          'SELECT 1 FROM seat_holds h JOIN checkout_sessions c ON c.id=h.checkout_id',
          'WHERE h.train_id=$1 AND h.origin_date=$2 AND h.travel_class=$3',
          'AND h.from_index < $4 AND h.to_index > $5 AND h.seat_no=ANY($6::smallint[])',
          "AND c.status='HELD' AND c.expires_at > now() LIMIT 1",
        ].join(' '),
        [booking.train.id, booking.route.originDate, booking.travelClass, booking.route.b, booking.route.a, booking.seats],
      );
      if (conflict.rowCount) throw new ApiError(409, 'A selected seat was just taken or is being held. Refresh availability and choose another seat.');

      const inserted = await client.query(
        "INSERT INTO checkout_sessions(id,user_id,idempotency_key,status,request_payload,expires_at) VALUES ($1,$2,$3,'HELD',$4::jsonb,now()+($5 * interval '1 second')) RETURNING id,status,expires_at",
        [checkoutId, req.user.id, idempotencyKey, JSON.stringify(booking), checkoutHoldSeconds],
      );
      for (const seat of booking.seats) {
        await client.query(
          'INSERT INTO seat_holds(checkout_id,train_id,origin_date,travel_class,from_index,to_index,seat_no) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [checkoutId, booking.train.id, booking.route.originDate, booking.travelClass, booking.route.a, booking.route.b, seat],
        );
      }
      await client.query("INSERT INTO checkout_events(checkout_id,status,detail) VALUES ($1,'HELD','Seat held for the demo checkout window.')", [checkoutId]);
      await client.query('COMMIT');
      res.status(201).json({id: inserted.rows[0].id, status: inserted.rows[0].status, expiresAt: new Date(inserted.rows[0].expires_at).toISOString()});
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch {}
      throw error;
    } finally {
      client.release();
    }
  }));

  router.get('/checkouts/:id', authenticate, wrap(async (req, res) => {
    const result = await pool.query('SELECT id,status,expires_at,booking_pnr FROM checkout_sessions WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!result.rowCount) throw new ApiError(404, 'Checkout was not found in this account.');
    const checkout = result.rows[0];
    const events = await pool.query('SELECT status,detail,created_at FROM checkout_events WHERE checkout_id=$1 ORDER BY created_at,id', [checkout.id]);
    res.json({id: checkout.id, status: checkout.status, expiresAt: new Date(checkout.expires_at).toISOString(), pnr: checkout.booking_pnr, events: events.rows.map(event => ({status: event.status, detail: event.detail, at: new Date(event.created_at).toISOString()}))});
  }));

  router.post('/checkouts/:id/cancel', authenticate, wrap(async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query('SELECT * FROM checkout_sessions WHERE id=$1 AND user_id=$2 FOR UPDATE', [req.params.id, req.user.id]);
      if (!result.rowCount) throw new ApiError(404, 'Checkout was not found in this account.');
      const checkout = result.rows[0];
      if (['CANCELLED', 'EXPIRED', 'FAILED'].includes(checkout.status)) {
        await client.query('COMMIT');
        return res.status(204).end();
      }
      if (checkout.status !== 'HELD') throw new ApiError(409, 'A payment is already being processed for this checkout.');
      await client.query("UPDATE checkout_sessions SET status='CANCELLED',updated_at=now() WHERE id=$1", [checkout.id]);
      await client.query("INSERT INTO checkout_events(checkout_id,status,detail) VALUES ($1,'CANCELLED','Traveller returned to seat selection.')", [checkout.id]);
      await client.query('DELETE FROM seat_holds WHERE checkout_id=$1', [checkout.id]);
      await client.query('COMMIT');
      res.status(204).end();
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch {}
      throw error;
    } finally {
      client.release();
    }
  }));

  router.post('/checkouts/:id/payment', authenticate, wrap(async (req, res) => {
    const outcome = req.body?.outcome;
    if (!['SUCCESS', 'FAILURE'].includes(outcome)) throw new ApiError(400, 'Choose a successful or failed demo payment outcome.');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query('SELECT * FROM checkout_sessions WHERE id=$1 AND user_id=$2 FOR UPDATE', [req.params.id, req.user.id]);
      if (!result.rowCount) throw new ApiError(404, 'Checkout was not found in this account.');
      const checkout = result.rows[0];
      if (checkout.status === 'CONFIRMED' && checkout.booking_pnr) {
        await client.query('COMMIT');
        const existing = await pool.query('SELECT b.*,u.email FROM bookings b JOIN users u ON u.id=b.user_id WHERE b.pnr=$1', [checkout.booking_pnr]);
        return res.json(bookingDto(existing.rows[0]));
      }
      if (checkout.status !== 'HELD') throw new ApiError(409, 'This checkout is no longer active. Refresh and start a new checkout.');
      if (Date.parse(checkout.expires_at) <= Date.now()) {
        await client.query("UPDATE checkout_sessions SET status='EXPIRED',updated_at=now() WHERE id=$1", [checkout.id]);
        await client.query("INSERT INTO checkout_events(checkout_id,status,detail) VALUES ($1,'EXPIRED','Seat hold expired before payment.')", [checkout.id]);
        await client.query('DELETE FROM seat_holds WHERE checkout_id=$1', [checkout.id]);
        await client.query('COMMIT');
        return res.status(409).json({error: 'That seat hold expired. Return to seat selection and start checkout again.'});
      }
      const booking = checkout.request_payload;
      for (const seat of booking.seats) {
        await client.query(
          'INSERT INTO seat_locks(train_id,origin_date,travel_class,seat_no) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
          [booking.train.id, booking.route.originDate, booking.travelClass, seat],
        );
        await client.query(
          'SELECT seat_no FROM seat_locks WHERE train_id=$1 AND origin_date=$2 AND travel_class=$3 AND seat_no=$4 FOR UPDATE',
          [booking.train.id, booking.route.originDate, booking.travelClass, seat],
        );
      }
      const taken = await client.query(
        "SELECT 1 FROM bookings b WHERE b.train_id=$1 AND b.origin_date=$2 AND b.travel_class=$3 AND b.status='CONFIRMED' AND b.from_index < $4 AND b.to_index > $5 AND b.seats && $6::smallint[] LIMIT 1",
        [booking.train.id, booking.route.originDate, booking.travelClass, booking.route.b, booking.route.a, booking.seats],
      );
      if (taken.rowCount) throw new ApiError(409, 'This seat is no longer available. Refresh availability and choose again.');

      const paymentId = 'DEMO-' + randomUUID();
      const paymentTransactionId = randomUUID();
      const paymentIdempotencyKey = 'demo-payment:' + checkout.id;
      await client.query("UPDATE checkout_sessions SET status='PAYMENT_PENDING',updated_at=now() WHERE id=$1", [checkout.id]);
      await client.query("INSERT INTO checkout_events(checkout_id,status,detail) VALUES ($1,'PAYMENT_PENDING','Demo payment simulation started.')", [checkout.id]);
      await client.query(
        "INSERT INTO payment_transactions(id,user_id,checkout_id,kind,provider,status,amount,idempotency_key) VALUES ($1,$2,$3,'PAYMENT','SIMULATED','PROCESSING',$4,$5)",
        [paymentTransactionId, req.user.id, checkout.id, booking.fare.total, paymentIdempotencyKey],
      );

      if (outcome === 'FAILURE') {
        await client.query("UPDATE payment_transactions SET status='FAILED' WHERE id=$1", [paymentTransactionId]);
        await client.query("UPDATE checkout_sessions SET status='FAILED',updated_at=now() WHERE id=$1", [checkout.id]);
        await client.query("INSERT INTO checkout_events(checkout_id,status,detail) VALUES ($1,'FAILED','Demo payment was declined; held seats were released.')", [checkout.id]);
        await client.query('DELETE FROM seat_holds WHERE checkout_id=$1', [checkout.id]);
        await client.query('COMMIT');
        return res.status(402).json({error: 'Simulated payment failed. No money was charged; the seat hold was released.'});
      }

      const inserted = await insertBooking(client, booking, req.user, paymentId);
      await client.query("UPDATE payment_transactions SET status='SUCCEEDED',booking_pnr=$2 WHERE id=$1", [paymentTransactionId, inserted.pnr]);
      await client.query("UPDATE checkout_sessions SET status='CONFIRMED',booking_pnr=$2,updated_at=now() WHERE id=$1", [checkout.id, inserted.pnr]);
      await client.query("INSERT INTO checkout_events(checkout_id,status,detail) VALUES ($1,'CONFIRMED','Demo payment succeeded and the booking was committed.')", [checkout.id]);
      await client.query('DELETE FROM seat_holds WHERE checkout_id=$1', [checkout.id]);
      await client.query('COMMIT');
      res.status(201).json(bookingDto({...inserted, email: req.user.email}));
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch {}
      if (error.code === '23505') throw new ApiError(409, 'This payment was already recorded. Check My journeys.');
      throw error;
    } finally {
      client.release();
    }
  }));

  router.post('/bookings', authenticate, (_req, res) => {
    res.status(410).json({error: 'Direct booking confirmation is disabled. Create a short seat hold and complete the demo checkout instead.'});
  });

  router.get('/transactions', authenticate, wrap(async (req, res) => {
    const result = await pool.query(
      'SELECT id,checkout_id,booking_pnr,kind,provider,status,amount,created_at FROM payment_transactions WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user.id],
    );
    res.json(result.rows.map(row => ({id: row.id, checkoutId: row.checkout_id, pnr: row.booking_pnr, kind: row.kind, provider: row.provider, status: row.status, amount: Number(row.amount), createdAt: new Date(row.created_at).toISOString()})));
  }));

  router.post('/bookings/:pnr/cancel', authenticate, wrap(async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        'SELECT * FROM bookings WHERE pnr=$1 AND user_id=$2 FOR UPDATE',
        [req.params.pnr, req.user.id],
      );
      const booking = result.rows[0];
      if (!booking) throw new ApiError(404, 'This PNR is not in your account.');
      if (booking.status !== 'CONFIRMED' || Date.parse(booking.departure.iso) <= Date.now()) {
        throw new ApiError(409, 'Only your upcoming confirmed tickets can be cancelled.');
      }
      for (const seat of booking.seats.map(Number).sort((a, b) => a - b)) {
        await client.query(
          `INSERT INTO seat_locks(train_id, origin_date, travel_class, seat_no)
           VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [booking.train_id, dateText(booking.origin_date), booking.travel_class, seat],
        );
        await client.query(
          `SELECT seat_no FROM seat_locks
           WHERE train_id=$1 AND origin_date=$2 AND travel_class=$3 AND seat_no=$4 FOR UPDATE`,
          [booking.train_id, dateText(booking.origin_date), booking.travel_class, seat],
        );
      }
      const updated = await client.query(
        `UPDATE bookings SET status='CANCELLED', cancelled_at=now(), refund=(fare->>'total')::integer
         WHERE id=$1 RETURNING *`,
        [booking.id],
      );
      await client.query(
        `INSERT INTO payment_transactions(id,user_id,booking_pnr,kind,provider,status,amount,idempotency_key)
         VALUES ($1,$2,$3,'REFUND','SIMULATED','REFUNDED',$4,$5)
         ON CONFLICT (user_id,idempotency_key) DO NOTHING`,
        [randomUUID(), req.user.id, booking.pnr, Number(booking.fare.total), `demo-refund:${booking.pnr}`],
      );
      await client.query('UPDATE food_orders SET status=\'CANCELLED\' WHERE booking_pnr=$1 AND user_id=$2 AND status=\'PLACED\'', [booking.pnr, req.user.id]);
      await client.query('COMMIT');
      res.json(bookingDto({...updated.rows[0], email: req.user.email}));
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }));

  router.get('/food-orders', authenticate, wrap(async (req, res) => {
    const result = await pool.query(
      `SELECT o.*, u.email FROM food_orders o JOIN users u ON u.id=o.user_id
       WHERE o.user_id=$1 ORDER BY o.created_at DESC`,
      [req.user.id],
    );
    res.json(result.rows.map(row => ({
      id: row.id, pnr: row.booking_pnr, email: row.email, station: row.station,
      name: row.name, price: Number(row.price), status: row.status,
      createdAt: new Date(row.created_at).toISOString(),
    })));
  }));

  router.post('/food-orders', authenticate, wrap(async (req, res) => {
    const {pnr, station, name} = req.body ?? {};
    const price = FOOD_MENU.get(name);
    if (!price || !STATIONS[station]) throw new ApiError(400, 'Choose a meal and delivery station from the demo menu.');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const found = await client.query('SELECT * FROM bookings WHERE pnr=$1 AND user_id=$2 FOR SHARE', [pnr, req.user.id]);
      const booking = found.rows[0];
      if (!booking || booking.status !== 'CONFIRMED' || Date.parse(booking.departure.iso) <= Date.now()) {
        throw new ApiError(409, 'Choose an upcoming confirmed journey.');
      }
      const train = TRAINS.find(item => item.id === booking.train_id);
      const fromIndex = train?.stops.indexOf(booking.boarding) ?? -1;
      const stopIndex = train?.stops.indexOf(station) ?? -1;
      if (stopIndex < fromIndex || stopIndex >= Number(booking.to_index)) throw new ApiError(400, 'Choose a delivery station along your booked journey.');
      const orderId = randomUUID();
      await client.query(
        `INSERT INTO food_orders(id, booking_pnr, user_id, station, name, price, status)
         VALUES ($1,$2,$3,$4,$5,$6,'PLACED')`,
        [orderId, pnr, req.user.id, station, name, price],
      );
      await client.query('COMMIT');
      res.status(201).json({id: orderId, pnr, email: req.user.email, station, name, price, status: 'PLACED', createdAt: new Date().toISOString()});
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }));

  router.use((error, _req, res, _next) => {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof ApiError ? error.message : 'The RailYatra service could not complete that request.';
    if (status === 500) console.error(JSON.stringify({event: 'api.request.failed', requestId: _req.requestId, code: error.code ?? 'INTERNAL_ERROR', name: error.name}));
    if (!res.headersSent) res.status(status).json({error: message});
  });

  return router;
}

export async function expireSeatHolds(pool) {
  const result = await pool.query(`
    WITH expired AS (
      UPDATE checkout_sessions SET status='EXPIRED', updated_at=now()
      WHERE status='HELD' AND expires_at <= now()
      RETURNING id
    ), recorded AS (
      INSERT INTO checkout_events(checkout_id,status,detail)
      SELECT id,'EXPIRED','Seat hold expired automatically.' FROM expired
      RETURNING checkout_id
    )
    DELETE FROM seat_holds WHERE checkout_id IN (SELECT id FROM expired)
  `);
  return result.rowCount ?? 0;
}
