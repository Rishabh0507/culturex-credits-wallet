import request from 'supertest';
import Stripe from 'stripe';

// Session creation is mocked (no network); signature verification stays real.
jest.mock('../src/config/stripe', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const StripeLib = require('stripe');
  const real = new StripeLib('sk_test_dummy');
  let counter = 0;

  return {
    stripe: {
      webhooks: real.webhooks,
      checkout: {
        sessions: {
          create: jest.fn(async () => ({
            id: `cs_test_acceptance_${Date.now()}_${counter++}`,
            url: 'https://checkout.stripe.com/c/pay/cs_test_acceptance',
          })),
        },
      },
    },
  };
});

import app from '../src/app';
import { sequelize, User, WalletBalance, WalletLedger, ProcessedStripeEvent } from '../src/models';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;
const CAMPAIGN_CURRENCY_ID = 1;

const email = `acceptance_${Date.now()}@example.com`;
const password = 'password123';

let token = '';
let userId = 0;
const eventIds: string[] = [];

beforeAll(async () => {
  const res = await request(app).post('/api/auth/signup').send({ email, password });
  token = res.body.data.token;
  userId = res.body.data.user.id;
});

afterAll(async () => {
  await ProcessedStripeEvent.destroy({ where: { stripe_event_id: eventIds } });
  await User.destroy({ where: { id: userId } });
  await sequelize.close();
});

function auth(req: request.Test) {
  return req.set('Authorization', `Bearer ${token}`);
}

/** Delivers a signed checkout.session.completed event for the given session. */
function deliverWebhook(sessionId: string, eventId: string) {
  eventIds.push(eventId);

  const payload = JSON.stringify({
    id: eventId,
    type: 'checkout.session.completed',
    data: { object: { object: 'checkout.session', id: sessionId, payment_status: 'paid' } },
  });

  return request(app)
    .post('/api/payments/webhook')
    .set('Content-Type', 'application/json')
    .set('Stripe-Signature', Stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET }))
    .send(payload);
}

/** The core invariant: every balance equals the sum of that currency's ledger entries. */
async function assertBalancesMatchLedger() {
  const balances = await WalletBalance.findAll({ where: { user_id: userId } });
  expect(balances.length).toBeGreaterThan(0);

  for (const row of balances) {
    const entries = await WalletLedger.findAll({
      where: { user_id: userId, currency_id: row.currency_id },
    });
    const summed = entries.reduce((total, entry) => total + entry.amount, 0);

    expect(row.balance).toBe(summed);
    expect(row.balance).toBeGreaterThanOrEqual(0);
  }
}

describe('Acceptance: purchase -> webhook -> campaign funding', () => {
  it('keeps every balance equal to the sum of its ledger entries across the full lifecycle', async () => {
    // 1. A fresh user starts at zero, with no ledger history.
    await assertBalancesMatchLedger();
    expect(await WalletLedger.count({ where: { user_id: userId } })).toBe(0);

    // 2. Creating a checkout session grants nothing: only the webhook can credit.
    const checkout = await auth(
      request(app).post('/api/payments/checkout')
    ).send({ currencyId: CAMPAIGN_CURRENCY_ID, quantity: 200 });

    expect(checkout.status).toBe(201);
    const sessionId = checkout.body.data.sessionId;

    const afterRedirect = await auth(request(app).get('/api/wallet'));
    const campaignBalance = afterRedirect.body.data.balances.find(
      (b: { currencyId: number }) => b.currencyId === CAMPAIGN_CURRENCY_ID
    );
    expect(campaignBalance.balance).toBe(0);
    await assertBalancesMatchLedger();

    // 3. The verified webhook grants the credits.
    const granted = await deliverWebhook(sessionId, `evt_acceptance_${Date.now()}`);
    expect(granted.body.handled).toBe(true);
    await assertBalancesMatchLedger();

    // 4. Funding a campaign spends them.
    const campaign = await auth(request(app).post('/api/campaigns')).send({
      name: 'Acceptance campaign',
      requiredCredits: 120,
    });
    const funded = await auth(
      request(app).post(`/api/campaigns/${campaign.body.data.campaign.id}/fund`)
    ).send({ currencyId: CAMPAIGN_CURRENCY_ID });

    expect(funded.status).toBe(200);
    expect(funded.body.data.balance).toBe(80); // 200 purchased - 120 spent
    await assertBalancesMatchLedger();

    // 5. A replayed webhook must not disturb the invariant.
    const replay = await deliverWebhook(sessionId, eventIds[0]);
    expect(replay.body.reason).toBe('duplicate_event');
    await assertBalancesMatchLedger();

    const finalWallet = await auth(request(app).get('/api/wallet'));
    expect(
      finalWallet.body.data.balances.find(
        (b: { currencyId: number }) => b.currencyId === CAMPAIGN_CURRENCY_ID
      ).balance
    ).toBe(80);
  });
});
