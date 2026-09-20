import request from 'supertest';
import app from '../src/app';
import { sequelize, User } from '../src/models';

const email = `wallet_${Date.now()}@example.com`;
const password = 'password123';
let token = '';

beforeAll(async () => {
  const res = await request(app).post('/api/auth/signup').send({ email, password });
  token = res.body.data.token;
});

afterAll(async () => {
  await User.destroy({ where: { email } });
  await sequelize.close();
});

describe('Protected read APIs', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/wallet');
    expect(res.status).toBe(401);
  });

  it('returns the seeded currencies and plans', async () => {
    const res = await request(app).get('/api/currencies').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.currencies).toHaveLength(3);
    expect(res.body.data.plans.length).toBeGreaterThanOrEqual(6);
  });

  it('returns a zero balance for every currency', async () => {
    const res = await request(app).get('/api/wallet').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.balances).toHaveLength(3);
    expect(res.body.data.balances.every((b: { balance: number }) => b.balance === 0)).toBe(true);
  });

  it('returns an empty ledger, and accepts the currencyId filter', async () => {
    const res = await request(app).get('/api/wallet/ledger').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.entries).toEqual([]);

    const filtered = await request(app)
      .get('/api/wallet/ledger?currencyId=1')
      .set('Authorization', `Bearer ${token}`);
    expect(filtered.status).toBe(200);
    expect(filtered.body.data.entries).toEqual([]);
  });
});
