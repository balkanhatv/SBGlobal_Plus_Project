# SBGlobal Plus — Canonical Development Branch

**Current checkpoint:** `Development/CORE_SERVICE_CHECKPOINT.md`  
**Branch:** `docs/architecture-branch-2`

**Current status:** Development is in progress at `DEV-AUTHZ-EVAL-001`. The Core/context/SQL/session-security chain, PLATFORM_GLOBAL Authorization persistence, deterministic policy grammar, governed read store and DD-045 fail-closed Authorization evaluator floor are implemented/tested within bounded scope. Compiler publication, true RESTRICT payload/reducer semantics, concrete Commercial facts/integration, transports/UI and production readiness are not complete.

> **SBGlobal Plus — A World-Class, AI-Ready, AI-Extensible, AI-Powered, Enterprise-Grade, Multi-Tenant, Multi-Industry SaaS Platform.**
>
> **One Unified Enterprise Core → Multiple Equal First-Class Industry Suites → Tenants → Primary + Enabled Industries → Management Systems → Secure Web/Mobile/Desktop Experiences → AI-Powered Operations.**

## Current Development evidence
Verified executable `96b051ca6feef26d3f8534ce6d3240f6843dc31e`, tree `1e9d6151cc4fa01232b4ee1e7397a33fa81249b0`.
- Core Service Verify `35281558425`: **87/87 Core/server**, **15/15 PostgreSQL** PASS.
- Database Verify `35281558472`: **36 migrations / 30 verification files** PASS.
- SQL Industry scope: **9 Industries / 41 canonical Management Systems / 181 Industry tables**.

The evaluator consumes exact CURRENT compiled snapshots. RBAC DENY is final; ABAC never widens. Matching persisted DENY denies. Matching RESTRICT also denies until an enforceable governed restriction payload/reducer exists. Tenant stale permissionVersion/role context and unavailable required policy facts fail closed; PLATFORM_GLOBAL does not invent a tenant entitlement snapshot version.

## Core product rules
- Exactly two logical Tenant mobile apps: Tenant Staff App + Tenant User App.
- RBAC is primary; ABAC only narrows/contextualizes.
- `industryContextId = null` never means all industries.
- Future Industry Framework is separate from the current nine and promotion-gated.
- One Unified Enterprise Core; no per-industry core forks.
- RawSourceCorpus remains immutable.
- Draft PR #2 remains review-only; `main` remains unmerged.

## Active technology
Next.js 15 · React 19 · TypeScript 5.x · Node.js 22+ · Tailwind/Shadcn · PostgreSQL · Payload CMS 3 · Refine where explicitly justified · Next.js server default · NestJS only where justified · tRPC first-party · REST/OpenAPI external · Clerk preferred/Auth.js fallback · React Native+Expo · Tauri 2.0 · Expo Push/OneSignal · PostgreSQL outbox · pgvector · Vercel suitable workloads · Coolify + Dockerized VPS.

## Next
Implement **only the dedicated Authorization compiler write boundary** required by DD-041. It must publish/invalidate exact CURRENT tenant/platform compiled snapshots monotonically through a least-privilege writer role/policy; runtime app roles stay read-only. Commercial integration and DD-06 transports follow later.
