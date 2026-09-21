# CultureX Assignment — Multi-Currency Credit Wallet

A wallet where a user buys module-specific credits (Campaign / Report / Discovery) through
Stripe Checkout and spends Campaign Credits to fund campaigns. Every balance change is
recorded in an append-only ledger, credits are granted only by a signature-verified Stripe
webhook, and campaign funding is transactional and safe under concurrency.

## Tech stack

| Layer | Stack |
| --- | --- |
| Backend | Node.js, TypeScript, Express, Sequelize (migrations + seeders), MySQL |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Payments | Stripe Checkout + webhooks |
| Tests | Jest + Supertest |
| Frontend | React + Vite, React Router, Axios, plain CSS |

The DB schema comes only from migrations — `sequelize.sync()` is never used. Money is stored
as integer **paise** and credits as plain integers; no floats anywhere.

## Folder structure

```
culturex-assignment/
├─ Backend/
│  ├─ migrations/           # schema (users, currencies, plans, wallet, payments, campaigns)
│  ├─ seeders/              # 3 currencies + 6 plans
│  ├─ src/
│  │  ├─ config/            # env, sequelize connection, stripe client
│  │  ├─ models/            # Sequelize models + associations
│  │  ├─ services/          # business logic (auth, wallet, payment, campaign)
│  │  ├─ controllers/       # request/response handling
│  │  ├─ routes/            # express routers
│  │  ├─ middleware/        # JWT auth, centralized error handler
│  │  ├─ validators/        # request validation
│  │  ├─ app.ts / server.ts
│  └─ tests/                # Jest + Supertest suites
└─ Frontend/
   └─ src/
      ├─ api/               # axios client + endpoint wrappers
      ├─ context/           # auth state
      ├─ routes/            # router + protected route
      ├─ components/        # Nav, AuthForm
      └─ pages/             # Signup, Login, Wallet, Campaigns
```

## Prerequisites

- Node.js 18+ (developed on Node 24)
- MySQL 8 running locally on port 3306
- A Stripe **test mode** account and the Stripe CLI (for webhooks)

## MySQL setup

The app connects with the credentials in `Backend/.env`. You do not need to create the
database by hand — `npm run db:create` does it:

```sql
-- optional, only if you prefer creating it manually
CREATE DATABASE culturex_assignment;
```

## Environment variables

Copy the examples and fill in the Stripe values:

```bash
cd Backend && cp .env.example .env
cd ../Frontend && cp .env.example .env
```

`Backend/.env`

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | API port |
| `DB_HOST` / `DB_PORT` | `localhost` / `3306` | MySQL connection |
| `DB_NAME` | `culturex_assignment` | Main database |
| `DB_USER` / `DB_PASSWORD` | `root` / _(empty)_ | MySQL credentials |
| `DB_NAME_TEST` | `culturex_assignment_test` | Database used by `npm test` |
| `JWT_SECRET` | `development_secret_change_me` | JWT signing secret |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `STRIPE_SECRET_KEY` | _(empty)_ | Stripe test secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | _(empty)_ | Webhook signing secret (`whsec_...`) |
| `FRONTEND_URL` | `http://localhost:5173` | Used for Stripe success/cancel URLs |

`Frontend/.env`

| Variable | Default |
| --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:5000/api` |

Real `.env` files are git-ignored; only `.env.example` is committed.

## Install

```bash
cd Backend  && npm install
cd ../Frontend && npm install
```

## Migrations and seeders

```bash
cd Backend
npm run db:create     # create the database
npm run db:migrate    # apply all migrations
npm run db:seed       # seed 3 currencies + 6 plans
```

Useful extras: `npm run db:reset` (undo seeds → undo migrations → migrate → seed),
`npm run db:migrate:undo`, `npm run db:seed:undo`.

## Run

```bash
# terminal 1 - API on http://localhost:5000
cd Backend && npm run dev

# terminal 2 - UI on http://localhost:5173
cd Frontend && npm run dev
```

Production build: `npm run build` then `npm start` (backend), `npm run build` (frontend).

## Stripe test-mode setup

1. In the Stripe Dashboard (test mode) copy your secret key into `STRIPE_SECRET_KEY`.
2. Forward webhooks to the local API:

   ```bash
   stripe listen --forward-to localhost:5000/api/payments/webhook
   ```

3. Copy the `whsec_...` secret the CLI prints into `STRIPE_WEBHOOK_SECRET` and restart the backend.
4. Pay with the Stripe test card:

   ```
   4242 4242 4242 4242   any future expiry   any CVC   any postcode
   ```

Keep `stripe listen` running: credits are granted **only** when the webhook arrives, never by
the browser redirect back to the app.

## End-to-end walkthrough

1. **Sign up** at <http://localhost:5173/signup>. The signup transaction also creates one
   wallet row per currency, all starting at 0.
2. **Buy credits** on the Wallet page: pick a currency, then either a plan or a custom
   quantity, and press *Buy credits*. Pricing is recalculated server-side from the DB.
3. You are redirected to Stripe Checkout — pay with `4242 4242 4242 4242`.
4. Stripe redirects you back to the Wallet page and, separately, delivers
   `checkout.session.completed` to the webhook. The **webhook** credits the wallet and writes a
   positive `purchase` ledger entry. Reload the wallet to see the new balance.
5. **Fund a campaign**: go to Campaigns, create one with a required-credits amount, then press
   *Fund*. Campaign Credits are debited, a negative `campaign_funding` ledger entry is written
   and the campaign is marked funded. Report/Discovery credits are rejected for campaigns, and
   funding with an insufficient balance fails without changing anything.

## API summary

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/signup` · `/api/auth/login` | public |
| GET | `/api/currencies` | JWT |
| GET | `/api/wallet` · `/api/wallet/ledger?currencyId=` | JWT |
| POST | `/api/payments/checkout` | JWT |
| POST | `/api/payments/webhook` | Stripe signature |
| POST | `/api/campaigns` · `GET /api/campaigns` · `POST /api/campaigns/:id/fund` | JWT |

## Tests

```bash
cd Backend && npm test        # creates/migrates/seeds the test DB, then runs Jest
cd Frontend && npm run build  # frontend has no test suite; build + lint are the check
cd Frontend && npm run lint
```

Tests run against `DB_NAME_TEST` (`culturex_assignment_test`), never the development database,
and make no real Stripe network calls.

See [DESIGN.md](DESIGN.md) for the schema, transaction boundaries and idempotency design.
