# SBGlobal Plus — Canonical Development Branch

**Current checkpoint:** `Development/CORE_SERVICE_CHECKPOINT.md`
**Branch:** `docs/architecture-branch-2`

**Current status:** Development is in progress at the tested Core context/identity/guard kernel and concrete pooled PostgreSQL/RLS adapter. `Development/CORE_SERVICE_CHECKPOINT.md` owns current executable evidence and the next task; `Development/CORE_PERSISTENCE_ADAPTER_MAP.md` records concrete repository dependencies. Historical design/database PASS labels do not establish unimplemented adapter or production readiness.

The physical pre-development ZIP was waived by explicit owner direction under `UD-BACKUP-01`. This session does not claim that a ZIP was created. Any desired local clone/archive backup will be handled manually by the owner.

> **SBGlobal Plus — A World-Class, AI-Ready, AI-Extensible, AI-Powered, Enterprise-Grade, Multi-Tenant, Multi-Industry SaaS Platform.**
>
> **One Unified Enterprise Core → Multiple Equal First-Class Industry Suites → Tenants → Primary + Enabled Industries → Management Systems → Secure Web/Mobile/Desktop Experiences → AI-Powered Operations.**

## Historical design evidence and current SQL scope
- Product/design P0/P1: 0/0
- Current adapter binding gaps: see `Development/CORE_PERSISTENCE_ADAPTER_MAP.md`; earlier zero-gap claims apply to their historical design audit scope.
- 9/9 Current Supported Industries: PASS
- 41/41 Management Systems: PASS
- 165/165 named KPI/report metrics: mapped
- Development determinism: 9/9 YES
- QA determinism: 9/9 YES
- Tenant + Industry Context isolation: current SQL persistence, Core kernel negatives and real PostgreSQL pool reuse tested; full application security validation remains unfinished
- RawSourceCorpus: immutable / PASS

## Core product rules
- Exactly two logical Tenant mobile apps: Tenant Staff App + Tenant User App.
- RBAC is primary; ABAC only narrows/contextualizes.
- `industryContextId = null` never means all industries.
- Future Industry Framework is separate from the current nine and promotion-gated.
- One Unified Enterprise Core; no per-industry core forks.

## Active technology
Next.js 15 · React 19 · TypeScript 5.x · Node.js 22+ · Tailwind/Shadcn · PostgreSQL · Payload CMS 3 · Refine where explicitly justified · Next.js server default · NestJS only where justified · tRPC first-party · REST/OpenAPI external · Clerk preferred/Auth.js fallback · React Native+Expo · Tauri 2.0 · Expo Push/OneSignal · PostgreSQL outbox · pgvector · Vercel suitable workloads · Coolify + Dockerized VPS.

## Current Development evidence
[DEV-CORE-POSTGRES-001](Development/CORE_SERVICE_CHECKPOINT.md) records commit `0ada4283959ea4abe39a0980574e2dfdcb62e508`, Core run `34823407649` (**40 Core + 7 PostgreSQL tests PASS**) and Database run `34823407538` (**32 migrations / 26 verification files PASS**). Both workflows assert the tested branch commit.

## Historical all-stages audit evidence
- `Registers/ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md`
- `Registers/ALL_STAGES_FILE_COVERAGE_2026-09-13.md`
- `State/PROJECT_MANIFEST.json`

PostgreSQL+pgvector PASS: commit `2c36b43a7d55c6600b71f9714389e025a06df580`, Database Verify run `34800144921`, job `103841023234`. All 32 migrations and 26 verification files executed, including 0099. The workflow log asserts the tested branch commit; the completed all-stages audit and metadata closure are recorded in `Registers/ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md`.

## Historical phase evidence
- `Registers/PHASE1_RAWSOURCE_FOUNDATION_RECONCILIATION_2026-09-12.md`
- `Registers/PHASE2_ARCHITECTURE_REVALIDATION_2026-09-12.md`
- `Registers/PHASE3_DETAILED_DESIGN_REVALIDATION_2026-09-13.md`
- `Registers/PHASE4_CROSS_LAYER_TRACEABILITY_ISOLATION_2026-09-13.md`
- `Registers/FINAL_PRE_DEVELOPMENT_ADVERSARIAL_AUDIT_2026-09-13.md`
- `Registers/D-DECISIONS.md` → `UD-BACKUP-01`

## Delivery
Draft PR #2 remains review-only. `main` has not been changed by this continuation.

## Next
Specify the exact Authorization compiled-permission snapshot/version persistence contract and the Current Supported Industry presentation catalog contract, then implement their module-owned read adapters. Do not infer missing fields, broaden database grants, or join across module ownership. Core application services have started; API transports and UI remain unstarted.
