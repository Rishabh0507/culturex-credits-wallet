import { Request, Response, NextFunction } from 'express';
import * as campaignService from '../services/campaign.service';
import { validateCreateCampaign, validateCurrencyId } from '../validators/campaignValidator';
import { AppError } from '../utils/appError';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = validateCreateCampaign(req.body);
    const campaign = await campaignService.createCampaign(req.user!.userId, input);
    res.status(201).json({ success: true, data: { campaign } });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const campaigns = await campaignService.listCampaigns(req.user!.userId);
    res.json({ success: true, data: { campaigns } });
  } catch (err) {
    next(err);
  }
}

export async function fund(req: Request, res: Response, next: NextFunction) {
  try {
    const campaignId = Number(req.params.id);
    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      throw new AppError(400, 'Invalid campaign id');
    }

    const currencyId = validateCurrencyId(req.body);
    const data = await campaignService.fundCampaign(req.user!.userId, campaignId, currencyId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
