import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCurrencies, getWallet, getLedger, createCheckout } from '../api/wallet';
import { apiError } from '../api/error';
import { formatPaise, formatDate } from '../utils/format';

export default function Wallet() {
  const [balances, setBalances] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [plans, setPlans] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const [currencyId, setCurrencyId] = useState('');
  const [mode, setMode] = useState('plan');
  const [planId, setPlanId] = useState('');
  const [quantity, setQuantity] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();

  const load = useCallback(async () => {
    try {
      const [wallet, catalogue, entries] = await Promise.all([getWallet(), getCurrencies(), getLedger()]);
      setBalances(wallet);
      setCurrencies(catalogue.currencies);
      setPlans(catalogue.plans);
      setLedger(entries);
      setCurrencyId((current) => current || String(catalogue.currencies[0]?.id || ''));
    } catch (err) {
      setError(apiError(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Returning from Stripe: credits are granted by the webhook, so we just reload.
  useEffect(() => {
    const status = searchParams.get('checkout');
    if (!status) return;

    setNotice(
      status === 'success'
        ? 'Payment received. Credits appear here once Stripe confirms the payment.'
        : 'Checkout cancelled.'
    );
    setSearchParams({}, { replace: true });
    load();
  }, [searchParams, setSearchParams, load]);

  const plansForCurrency = plans.filter((plan) => String(plan.currencyId) === String(currencyId));
  const selectedCurrency = currencies.find((c) => String(c.id) === String(currencyId));

  const handleBuy = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);

    try {
      const payload =
        mode === 'plan'
          ? { currencyId: Number(currencyId), planId: Number(planId) }
          : { currencyId: Number(currencyId), quantity: Number(quantity) };

      const { checkoutUrl } = await createCheckout(payload);
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(apiError(err));
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <h1>Wallet</h1>
      {notice && <p className="notice">{notice}</p>}
      {error && <p className="error">{error}</p>}

      <section>
        <h2>Balances</h2>
        <div className="balance-grid">
          {balances.map((balance) => (
            <div className="card balance" key={balance.currencyId}>
              <span className="muted">{balance.name}</span>
              <strong className="balance-value">{balance.balance}</strong>
              <span className="muted">credits</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Buy credits</h2>
        <form className="card row-form" onSubmit={handleBuy}>
          <label>
            Currency
            <select
              value={currencyId}
              onChange={(e) => {
                setCurrencyId(e.target.value);
                setPlanId('');
              }}
            >
              {currencies.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Buy by
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="plan">Plan</option>
              <option value="quantity">Custom quantity</option>
            </select>
          </label>

          {mode === 'plan' ? (
            <label>
              Plan
              <select value={planId} onChange={(e) => setPlanId(e.target.value)} required>
                <option value="">Select a plan</option>
                {plansForCurrency.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.credits} credits - {formatPaise(plan.pricePaise)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Credits
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </label>
          )}

          <button type="submit" disabled={busy}>
            {busy ? 'Redirecting...' : 'Buy credits'}
          </button>
        </form>
        {mode === 'quantity' && selectedCurrency && quantity > 0 && (
          <p className="muted">
            Total: {formatPaise(Number(quantity) * selectedCurrency.pricePerCreditPaise)}
          </p>
        )}
      </section>

      <section>
        <h2>Ledger</h2>
        {ledger.length === 0 ? (
          <p className="muted">No transactions yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Currency</th>
                <th>Type</th>
                <th className="right">Amount</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.createdAt)}</td>
                  <td>{entry.currencyCode}</td>
                  <td>{entry.type}</td>
                  <td className={`right ${entry.amount < 0 ? 'negative' : 'positive'}`}>
                    {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                  </td>
                  <td className="muted">
                    {entry.referenceType ? `${entry.referenceType} #${entry.referenceId}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
