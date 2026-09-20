import { Request, Response, NextFunction } from 'express';
import * as paymentService from '../services/payment.service';
import { validateCheckout } from '../validators/paymentValidator';

export async function checkout(req: Request, res: Response, next: NextFunction) {
  try {
    const input = validateCheckout(req.body);
    const data = await paymentService.createCheckoutSession(req.user!.userId, input);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function webhook(req: Request, res: Response, next: NextFunction) {
  try {
    // req.body is a raw Buffer here (see the express.raw mount in app.ts).
    const event = paymentService.constructWebhookEvent(
      req.body as Buffer,
      req.headers['stripe-signature'] as string | undefined
    );

    const result = await paymentService.handleWebhookEvent(event);
    res.json({ received: true, ...result });
  } catch (err) {
    next(err);
  }
}
