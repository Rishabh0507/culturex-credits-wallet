import Stripe from 'stripe';
import { env } from './env';

if (!env.stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY is not set - checkout calls to Stripe will fail.');
}

// A placeholder key keeps the app bootable (and testable) without Stripe credentials.
export const stripe = new Stripe(env.stripeSecretKey || 'sk_test_placeholder');
