# CultureX Backend — Phase 1

Node + TypeScript + Express + MySQL (Sequelize). Schema comes from migrations only (no `sequelize.sync()`).

## Setup

```bash
npm install
cp .env.example .env      # adjust DB credentials if needed
npm run db:create         # creates the database
npm run db:migrate
npm run db:seed
npm run dev               # http://localhost:5000
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start dev server (ts-node + nodemon) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Apply seeders |
| `npm run db:reset` | Undo all migrations, re-migrate, re-seed |
| `npm test` | Prepare the test DB, then run Jest + Supertest |

## APIs

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | no | Health check |
| POST | `/api/auth/signup` | no | Create user + wallet rows, return JWT |
| POST | `/api/auth/login` | no | Return JWT |
| GET | `/api/currencies` | yes | Currencies + plans |
| GET | `/api/wallet` | yes | Balance per currency |
| GET | `/api/wallet/ledger?currencyId=` | yes | Ledger entries, newest first |
| POST | `/api/payments/checkout` | yes | Create a Stripe Checkout Session (`currencyId` + `planId` **or** `quantity`) |
| POST | `/api/payments/webhook` | Stripe signature | Grants credits on verified `checkout.session.completed` |

### Stripe webhook (local)

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET
```

## Conventions

- Credits are integers; money is stored in integer **paise**.
- `wallet_ledger.amount` is signed: positive = added, negative = spent.
- A module maps to a currency through `currencies.module_key` (no hardcoded currency logic in services).
- Credits are granted **only** by a signature-verified Stripe webhook; the browser success redirect grants nothing.
- Webhook idempotency: `processed_stripe_events.stripe_event_id` is UNIQUE, inserted inside the same transaction that grants credits.

Not implemented yet: campaign spends.
