import Stripe from 'stripe';
import { UniqueConstraintError } from 'sequelize';
import {
  sequelize,
  Currency,
  CurrencyPlan,
  Payment,
  ProcessedStripeEvent,
  WalletBalance,
  WalletLedger,
} from '../models';
import { PAYMENT_STATUS } from '../models/payment';
import { stripe } from '../config/stripe';
import { env } from '../config/env';
import { AppError } from '../utils/appError';
import { CheckoutInput } from '../validators/paymentValidator';

const LEDGER_TYPE_PURCHASE = 'purchase';

/**
 * Prices and credit amounts always come from the DB - the client only says
 * which currency and which plan (or how many credits) it wants.
 */
async function resolveOrder(input: CheckoutInput) {
  const currency = await Currency.findByPk(input.currencyId);
  if (!currency) {
    throw new AppError(404, 'Currency not found');
  }

  if (input.planId) {
    const plan = await CurrencyPlan.findByPk(input.planId);
    if (!plan || plan.currency_id !== currency.id) {
      throw new AppError(404, 'Plan not found for this currency');
    }
    return { currency, credits: plan.credits, amountPaise: plan.price_paise, label: plan.name };
  }

  const quantity = input.quantity as number;
  return {
    currency,
    credits: quantity,
    amountPaise: quantity * currency.price_per_credit_paise,
    label: `${quantity} ${currency.name}`,
  };
}

export async function createCheckoutSession(userId: number, input: CheckoutInput) {
  const { currency, credits, amountPaise, label } = await resolveOrder(input);

  // Recorded as pending first, so a webhook always has a row to settle against.
  const payment = await Payment.create({
    user_id: userId,
    currency_id: currency.id,
    credits,
    amount_paise: amountPaise,
    status: PAYMENT_STATUS.PENDING,
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'inr',
          unit_amount: amountPaise,
          product_data: { name: label },
        },
      },
    ],
    metadata: {
      paymentId: String(payment.id),
      userId: String(userId),
      currencyId: String(currency.id),
      credits: String(credits),
    },
    success_url: `${env.frontendUrl}/wallet?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.frontendUrl}/wallet?checkout=cancelled`,
  });

  payment.stripe_session_id = session.id;
  await payment.save();

  return {
    paymentId: payment.id,
    sessionId: session.id,
    checkoutUrl: session.url,
    credits,
    amountPaise,
    currencyCode: currency.code,
  };
}

/** Verifies the Stripe signature against the raw body. Throws 400 when it does not match. */
export function constructWebhookEvent(rawBody: Buffer | string, signature?: string): Stripe.Event {
  if (!signature) {
    throw new AppError(400, 'Missing Stripe-Signature header');
  }
  if (!env.stripeWebhookSecret) {
    throw new AppError(500, 'STRIPE_WEBHOOK_SECRET is not configured');
  }

  try {
    return stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  } catch {
    throw new AppError(400, 'Invalid Stripe signature');
  }
}

export async function handleWebhookEvent(event: Stripe.Event) {
  if (event.type !== 'checkout.session.completed') {
    return { handled: false, reason: 'ignored_event_type' };
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Credits are only ever granted for a payment Stripe itself reports as paid.
  if (session.payment_status !== 'paid') {
    return { handled: false, reason: 'not_paid' };
  }

  return sequelize.transaction(async (t) => {
    // The UNIQUE index on stripe_event_id is the idempotency guard: a replayed
    // event fails this insert and we stop before touching any balance.
    try {
      await ProcessedStripeEvent.create(
        { stripe_event_id: event.id, type: event.type },
        { transaction: t }
      );
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        return { handled: false, reason: 'duplicate_event' };
      }
      throw err;
    }

    const payment = await Payment.findOne({
      where: { stripe_session_id: session.id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!payment) {
      return { handled: false, reason: 'payment_not_found' };
    }
    if (payment.status === PAYMENT_STATUS.COMPLETED) {
      return { handled: false, reason: 'already_completed' };
    }

    const wallet = await WalletBalance.findOne({
      where: { user_id: payment.user_id, currency_id: payment.currency_id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!wallet) {
      throw new AppError(404, 'Wallet balance row not found');
    }

    wallet.balance += payment.credits;
    await wallet.save({ transaction: t });

    await WalletLedger.create(
      {
        user_id: payment.user_id,
        currency_id: payment.currency_id,
        type: LEDGER_TYPE_PURCHASE,
        amount: payment.credits, // positive: credits added
        reference_type: 'payment',
        reference_id: String(payment.id),
      },
      { transaction: t }
    );

    payment.status = PAYMENT_STATUS.COMPLETED;
    await payment.save({ transaction: t });

    return { handled: true, paymentId: payment.id, credits: payment.credits };
  });
}
