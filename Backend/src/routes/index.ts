import { Router } from 'express';
import authRoutes from './auth.routes';
import currencyRoutes from './currency.routes';
import walletRoutes from './wallet.routes';
import paymentRoutes from './payment.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, message: 'ok' }));
router.use('/auth', authRoutes);
router.use('/currencies', currencyRoutes);
router.use('/wallet', walletRoutes);
router.use('/payments', paymentRoutes);

export default router;
