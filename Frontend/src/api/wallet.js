import client from './client';

export const getCurrencies = () => client.get('/currencies').then((res) => res.data.data);

export const getWallet = () => client.get('/wallet').then((res) => res.data.data.balances);

export const getLedger = (currencyId) =>
  client
    .get('/wallet/ledger', { params: currencyId ? { currencyId } : {} })
    .then((res) => res.data.data.entries);

export const createCheckout = (payload) =>
  client.post('/payments/checkout', payload).then((res) => res.data.data);
