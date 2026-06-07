# Cloudflare Workers Integration & Deployment Plan

## Context

`context/foundation/infrastructure.md` selected **Cloudflare Workers** as the MVP deploy
target for HouseBuild Assistant (Astro 6 SSR + React 19, Supabase SSR, OpenRouter for AI).
The project is already scaffolded with `@astrojs/cloudflare` v13 and a `wrangler.jsonc`, but
has never been deployed. This plan takes it to a **correct** first production deploy — not just
a working one — by closing the specific gaps and risks the infra research flagged, then wires
auto-deploy on merge.

The driving concern from infrastructure.md is the **per-user data-isolation guardrail**: a
cached `Set-Cookie` on Cloudflare's edge can authenticate the *wrong user* (Risk #1, H impact).
The current `setAll` cookie handler does **not** forward the cache headers that `@supabase/ssr`
≥0.10.0 provides to prevent exactly this. That fix is a launch blocker, not a nice-to-have.

**Decisions locked with the user:**
- Wrangler auth: **scoped `CLOUDFLARE_API_TOKEN`** (Workers-only, this project) for the local /
  manual first deploy and `wrangler secret put` — agent-friendly, matches the minimal-permissions
  posture in CLAUDE.md. Not `wrangler login`. (Auto-deploy does NOT use this token — see below.)
- Auto-deploy: **Cloudflare Workers Builds** (native Git integration), NOT a GitHub Actions deploy
  job. Cloudflare connects to the repo and runs `npm run build` → `npx wrangler deploy` on push.
- Deploy branch: **`main`** (repo default; no `master` exists). Production branch in Workers
  Builds = `main`; other branches get preview versions (`wrangler versions upload`).
- GitHub Actions: **kept as PR checks only** (lint + build), trigger fixed to `main`. Deploy is
  Cloudflare's job, not GHA's.
- OpenRouter: **deferred**. The AI feature isn't built; `OPENROUTER_API_KEY` is NOT wired in this
  plan. A "when AI lands" stub is included so nothing is forgotten.

## Current state (verified)

Already correct — do **not** touch:
- `wrangler.jsonc`: `compatibility_flags: ["nodejs_compat"]` ✓ (Risk #2 already mitigated),
  `main: "@astrojs/cloudflare/entrypoints/server"` ✓, `assets` binding ✓, `observability` ✓.
- `@supabase/ssr@^0.10.3` ✓ (≥0.10.0 — the version that emits cache headers to `setAll`).
- `astro.config.mjs`: `output: "server"`, `adapter: cloudflare()`, `astro:env` schema ✓.
- No deprecated `Astro.locals.runtime` usage (Risk #5 N/A).
- `.gitignore` covers `.dev.vars`, `.env`, `.wrangler/`, `dist/` ✓.

Gaps this plan closes:
- `setAll` in `src/lib/supabase.ts` ignores the cache-header second arg → **tenant-leak risk**.
- No `Cache-Control: private, no-store` on authenticated responses in `src/middleware.ts`.
- Worker `name` is the generic `"10x-astro-starter"` → rename to `house-build-assistant`.
- `.dev.vars` missing (needed for local `workerd` dev to see secrets).
- CI triggers on `master` (nonexistent) and has no deploy step.
- No `context/deployment/` directory / `deploy-plan.md` artifact.

---

## Phase 0 — Prerequisites: CLI & Supabase setup

Do this before Phase 1. Both `wrangler` and `supabase` are **devDependencies** — use via `npx`,
no global install.

### A. Toolchain
- [x] **0.1 Node 22.14.0** ✅ (build/deploy ran successfully on the pinned version).
- [x] **0.2 Install deps** ✅ (`node_modules` present; build/deploy succeeded).
- [x] **0.3 Wrangler CLI** — installed (v4.90.0) and already authenticated via OAuth as
  `wpankanin@gmail.com` (`npx wrangler whoami` confirmed). Scoped-token hardening is Phase 3.1.
- [x] **0.4 Supabase CLI** ✅ installed (v2.98.2); `supabase/config.toml` initialized (local-stack
  config; `project_id` still the generic `10x-astro-starter` — harmless to leave).

### B. Hosted Supabase project (what the deployed Worker connects to)
- [x] **0.5 Create a hosted Supabase project** — done (Supabase Cloud project exists). Confirm it's
  in the **EU (Frankfurt) region** (PII residency per infrastructure.md's EU note). Optionally add a
  second project for previews (see "Preview deploys leak real data" in edge cases).
- [x] **0.6 Grab credentials** from Project Settings → API ✅ done (Project URL + anon key in hand;
  used for `.dev.vars` and Worker secrets). Reminder: must be the **anon** key, never `service_role`.
- [x] **0.7 Enable Email auth** ✅ done (email + password provider enabled).
- [x] **0.8 Feed the values** ✅ done — into `.dev.vars` (2.2) and Worker secrets (3.2).

### C. Supabase CLI link (forward-looking — needed when DB tables/migrations land, not for first deploy)
- [ ] **0.9 Authenticate the CLI** — `npx supabase login` (or set `SUPABASE_ACCESS_TOKEN`).
- [ ] **0.10 Link to the hosted project** — `npx supabase link --project-ref <project-ref>`.
- [ ] **0.11 When schema is added** — author migrations in `supabase/migrations/` and apply with
  `npx supabase db push`. No app tables exist today (auth only), so this is a stub until the
  investment/checklist data model is built. Reminder: DB schema changes are **not** covered by
  `wrangler rollback` — coordinate separately.

> **Local-dev note:** `supabase/config.toml` has `site_url = "http://127.0.0.1:3000"` but
> `astro dev` serves on **:4321**. If you run the local Supabase stack (`supabase start`) and test
> auth redirects locally, set `site_url` / `additional_redirect_urls` to `http://localhost:4321`.
> For MVP connecting straight to the hosted project, this local-stack config is unused.

### D. Cloudflare account
- [x] **0.12 Cloudflare account** — done (account `Wpankanin@gmail.com's Account` active on the
  Workers Free plan; $0 at MVP scale, 100k req/day hard cap). The $5/mo Workers Paid plan only
  matters if traffic outgrows the free cap.
- [x] **0.13 Claim your `*.workers.dev` subdomain** ✅ done (`housebuild-assistant.workers.dev`).
- [x] **0.14 Account ID** — `3d5d458112e4bfff24a410ace177ff0e` (from `wrangler whoami`).
- [x] **0.15 Access rights + GitHub repo** — repo `kansoft/house-build-assistant` exists and is
  configured; account-owner access confirmed. Still pending as actions: create the **scoped API
  token** (Phase 3.1) and connect the repo via the **Cloudflare GitHub App** for auto-deploy
  (Phase 5.1) — the latter may need org-owner approval of the app.

---

## Phase 1 — Code hardening (security-critical, before any deploy)

- [x] **1.1 Forward Supabase cache headers in `setAll`** — `src/lib/supabase.ts` ✅ Done.
  `createClient` now takes an optional `authResponseHeaders: Headers`; `setAll(cookiesToSet, headers)`
  copies the emitted no-cache headers into it. Verified against installed `@supabase/ssr@0.10.3`
  type `SetAllCookies = (cookies[], headers: Record<string,string>) => …`.
- [x] **1.2 No-store on authenticated responses** — `src/middleware.ts` ✅ Done.
  Middleware passes a `Headers` collector to `createClient`, then after `await next()` applies the
  collected headers to the response and forces `Cache-Control: private, no-store` whenever
  `context.locals.user` is set.
- [x] **1.3 Sanity-build locally** ✅ `npx astro sync && npm run build` passes; `eslint` clean on
  both files.

> Reuse: keep using the existing `createClient(requestHeaders, cookies)` factory and the
> `import { SUPABASE_URL, SUPABASE_KEY } from "astro:env/server"` pattern — extend, don't replace.

## Phase 2 — Wrangler / project config

- [x] **2.1 Rename the Worker** — `wrangler.jsonc` `name` → `house-build-assistant` ✅ Done.
- [x] **2.2 Create `.dev.vars`** ✅ done (gitignored, real Supabase values).
- [x] **2.3 Confirm `compatibility_date`** (`2026-05-08`) ✅ left as-is (current).

## Phase 3 — Cloudflare auth & secrets (manual gates — human-only)

- [ ] **3.1 Create scoped API token** (you, in Cloudflare dashboard): template "Edit Cloudflare
  Workers", scoped to this account + this project only — **no** DNS, billing, or unrelated
  Workers secrets. Export as `CLOUDFLARE_API_TOKEN` in your shell env (not committed, not in
  `wrangler.jsonc`). This token is for the manual first deploy + `secret put` only; Workers Builds
  uses its own dashboard connection, not this token. Verify: `npx wrangler whoami`.
- [x] **3.2 Set production secrets** ✅ done — `SUPABASE_URL` + `SUPABASE_KEY` set on the Worker
  (confirmed via `wrangler secret list`). (OpenRouter deferred.)
- [x] **3.3 Enable `workers.dev` subdomain** ✅ done (see 0.13).

> **Note:** Scoped API token (3.1) was **skipped** for the first deploy — the existing OAuth login
> was used. Recommended hardening for later: create a Workers-scoped token and switch to it.

## Phase 4 — First manual deploy & verification

- [x] **4.1 Build + deploy** ✅ done via `npm run build && npx wrangler deploy`. Live at
  **https://house-build-assistant.housebuild-assistant.workers.dev** (version `9e97afcc`). Wrangler
  auto-provisioned the `SESSION` KV namespace. Note: new-subdomain TLS cert took ~minutes to
  propagate before the URL responded.
- [x] **4.2 Configure Supabase external integration** ✅ done. Site URL =
  `https://house-build-assistant.housebuild-assistant.workers.dev`; Redirect URLs include
  `…workers.dev/**` (wildcard so all auth redirect paths match).
- [x] **4.3 Multi-user tenant-isolation smoke test** ✅ **PASSED** (hard launch gate). Two users in
  separate browsers each saw only their own session/dashboard; authenticated responses carried
  `Cache-Control: private, no-store`. Confirms the Phase 1 cache-header fix holds on the edge.
- [x] **4.4 Verify ops loop** ✅ `/` 200, `/auth/signin` 200, `/dashboard` 302→/auth/signin;
  `wrangler deployments list` shows the Upload deployment.

## Phase 5 — Auto-deploy via Cloudflare Workers Builds (native, no GHA deploy)

- [x] **5.1 Connect the repo in Cloudflare** ✅ done — Workers Builds connected to
  `kansoft/house-build-assistant`, production branch `main`, build `npm run build`, deploy
  `npx wrangler deploy`.
- [x] **5.2 Confirm build environment / auto-deploy** ✅ verified — push of empty commit `436b8f6`
  to `main` triggered a Workers Build that produced deployment `86a48f4d` (23:35Z) with no manual
  CLI action; live site stayed healthy (`/` 200). Runtime secrets already on the Worker; no
  build-time secrets needed.
- [x] **5.3 Fix GHA triggers** — `.github/workflows/ci.yml` `push`/`pull_request` `master` → `main`
  ✅ Done. Still lint+build only (no deploy step); existing build secrets unchanged.

## Phase 6 — Capture the artifact

- [x] **6.1 Write `context/deployment/deploy-plan.md`** ✅ done — concise durable audit record
  (platform, live URL, auto-deploy mechanism, secrets/bindings, Supabase config, security
  guardrail, rollback/ops), pointing back to this detailed checklist. Kept short to avoid drift.

---

## Edge cases & extra support steps

- **Tenant leak via cached cookie (Risk #1).** Primary mitigation = Phase 1.1 + 1.2; verification
  gate = Phase 4.3. Treat 4.3 as a hard launch gate.
- **Wrong deploy command.** `wrangler deploy` (Workers), not `wrangler pages deploy`. Ignore any
  `wrangler pages *` docs — Pages support was dropped in adapter v13.
- **Token can't open a browser (agent context).** Scoped `CLOUDFLARE_API_TOKEN` avoids the
  interactive `wrangler login` OAuth flow entirely; `wrangler` auto-discovers it from env.
- **Supabase email links break in prod.** Phase 4.2 — add the prod URL to Supabase Site/Redirect
  URLs. If you later add a custom domain, re-add it here.
- **`master`/`main` mismatch.** Phase 5.3. Until fixed, GHA PR checks don't fire on `main`. (Deploy
  is Cloudflare's, keyed to the `main` production branch set in 5.1.)
- **Workers Builds GitHub App permissions.** The connection needs the Cloudflare GitHub App
  installed with access to `kansoft/house-build-assistant`. If the org owner must approve, that's a
  manual gate — the build won't trigger until it's installed and authorized.
- **Preview deploys leak real data.** Non-`main` branch pushes create preview versions with their
  own URLs hitting the same Supabase. If a preview URL is shared, protect it (Cloudflare Access) or
  point previews at a separate Supabase project before sharing.
- **AI handler CPU ceiling (Risk #4, future).** Workers caps CPU-time per request (I/O waits like
  OpenRouter don't count). When AI lands: stream the response, keep post-processing tiny, enforce
  the PRD's bounded-timeout + graceful fallback so AI failure never drops checklist state.
- **Free-tier 100k req/day hard cap** (resets 00:00 UTC, errors not a bill). Fine at MVP scale;
  the $5/mo Workers plan lifts it if traffic grows.
- **Rollback ≠ DB rollback.** `wrangler rollback` reverts code in seconds but NOT Supabase
  schema/data — coordinate migrations separately (human-only destructive DB ops).

## When AI lands (out of scope now — checklist stub for later)

- [ ] Add `OPENROUTER_API_KEY` to the `astro:env` server schema in `astro.config.mjs`.
- [ ] Add `OPENROUTER_API_KEY=###` to `.env.example` and a real value to `.dev.vars`.
- [ ] `npx wrangler secret put OPENROUTER_API_KEY` and add it as a GitHub Actions repo secret.

## Verification summary

0. Prereqs (Phase 0): `node -v` = v22.14.0; `npx wrangler --version` & `npx supabase --version`
   respond; hosted Supabase project exists in EU with Email auth on and the **anon** key in hand.
1. `npx astro sync && npm run build` passes after Phase 1 code changes.
2. `npx wrangler whoami` confirms the scoped token (Phase 3).
3. First deploy returns a `workers.dev` URL; `/`, auth pages, and `/dashboard` redirect work.
4. **Multi-user smoke test (4.3)** passes — each user sees only their own data; authenticated
   responses are `private, no-store`. (Hard gate.)
5. `wrangler tail` / `wrangler deployments list` show healthy live state.
6. A test push to `main` triggers a **Cloudflare Workers Build** (visible in the dashboard build
   logs) that runs `npm run build` → `wrangler deploy` and promotes the new version to active.
   Separately, GHA runs lint+build as the PR check.

## Files touched

- `src/lib/supabase.ts` — `setAll` captures + exposes cache headers.
- `src/middleware.ts` — apply `no-store` / captured headers to authenticated responses.
- `wrangler.jsonc` — rename Worker.
- `.dev.vars` — new, gitignored (not committed).
- `.github/workflows/ci.yml` — branch `master`→`main` only (stays lint+build PR check, no deploy job).
- `context/deployment/deploy-plan.md` — new artifact.

Cloudflare-dashboard config (no repo files): Workers Builds Git connection, production branch,
build/deploy commands, scoped API token, Worker secrets, Supabase URL config.
