# AGENTS.md

## Quick Start

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:migrate
node scripts/seed-v2.js   # optional seed data
npm start                  # http://localhost:8181
npm run start:test         # test env (uses NODE_ENV=test)
```

## Commands

| Command | What it does |
|---|---|
| `npm start` | Dev server with nodemon (NODE_ENV=development) |
| `npm run test` | Full Jest suite with coverage |
| `npm run test:unit` | Unit-only: `test/db test/lib test/middleware` |
| `npm run lint` | ESLint (airbnb-base + prettier) |
| `npm run db:migrate` | Sequelize migrations |
| `npm run db:undo` | Undo last migration |
| `node scripts/seed-v2.js` | Seed DB (users, foundations, animals) |

## Test DB (required for test:unit and full test)

Tests hit a real Postgres database. Set these env vars before running:

```bash
export DATABASE_URL='postgresql://leopet:leopet@localhost:5432/leopet_dev'
export DB_SSL='false'
export NODE_ENV='test'
```

Docker Compose runs Postgres on port 5432 with `leopet`/`leopet`/`leopet_dev`.

The `test/lib/solicitud-fundacion.spec.js` integration test creates and cleans up
rows (solicitudes, fundaciones, usuarios) in these tables. Ensure migrations have run.

## Docker

```bash
docker compose up -d --build app     # full rebuild + start
docker compose up -d postgres        # Postgres only
docker compose up -d --build         # all services
```

- `leopet-app` on port 8181 (production build, `npm ci --omit=dev`)
- `leopet-postgres` on port 5432 (`leopet_dev`/`leopet`/`leopet`)
- App healthcheck: `GET /api/health`
- API docs: `http://localhost:8181/api-docs` (Scalar/OpenAPI)

## Non-Obvious Facts

### JWT Secret is hardcoded
`middlewares/passport.js` and `loginController.js` both use the hardcoded string `'secret'`.
The `JWT_SECRET` env var in `.env` is never read. Token expires in 28800s (8 hours).

### Storage Provider defaults to Supabase
`services/storage/index.js` defaults to `supabase` when `STORAGE_PROVIDER` is unset.
Set `STORAGE_PROVIDER=local` explicitly for local development.

### PayPal auto-mocks at startup
If `PAYPAL_CLIENT` or `PAYPAL_SECRET` are missing, `server.js` loads `mocks/paypal-nock.js`
which intercepts PayPal API calls via nock for the entire process lifetime.

### No global error handler
There is no Express error-handling middleware. Errors propagate via `AsyncWrapper`
(`helpers.js`) which catches async rejections and returns 422 for validation errors
or forwards to `next(err)` for unhandled errors.

### Roles (numeric, in constants.js)
- `1` = ADMINISTRADOR (superadmin, full access)
- `2` = ADMINISTRADOR_FUNDACION (foundation admin, linked via `administrador_fund` table)
- `3` = DONADOR (donor)
- Role checks are in controllers, not middleware (except `/denuncias` which has inline `checkRole`).

### Spanish codebase
Variable names, comments, error messages, route names, and DB table/column names are all
in Spanish. Keep this convention when adding code.

## Validation

Request validation uses `express-validator` chains in `controllers/validations.js`.
Each array ends with a `validate` middleware that returns 400:
```json
{ "status": "fail", "errors": [{ "campo": "field", "mensaje": "msg" }] }
```

Custom Ecuadorian validators in `utils/validators.js`:
- `esCedulaValida(cedula)` -- mod-10, province 01-24 or 30
- `esRucValido(ruc)` -- natural (0-5), juridica (9), publica (6) with mod-11
- `esTelefonoEcuador(tel)` -- `09XXXXXXXX` or `0[2-7]XXXXXXX`

Cross-table uniqueness: `ruc` is unique in `fundacion` and must not collide with
`solicitudes_fundacion` rows (enforced in controllers, returns 409 Conflict).

## ESLint

Config: `.eslintrc.js` (airbnb-base). Key non-default rules:
- `no-console: off`
- `camelcase: warn` with `properties: 'never'` (DB snake_case is OK)
- `max-len: 120` (ignores comments, strings, templates)
- `no-param-reassign: error` with `props: false` (mutating props is OK)
- `consistent-return: warn`

ESLint ignores: `lib/`, `tempFiles/`, `*.test.js`. The `test/lib/` directory is
also ignored by ESLint (matches `lib/` pattern).

Pre-existing lint errors exist in `controllers/uploadController.js` (not blocking CI).

## CI (.gitlab-ci.yml)

- **lint stage:** `npm ci --legacy-peer-deps && npm run lint`
- **test stage:** Postgres service, runs `npm run test`, artifacts `coverage/`
- Test stage has `allow_failure: true`
- CI does NOT run migrations -- they must exist and be compatible

## Seeding

`scripts/seed-v2.js` bulk-creates users with password `Leopet2025!` (different from
README credentials). Seed RUCs use invalid checksums (they bypass model validation).

Do NOT add Sequelize `validate` to `fundacion.ruc` or `solicitudes_fundacion.ruc` --
it would break the seed script and historical rows.

## Git

- Remote: `origin/master`
- Branch: `master`
- Push has been deferred by user decision (multiple commits ahead of origin)
- `.gitlab-ci.yml` runs on merge_requests, main, and develop
