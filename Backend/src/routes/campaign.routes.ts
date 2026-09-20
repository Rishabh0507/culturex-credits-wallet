import { Router } from 'express';
import * as campaignController from '../controllers/campaign.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, campaignController.create);
router.get('/', requireAuth, campaignController.list);
router.post('/:id/fund', requireAuth, campaignController.fund);

export default router;
