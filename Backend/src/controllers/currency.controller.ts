import { Request, Response, NextFunction } from 'express';
import * as currencyService from '../services/currency.service';

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await currencyService.listCurrenciesWithPlans();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
