import { Request, Response, NextFunction } from 'express';
import * as walletService from '../services/wallet.service';
import { AppError } from '../utils/appError';

export async function getWallet(req: Request, res: Response, next: NextFunction) {
  try {
    const balances = await walletService.getWallet(req.user!.userId);
    res.json({ success: true, data: { balances } });
  } catch (err) {
    next(err);
  }
}

export async function getLedger(req: Request, res: Response, next: NextFunction) {
  try {
    let currencyId: number | undefined;

    if (req.query.currencyId !== undefined) {
      currencyId = Number(req.query.currencyId);
      if (!Number.isInteger(currencyId) || currencyId <= 0) {
        throw new AppError(400, 'currencyId must be a positive integer');
      }
    }

    const entries = await walletService.getLedger(req.user!.userId, currencyId);
    res.json({ success: true, data: { entries } });
  } catch (err) {
    next(err);
  }
}
