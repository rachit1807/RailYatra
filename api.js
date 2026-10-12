import {createHash, randomBytes, randomInt, randomUUID, scrypt as scryptCallback, timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import express from 'express';
import {CLASSES, STATIONS, TRAINS, addDays, fare, journeyTime, routeFor, today} from './dist/engine.js';

const scrypt = promisify(scryptCallback);
const SESSION_DAYS = 7;
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
const userDto = user => ({id: user.id, name: user.name, email: user.email});
const dateText = value => String(value).slice(0, 10);

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

function bookingInput(body, userId) {
  const train = TRAINS.find(item => item.id === body.trainId);
  const date = body.date;
  if (!train || !validJourneyDate(date)) throw new ApiError(400, 'Choose a valid sample train and journey date.');
  if (!STATIONS[body.from] || !STATIONS[body.to]) throw new ApiError(400, 'Choose valid stations.');
  if (!Object.hasOwn(CLASSES, body.cls)) throw new ApiError(400, 'Choose a valid travel class.');
  if (!['GENERAL', 'TATKAL'].includes(body.quota)) throw new ApiError(400, 'Choose a valid demo quota.');
  if (body.paymentOutcome !== 'SUCCESS') throw new ApiError(400, 'Complete the simulated payment to confirm this demo booking.');
  if (typeof body.paymentId !== 'string' || body.paymentId.length < 8 || body.paymentId.length > 120) {
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
    paymentId: body.paymentId,
    fare: fare(train, route, body.cls, passengers.length, body.quota),
  };
}

export function createApi(pool) {
  const router = express.Router();

  const authenticate = wrap(async (req, res, next) => {
    const match = /^Bearer ([A-Za-z0-9_-]{32,})$/.exec(req.get('authorization') ?? '');
    if (!match) throw new ApiError(401, 'Please sign in again.');
    const tokenHash = digest(match[1]);
    const result = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [tokenHash],
    );
    if (!result.rowCount) throw new ApiError(401, 'Your session has expired. Please sign in again.');
    req.user = result.rows[0];
    req.sessionTokenHash = tokenHash;
    next();
  });

  router.get('/health', wrap(async (_req, res) => {
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
        'INSERT INTO users(id, name, email, password_salt, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email',
        [randomUUID(), name, email, salt, hash],
      );
      const token = randomBytes(32).toString('base64url');
      await client.query(
        `INSERT INTO sessions(token_hash, user_id, expires_at)
         VALUES ($1, $2, now() + ($3 * interval '1 day'))`,
        [digest(token), inserted.rows[0].id, SESSION_DAYS],
      );
      await client.query('COMMIT');
      res.status(201).json({user: userDto(inserted.rows[0]), token});
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
    const found = await pool.query('SELECT id, name, email, password_salt, password_hash FROM users WHERE email = $1', [email]);
    if (!found.rowCount) throw new ApiError(401, 'Email or password is incorrect.');
    const user = found.rows[0];
    const candidate = await passwordDigest(password, user.password_salt);
    const stored = Buffer.from(user.password_hash, 'hex');
    if (stored.length !== candidate.length || !timingSafeEqual(stored, candidate)) throw new ApiError(401, 'Email or password is incorrect.');
    await pool.query('DELETE FROM sessions WHERE expires_at < now()');
    const token = await createSession(pool, user.id);
    res.json({user: userDto(user), token});
  }));

  router.get('/auth/me', authenticate, (req, res) => res.json(userDto(req.user)));
  router.post('/auth/logout', authenticate, wrap(async (req, res) => {
    await pool.query('DELETE FROM sessions WHERE token_hash = $1', [req.sessionTokenHash]);
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
       WHERE b.status = 'CONFIRMED'`,
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

  router.post('/bookings', authenticate, wrap(async (req, res) => {
    const booking = bookingInput(req.body, req.user.id);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let prior = await client.query('SELECT * FROM bookings WHERE user_id = $1 AND payment_id = $2', [req.user.id, booking.paymentId]);
      if (prior.rowCount) {
        await client.query('COMMIT');
        const response = await pool.query('SELECT b.*, u.email FROM bookings b JOIN users u ON u.id=b.user_id WHERE b.id=$1', [prior.rows[0].id]);
        return res.json(bookingDto(response.rows[0]));
      }

      for (const seat of booking.seats) {
        await client.query(
          `INSERT INTO seat_locks(train_id, origin_date, travel_class, seat_no)
           VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [booking.train.id, booking.route.originDate, booking.travelClass, seat],
        );
        await client.query(
          `SELECT seat_no FROM seat_locks
           WHERE train_id = $1 AND origin_date = $2 AND travel_class = $3 AND seat_no = $4
           FOR UPDATE`,
          [booking.train.id, booking.route.originDate, booking.travelClass, seat],
        );
      }

      prior = await client.query('SELECT * FROM bookings WHERE user_id = $1 AND payment_id = $2', [req.user.id, booking.paymentId]);
      if (prior.rowCount) {
        await client.query('COMMIT');
        const response = await pool.query('SELECT b.*, u.email FROM bookings b JOIN users u ON u.id=b.user_id WHERE b.id=$1', [prior.rows[0].id]);
        return res.json(bookingDto(response.rows[0]));
      }

      const current = await client.query(
        `SELECT seats FROM bookings
         WHERE train_id=$1 AND origin_date=$2 AND travel_class=$3 AND status='CONFIRMED'
           AND from_index < $4 AND to_index > $5`,
        [booking.train.id, booking.route.originDate, booking.travelClass, booking.route.b, booking.route.a],
      );
      const usedSeats = new Set(current.rows.flatMap(row => row.seats.map(Number)));
      if (booking.seats.some(seat => usedSeats.has(seat))) throw new ApiError(409, 'A selected seat was just booked. Go back and choose an available seat. No demo payment was recorded.');

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
        [id, pnr, req.user.id, booking.train.id, booking.train.name, booking.route.originDate, booking.route.date,
          booking.route.from, booking.route.to, booking.route.a, booking.route.b, booking.travelClass, booking.quota,
          JSON.stringify(booking.passengers), booking.seats, booking.boarding, JSON.stringify(booking.boardingTime),
          JSON.stringify(booking.departure), JSON.stringify(booking.arrival), JSON.stringify(booking.fare), booking.paymentId],
      );
      await client.query('COMMIT');
      res.status(201).json(bookingDto({...inserted.rows[0], email: req.user.email}));
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') throw new ApiError(409, 'This checkout was already completed. Check My journeys.');
      throw error;
    } finally {
      client.release();
    }
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
    if (status === 500) console.error('API request failed:', error);
    if (!res.headersSent) res.status(status).json({error: message});
  });

  return router;
}
