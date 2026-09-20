process.env.NODE_ENV = 'test';

// Stripe values used by the webhook tests (no network calls are made).
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
