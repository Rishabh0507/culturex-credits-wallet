import { sequelize, Campaign, Currency, WalletBalance, WalletLedger } from '../models';
import { AppError } from '../utils/appError';
import { CreateCampaignInput } from '../validators/campaignValidator';

const LEDGER_TYPE_CAMPAIGN_FUNDING = 'campaign_funding';
const CAMPAIGNS_MODULE_KEY = 'campaigns';

function serialize(campaign: Campaign) {
  return {
    id: campaign.id,
    name: campaign.name,
    requiredCredits: campaign.required_credits,
    funded: campaign.funded,
    fundedAt: campaign.funded_at,
    createdAt: campaign.created_at,
  };
}

export async function createCampaign(userId: number, input: CreateCampaignInput) {
  const campaign = await Campaign.create({
    user_id: userId,
    name: input.name,
    required_credits: input.requiredCredits,
  });

  return serialize(campaign);
}

export async function listCampaigns(userId: number) {
  const campaigns = await Campaign.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC'], ['id', 'DESC']],
  });

  return campaigns.map(serialize);
}

export async function fundCampaign(userId: number, campaignId: number, currencyId: number) {
  // The currency -> module mapping lives in the DB, not in this service.
  const currency = await Currency.findByPk(currencyId);
  if (!currency) {
    throw new AppError(404, 'Currency not found');
  }
  if (currency.module_key !== CAMPAIGNS_MODULE_KEY) {
    throw new AppError(400, `${currency.name} cannot be used to fund campaigns`);
  }

  return sequelize.transaction(async (t) => {
    // Lock the campaign first, then the wallet row: a consistent order avoids deadlocks.
    const campaign = await Campaign.findOne({
      where: { id: campaignId, user_id: userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!campaign) {
      throw new AppError(404, 'Campaign not found');
    }

    const wallet = await WalletBalance.findOne({
      where: { user_id: userId, currency_id: currency.id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!wallet) {
      throw new AppError(404, 'Wallet balance not found for this currency');
    }

    // Re-checked after the locks are held, so a concurrent request cannot
    // fund twice or push the balance negative.
    if (campaign.funded) {
      throw new AppError(409, 'Campaign is already funded');
    }
    if (wallet.balance < campaign.required_credits) {
      throw new AppError(
        400,
        `Insufficient balance: ${campaign.required_credits} credits required, ${wallet.balance} available`
      );
    }

    wallet.balance -= campaign.required_credits;
    await wallet.save({ transaction: t });

    await WalletLedger.create(
      {
        user_id: userId,
        currency_id: currency.id,
        type: LEDGER_TYPE_CAMPAIGN_FUNDING,
        amount: -campaign.required_credits, // negative: credits spent
        reference_type: 'campaign',
        reference_id: String(campaign.id),
      },
      { transaction: t }
    );

    campaign.funded = true;
    campaign.funded_at = new Date();
    await campaign.save({ transaction: t });

    return { campaign: serialize(campaign), balance: wallet.balance };
  });
}
