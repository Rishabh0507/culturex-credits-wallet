import request from 'supertest';
import app from '../src/app';
import { sequelize, User, Currency, WalletBalance } from '../src/models';

const email = `user_${Date.now()}@example.com`;
const password = 'password123';

afterAll(async () => {
  await User.destroy({ where: { email } });
  await sequelize.close();
});

describe('Auth', () => {
  it('signs up a user, returns a token and creates a wallet row per currency', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email, password });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user.password_hash).toBeUndefined();

    const currencyCount = await Currency.count();
    const walletCount = await WalletBalance.count({ where: { user_id: res.body.data.user.id } });
    expect(walletCount).toBe(currencyCount);
  });

  it('rejects a duplicate email', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email, password });
    expect(res.status).toBe(409);
  });

  it('rejects an invalid payload', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'nope', password: '123' });
    expect(res.status).toBe(400);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
  });

  it('rejects a wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });
});
