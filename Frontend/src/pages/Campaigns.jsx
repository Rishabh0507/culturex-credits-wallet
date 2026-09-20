import { useCallback, useEffect, useState } from 'react';
import { listCampaigns, createCampaign, fundCampaign } from '../api/campaigns';
import { getCurrencies, getWallet } from '../api/wallet';
import { apiError } from '../api/error';
import { formatDate } from '../utils/format';

const CAMPAIGNS_MODULE_KEY = 'campaigns';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [campaignCurrency, setCampaignCurrency] = useState(null);
  const [balance, setBalance] = useState(null);
  const [name, setName] = useState('');
  const [requiredCredits, setRequiredCredits] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, catalogue, wallet] = await Promise.all([listCampaigns(), getCurrencies(), getWallet()]);
      // Campaigns are funded with whichever currency the API maps to the campaigns module.
      const currency = catalogue.currencies.find((c) => c.moduleKey === CAMPAIGNS_MODULE_KEY);
      setCampaigns(list);
      setCampaignCurrency(currency || null);
      setBalance(wallet.find((b) => b.currencyId === currency?.id)?.balance ?? null);
    } catch (err) {
      setError(apiError(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setCreating(true);

    try {
      await createCampaign(name.trim(), Number(requiredCredits));
      setName('');
      setRequiredCredits('');
      setNotice('Campaign created.');
      await load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setCreating(false);
    }
  };

  const handleFund = async (campaign) => {
    setError('');
    setNotice('');
    setBusyId(campaign.id);

    try {
      const result = await fundCampaign(campaign.id, campaignCurrency.id);
      setNotice(`Funded "${campaign.name}" with ${campaign.requiredCredits} credits.`);
      setBalance(result.balance);
      await load();
    } catch (err) {
      setError(apiError(err));
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <h1>Campaigns</h1>
      {campaignCurrency && (
        <p className="muted">
          Funded with {campaignCurrency.name} - balance: <strong>{balance ?? '-'}</strong>
        </p>
      )}
      {notice && <p className="notice">{notice}</p>}
      {error && <p className="error">{error}</p>}

      <section>
        <h2>New campaign</h2>
        <form className="card row-form" onSubmit={handleCreate}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Required credits
            <input
              type="number"
              min="1"
              step="1"
              value={requiredCredits}
              onChange={(e) => setRequiredCredits(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create campaign'}
          </button>
        </form>
      </section>

      <section>
        <h2>Your campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="muted">No campaigns yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th className="right">Required credits</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td>{campaign.name}</td>
                  <td className="right">{campaign.requiredCredits}</td>
                  <td>
                    {campaign.funded ? (
                      <span className="positive">Funded {formatDate(campaign.fundedAt)}</span>
                    ) : (
                      <span className="muted">Not funded</span>
                    )}
                  </td>
                  <td>
                    {!campaign.funded && (
                      <button
                        type="button"
                        onClick={() => handleFund(campaign)}
                        disabled={busyId === campaign.id || !campaignCurrency}
                      >
                        {busyId === campaign.id ? 'Funding...' : 'Fund'}
                      </button>
                    )}
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
