import request from 'supertest';
import app from '../src/app';
import { sequelize, User, Campaign, WalletBalance, WalletLedger } from '../src/models';

const CAMPAIGN_CURRENCY_ID = 1; // CAMPAIGN_CREDITS
const REPORT_CURRENCY_ID = 2; // REPORT_CREDITS

const email = `campaign_${Date.now()}@example.com`;
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

/** Credits are normally granted by the Stripe webhook; tests set the balance directly. */
async function setBalance(balance: number) {
  await WalletBalance.update(
    { balance },
    { where: { user_id: userId, currency_id: CAMPAIGN_CURRENCY_ID } }
  );
}

async function getBalance() {
  const row = await WalletBalance.findOne({
    where: { user_id: userId, currency_id: CAMPAIGN_CURRENCY_ID },
  });
  return row!.balance;
}

async function createCampaign(name: string, requiredCredits: number) {
  const res = await request(app)
    .post('/api/campaigns')
    .set('Authorization', `Bearer ${token}`)
    .send({ name, requiredCredits });

  expect(res.status).toBe(201);
  return res.body.data.campaign.id as number;
}

function fund(campaignId: number, currencyId = CAMPAIGN_CURRENCY_ID) {
  return request(app)
    .post(`/api/campaigns/${campaignId}/fund`)
    .set('Authorization', `Bearer ${token}`)
    .send({ currencyId });
}

describe('Campaign auth', () => {
  it('rejects unauthenticated access to every campaign endpoint', async () => {
    expect((await request(app).get('/api/campaigns')).status).toBe(401);
    expect((await request(app).post('/api/campaigns').send({ name: 'x', requiredCredits: 1 })).status).toBe(401);
    expect((await request(app).post('/api/campaigns/1/fund').send({ currencyId: 1 })).status).toBe(401);
  });

  it('does not expose or fund another user\'s campaign', async () => {
    const otherEmail = `other_${Date.now()}@example.com`;
    const other = await request(app).post('/api/auth/signup').send({ email: otherEmail, password });
    const otherId = other.body.data.user.id;
    const campaignId = await createCampaign('Mine', 10);

    const list = await request(app).get('/api/campaigns').set('Authorization', `Bearer ${other.body.data.token}`);
    expect(list.body.data.campaigns).toHaveLength(0);

    const res = await request(app)
      .post(`/api/campaigns/${campaignId}/fund`)
      .set('Authorization', `Bearer ${other.body.data.token}`)
      .send({ currencyId: CAMPAIGN_CURRENCY_ID });
    expect(res.status).toBe(404);

    await User.destroy({ where: { id: otherId } });
  });
});

describe('POST /api/campaigns/:id/fund', () => {
  it('funds a campaign and writes a negative ledger entry', async () => {
    await setBalance(500);
    const campaignId = await createCampaign('Funded campaign', 100);

    const res = await fund(campaignId);

    expect(res.status).toBe(200);
    expect(res.body.data.campaign.funded).toBe(true);
    expect(res.body.data.campaign.fundedAt).toBeTruthy();
    expect(res.body.data.balance).toBe(400);
    expect(await getBalance()).toBe(400);

    const entry = await WalletLedger.findOne({
      where: { user_id: userId, reference_type: 'campaign', reference_id: String(campaignId) },
    });
    expect(entry!.amount).toBe(-100);
    expect(entry!.type).toBe('campaign_funding');
    expect(entry!.currency_id).toBe(CAMPAIGN_CURRENCY_ID);
  });

  it('rejects a currency whose module_key is not "campaigns"', async () => {
    await setBalance(500);
    const campaignId = await createCampaign('Wrong currency', 100);

    const res = await fund(campaignId, REPORT_CURRENCY_ID);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot be used to fund campaigns/i);
    expect(await getBalance()).toBe(500);
    expect((await Campaign.findByPk(campaignId))!.funded).toBe(false);
  });

  it('leaves wallet, ledger and campaign unchanged when the balance is insufficient', async () => {
    await setBalance(50);
    const campaignId = await createCampaign('Too expensive', 100);
    const ledgerBefore = await WalletLedger.count({ where: { user_id: userId } });

    const res = await fund(campaignId);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/insufficient balance/i);
    expect(await getBalance()).toBe(50);
    expect(await WalletLedger.count({ where: { user_id: userId } })).toBe(ledgerBefore);
    expect((await Campaign.findByPk(campaignId))!.funded).toBe(false);
  });

  it('cannot fund the same campaign twice', async () => {
    await setBalance(300);
    const campaignId = await createCampaign('Once only', 100);

    expect((await fund(campaignId)).status).toBe(200);
    const second = await fund(campaignId);

    expect(second.status).toBe(409);
    expect(await getBalance()).toBe(200);
    expect(
      await WalletLedger.count({ where: { user_id: userId, reference_type: 'campaign', reference_id: String(campaignId) } })
    ).toBe(1);
  });

  it('spends only once when the same campaign is funded concurrently', async () => {
    await setBalance(300);
    const campaignId = await createCampaign('Concurrent same', 100);

    const results = await Promise.all([fund(campaignId), fund(campaignId), fund(campaignId)]);
    const statuses = results.map((r) => r.status).sort();

    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(await getBalance()).toBe(200);
    expect(
      await WalletLedger.count({ where: { user_id: userId, reference_type: 'campaign', reference_id: String(campaignId) } })
    ).toBe(1);
  });

  it('cannot overspend when different campaigns are funded concurrently', async () => {
    await setBalance(150); // enough for exactly one of the two
    const first = await createCampaign('Concurrent A', 100);
    const second = await createCampaign('Concurrent B', 100);

    const results = await Promise.all([fund(first), fund(second)]);
    const succeeded = results.filter((r) => r.status === 200);

    expect(succeeded).toHaveLength(1);
    expect(await getBalance()).toBe(50);

    const fundedCount = await Campaign.count({ where: { id: [first, second], funded: true } });
    expect(fundedCount).toBe(1);
  });
});
