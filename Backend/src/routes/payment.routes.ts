import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/checkout', requireAuth, paymentController.checkout);
// Not JWT-protected: authenticity comes from the Stripe signature.
router.post('/webhook', paymentController.webhook);

export default router;
