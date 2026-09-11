# SBGlobal Plus — A-00 ARCHITECTURE OVERVIEW
**Document ID:** A-00 · **Version:** 1.2 · **Status:** ARCHITECTURE BASELINE (CP-A1-002) · **Date:** 10-09-2026
**Governed by:** MASTER_INSTRUCTION v2.5 + MASTER_PROMPT v2.5 · **Foundation baseline:** CP-F1-005 (FOUNDATION CERTIFIED) · **Phase:** Architecture (HOW). Foundation (WHAT/WHY/WHO) is authoritative and unmodified.

---

## 1. Purpose & Boundary
This document set defines the high-level enterprise architecture of SBGlobal Plus: boundaries, components, responsibilities, interactions, flows, ownership, security boundaries and technology choices. It contains no Detailed Design (endpoint-level contracts, schemas/migrations, screen inventories, code) — those are deferred per §26A/§26B and named per document under "Deferred to Detailed Design".

Non-duplication rule (inherited from F-00 §3): each architectural fact lives in exactly one A-document; all others cross-reference it (`→ A-xx §y`). Foundation facts are referenced (`→ F-xx §y`), never restated as authority.

**Repository-state rule:** the current target set is **A-00 through A-12**; A-10/A-11/A-12 are created in this reconciliation and are current Architecture evidence.

## 2. Architecture Vision
One Unified Enterprise Core → Multiple First-Class Industries → Multiple Tenants → Configurable & Modular Management Systems → Secure Web/Mobile/Desktop Experiences → AI-Powered Business Operations.

All nine industries (F-07…F-09, F-12, F-13) are first-class and equal. There is exactly one Core, one codebase, one canonical data architecture; industries and tenants are activation/configuration dimensions, never forks (→ A-09, ADR-012).

## 3. Layered System Model (canonical)
```
┌─────────────────────────────────────────────────────────────────┐
│ L6 EXPERIENCE   Public Site (Next.js 15 + Payload CMS 3)       │
│                 Platform App (Next.js 15) · Tenant App          │
│                 (Next.js 15) · Mobile (React Native / Expo)     │
│                 · Desktop (Tauri 2.0) · Ops Admin              │
│                 (Next.js 15 + Shadcn UI)                        │
├─────────────────────────────────────────────────────────────────┤
│ L5 EXPERIENCE-API  tRPC (first-party) · REST/OpenAPI            │
│                    compatibility for external integrations      │
│                    · Webhooks out · Push (Expo Push/OneSignal)   │
├─────────────────────────────────────────────────────────────────┤
│ L4 UNIFIED CORE (Next.js 15 application core)                   │
│    TypeScript 5.x · Node.js 22 · Identity·Tenancy·AuthZ         │
│    (RBAC+ABAC)·Entitlement·Billing·Config·Workflow·Notification │
│    ·Document·Search·Audit                                       │
├─────────────────────────────────────────────────────────────────┤
│ L3 INDUSTRY CAPABILITY MODULES (9 suites; Management Systems    │
│    as Core-hosted modules, entitlement-activated per tenant)    │
├─────────────────────────────────────────────────────────────────┤
│ L2 AI PLATFORM   AI Gateway · Provider Abstraction · RAG        │
│                  (pgvector) · Agents/Skills/Tools · Guardrails  │
├─────────────────────────────────────────────────────────────────┤
│ L1 DATA          PostgreSQL (RLS multi-tenant) · Object storage │
│                  · Outbox/Event log · Regional Data Homes       │
├─────────────────────────────────────────────────────────────────┤
│ L0 INFRASTRUCTURE  Vercel for suitable web workloads            │
│                    · Coolify + Dockerized VPS for self-hosted   │
│                    workloads · Observability stack               │
└─────────────────────────────────────────────────────────────────┘
```
Every request descends through L6→L5→L4 with the Tenant Context established at L5 entry and enforced at L4 and L1 (→ A-02). Industry modules (L3) run inside the Core process boundary but behind module contracts (→ A-01 §4).

## 4. Architecture Principles
1. **One Core, no forks** — one deployable Core; industries/tenants are configuration (ADR-001, ADR-012).
2. **Tenant isolation is enforced in depth** — token, application guard, and PostgreSQL Row-Level Security must all agree (→ A-02 §4).
3. **RBAC-primary, ABAC-complementary** (MI v2.5 §13; → A-03 §4).
4. **Contracts over calls** — modules interact via typed interfaces and domain events, never via foreign table access (→ A-01 §5, A-05 §3).
5. **Entitlement gates everything commercial** — plan→subscription→license→entitlement→runtime guard (→ A-04).
6. **AI is a platform capability, not a bolt-on** — every AI use passes the AI Gateway; providers are swappable (→ A-07).
7. **Evidence-based status** — no scope claims a status above its evidence (§33A; → A-12 §5).
8. **Deployable through approved managed or self-hosted topologies** — Vercel for suitable web workloads and Coolify + Dockerized VPS for self-hosted workloads (→ A-10).

## 5. Architecture Document Map
**Target/current architecture set:** **A-00…A-12**.

| ID | Owns | Repository status |
|---|---|---|
| A-00 | This overview: layered model, principles, context, map | PRESENT · BASELINE |
| A-01 | Unified Core: module catalog, boundaries, contracts, request flow | PRESENT · BASELINE |
| A-02 | Multi-tenancy: context resolution, isolation, residency, tenant lifecycle | PRESENT · BASELINE |
| A-03 | Identity, AuthN (Clerk), RBAC+ABAC, security zones, compliance | PRESENT · BASELINE |
| A-04 | Commercial: plan/subscription/license/entitlement enforcement | PRESENT · CP-A1-002 |
| A-05 | Data: categories, ownership, storage topology, lifecycle, governance | PRESENT · CP-A1-002 |
| A-06 | API (tRPC/REST), events (outbox), integrations, webhooks | PRESENT · CP-A1-002 |
| A-07 | AI: gateway, provider abstraction, RAG, agents, guardrails | PRESENT · CP-A1-002 |
| A-08 | Experience: web (Next.js), mobile (React Native/Expo), desktop (Tauri 2.0), admin (Shadcn UI/Refine), CMS (Payload 3) | PRESENT · CP-A1-002 |
| A-09 | Industry suites on the Unified Core; MS activation model | PRESENT · CP-A1-002 |
| A-10 | Infrastructure, deployment topologies, scalability, resilience | PRESENT · REVALIDATED |
| A-11 | Observability, operations, reliability | PRESENT · REVALIDATED |
| A-12 | Decisions, dependencies, constraints, trade-offs | PRESENT · AUTHORITATIVE ADR REGISTER |

Architecture registers/audit documents for the Architecture phase are not yet fully present and will be added with the remaining gate evidence package.

## 6. System Context (external actors & systems)
Actors: Platform Operator staff · Tenant admins/staff/end-customers per industry (F-02 actors) · Visitors. External systems: identity provider (Clerk), payment gateways, AI providers, email/SMS/push providers (Expo Push/OneSignal), government/industry integrations per suite (→ A-06 §5), object storage, DNS/CDN.

## 7. Traceability & Phase Boundary
Every A-document carries a "Traces to" header and is covered by the current Architecture traceability register (`Registers/ARCHITECTURE_TRACEABILITY_MATRIX.md`). Architecture introduces no new business scope: where an architectural completion is required, it must be labelled as a decision in A-12 (provenance `[AC]`-equivalent for the Architecture phase). Detailed Design, Development, Testing and Deployment implementation remain future phases (§26A).

**Current technology governance:** `UD-TECH-01` plus the later user-directed refinement recorded in `D-DECISIONS.md` govern the current approved stack. RawSourceCorpus remains immutable historical/source corpus and is not rewritten to match it.
