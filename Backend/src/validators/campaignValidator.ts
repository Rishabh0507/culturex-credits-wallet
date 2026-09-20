import { AppError } from '../utils/appError';

export interface CreateCampaignInput {
  name: string;
  requiredCredits: number;
}

export function validateCreateCampaign(body: any): CreateCampaignInput {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const requiredCredits = Number(body?.requiredCredits);

  if (!name) {
    throw new AppError(400, 'name is required');
  }
  if (!Number.isInteger(requiredCredits) || requiredCredits <= 0) {
    throw new AppError(400, 'requiredCredits must be a positive integer');
  }

  return { name, requiredCredits };
}

export function validateCurrencyId(body: any): number {
  const currencyId = Number(body?.currencyId);
  if (!Number.isInteger(currencyId) || currencyId <= 0) {
    throw new AppError(400, 'currencyId must be a positive integer');
  }
  return currencyId;
}
