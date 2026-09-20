import { Currency, CurrencyPlan } from '../models';

export async function listCurrenciesWithPlans() {
  const currencies = await Currency.findAll({ order: [['id', 'ASC']] });
  const plans = await CurrencyPlan.findAll({ order: [['currency_id', 'ASC'], ['credits', 'ASC']] });

  return {
    currencies: currencies.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      moduleKey: c.module_key,
      pricePerCreditPaise: c.price_per_credit_paise,
    })),
    plans: plans.map((p) => ({
      id: p.id,
      currencyId: p.currency_id,
      name: p.name,
      credits: p.credits,
      pricePaise: p.price_paise,
    })),
  };
}
