import { Currency, WalletBalance, WalletLedger } from '../models';

export async function getWallet(userId: number) {
  const balances = await WalletBalance.findAll({
    where: { user_id: userId },
    include: [{ model: Currency, as: 'currency' }],
    order: [['currency_id', 'ASC']],
  });

  return balances.map((row) => {
    const currency = row.get('currency') as Currency;
    return {
      currencyId: row.currency_id,
      code: currency.code,
      name: currency.name,
      moduleKey: currency.module_key,
      balance: row.balance,
    };
  });
}

export async function getLedger(userId: number, currencyId?: number) {
  const where: Record<string, unknown> = { user_id: userId };
  if (currencyId) {
    where.currency_id = currencyId;
  }

  const entries = await WalletLedger.findAll({
    where,
    include: [{ model: Currency, as: 'currency' }],
    order: [['created_at', 'DESC'], ['id', 'DESC']],
  });

  return entries.map((entry) => {
    const currency = entry.get('currency') as Currency;
    return {
      id: entry.id,
      currencyId: entry.currency_id,
      currencyCode: currency?.code,
      type: entry.type,
      amount: entry.amount,
      referenceType: entry.reference_type,
      referenceId: entry.reference_id,
      createdAt: entry.created_at,
    };
  });
}
