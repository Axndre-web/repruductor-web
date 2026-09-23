# NEON PLAYER X — External Real Economy / Governed Production

This release adds a server-side external-economy governor without changing the existing UI or internal modules.

## Operating model

- `GUARDED_AUTONOMY`: the system can plan registered external opportunities and maintain a durable audit trail.
- `READ_VERIFY_ONLY`: external revenue is counted only after an approved provider adapter supplies a trusted reference and explicit verification.
- Pending transactions are never counted as real revenue.
- Automatic spending, signing, withdrawals and private-key custody are disabled by policy.
- Settlement limits are enforced by the server.
- Economic state is persisted atomically under `data/external-economic.json` (override with `NEON_ECONOMIC_DATA_FILE`).

## Production environment

Authentication:

- `NEON_ADMIN_TOKEN` protects all mutation endpoints (`pause`, `resume`, opportunities, planning, settlements and costs).
- In `NODE_ENV=production`, mutation endpoints fail closed if `NEON_ADMIN_TOKEN` is not configured.

Optional limits:

- `NEON_MAX_SINGLE_SETTLEMENT_EUR` (default 1000)
- `NEON_MAX_DAILY_VERIFIED_REVENUE_EUR` (default 10000)
- `NEON_ECONOMIC_DATA_FILE`
- `HOST` / `PORT`

Do not put private keys or provider secrets in the public directory. Connect real providers through dedicated server-side adapters and verify settlement server-to-server.

## API

- `GET /api/economy/status`
- `POST /api/economy/pause`
- `POST /api/economy/resume`
- `POST /api/economy/opportunities`
- `POST /api/economy/plan`
- `POST /api/economy/settlements/pending`
- `POST /api/economy/settlements/verify`
- `POST /api/economy/costs`

These endpoints are intentionally not exposed as an unrestricted money-moving API. Authentication/authorization should be placed in front of mutation routes before exposing them to the public Internet.
