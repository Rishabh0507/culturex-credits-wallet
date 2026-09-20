import client from './client';

export const listCampaigns = () => client.get('/campaigns').then((res) => res.data.data.campaigns);

export const createCampaign = (name, requiredCredits) =>
  client.post('/campaigns', { name, requiredCredits }).then((res) => res.data.data.campaign);

export const fundCampaign = (id, currencyId) =>
  client.post(`/campaigns/${id}/fund`, { currencyId }).then((res) => res.data.data);
