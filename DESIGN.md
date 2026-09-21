# Design Notes

## Schema

```
users                         currencies                        currency_plans
─────────────                 ───────────────────────           ────────────────────
id                            id                                id
email          UNIQUE         code            UNIQUE            currency_id ──► currencies.id
password_hash                 name                              name
timestamps                    module_key                        credits      (int)
     │                        price_per_credit_paise (int)      price_paise  (int)
     │                        timestamps                        timestamps
     │                             │
     │   ┌─────────────────────────┴─────────────────────────┐
     │   │                                                   │
     ▼   ▼                                                   ▼
wallet_balances                      wallet_ledger                    payments
──────────────────────────           ────────────────────────         ───────────────────────────
id                                   id                               id
user_id     ──► users.id             user_id     ──► users.id         user_id     ──► users.id
currency_id ──► currencies.id        currency_id ──► currencies.id    currency_id ──► currencies.id
balance     (int, >= 0)              type        ('purchase' |        credits      (int)
timestamps                                        'campaign_funding') amount_paise (int)
UNIQUE (user_id, currency_id)        amount      (signed int)         stripe_session_id UNIQUE
                                     reference_type  (nullable)       status ('pending'|'completed')
campaigns                            reference_id    (nullable)       timestamps
──────────────────────               timestamps
id                                   INDEX (user_id, currency_id, created_at)
user_id ──► users.id
name                                 processed_stripe_events
required_credits (int)               ────────────────────────
funded (bool)                        id
funded_at (nullable)                 stripe_event_id UNIQUE
timestamps                           type
                                     timestamps
```

A signup creates the user **and** one `wallet_balances` row per currency in a single transaction,
so every user always has a row to lock later.

## Currency ↔ module binding

Modules are not hardcoded in services. Each currency carries a `module_key`
(`campaigns`, `reports`, `discovery`), and a spend path checks the currency it was handed:

```ts
if (currency.module_key !== 'campaigns') throw new AppError(400, `${currency.name} cannot be used to fund campaigns`);
```

Adding a fourth currency is a seeder row, not a code change. The frontend resolves the funding
currency the same way — by looking for `moduleKey === 'campaigns'` in `GET /api/currencies`
rather than assuming an id.

## Ledger / balance invariant

`wallet_ledger` is append-only and signed: **positive = credits added, negative = credits spent**.
The invariant the system maintains is:

> for every (user, currency): `wallet_balances.balance` == SUM(`wallet_ledger.amount`)

Only two code paths change a balance — the Stripe webhook (`+credits`) and campaign funding
(`-required_credits`) — and each writes its ledger row inside the same transaction that moves
the balance, so the two can never drift. `tests/acceptance.test.ts` asserts this invariant
across a full purchase → funding → replayed-webhook lifecycle.

Keeping a stored balance (rather than summing the ledger on read) keeps reads cheap and lets a
single locked row serialize concurrent spends.

## Stripe purchase flow

```
Browser            API                         Stripe
  │ POST /payments/checkout (currencyId + planId | quantity)
  │──────────────►│ price/credits re-read from DB (client input never trusted)
  │               │ INSERT payments (status='pending')
  │               │──────────── create Checkout Session ───────────►│
  │               │◄─────────── session id + url ───────────────────│
  │               │ UPDATE payments SET stripe_session_id
  │◄── checkoutUrl │
  │───────── redirect to Stripe Checkout, pay 4242… ───────────────►│
  │◄── success_url (frontend only: GRANTS NOTHING) ─────────────────│
                  │◄────── POST /payments/webhook (signed) ─────────│
                  │ verify signature → grant credits in ONE tx
```

The success redirect only reloads the wallet. Credits exist solely as the outcome of a
signature-verified `checkout.session.completed` whose `payment_status === 'paid'`.

## Idempotency — exact constraints

| Guard | Column / constraint | Protects against |
| --- | --- | --- |
| `processed_stripe_events.stripe_event_id` | UNIQUE | the same Stripe event delivered twice |
| `payments.stripe_session_id` | UNIQUE | two payment rows for one checkout session |
| `payments.status` | re-checked as `!= 'completed'` under `FOR UPDATE` | a *different* event id settling an already-paid session |
| `wallet_balances (user_id, currency_id)` | UNIQUE | duplicate wallet rows per user/currency |
| `campaigns.funded` | re-checked under `FOR UPDATE` | funding one campaign twice |

## Transaction boundaries and row locks

**Webhook (`handleWebhookEvent`)** — signature verified *before* any DB access; one transaction:

1. `INSERT processed_stripe_events` — a duplicate event id violates UNIQUE, is caught, and the
   handler returns `duplicate_event` before touching a balance.
2. `SELECT payments … FOR UPDATE` → must exist and not already be `completed`.
3. `SELECT wallet_balances … FOR UPDATE` → `balance += credits`.
4. `INSERT wallet_ledger` (positive, `reference_type='payment'`).
5. `UPDATE payments SET status='completed'` → commit.

**Campaign funding (`fundCampaign`)** — `module_key` checked first, then one transaction:

1. `SELECT campaigns … FOR UPDATE` (campaign first, always this order → no deadlocks).
2. `SELECT wallet_balances … FOR UPDATE`.
3. Re-check *after* both locks: `funded === false` and `balance >= required_credits`.
4. `balance -= required_credits`, `INSERT wallet_ledger` (negative, `reference_type='campaign'`),
   `UPDATE campaigns SET funded=1, funded_at=NOW()` → commit.

Any rejection throws before step 4, so a failed fund writes nothing at all.

## Failure modes

- **Duplicate / replayed webhook** — second delivery fails the UNIQUE insert → `duplicate_event`,
  no balance change. A different event id for the same session is stopped by the
  `status === 'completed'` re-check.
- **Invalid signature** — `constructEvent` throws, the request 400s before any query runs.
- **Unpaid / non-checkout events** — ignored; only `checkout.session.completed` with
  `payment_status === 'paid'` grants credits.
- **Out-of-order delivery** — the webhook settles by `stripe_session_id`, not by arrival order;
  a webhook arriving before the browser returns is fine, and the redirect is purely cosmetic.
- **Concurrent funding** — the second request blocks on the campaign row lock, then re-reads the
  committed state and sees `funded = true` (409) or an insufficient balance (400). Verified by
  tests that fire three parallel funds at one campaign, and two parallel funds with only enough
  balance for one.
- **Insufficient balance** — checked under the lock, so a balance can never go negative.

## What I would improve with more time

- Enforce non-negative balances in the schema too (`balance` UNSIGNED or a CHECK constraint), so
  the DB backs up the application guard rather than the service being the only line of defence.
- Handle more Stripe lifecycle events (`checkout.session.expired`, `payment_intent.payment_failed`)
  to mark abandoned payments instead of leaving them `pending` forever, plus a reconciliation job
  that compares `payments` against Stripe.
- Ledger pagination and a payment-history endpoint — fine at assignment scale, needed in reality.
- Frontend tests (none today) and refresh-token handling; the JWT currently lives in
  `localStorage` and expires after 7 days with no refresh path.
- A generic `spendCredits(userId, moduleKey, amount, reference)` service so Report/Discovery
  spending reuses the campaign funding logic instead of copying it.
