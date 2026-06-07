# Deploy Record — HouseBuild Assistant

Durable "what is deployed" record (the audit/contract surface downstream milestone-planning reads).
Full step-by-step execution checklist lives in
[`context/changes/deployment/deployment-plan.md`](../changes/deployment/deployment-plan.md).

## Platform & target

- **Platform:** Cloudflare Workers (per `context/foundation/infrastructure.md`)
- **Worker name:** `house-build-assistant`
- **Adapter:** `@astrojs/cloudflare` v13 (Workers + Static Assets; **not** Pages)
- **Account ID:** `3d5d458112e4bfff24a410ace177ff0e`

## Live URL

- **Production:** https://house-build-assistant.housebuild-assistant.workers.dev

## Auto-deploy

- **Mechanism:** Cloudflare **Workers Builds** (native Git integration) — NOT GitHub Actions.
- **Repo:** `kansoft/house-build-assistant`, **production branch `main`**.
- **Build command:** `npm run build` · **Deploy command:** `npx wrangler deploy`
  (non-`main` branches → `npx wrangler versions upload` preview versions).
- Verified: push to `main` → build → deploy (e.g. version `86a48f4d`).
- **GitHub Actions** (`.github/workflows/ci.yml`): lint + build **PR check only** on `main`
  (no deploy step).

## Secrets & bindings (on the Worker, runtime)

- Secrets: `SUPABASE_URL`, `SUPABASE_KEY` (anon key) — set via `wrangler secret put`.
  `OPENROUTER_API_KEY` **deferred** (AI feature not built yet).
- Bindings: `ASSETS` (static), `IMAGES` (Cloudflare Images, auto), `SESSION` (KV namespace
  `house-build-assistant-session`, auto-provisioned on first deploy).
- Local dev secrets: `.dev.vars` (gitignored).

## External integration — Supabase

- Hosted Supabase Cloud project; Email auth (email + password) enabled.
- Auth URL config: Site URL = the production URL above; Redirect URLs include
  `…workers.dev/**` (wildcard, so all auth redirect paths match).

## Security guardrail (per-user data isolation)

- `@supabase/ssr` cache headers forwarded in `setAll` + `Cache-Control: private, no-store` on
  authenticated responses (`src/lib/supabase.ts`, `src/middleware.ts`) — prevents an edge-cached
  `Set-Cookie` from authenticating the wrong user.
- **Verified** by a two-user concurrent smoke test (each user saw only their own session).

## Operations

- **Rollback (code only):** `npx wrangler rollback [<version-id>]` (does NOT roll back Supabase
  schema/data — coordinate DB migrations separately).
- **Logs:** `npx wrangler tail --format json`
- **History:** `npx wrangler deployments list --name house-build-assistant`
- **Auth:** currently the OAuth `wrangler login` token. Recommended hardening: a Workers-scoped
  `CLOUDFLARE_API_TOKEN` (deferred).

## Known / deferred

- Free tier: 100k req/day hard cap (resets 00:00 UTC). Fine at MVP scale.
- No EU compute pinning (global edge); PII stays in Supabase EU.
- Supabase CLI link + migrations: deferred until the app gains DB tables.
