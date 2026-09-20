import request from 'supertest';
import Stripe from 'stripe';
import app from '../src/app';
import { sequelize, User, Payment, ProcessedStripeEvent, WalletBalance, WalletLedger } from '../src/models';
import { PAYMENT_STATUS } from '../src/models/payment';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;
const CURRENCY_ID = 1;
const CREDITS = 100;

const email = `pay_${Date.now()}@example.com`;
const password = 'password123';

let token = '';
let userId = 0;
let sessionId = '';
const eventId = `evt_test_${Date.now()}`;

/** Builds a checkout.session.completed payload plus a valid Stripe-Signature header. */
function signedEvent(id: string, overrides: Record<string, unknown> = {}) {
  const payload = JSON.stringify({
    id,
    type: 'checkout.session.completed',
    data: {
      object: {
        object: 'checkout.session',
        id: sessionId,
        payment_status: 'paid',
        ...overrides,
      },
    },
  });

  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
  return { payload, signature };
}

function postWebhook(payload: string, signature: string) {
  return request(app)
    .post('/api/payments/webhook')
    .set('Content-Type', 'application/json')
    .set('Stripe-Signature', signature)
    .send(payload);
}

beforeAll(async () => {
  const res = await request(app).post('/api/auth/signup').send({ email, password });
  token = res.body.data.token;
  userId = res.body.data.user.id;

  sessionId = `cs_test_${Date.now()}`;
  await Payment.create({
    user_id: userId,
    currency_id: CURRENCY_ID,
    credits: CREDITS,
    amount_paise: 30000,
    stripe_session_id: sessionId,
    status: PAYMENT_STATUS.PENDING,
  });
});

afterAll(async () => {
  await ProcessedStripeEvent.destroy({ where: { stripe_event_id: [eventId, `${eventId}_other`] } });
  await User.destroy({ where: { id: userId } });
  await sequelize.close();
});

async function balance() {
  const row = await WalletBalance.findOne({ where: { user_id: userId, currency_id: CURRENCY_ID } });
  return row!.balance;
}

describe('POST /api/payments/checkout', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/api/payments/checkout').send({ currencyId: 1, quantity: 10 });
    expect(res.status).toBe(401);
  });

  it('rejects a non-positive quantity', async () => {
    const res = await request(app)
      .post('/api/payments/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ currencyId: 1, quantity: 0 });

    expect(res.status).toBe(400);
  });

  it('rejects sending both planId and quantity', async () => {
    const res = await request(app)
      .post('/api/payments/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ currencyId: 1, planId: 1, quantity: 5 });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/payments/webhook', () => {
  it('rejects an invalid signature and changes nothing', async () => {
    const { payload } = signedEvent(eventId);
    const before = await balance();

    const res = await postWebhook(payload, 't=1,v1=not_a_real_signature');

    expect(res.status).toBe(400);
    expect(await balance()).toBe(before);
    expect(await ProcessedStripeEvent.count({ where: { stripe_event_id: eventId } })).toBe(0);
    expect(await WalletLedger.count({ where: { user_id: userId } })).toBe(0);
  });

  it('grants credits once for a verified successful payment', async () => {
    const { payload, signature } = signedEvent(eventId);

    const res = await postWebhook(payload, signature);

    expect(res.status).toBe(200);
    expect(res.body.handled).toBe(true);
    expect(await balance()).toBe(CREDITS);

    const entries = await WalletLedger.findAll({ where: { user_id: userId } });
    expect(entries).toHaveLength(1);
    expect(entries[0].amount).toBe(CREDITS);
    expect(entries[0].type).toBe('purchase');

    const payment = await Payment.findOne({ where: { stripe_session_id: sessionId } });
    expect(payment!.status).toBe(PAYMENT_STATUS.COMPLETED);
  });

  it('grants nothing extra when the same event is replayed', async () => {
    const { payload, signature } = signedEvent(eventId);

    const res = await postWebhook(payload, signature);

    expect(res.status).toBe(200);
    expect(res.body.reason).toBe('duplicate_event');
    expect(await balance()).toBe(CREDITS);
    expect(await WalletLedger.count({ where: { user_id: userId } })).toBe(1);
  });

  it('grants nothing when a new event targets an already completed payment', async () => {
    const { payload, signature } = signedEvent(`${eventId}_other`);

    const res = await postWebhook(payload, signature);

    expect(res.status).toBe(200);
    expect(res.body.reason).toBe('already_completed');
    expect(await balance()).toBe(CREDITS);
    expect(await WalletLedger.count({ where: { user_id: userId } })).toBe(1);
  });

  it('ignores a session that is not paid', async () => {
    const { payload, signature } = signedEvent(`${eventId}_unpaid`, { payment_status: 'unpaid' });

    const res = await postWebhook(payload, signature);

    expect(res.status).toBe(200);
    expect(res.body.reason).toBe('not_paid');
    expect(await balance()).toBe(CREDITS);
  });
});
