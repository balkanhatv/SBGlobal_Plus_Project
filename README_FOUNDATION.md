# SBGlobal Plus — Canonical Development Branch

**Current checkpoint:** `Development/CORE_SERVICE_CHECKPOINT.md`  
**Branch:** `docs/architecture-branch-2`

**Current status:** Development is in progress at `DEV-AUTHZ-POLICY-GRAMMAR-001`. Core context/identity/guards, pooled PostgreSQL/RLS, DD-041/DD-042 read bindings, DD-043 protected PLATFORM_GLOBAL identity/SQL floor, DD-044 Clerk session-security, `DEV-AUTHZ-PDP-001` PLATFORM_GLOBAL Authorization persistence and the deterministic Permission Set v1 / ABAC Expression v1 grammar are implemented and tested within their bounded scope. Historical PASS labels do not establish Authorization reader/PDP evaluator/compiler, Commercial integration, transport/UI or production readiness.

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
- DEV-AUTHZ-POLICY-GRAMMAR-001 Permission Set v1 + ABAC Expression v1: implemented/tested; reader/evaluator/compiler not claimed.
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
[DEV-AUTHZ-POLICY-GRAMMAR-001](Development/CORE_SERVICE_CHECKPOINT.md) records verified executable `1b0f90dc900e0ab49cde2f8305f11cfadadae31c`, tree `a48a2b8cd4d9447522ca2c5721d23a85175dbfa8`: Core Service Verify `35247193977` PASS (**71/71 Core/server tests; 13/13 real PostgreSQL tests**) and Database Verify `35247193986` PASS (**35 migrations / 29 verification files**). Exact tested HEAD/tree are asserted by CI.

The policy grammar is schema-version-aligned, canonical, bounded and data-only. It allows only governed permission facts, allowlisted server-derived ABAC attributes/operators and exact/terminal-prefix permission patterns. Arbitrary JavaScript/eval, SQL, shell, regex/glob ASTs, templates, network/filesystem/provider calls and dynamic object traversal are rejected.

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
Implement **only the Authorization read store** for exact tenant/platform CURRENT compiled snapshots plus applicable ACTIVE ABAC policies. Persisted permission payloads, ABAC expressions and permission patterns must validate through the locked v1 grammar and failures must be fail-closed. PDP/ABAC evaluation follows only after this reader is independently verified; compiler, Commercial validation, DD-06 transports, broader repositories, runtime rate limiter/idempotency, UI/mobile/desktop and deployment remain unfinished.
