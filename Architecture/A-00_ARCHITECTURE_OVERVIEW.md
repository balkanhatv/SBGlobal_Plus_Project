# SBGlobal Plus — A-00 ARCHITECTURE OVERVIEW
**Document ID:** A-00 · **Version:** 1.1 · **Status:** ARCHITECTURE BASELINE (CP-A1-001) · **Date:** 09-09-2026
**Governed by:** MASTER_INSTRUCTION v2.5 + MASTER_PROMPT v2.5 · **Foundation baseline:** CP-F1-005 (FOUNDATION CERTIFIED) · **Phase:** Architecture (HOW). Foundation (WHAT/WHY/WHO) is authoritative and unmodified.

---

## 1. Purpose & Boundary
This document set defines the high-level enterprise architecture of SBGlobal Plus: boundaries, components, responsibilities, interactions, flows, ownership, security boundaries and technology choices. It contains no Detailed Design (endpoint-level contracts, schemas/migrations, screen inventories, code) — those are deferred per §26A/§26B and named per document under "Deferred to Detailed Design".

Non-duplication rule (inherited from F-00 §3): each architectural fact lives in exactly one A-document; all others cross-reference it (`→ A-xx §y`). Foundation facts are referenced (`→ F-xx §y`), never restated as authority.

**Repository-state rule:** the Architecture directory currently contains **A-00 through A-03 only**. A-04 through A-12 are planned architecture documents referenced by the target architecture map but are **not yet present in this branch** and must not be represented as completed/available until actually created and verified.

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
│                    · Webhooks out · Push (Expo Push / FCM)      │
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
│ L0 INFRASTRUCTURE  PM2-managed VPS / compatible hosting         │
│                    (Optional Docker or Vercel etc. dependency)   │
│                    · Observability stack                        │
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
8. **Deployable two ways** — managed SaaS and self-hosted VPS/PM2 from the same application artifacts; Docker and Vercel are optional and never mandatory (→ A-10).

## 5. Architecture Document Map
**Target architecture set:** A-00…A-12. **Current repository availability:** A-00…A-03 only.

| ID | Owns | Repository status |
|---|---|---|
| A-00 | This overview: layered model, principles, context, map | PRESENT · BASELINE |
| A-01 | Unified Core: module catalog, boundaries, contracts, request flow | PRESENT · BASELINE |
| A-02 | Multi-tenancy: context resolution, isolation, residency, tenant lifecycle | PRESENT · BASELINE |
| A-03 | Identity, AuthN (Clerk), RBAC+ABAC, security zones, compliance | PRESENT · BASELINE |
| A-04 | Commercial: plan/subscription/license/entitlement enforcement | PLANNED · NOT PRESENT |
| A-05 | Data: categories, ownership, storage topology, lifecycle, governance | PLANNED · NOT PRESENT |
| A-06 | API (tRPC/REST), events (outbox), integrations, webhooks | PLANNED · NOT PRESENT |
| A-07 | AI: gateway, provider abstraction, RAG, agents, guardrails | PLANNED · NOT PRESENT |
| A-08 | Experience: web (Next.js), mobile (React Native/Expo), desktop (Tauri 2.0), admin (Shadcn UI), CMS (Payload 3) | PLANNED · NOT PRESENT |
| A-09 | Industry suites on the Unified Core; MS activation model | PLANNED · NOT PRESENT |
| A-10 | Infrastructure, deployment topologies, scalability, resilience | PLANNED · NOT PRESENT |
| A-11 | Observability, audit, operations | PLANNED · NOT PRESENT |
| A-12 | Decisions (ADR-001…), dependencies, constraints, trade-offs | PLANNED · NOT PRESENT |

Architecture registers/audit documents are likewise **not yet present under `Architecture/` in this branch**; they must be created as part of the Architecture governance package before being referenced as repository artifacts.

## 6. System Context (external actors & systems)
Actors: Platform Operator staff · Tenant admins/staff/end-customers per industry (F-02 actors) · Visitors. External systems: identity provider (Clerk), payment gateways, AI providers, email/SMS/push providers (Expo Push/FCM), government/industry integrations per suite (→ A-06 §5), object storage, DNS/CDN.

## 7. Traceability & Phase Boundary
Every A-document carries a "Traces to" header and a traceability row in the Architecture traceability register once that register is created. Architecture introduces no new business scope: where an architectural completion is required, it must be labelled as a decision in A-12 (provenance `[AC]`-equivalent for the Architecture phase). Detailed Design, Development, Testing and Deployment remain future phases (§26A).

**Current technology governance:** UD-TECH-01 in `Registers/D-DECISIONS.md` is the active user-directed technology baseline for this Architecture branch. RawSourceCorpus remains immutable historical/source corpus and is not rewritten to match it.
