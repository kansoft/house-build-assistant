---
project: HouseBuild Assistant
researched_at: 2026-06-04
recommended_platform: Cloudflare Workers
runner_up: Vercel
context_type: mvp
tech_stack:
  language: TypeScript
  framework: Astro 6 (SSR) + React 19
  runtime: Cloudflare Workers (workerd) via @astrojs/cloudflare
---

## Recommendation

**Deploy on Cloudflare Workers.**

It scores Pass on all five agent-friendly criteria, costs $0 at this app's traffic (well under the 100k requests/day free cap), and the project is already scaffolded with `@astrojs/cloudflare`. `astro dev` runs the real `workerd` runtime, so local behaviour matches production — including failure modes. Data lives in external Supabase and AI in OpenRouter, so the "co-location" advantage of container PaaS options (Railway/Render/Fly) does not apply, and their always-on cost or cold-start latency would work against the PRD's "checklist within ~1 second" expectation. One version correction drove the decision detail: `@astrojs/cloudflare` v13 dropped Cloudflare **Pages** support and targets **Workers + Static Assets** — so the `deployment_target: cloudflare-pages` in `tech-stack.md` is legacy terminology; the live target is Workers.

## Platform Comparison

| Platform | CLI-first | Managed/Serverless | Agent docs | Stable deploy API | MCP / Integration | Tally |
|---|---|---|---|---|---|---|
| **Cloudflare (Workers)** | Pass | Pass | Pass (`llms.txt`) | Pass (`wrangler deploy`/`rollback`) | Pass (MCP + Claude plugin) | **5 Pass** |
| **Vercel** | Pass | Pass | Pass (`llms.txt`) | Pass | Partial (MCP beta, read-only) | 4 Pass / 1 Partial |
| **Netlify** | Partial (rollback UI-only) | Pass | Pass (`llms.txt`) | Pass (`--prod`) | Pass (GA MCP) | 4 Pass / 1 Partial |
| **Render** | Partial (rollback API-only) | Pass | Pass (`llms.txt`) | Pass (hooks + API) | Pass (GA infra MCP) | 4 Pass / 1 Partial |
| **Railway** | Partial (rollback UI-only) | Pass | Pass (`llms-full.txt`) | Pass (`railway up`) | Pass (MCP local+remote) | 4 Pass / 1 Partial |
| **Fly.io** | Pass | Partial (own Dockerfile + health checks) | Partial (no `llms.txt`) | Pass (`fly deploy`) | Partial (MCP experimental) | 3 Pass / 2 Partial |

Notes per platform:

- **Cloudflare** — `wrangler deploy` / `wrangler rollback [<version-id>]` / `wrangler tail` cover the full ops loop. Docs as `llms.txt` + markdown. Multiple managed MCP servers plus a Claude Code plugin. Free: 100k req/day hard cap (resets 00:00 UTC). No EU region pinning (global edge). `@astrojs/cloudflare` v13 = Astro 6, Workers-only.
- **Vercel** — `@astrojs/vercel` v10, GA. `vercel --prod` / `vercel rollback` / `vercel logs`. EU region pinning GA (`regions: ["fra1"]`). MCP is **public beta, read-only** (checked 2026-06-04). Hobby tier is **non-commercial only** — a revenue/business app must move to Pro (~$20/mo).
- **Netlify** — `@astrojs/netlify` v7, GA ("Astro 6 just works", 2026-03-10). `netlify deploy --prod` (draft by default — a safety win). Rollback is UI-only (no first-class CLI). Official GA MCP server. EU function-region pinning is **Pro/Enterprise only**; default region is US-Ohio.
- **Render** — Node-adapter Web Service, Frankfurt EU GA. CLI GA, but rollback is API/dashboard. Free tier spins down after 15 min idle with ~50–60s cold start (conflicts with the latency NFR); $7/mo Starter avoids it.
- **Railway** — Node-adapter, Railpack autodetect (no Dockerfile). No scale-to-zero → pay for idle (~$7–10/mo). Closest EU region is Amsterdam. Official MCP (local + remote).
- **Fly.io** — Node-adapter in a container you own (Dockerfile + health checks). `fra` (Frankfurt) region. No free tier (~$2–4/mo always-on, or scale-to-zero with cold starts). MCP experimental; no `llms.txt`.

### Shortlisted Platforms

#### 1. Cloudflare Workers (Recommended)

Top score on every criterion, $0 at this scale, already scaffolded, highest-fidelity local dev (`astro dev` on `workerd`), and the strongest agent tooling of the six. Single-region preference and external data layer remove every reason the container PaaS options would have won.

#### 2. Vercel

The best developer experience and documentation, and EU region pinning is GA — a cleaner data-locality story than Cloudflare. The gap: the Hobby tier forbids commercial use, so an investor-facing product realistically needs Pro (~$20/mo), and the MCP server is still beta/read-only. This is the natural fallback if Workers-specific runtime quirks become a time sink.

#### 3. Netlify

Official GA MCP server, generous free tier, and draft-by-default deploys (you must explicitly `--prod`, which prevents accidental production pushes). The gaps vs. the recommendation: rollback has no first-class CLI path, and EU function-region pinning requires a paid tier.

## Anti-Bias Cross-Check: Cloudflare Workers

### Devil's Advocate — Weaknesses

1. **Stale deployment target.** `tech-stack.md` says `cloudflare-pages`, but `@astrojs/cloudflare` v13 dropped Pages and targets Workers + Static Assets. Deploy with `wrangler deploy`; any `wrangler pages deploy` instructions are wrong for this version.
2. **`nodejs_compat` is mandatory for Supabase.** Without `"compatibility_flags": ["nodejs_compat"]` in `wrangler.jsonc`, the `@supabase/ssr` client fails on the Workers runtime — a silent setup trap.
3. **Supabase SSR cookie-cache bug on edge.** A cached `Set-Cookie` from token refresh can authenticate the *wrong user* — a direct hit on the PRD's hard "per-user data isolation" guardrail. Requires `@supabase/ssr` ≥0.10.0 and forwarding cache headers (`Cache-Control`/`Expires`/`Pragma`) in `setAll`.
4. **No EU region pinning** on free/standard Workers — compute is global. PII lives in Supabase EU so this is a minor residency note, not a blocker, in a Polish/GDPR context.
5. **`Astro.locals.runtime` was removed** in v13 (now `Astro.locals.cfContext` / `Astro.request.cf`). Older code samples won't compile.

### Pre-Mortem — How This Could Fail

The team shipped fast on Cloudflare's free tier. The first cracks came not from traffic but from auth: under real concurrent use, a few investors intermittently saw *someone else's* investments — the cached-cookie token-refresh bug, never caught because local single-user testing can't reproduce it. Trust, the product's entire premise ("no false confidence," "per-user isolation"), took the hit. Meanwhile the AI suggestion endpoint occasionally exceeded the Workers per-request CPU-time ceiling on longer OpenRouter round-trips, surfacing as opaque 500s rather than the PRD's required graceful timeout. Debugging was slowed by treating Workers as "just Node" — subtle runtime differences meant libraries that worked locally failed at the edge. None of these were fatal individually, but each ate scarce after-hours time, and the "cheapest path to first deploy" quietly became the most expensive path to a *correct* deploy.

### Unknown Unknowns

- **Workers enforces a CPU-time limit per request, not wall-clock.** OpenRouter waits are I/O (don't burn CPU), so usually fine — but heavy post-processing of AI responses could trip it. Keep the AI handler's CPU work small; stream/return promptly.
- **`astro dev` runs on `workerd`, not Node.** High fidelity (good), but Node-only dev conveniences are absent locally too — what works in dev is what works in prod, failure modes included.
- **The free tier is a hard 100k req/day cap resetting at 00:00 UTC** — no overage grace; you hit errors, not a bill. Fine at this scale, but know the failure shape.
- **Cloudflare's agent tooling (MCP servers, "Markdown for Agents") ships fast and is partly Pro-gated.** Capabilities may shift; pin what you depend on.

## Operational Story

- **Preview deploys**: `wrangler versions upload` creates a non-production preview version with its own URL; production publish is a separate `wrangler deploy`. Branch/PR preview URLs can be wired via the Cloudflare GitHub integration. Protect preview URLs with Cloudflare Access if they expose real data.
- **Secrets**: store `SUPABASE_URL`, `SUPABASE_KEY`, and `OPENROUTER_API_KEY` as Workers secrets via `wrangler secret put <NAME>` (or the dashboard); they are never committed. Locally, use `.dev.vars` (already in the starter, gitignored). Read them in code through `astro:env/server`, not `process.env`. CI sets them as GitHub Actions repository secrets for the build/deploy step.
- **Rollback**: `wrangler rollback [<version-id>]` reverts to a prior version (interactive picker lists up to 100 recent versions); time-to-revert is seconds. Caveat: code rolls back, but Supabase schema/data changes do not — coordinate DB migrations separately.
- **Approval**: an agent may run `wrangler deploy`, `wrangler tail`, and `wrangler rollback` unattended. Human-only: rotating the primary Supabase/OpenRouter keys, deleting the Worker/project, and any destructive Supabase operation (drop table, disable RLS).
- **Logs**: `wrangler tail --format json` streams live runtime logs (filter with `--status error` / `--search`); `wrangler deployments list` and `wrangler versions list` show deploy history. Read-only and scriptable for an agent.

## Risk Register

| Risk | Source | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Supabase SSR cached-cookie bug authenticates wrong user (tenant leak) | Devil's advocate / Pre-mortem | M | H | Use `@supabase/ssr` ≥0.10.0; forward `Cache-Control`/`Expires`/`Pragma` in `setAll`; set authenticated routes to no-cache; add a multi-user smoke test before launch |
| Missing `nodejs_compat` flag breaks Supabase client at runtime | Devil's advocate | M | H | Add `"compatibility_flags": ["nodejs_compat"]` to `wrangler.jsonc`; verify in `astro dev` (runs on workerd) before deploy |
| Deploying via legacy Pages path instead of Workers | Devil's advocate / Research finding | M | M | Use `wrangler deploy` (Workers + Static Assets); update `tech-stack.md` target from `cloudflare-pages` to `cloudflare-workers`; ignore `wrangler pages *` docs |
| AI handler exceeds per-request CPU-time limit → opaque 500s | Pre-mortem / Unknown unknowns | L | M | Keep CPU work in the AI path minimal; stream OpenRouter responses; enforce the PRD's bounded-timeout + graceful-fallback so AI failure never drops checklist state |
| Old v12 code samples (`Astro.locals.runtime`) won't compile on v13 | Devil's advocate | L | L | Use `Astro.locals.cfContext` / `Astro.request.cf`; follow the v13 adapter upgrade guide |
| 100k req/day free cap hit → hard errors, no overage grace | Unknown unknowns | L | L | Monitor request volume; the $5/mo Workers paid plan lifts the cap if traffic grows |
| No EU region pinning (compute runs globally) | Devil's advocate | L | L | PII stays in Supabase EU; compute is stateless. Record for GDPR review; revisit only if data-residency requirements tighten |
| Cloudflare agent tooling (MCP/Markdown-for-Agents) shifts under you | Unknown unknowns | L | L | Pin the specific MCP servers/CLI versions you rely on; treat Pro-gated agent features as optional |

## Getting Started

The project is already scaffolded with `@astrojs/cloudflare` and `wrangler.jsonc`. Version-accurate steps for Astro 6 + adapter v13 (Workers, not Pages):

1. **Add the Node compatibility flag** to `wrangler.jsonc` (required for Supabase): `"compatibility_flags": ["nodejs_compat"]`.
2. **Authenticate Wrangler**: `npx wrangler login`.
3. **Set production secrets** (not in the repo): `npx wrangler secret put SUPABASE_URL`, `... SUPABASE_KEY`, `... OPENROUTER_API_KEY`. Keep the same values in local `.dev.vars`.
4. **Build and deploy**: `npm run build && npx wrangler deploy`. (Do *not* use `wrangler pages deploy` — that path is removed in adapter v13.)
5. **Wire CI** (matches `tech-stack.md` `auto-deploy-on-merge`): add the three secrets as GitHub Actions repository secrets and run `wrangler deploy` on merge to the deploy branch. Note the existing CI triggers on `master` while the local default branch is `main` — align these before relying on auto-deploy.

## Out of Scope

The following were not evaluated in this research:
- Docker image configuration
- CI/CD pipeline setup (only referenced; not authored)
- Production-scale architecture (multi-region, HA, DR)
