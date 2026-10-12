import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {Pool} from 'pg';
import {addDays, routeFor, today, TRAINS} from '../dist/engine.js';
import {migrateDatabase} from '../api/migrate.mjs';
import {createServer} from '../server.mjs';

test('PostgreSQL auth, seat holds, payment lifecycle and concurrent booking safety', {
  skip: !process.env.TEST_DATABASE_URL && 'Set TEST_DATABASE_URL to an isolated PostgreSQL test database.',
  timeout: 45_000,
}, async () => {
  const pool = new Pool({connectionString: process.env.TEST_DATABASE_URL, max: 5});
  const origin = 'http://localhost:5173';
  process.env.ALLOWED_ORIGINS = origin;
  const users = [];
  let server;

  try {
    await migrateDatabase(pool);
    const app = createServer({pool, checkoutHoldSeconds: 10});
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    const base = `http://127.0.0.1:${address.port}`;
    const request = (path, {method = 'GET', body, cookie, idempotencyKey} = {}) => {
      const headers = {Origin: origin};
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) headers['X-RailYatra-Request'] = '1';
      if (cookie) headers.Cookie = cookie;
      if (body) headers['Content-Type'] = 'application/json';
      if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
      return fetch(`${base}/api${path}`, {method, headers, body: body ? JSON.stringify(body) : undefined});
    };
    const register = async suffix => {
      const response = await request('/auth/register', {method: 'POST', body: {
        name: 'Test Traveller', email: `rail-${randomUUID()}-${suffix}@example.test`, password: 'Temporary-demo-2026!',
      }});
      assert.equal(response.status, 201);
      const payload = await response.json();
      users.push(payload.user.id);
      assert.equal(payload.token, undefined, 'session credentials must not be exposed to JavaScript');
      const cookieHeader = response.headers.get('set-cookie');
      assert.match(cookieHeader, /HttpOnly/i);
      assert.match(cookieHeader, /SameSite=Lax/i);
      const cookie = cookieHeader.split(';', 1)[0];
      const profile = await request('/auth/me', {cookie});
      assert.equal(profile.status, 200);
      const user = await profile.json();
      return {cookie, user};
    };

    const first = await register('one');
    const second = await register('two');
    const train = TRAINS[0];
    const date = addDays(today(), 24);
    const firstRoute = routeFor(train, train.stops[0], train.stops[1], date);
    const makeDraft = (from, to, seat) => ({
      trainId: train.id, date, from, to, cls: '3A', quota: 'GENERAL',
      passengers: [{name: 'Test Traveller', age: 30, gender: 'Other'}],
      seats: [seat], boarding: from,
    });
    const openCheckout = (account, draft) => request('/checkouts', {
      method: 'POST', cookie: account.cookie, body: draft, idempotencyKey: randomUUID(),
    });

    const competing = await Promise.all([
      openCheckout(first, makeDraft(firstRoute.from, firstRoute.to, 1)),
      openCheckout(second, makeDraft(firstRoute.from, firstRoute.to, 1)),
    ]);
    assert.deepEqual(competing.map(response => response.status).sort(), [201, 409]);
    const winnerIndex = competing.findIndex(response => response.status === 201);
    const winnerAccount = winnerIndex === 0 ? first : second;
    const held = await competing[winnerIndex].json();
    assert.equal(held.status, 'HELD');

    const confirmed = await request(`/checkouts/${held.id}/payment`, {
      method: 'POST', cookie: winnerAccount.cookie, body: {outcome: 'SUCCESS'},
    });
    assert.equal(confirmed.status, 201);
    const ticket = await confirmed.json();
    assert.equal(ticket.status, 'CONFIRMED');
    assert.equal(ticket.paymentStatus, 'SIMULATED_SUCCESS');
    const retry = await request(`/checkouts/${held.id}/payment`, {
      method: 'POST', cookie: winnerAccount.cookie, body: {outcome: 'SUCCESS'},
    });
    assert.equal((await retry.json()).pnr, ticket.pnr, 'retrying a completed payment must return the original booking');

    const adjacentRoute = routeFor(train, train.stops[1], train.stops[2], date);
    const adjacent = await openCheckout(second, makeDraft(adjacentRoute.from, adjacentRoute.to, 1));
    assert.equal(adjacent.status, 201, 'the same seat can serve adjacent, non-overlapping legs');
    const adjacentHold = await adjacent.json();
    const adjacentBooking = await request(`/checkouts/${adjacentHold.id}/payment`, {
      method: 'POST', cookie: second.cookie, body: {outcome: 'SUCCESS'},
    });
    assert.equal(adjacentBooking.status, 201);
    const adjacentTicket = await adjacentBooking.json();
    const cancellation = await request(`/bookings/${adjacentTicket.pnr}/cancel`, {method: 'POST', cookie: second.cookie});
    assert.equal(cancellation.status, 200);
    const refundLedger = await request('/transactions', {cookie: second.cookie});
    assert((await refundLedger.json()).some(item => item.pnr === adjacentTicket.pnr && item.kind === 'REFUND' && item.status === 'REFUNDED'));

    const failedCheckout = await openCheckout(second, makeDraft(firstRoute.from, firstRoute.to, 2));
    assert.equal(failedCheckout.status, 201);
    const failedHold = await failedCheckout.json();
    const failedPayment = await request(`/checkouts/${failedHold.id}/payment`, {
      method: 'POST', cookie: second.cookie, body: {outcome: 'FAILURE'},
    });
    assert.equal(failedPayment.status, 402);
    const availability = await request(`/availability?from=${firstRoute.from}&to=${firstRoute.to}&date=${date}`);
    assert.equal(availability.status, 200);
    const inventory = await availability.json();
    assert(inventory[train.id].classes['3A'].includes(2), 'failed payment releases its temporary hold');

    const expiryCheckout = await openCheckout(second, makeDraft(firstRoute.from, firstRoute.to, 3));
    assert.equal(expiryCheckout.status, 201);
    const expiryHold = await expiryCheckout.json();
    await new Promise(resolve => setTimeout(resolve, 10_100));
    const expiredPayment = await request(`/checkouts/${expiryHold.id}/payment`, {
      method: 'POST', cookie: second.cookie, body: {outcome: 'SUCCESS'},
    });
    assert.equal(expiredPayment.status, 409, 'expired holds cannot be paid or confirmed');

    const transactions = await request('/transactions', {cookie: winnerAccount.cookie});
    assert.equal(transactions.status, 200);
    assert((await transactions.json()).some(item => item.pnr === ticket.pnr && item.status === 'SUCCEEDED'));

    const logout = await request('/auth/logout', {method: 'POST', cookie: first.cookie});
    assert.equal(logout.status, 204);
    const loggedOut = await request('/auth/me', {cookie: first.cookie});
    assert.equal(loggedOut.status, 401);
  } finally {
    if (server) {
      server.close();
      await once(server, 'close');
    }
    if (users.length) {
      const ids = users;
      await pool.query('DELETE FROM payment_transactions WHERE user_id=ANY($1::text[])', [ids]);
      await pool.query('DELETE FROM checkout_sessions WHERE user_id=ANY($1::text[])', [ids]);
      await pool.query('DELETE FROM food_orders WHERE user_id=ANY($1::text[])', [ids]);
      await pool.query('DELETE FROM bookings WHERE user_id=ANY($1::text[])', [ids]);
      await pool.query('DELETE FROM users WHERE id=ANY($1::text[])', [ids]);
    }
    await pool.end();
  }
});
