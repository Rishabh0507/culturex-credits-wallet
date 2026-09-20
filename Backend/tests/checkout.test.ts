import request from 'supertest';

// Stripe is mocked so checkout can be tested without any network call.
jest.mock('../src/config/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: jest.fn(async () => ({
          id: `cs_test_mock_${Date.now()}`,
          url: 'https://checkout.stripe.com/c/pay/cs_test_mock',
        })),
      },
    },
  },
}));

import app from '../src/app';
import { stripe } from '../src/config/stripe';
import { sequelize, User, Payment, CurrencyPlan } from '../src/models';
import { PAYMENT_STATUS } from '../src/models/payment';

const email = `checkout_${Date.now()}@example.com`;
const password = 'password123';

let token = '';
let userId = 0;

beforeAll(async () => {
  const res = await request(app).post('/api/auth/signup').send({ email, password });
  token = res.body.data.token;
  userId = res.body.data.user.id;
});

afterAll(async () => {
  await User.destroy({ where: { id: userId } });
  await sequelize.close();
});

describe('POST /api/payments/checkout', () => {
  it('prices a plan from the DB and ignores client-supplied credits/amount', async () => {
    const plan = (await CurrencyPlan.findOne({ where: { currency_id: 1 } }))!;

    const res = await request(app)
      .post('/api/payments/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ currencyId: 1, planId: plan.id, credits: 999999, amountPaise: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.credits).toBe(plan.credits);
    expect(res.body.data.amountPaise).toBe(plan.price_paise);
    expect(res.body.data.checkoutUrl).toContain('checkout.stripe.com');

    const payment = (await Payment.findByPk(res.body.data.paymentId))!;
    expect(payment.credits).toBe(plan.credits);
    expect(payment.amount_paise).toBe(plan.price_paise);
    expect(payment.status).toBe(PAYMENT_STATUS.PENDING);
    expect(payment.stripe_session_id).toBe(res.body.data.sessionId);
  });

  it('prices a quantity order from the currency rate', async () => {
    const res = await request(app)
      .post('/api/payments/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ currencyId: 2, quantity: 7 });

    // REPORT_CREDITS is seeded at 1000 paise per credit.
    expect(res.status).toBe(201);
    expect(res.body.data.credits).toBe(7);
    expect(res.body.data.amountPaise).toBe(7000);
    expect(stripe.checkout.sessions.create).toHaveBeenCalled();
  });

  it('returns 404 for a plan that belongs to another currency', async () => {
    const plan = (await CurrencyPlan.findOne({ where: { currency_id: 1 } }))!;

    const res = await request(app)
      .post('/api/payments/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ currencyId: 2, planId: plan.id });

    expect(res.status).toBe(404);
  });
});
