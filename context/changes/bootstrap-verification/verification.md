---
bootstrapped_at: 2026-05-27T22:40:55Z
starter_id: 10x-astro-starter
starter_name: "10x Astro Starter (Astro + Supabase + Cloudflare)"
project_name: house-build-assistant
language_family: js
package_manager: npm
cwd_strategy: git-clone
bootstrapper_confidence: first-class
phase_3_status: ok
audit_command: "npm audit --json"
---

## Hand-off

Verbatim copy of `context/foundation/tech-stack.md` consumed at Step 0.

### Frontmatter

```yaml
starter_id: 10x-astro-starter
package_manager: npm
project_name: house-build-assistant
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-pages
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: first-class
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: true
  has_background_jobs: false
```

### Why this stack

Solo investor-tool MVP shipping in 6 weeks of after-hours work, with email+password auth, per-user data isolation, durable checklist progress across multi-month build timelines, and AI-suggested checklist items on demand. The 10x Astro Starter is the recommended default for `(web, js)` and clears all four agent-friendly gates; its Supabase backbone delivers Postgres + auth + row-level security out of the box, covering the auth and per-user isolation NFRs without bespoke wiring. Cloudflare Pages/Workers is the starter's first deployment default and matches the short timeline — cheapest path to first deploy. AI suggestions land as a bring-your-own integration on top of the starter; no payments, no realtime, no background jobs in scope per PRD non-goals. CI on GitHub Actions with auto-deploy-on-merge matches the standard shape for a solo build. Bootstrapper confidence is first-class; expect mostly-smooth scaffolding with occasional manual steps.

## Pre-scaffold verification

| Signal       | Value                                                            | Severity | Notes                                              |
| ------------ | ---------------------------------------------------------------- | -------- | -------------------------------------------------- |
| npm package  | not run                                                          | n/a      | cmd_template starts with `git clone`; npm step skipped per pre-scaffold-verification.md |
| GitHub repo  | przeprogramowani/10x-astro-starter last pushed 2026-05-17T10:33:39Z | fresh    | from card.docs_url; 11 days before bootstrap       |

## Scaffold log

**Resolved invocation**: `git clone https://github.com/przeprogramowani/10x-astro-starter .bootstrap-scaffold && cd .bootstrap-scaffold && npm install`
**Strategy**: git-clone
**Exit code**: 0
**Files moved**: 20
**Conflicts (.scaffold siblings)**: CLAUDE.md.scaffold
**.gitignore handling**: moved silently (absent in cwd)
**.bootstrap-scaffold cleanup**: deleted

### Moved entries

Root-level files/dirs moved from `.bootstrap-scaffold/` into cwd:

- `.env.example`
- `.github/`
- `.gitignore`
- `.husky/`
- `.nvmrc`
- `.prettierrc.json`
- `.vscode/`
- `CLAUDE.md` → sidelined as `CLAUDE.md.scaffold` (existing cwd `CLAUDE.md` preserved)
- `README.md`
- `astro.config.mjs`
- `components.json`
- `eslint.config.js`
- `node_modules/`
- `package-lock.json`
- `package.json`
- `public/`
- `src/`
- `supabase/`
- `tsconfig.json`
- `wrangler.jsonc`

`.bootstrap-scaffold/.git/` was deleted before move-up so the upstream starter history does not leak into this project.

### Installer notes

`npm install` emitted `EBADENGINE` warnings: the cloned starter pins `node >=22.12.0` for several dependencies (`astro@6.3.1`, `@astrojs/react`, `wrangler`, `miniflare`, `@cloudflare/kv-asset-handler`, `@astrojs/prism`, `get-tsconfig`), but the local runtime is `node v20.19.5 / npm 10.8.2`. Install completed successfully — these are advisory engine warnings, not failures — but `dev`/`build`/`deploy` commands may misbehave until Node is upgraded to 22.12+.

## Post-scaffold audit

**Tool**: `npm audit --json`
**Summary**: 0 CRITICAL, 1 HIGH, 9 MODERATE, 0 LOW
**Direct vs transitive**: 0/0/2/0 direct of total 0/1/9/0 (npm-audit distinguishes via `isDirect` on each advisory)

Dependency totals from `metadata.dependencies`: 449 prod, 316 dev, 131 optional, 895 total.

### CRITICAL findings

None.

### HIGH findings

- **devalue** (transitive, range `5.6.3 - 5.8.0`)
  - Advisory: GHSA-77vg-94rm-hx3p — "Svelte devalue: DoS via sparse array deserialization"
  - CVSS: 7.5 (`AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H`)
  - CWE-770
  - Fix available: yes

### MODERATE findings

- **@astrojs/check** (direct, range `>=0.9.3`) — via `@astrojs/language-server`; fix available at `@astrojs/check@0.9.2` (semver-major downgrade).
- **@astrojs/language-server** (transitive, range `>=2.14.0`) — via `volar-service-yaml`; effects `@astrojs/check`; fix path through `@astrojs/check@0.9.2`.
- **@cloudflare/vite-plugin** (transitive, range `<=0.0.0-fff677e35 || 0.0.7 - 1.37.2`) — via `miniflare`, `wrangler`, `ws`; fix available.
- **miniflare** (transitive, range `<=0.0.0-fff677e35 || 3.20250204.0 - 4.20260518.0`) — via `ws`; effects `@cloudflare/vite-plugin`, `wrangler`; fix available.
- **volar-service-yaml** (transitive, range `<=0.0.70`) — via `yaml-language-server`; effects `@astrojs/language-server`; fix path through `@astrojs/check@0.9.2`.
- **wrangler** (direct, range `<=0.0.0-kickoff-demo || 3.108.0 - 4.93.0`) — via `miniflare`; effects `@cloudflare/vite-plugin`; fix available.
- **ws** (transitive, range `8.0.0 - 8.20.0`) — Advisory GHSA-58qx-3vcg-4xpx "ws: Uninitialized memory disclosure" (CVSS 4.4, CWE-908); effects `@cloudflare/vite-plugin`, `miniflare`; fix available.
- **yaml** (transitive, range `2.0.0 - 2.8.2`) — Advisory GHSA-48c2-rrv3-qjmp "yaml is vulnerable to Stack Overflow via deeply nested YAML collections" (CVSS 4.3, CWE-674); effects `yaml-language-server`; fix path through `@astrojs/check@0.9.2`.
- **yaml-language-server** (transitive) — via `yaml`; effects `volar-service-yaml`; fix path through `@astrojs/check@0.9.2`.

### LOW / INFO findings

None.

## Hints recorded but not acted on

| Hint                    | Value                |
| ----------------------- | -------------------- |
| bootstrapper_confidence | first-class          |
| quality_override        | false                |
| path_taken              | standard             |
| self_check_answers      | null                 |
| team_size               | solo                 |
| deployment_target       | cloudflare-pages     |
| ci_provider             | github-actions       |
| ci_default_flow         | auto-deploy-on-merge |
| has_auth                | true                 |
| has_payments            | false                |
| has_realtime            | false                |
| has_ai                  | true                 |
| has_background_jobs     | false                |

## Next steps

Next: a future skill will set up agent context (CLAUDE.md, AGENTS.md). For now, your project is scaffolded and verified — happy hacking.

Useful manual steps in the meantime:
- `git init` (if you have not already) to start your own repo history.
- Review `CLAUDE.md.scaffold` against the existing `CLAUDE.md` and merge anything worth keeping (`diff CLAUDE.md CLAUDE.md.scaffold`).
- Upgrade Node to `>=22.12.0` to silence the `EBADENGINE` warnings and unblock `astro dev`/`build`/`wrangler`.
- Address audit findings per your project's risk tolerance — the full breakdown is above. Most fixes route through `npm audit fix` or a semver-major bump of `@astrojs/check`.
