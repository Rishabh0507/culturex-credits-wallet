import { Router } from 'express';
import * as walletController from '../controllers/wallet.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, walletController.getWallet);
router.get('/ledger', requireAuth, walletController.getLedger);

export default router;
