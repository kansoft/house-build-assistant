---
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
---

## Why this stack

Solo investor-tool MVP shipping in 6 weeks of after-hours work, with email+password auth, per-user data isolation, durable checklist progress across multi-month build timelines, and AI-suggested checklist items on demand. The 10x Astro Starter is the recommended default for `(web, js)` and clears all four agent-friendly gates; its Supabase backbone delivers Postgres + auth + row-level security out of the box, covering the auth and per-user isolation NFRs without bespoke wiring. Cloudflare Pages/Workers is the starter's first deployment default and matches the short timeline — cheapest path to first deploy. AI suggestions land as a bring-your-own integration on top of the starter; no payments, no realtime, no background jobs in scope per PRD non-goals. CI on GitHub Actions with auto-deploy-on-merge matches the standard shape for a solo build. Bootstrapper confidence is first-class; expect mostly-smooth scaffolding with occasional manual steps.
