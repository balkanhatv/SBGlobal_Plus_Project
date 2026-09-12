# SBGlobal Plus — Project Foundation / Architecture / Detailed Design Branch

**Current status: PHASE 1 FOUNDATION PASS · PHASE 2 ARCHITECTURE PASS · PHASE 3 DETAILED DESIGN PASS · PHASE 4 CROSS-LAYER PASS · DEVELOPMENT NOT YET AUTHORIZED · checkpoint `PHASE4-CROSS-LAYER-REVALIDATED`** on `docs/architecture-branch-2`.

> **SBGlobal Plus — A World-Class, AI-Ready, AI-Extensible, AI-Powered, Enterprise-Grade, Multi-Tenant, Multi-Industry SaaS Platform.**
>
> **One Unified Enterprise Core → Multiple Equal First-Class Industry Suites → Tenants → Primary + Enabled Industries → Management Systems → Secure Web/Mobile/Desktop Experiences → AI-Powered Operations.**

All nine Current Supported Industries are equal first-class suites. Healthcare is not a template, benchmark or default.

## Current truth
- Phase 1 freshly reconciled the complete immutable RawSourceCorpus against F-00…F-15 and corrected missed/compressed Foundation requirements.
- Phase 2 freshly revalidated A-00…A-12 and ADR-001…ADR-020 against the corrected Foundation.
- Phase 3 freshly read all 55 DetailedDesign files, all nine Industry DD artifacts and 41 MS evidence; material upstream deltas were propagated to exact contracts/tests.
- Phase 4 freshly revalidated cross-layer traceability, Tenant+Industry isolation and Development/QA determinism.
- Foundation, Architecture and Detailed Design gates are PASS.
- Development remains blocked only until repository/checkpoint-backup closure and the final independent pre-development adversarial gate are completed.

## Canonical evidence
- Phase 1: `Registers/PHASE1_RAWSOURCE_FOUNDATION_RECONCILIATION_2026-09-12.md`
- Phase 2: `Registers/PHASE2_ARCHITECTURE_REVALIDATION_2026-09-12.md`
- Phase 3: `Registers/PHASE3_DETAILED_DESIGN_REVALIDATION_2026-09-13.md`
- Phase 4: `Registers/PHASE4_CROSS_LAYER_TRACEABILITY_ISOLATION_2026-09-13.md`
- Isolation: `Registers/ISOLATION_ATTACK_MATRIX.md`
- DD final audit: `DetailedDesign/DD-20D_OVERALL_DETAILED_DESIGN_AUDIT.md`
- DD traceability: `DetailedDesign/DD-30_FINAL_REQUIREMENT_TRACEABILITY_AUDIT.md`
- DD determinism: `DetailedDesign/DD-31_FINAL_DEVELOPMENT_QA_DETERMINISM.md`

## Active technology — UD-TECH-01
Next.js 15 · React 19 · TypeScript 5.x · Node.js 22+ · Tailwind/Shadcn · PostgreSQL · Payload CMS 3 · Refine where explicitly justified · Next.js server default · NestJS only where justified · tRPC first-party · REST/OpenAPI external · Clerk preferred/Auth.js fallback · React Native+Expo · Tauri 2.0 · Expo Push/OneSignal · PostgreSQL outbox · pgvector · Vercel suitable workloads · Coolify + Dockerized VPS regional/self-hosted workloads.

Historical Laravel/PHP/Filament/MySQL-primary/Flutter/PM2/cPanel assumptions remain source/history only where preserved.

## Current product invariants
- Exactly two logical Tenant mobile apps per Tenant + enabled Industry Experience: **Tenant Staff App** and **Tenant User App**.
- `industryContextId = null` never means all industries.
- RBAC is primary; ABAC only narrows/contextualizes.
- Future Industry Framework is separate from the current nine and requires explicit governed promotion before live Tenant activation.
- RawSourceCorpus remains immutable.

## Repository status
`main` contains a historical PR #1 merge at `3911590ff2020993ce51b32d7b091efd6f5f466f`. No Phase 1–4 work merged `main`. Current working branch is ahead of `main`; final merge remains approval-gated.

Historical `DD-F5-RECERTIFIED` and prior READY labels remain provenance only; current authority is the Phase 1→4 evidence above.

## Next
**Phase 5 — repository/state/checkpoint backup closure**, then the **final independent pre-development adversarial gate**. Development starts only after that final gate explicitly authorizes it.
