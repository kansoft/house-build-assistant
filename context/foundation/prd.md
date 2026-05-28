---
project: "HouseBuild Assistant"
version: 1
status: draft
created: 2026-05-25
context_type: greenfield
product_type: web-app
target_scale:
  users: medium
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 6
  hard_deadline: null
  after_hours_only: true
---

# HouseBuild Assistant — Product Requirements Document

## Vision & Problem Statement

An individual investor building their own house is the project manager of a construction site without the training or tooling that professional general contractors take for granted. At every stage transition — closing foundations before the team leaves, deciding whether plasterers can start, confirming that all conduit was run before walls are buried — they must answer "is this stage really done?" with a mix of memory, scattered notes, and word-of-mouth advice from the trades themselves (who have a conflict of interest in flagging their own rework). When something is missed, the cost surfaces after the trade has left the site: tear-out, callbacks, schedule slip, and the stress of not knowing what else they don't know.

Stage-gated, residential-construction-specific checklists do not exist as a product. Generic project trackers require the investor to author the checklist themselves — which assumes they already know what to check, the exact knowledge they lack. Forum threads and contractor advice are unstructured and partial. A purpose-built checklist that knows construction stages and the cross-trade dependencies between them, paired with a structured readiness assessment, is the missing tool.

## User & Persona

**Primary persona:** First-time individual investor building their own single-family house. Non-professional — they are not a contractor, architect, or kierownik budowy. They are paying for and overseeing the build, typically once in a lifetime. They are learning the domain as the build progresses, often under time pressure (trades scheduled, weather windows, financing milestones). They reach for this product at every stage transition: when a trade is about to finish or another is about to start, and they need to decide whether to close the current stage or hold it open.

## Success Criteria

### Primary

- An investor can sign up, create an investment, select a construction stage, see (or AI-generate) a checklist, mark items, and receive a structured readiness assessment ("ready to close" / "partially ready" / "has risks") that calls out missing or risky items by name. This end-to-end flow working = the product worked.

### Secondary

- AI-generated checklist suggestions are useful enough that the investor accepts (keeps) at least one AI-suggested item in 50%+ of sessions where AI is invoked. Validates that AI is value-additive rather than noise the user filters out.

### Guardrails

- **Data durability** — checklist progress (item state, custom items added by the user) is never silently lost between sessions. An investor who marks items over weeks of build time must be able to trust that what they marked stays marked.
- **No false confidence** — the readiness verdict must err toward "has risks" or "partially ready" over a premature "ready to close". A false "ready" is more harmful than a false "not ready", because the investor will let the trade leave the site.
- **Per-user data isolation** — no investor ever sees another investor's investments, checklists, or progress. Tenant-leak is a trust-killer.

## User Stories

### US-01: Investor assesses readiness of "Instalacje przed tynkami" stage

- **Given** a signed-in investor with an investment "Dom jednorodzinny" and current stage set to "Instalacje przed tynkami"
- **When** they open the stage's checklist, mark the items they have already verified on-site, optionally add a custom item ("Sprawdzić przepust pod kabel ogrodowy"), and request AI suggestions
- **Then** they see a live readiness indicator updating as they toggle items, and on clicking "Show detailed report" they see which items remain unchecked, which are flagged as risk items, and a one-line recommendation of the next step (close stage / hold and verify X / consult Y trade)

#### Acceptance Criteria

- The seeded checklist for "Instalacje przed tynkami" appears within ~1 second of stage selection
- Toggling an item visibly updates the readiness indicator without a perceptible delay
- A custom item added by the investor persists across sessions and contributes to the readiness assessment
- Requesting AI suggestions returns suggestions (or an explicit "no additional suggestions" message) within a bounded time; AI failure does not destroy any existing checklist state
- The detailed report names each missing/risk item rather than showing a generic "items missing" count
- The "ready to close" verdict is only shown when no risk items remain unchecked

## Functional Requirements

### Authentication

- FR-001: Investor can sign up with email + password. Priority: must-have
  > Socrates: Stands as written (batch-accepted alongside other routine auth/CRUD FRs). Email+password is the simplest path to per-user data; social-login deferred to v2.
- FR-002: Investor can sign in with email + password. Priority: must-have
  > Socrates: Stands as written (batch-accepted).
- FR-003: Investor can request a password reset via email. Priority: must-have
  > Socrates: Stands as written (batch-accepted). A multi-month build cannot afford permanent lockout from progress data.

### Investment management

- FR-004: Investor can create a named investment (e.g. "Dom jednorodzinny"). Priority: must-have
  > Socrates: Stands as written (batch-accepted). Naming supports future multi-investment users (e.g. building + planned extension).
- FR-005: Investor can list their own investments. Priority: must-have
  > Socrates: Stands as written (batch-accepted).
- FR-006: Investor can rename / edit an investment. Priority: must-have
  > Socrates: Stands as written (batch-accepted).
- FR-007: Investor can delete an investment (with confirmation). Priority: must-have
  > Socrates: Stands as written (batch-accepted). Confirmation guard plus per-user isolation makes hard delete acceptable for v1; soft-archive is a v2 concern.

### Construction stages

- FR-008: Investor can select the current stage for an investment from a fixed seeded taxonomy (10–12 stages — e.g. fundamenty, stan surowy otwarty, stan surowy zamknięty, dach, instalacje przed tynkami, instalacje po tynkach, tynki, wylewki, …). Priority: must-have
  > Socrates: Counter-argument considered: "fixed taxonomy may miss real builds (retrofit, modular, energy-efficient)." Resolution: kept; the taxonomy is the product knowledge — but FR-021 adds a custom-stage escape hatch so unusual builds are not blocked.
- FR-009: Investor can change the current stage at any time (no enforced linear progression). Priority: must-have
  > Socrates: Counter-argument considered: "enforced progression would surface 'you skipped X' warnings." Resolution: stands as written; real builds run multiple trades in parallel (electrical + plumbing + roofing can overlap), enforcement would model construction wrong.

### Checklist items

- FR-010: Investor sees a seeded default checklist for the currently selected stage. Priority: must-have
  > Socrates: Stands as written (batch-accepted). The seeded baseline is the value-add; AI-only would be just generic chat.
- FR-011: Investor can mark any checklist item (default or custom) as done / not-done. Priority: must-have
  > Socrates: Stands as written (batch-accepted). Core interaction.
- FR-012: Investor can add a custom checklist item to the current stage. Priority: must-have
  > Socrates: Stands as written (batch-accepted). The escape hatch when seeded list misses a build-specific concern.
- FR-013: Investor can edit a custom checklist item's text. Priority: must-have
  > Socrates: Stands as written (batch-accepted).
- FR-014: Investor can delete a custom checklist item (with confirmation). Priority: must-have
  > Socrates: Stands as written (batch-accepted).
- FR-015: Default (seeded) checklist items are read-only — they cannot be edited or deleted, only checked/unchecked or marked N/A (per FR-022). Priority: must-have
  > Socrates: Counter-argument considered: "'mark as not applicable' should be allowed without deletion (e.g. no garage → skip 'przewody pod bramę garażową')." Resolution: revised; FR-022 added so default items can be marked N/A. Items marked N/A are excluded from the readiness assessment.

### AI suggestions

- FR-016: Investor can invoke AI to suggest additional checklist items on top of the seeded default for the current stage. Priority: must-have
  > Socrates: Counter-argument considered: "AI hallucinates construction advice — risk of wrong checklist; AI should be cited or opt-in only." Resolution: stands as written; per-item accept/dismiss (FR-017) is the hallucination guard. Source-citation and opt-in defaults are recorded as Open Questions for downstream design.
- FR-017: Investor can accept or dismiss each AI-suggested item individually before it joins the checklist. Priority: must-have
  > Socrates: Counter-argument considered: "'accept all' shortcut + per-item undo would be faster." Resolution: stands as written; individual review is the safety mechanism that makes FR-016 acceptable — bulk-accept would defeat the hallucination guard.
- FR-018: AI-suggested items, once accepted, are treated as custom items (editable and deletable per FR-013/FR-014). Priority: must-have
  > Socrates: Counter-argument considered: "retain 'AI-suggested' origin tag for audit." Resolution: stands as written; simpler data model wins for v1. Origin tracking is a v2 concern.

### Readiness assessment

- FR-019: Investor sees an always-visible readiness indicator (ready to close / partially ready / has risks) that re-evaluates after every item toggle. Priority: must-have
  > Socrates: Counter-argument considered: "live indicator may create premature 'ready' gaming — investor checks items to flip the indicator without doing the work." Resolution: stands as written; the indicator is core UX value, and the guardrail "no false confidence" is enforced by the rule's bias toward "has risks" (see Business Logic).
- FR-020: Investor can open a detailed readiness report listing missing items, risk items, and a recommended next step. Priority: must-have
  > Socrates: Counter-argument considered: "always-visible inline so the report isn't hidden behind a click." Resolution: stands as written; the click is the deliberate moment of evaluation. UI placement is a downstream design choice.

### Escape hatches and edge cases

- FR-021: Investor can define a custom stage when no seeded taxonomy entry fits their build (e.g. retrofit, modular, energy-efficient). A custom stage starts with an empty checklist; the investor can add custom items (FR-012) or invoke AI suggestions (FR-016). Priority: must-have
  > Socrates: Added in response to FR-008 challenge. Custom stages are excluded from cross-stage dependency hints (since the taxonomy doesn't know them), but the per-stage readiness rule still applies.
- FR-022: Investor can mark any checklist item (default or custom) as "not applicable" for their build. N/A items are visually distinct, do not require checking, and are excluded from the readiness assessment. Priority: must-have
  > Socrates: Added in response to FR-015 challenge. Solves the "no garage → 'przewody pod bramę garażową' shouldn't block readiness" case without violating the default-items-read-only rule.

## Non-Functional Requirements

- A request for AI suggestions either returns within a bounded user-perceived time, or surfaces an explicit timeout message that lets the investor continue with the existing checklist. AI failure under any condition leaves the existing checklist state intact (no items lost, no toggles reverted).
- The readiness indicator reflects every item toggle within continuous-feedback latency — the investor perceives the verdict update as immediate, without any visible interruption of the stage view.
- User-facing content — stage names, seeded checklist items, UI labels, and AI-suggested item text — is in Polish. The product is Polish-only for v1; later locale addition does not require re-authoring seeded content (no Polish strings are embedded inside the readiness logic itself).
- Checklist progress (item state, custom items, N/A flags, AI-accepted items) survives session boundaries, browser restarts, and device switches for the same authenticated investor. Progress loss between sessions is a regression at the highest severity.
- An investor never sees another investor's investments, checklists, or progress at any system boundary — including direct URL access, list views, and AI prompts (AI calls do not leak data across tenants).

## Business Logic

The app classifies each construction stage's readiness — ready to close, partially ready, or has risks — by checking which of the stage's critical checklist items remain unchecked, and surfaces the missing items by name so the investor can decide whether to release the trade.

Inputs the rule consumes (from the investor's perspective): the current stage selected for the investment, the set of checklist items for that stage (seeded defaults plus any items the investor has added or accepted from AI suggestions), and the status of each item — checked, unchecked, or marked not-applicable. Each item also carries a criticality flag set when the seeded content was authored (or, for custom and AI-accepted items, defaulted to "standard" unless the investor opts to flag it as critical).

The rule's output is a verdict for the stage with three discrete values:

- **Ready to close** — every critical item is checked or marked N/A, AND every standard item is checked or marked N/A. The investor sees an explicit "you can safely release the trade for this stage" recommendation.
- **Partially ready** — every critical item is checked or marked N/A, but at least one standard item remains unchecked. The investor sees the unchecked standard items by name; the recommendation is "stage is safe to close but consider these items before next stage starts".
- **Has risks** — at least one critical item remains unchecked. The investor sees the unchecked critical items called out by name as risks; the recommendation is "do not close this stage yet; verify these items first".

The investor encounters the verdict in two places: (a) an always-visible indicator on the stage view that updates after every item toggle, and (b) a detailed report (opened on explicit click) that lists the unchecked items by name, separates risks from standard misses, and shows the next-step recommendation. The rule is biased toward "has risks" over "ready to close" — false negatives are tolerable (the investor double-checks something they already did), but false positives are the failure mode that destroys trust (the investor releases the trade with critical work undone).

The rule evaluates each stage standalone in v1. It does not look back at prior stages' items or forward to upcoming stages' prerequisites; cross-stage dependency hints are explicitly deferred to a later version.

## Access Control

Multi-user web application with email + password authentication. Each user owns one or more building investments and the checklists / progress within them; a user can only see and modify their own data. No role hierarchy in MVP — no admin, no contractor / kierownik budowy role, no read-only invited viewers. Unauthenticated access to any investment-scoped route returns the user to sign-in / sign-up.

Sign-up is open (anyone with an email can register); sign-in is email + password. Password reset is required (a multi-month build cannot afford to lock the investor out of their own data).

## Non-Goals

### Functional non-goals (out of scope for v1)

- **Budget, cost, and invoice tracking** — cost management is a separate product class; HouseBuild Assistant is a readiness tool, not a budgeting tool.
- **Trade scheduling and ekipy calendar** — coordination of trades over time is a calendar product; v1 focuses on stage-readiness, not when-which-trade-arrives.
- **OCR of invoices, documents, or site photos** — no document ingestion in v1.
- **Photo documentation module** — investors can take photos elsewhere; v1 does not store or organize site photos.
- **Native mobile app** — web-only for v1 (responsive layout is acceptable; a packaged native app is v2+).
- **Multi-user sharing, contractor view, role hierarchy (inwestor / kierownik budowy / wykonawca)** — per-user isolation only; no invited viewers, no shared investments, no contractor-side UX in v1.
- **Contractor marketplace** — out of scope; HouseBuild does not introduce trades to investors.
- **Chat with trades / ekipy** — no in-app messaging.
- **Integrations with stores, wholesalers, or external systems** — no purchasing, no inventory, no third-party data ingest in v1.
- **Advanced PDF reports** — v1's "report" is in-app only; no PDF export, no shareable links.
- **Smart home or instalacje management** — HouseBuild is about building the house, not operating it once built.
- **Cross-stage dependency hints** — v1 evaluates each stage standalone (per business-logic decision). Hints like "before tynki, verify all instalacje items" are deferred to v2.
- **AI-origin tracking on accepted items** — once an AI suggestion is accepted it becomes indistinguishable from a manual custom item; no audit trail of AI vs human-origin items in v1.

### Non-functional non-goals (quality dimensions v1 does NOT aim for)

- **Offline-capable usage** — the web app requires a network connection; v1 does not aim for any offline-functional behavior.
- **Multi-language at launch** — Polish-only for v1. Structure permits later locale addition but no other locales are shipped.

## Open Questions

1. **Who authors the seeded checklist content for the 10–12 construction stages?** — Owner: user. Required before v1 launch. The taxonomy IS the product value (per FR-008 Socrates resolution); empty or low-quality seeded content makes the product hollow regardless of features built. Block: yes.
2. **What is the criticality flag distribution per seeded item?** — Owner: user, co-authored with the checklist content. Each seeded item needs `critical | standard` set when authored; the readiness rule depends on this. Block: yes (business logic cannot operate without this data).
3. **Bounded AI suggestion latency — what is the user-perceived timeout threshold?** — Owner: design / downstream. NFR captures "bounded" without naming a number; downstream design picks the value (typical web-AI patterns are 5–15s). Block: no.
4. **Should AI suggestions be sourced or cited?** — Surfaced during FR-016 Socrates challenge. Resolution: deferred — v1 ships suggestions without source attribution, but the product may need this if quality complaints surface. Block: no.
5. **Should AI suggestions default to opt-in or always-available?** — Surfaced during FR-016 Socrates challenge. Resolution: deferred — v1 makes AI invokable on demand; default state is a downstream UX choice. Block: no.
6. **Custom-stage UX (FR-021): how does the investor describe their stage so the readiness rule still makes sense?** — Owner: design. Custom stages start empty; the investor has to add items themselves or rely on AI generation. Open: does the investor name the stage in plain text, or pick a "based on" parent from the taxonomy? Block: no.
7. **N/A marker UX (FR-022): how is "not applicable" visually distinct from "not checked"?** — Owner: design. Critical that the rule output is unambiguous to the investor. Block: no.
8. **Polish-only at launch — when (if ever) does English / other locales land?** — Owner: user / product roadmap. Block: no.
