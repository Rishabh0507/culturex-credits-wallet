import { Router } from 'express';
import * as currencyController from '../controllers/currency.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, currencyController.list);

export default router;
