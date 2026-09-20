import { AppError } from '../utils/appError';

export interface CheckoutInput {
  currencyId: number;
  planId?: number;
  quantity?: number;
}

function positiveInt(value: unknown, field: string): number {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw new AppError(400, `${field} must be a positive integer`);
  }
  return num;
}

export function validateCheckout(body: any): CheckoutInput {
  const currencyId = positiveInt(body?.currencyId, 'currencyId');

  const hasPlan = body?.planId !== undefined && body?.planId !== null;
  const hasQuantity = body?.quantity !== undefined && body?.quantity !== null;

  if (hasPlan === hasQuantity) {
    throw new AppError(400, 'Provide either planId or quantity');
  }

  return hasPlan
    ? { currencyId, planId: positiveInt(body.planId, 'planId') }
    : { currencyId, quantity: positiveInt(body.quantity, 'quantity') };
}
