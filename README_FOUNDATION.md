# SBGlobal Plus — Canonical Development Branch

**Current checkpoint:** `Development/CORE_SERVICE_CHECKPOINT.md`  
**Branch:** `docs/architecture-branch-2`

**Current status:** Development is in progress at `DEV-AUTHZ-READ-STORE-001`. Core context/identity/guards, pooled PostgreSQL/RLS, DD-041/DD-042 read bindings, DD-043 protected PLATFORM_GLOBAL identity/SQL floor, DD-044 Clerk session-security, `DEV-AUTHZ-PDP-001` PLATFORM_GLOBAL Authorization persistence, deterministic Permission Set v1 / ABAC Expression v1 grammar, migration 0036 PLATFORM_GLOBAL ABAC write-boundary hardening, and the governed Authorization read store are implemented and tested within their bounded scope. Historical PASS labels do not establish the PDP evaluator/compiler, Commercial integration, transport/UI or production readiness.

The physical pre-development ZIP was waived by explicit owner direction under `UD-BACKUP-01`. This session does not claim that a ZIP was created. Any desired local clone/archive backup will be handled manually by the owner.

> **SBGlobal Plus — A World-Class, AI-Ready, AI-Extensible, AI-Powered, Enterprise-Grade, Multi-Tenant, Multi-Industry SaaS Platform.**
>
> **One Unified Enterprise Core → Multiple Equal First-Class Industry Suites → Tenants → Primary + Enabled Industries → Management Systems → Secure Web/Mobile/Desktop Experiences → AI-Powered Operations.**

## Historical design evidence and current SQL scope
- Product/design P0/P1: 0/0
- DD-041 compiled Authorization and DD-042 Current Supported Industry read bindings: implemented/tested.
- DD-043 protected PLATFORM_GLOBAL scope floor: implemented/tested.
- DD-044 Clerk session-security: implemented/tested in the current bounded Core scope.
- DEV-AUTHZ-PDP-001 PLATFORM_GLOBAL Authorization persistence prerequisite: implemented/tested; evaluator/compiler not claimed.
- DEV-AUTHZ-POLICY-GRAMMAR-001 Permission Set v1 + ABAC Expression v1: implemented/tested.
- DEV-AUTHZ-READ-STORE-001 exact CURRENT tenant/platform snapshot + ACTIVE ABAC policy reader: implemented/tested; evaluator/compiler not claimed.
- 9/9 Current Supported Industries: PASS
- 41/41 Management Systems: PASS
- 165/165 named KPI/report metrics: mapped
- Development determinism: 9/9 YES
- QA determinism: 9/9 YES
- Tenant + Industry Context isolation: current SQL persistence, Core kernel negatives and real PostgreSQL pool reuse/read-store tests pass; full application security validation remains unfinished
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
[DEV-AUTHZ-READ-STORE-001](Development/CORE_SERVICE_CHECKPOINT.md) records verified executable `4916b30359cea056a352245176dcb33f739fc0a0`, tree `16e1a322620de4a0591222356e6db3dd5f0428bf`: Core Service Verify `35252274497` PASS (**75/75 Core/server tests; 15/15 real PostgreSQL tests**) and Database Verify `35252274557` PASS (**36 migrations / 30 verification files**). Exact tested HEAD/tree are asserted by CI.

The read store consumes only the locked, bounded v1 grammar; tenant/platform paths do not cross-fallback, sibling Industry isolation is preserved, and missing/invalid/version/scope/dependency states fail closed. No PDP decision evaluation or compiler publication is claimed.

## Historical all-stages audit evidence
- `Registers/ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md`
- `Registers/ALL_STAGES_FILE_COVERAGE_2026-09-13.md`
- `State/PROJECT_MANIFEST.json`

PostgreSQL+pgvector historical audit PASS: commit `2c36b43a7d55c6600b71f9714389e025a06df580`, Database Verify run `34800144921`, job `103841023234`. All 32 migrations and 26 verification files executed, including 0099. This is historical evidence only; current executable evidence is the checkpoint above.

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
Implement **only the fail-closed `AuthorizationDecisionPort` PDP/ABAC evaluator + DD-17 AUTH acceptance** against the verified read store. Compiler, Commercial validation, DD-06 transports, broader repositories, runtime rate limiter/idempotency, UI/mobile/desktop and deployment remain unfinished.
