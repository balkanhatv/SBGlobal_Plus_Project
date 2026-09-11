# SBGlobal Plus — A-12 ARCHITECTURE DECISIONS, CONSTRAINTS, DEPENDENCIES & TRADE-OFFS
**Status:** AUTHORITATIVE ARCHITECTURE ADR REGISTER · **Date:** 2026-09-11

This file is the authoritative Architecture ADR owner. Other A-documents cross-reference these IDs; no one-line ADR is authoritative elsewhere.

## ADR-001 — Unified modular Core
**Context:** nine industries and many tenants must share one platform without backend forks.  
**Decision:** one logical modular Core with enforced domain boundaries and extraction seams.  
**Options:** per-industry services; microservices-first; modular Core.  
**Trade-offs:** modular Core lowers distributed complexity but needs strong internal boundaries.  
**Consequences:** industry/tenant are activation/context dimensions, not deployments.  
**Risks:** accidental module coupling. **Dependencies:** A-01, A-09. **Affected:** A-00/A-01/A-09. **Reversibility:** modules can be extracted behind contracts.

## ADR-002 — PostgreSQL tenancy and RLS
**Context:** strong tenant isolation with high tenant density and optional stronger isolation.  
**Decision:** shared PostgreSQL + RLS default; dedicated database allowed for justified tenants with identical logical schema.  
**Options:** DB-per-tenant universally; schema-per-tenant; shared without RLS.  
**Trade-offs:** RLS maximizes density but requires policy discipline; dedicated DB costs more.  
**Consequences:** tenant-owned rows/context always scoped; isolation tests mandatory.  
**Risks:** missing RLS policy. **Dependencies:** A-02/A-05. **Affected:** all data modules. **Reversibility:** tenant may migrate to dedicated DB.

## ADR-003 — Identity provider abstraction
**Context:** current preference is Clerk but deployment/contract constraints can vary.  
**Decision:** one Core Identity contract; Clerk preferred, Auth.js fallback where Clerk is unsuitable.  
**Options:** hard-couple Clerk; custom auth; separate auth per surface.  
**Trade-offs:** abstraction adds adapter work; prevents identity fragmentation/lock-in.  
**Consequences:** no competing identity core. **Risks:** lowest-common-denominator abstraction. **Dependencies:** A-03/A-08. **Affected:** every authenticated surface.

## ADR-004 — RBAC primary + ABAC complementary
**Context:** roles are manageable, but context affects access.  
**Decision:** entitlement gate → RBAC permission → applicable ABAC/security/context policy → allow/deny.  
**Options:** RBAC only; ABAC only.  
**Trade-offs:** combined model is richer but more complex to test.  
**Consequences:** server remains final authority. **Risks:** policy conflicts. **Dependencies:** F-03/A-03. **Affected:** Core guard/APIs/AI tools.

## ADR-005 — tRPC + REST boundary
**Context:** first-party TypeScript clients need typed contracts; external integrations need stable interoperable APIs.  
**Decision:** tRPC for first-party typed APIs; REST/OpenAPI for external interoperability.  
**Options:** REST-only; GraphQL-only; tRPC-only.  
**Trade-offs:** two projections require governance but optimize both audiences.  
**Consequences:** one underlying service/schema model. **Risks:** projection drift. **Dependencies:** A-06.

## ADR-006 — Transactional outbox
**Context:** domain writes and async publication must not diverge.  
**Decision:** write business change + outbox atomically in PostgreSQL, dispatch asynchronously.  
**Options:** direct publish; broker-first distributed transaction.  
**Trade-offs:** simple/consistent v1, with DB-outbox throughput ceilings.  
**Consequences:** at-least-once consumers are idempotent. **Risks:** outbox lag. **Dependencies:** A-01/A-06/A-10. **Reversibility:** dispatcher seam permits broker extraction.

## ADR-007 — Entitlement compilation
**Context:** runtime cannot reinterpret commercial policy independently per surface.  
**Decision:** compile versioned entitlement snapshots from plan/license/overrides/add-ons/constraints.  
**Options:** ad hoc checks; plan-only access.  
**Trade-offs:** invalidation complexity for consistent runtime behavior.  
**Consequences:** one server-authoritative guard consumes snapshots. **Risks:** stale snapshot. **Dependencies:** F-14/A-04.

## ADR-008 — PostgreSQL + pgvector/search strategy
**Context:** preserve RAG/search capability without premature infrastructure.  
**Decision:** PostgreSQL structured store + FTS + pgvector initially; Search/Retrieval facade is extraction seam.  
**Options:** external search/vector from day one; no vector search.  
**Trade-offs:** fewer dependencies with possible future scale ceiling.  
**Consequences:** tenant/industry RLS and ACL stay close to canonical data. **Risks:** vector/index scale. **Dependencies:** A-05/A-07. **Reversibility:** facade permits external engine.

## ADR-009 — Webhook architecture
**Context:** tenants/integrators need reliable outbound events.  
**Decision:** tenant-configurable, entitlement-gated, HMAC-signed at-least-once delivery with retry/DLQ/log.  
**Options:** synchronous callbacks; unsigned fire-and-forget.  
**Trade-offs:** more delivery infrastructure for reliability/security.  
**Consequences:** webhooks pause under prohibited states. **Risks:** replay/endpoint abuse. **Dependencies:** A-06/A-10/A-11.

## ADR-010 — AI Gateway/provider abstraction
**Context:** multiple AI providers/models require central policy/isolation/residency enforcement.  
**Decision:** all AI passes through AI Gateway + provider/model registry/adapters.  
**Options:** direct module SDKs; single hard-coded vendor.  
**Trade-offs:** extra control hop vs provider portability and policy consistency.  
**Consequences:** Tenant + Industry Context + ACL + entitlement + security/residency gates apply before inference/RAG/tools. **Risks:** gateway bottleneck. **Dependencies:** A-07/A-10/A-11.

## ADR-011 — Design/admin/CMS technology choices
**Context:** public CMS, product UI and CRUD-heavy internal ops have different needs.  
**Decision:** Shadcn/Tailwind shared design system; Payload CMS 3 for content; Refine where internal CRUD/admin is more suitable.  
**Options:** one framework for all; custom CMS/admin.  
**Trade-offs:** specialized tools vs tool-count complexity.  
**Consequences:** shared identity/API/design contracts prevent silos. **Risks:** duplicate primitives. **Dependencies:** A-08.

## ADR-012 — Industry-suite module architecture
**Context:** nine equal industries need domain specificity without nine platforms.  
**Decision:** suites/MSs are Core-hosted modular domains activated by Tenant + Industry Context + entitlement.  
**Options:** per-industry backend; one generic domain model.  
**Trade-offs:** shared platform discipline plus industry-specific modules.  
**Consequences:** no Healthcare template; no cross-industry-context leakage. **Risks:** over-generalization. **Dependencies:** A-09.

## ADR-013 — Next.js vs NestJS service-boundary rule
**Context:** Next.js server capabilities cover most Core needs; some workloads may need independent service behavior.  
**Decision:** Next.js by default; NestJS only for justified scale/isolation/protocol/long-running/security boundaries.  
**Options:** NestJS everywhere; Next.js-only regardless of workload.  
**Trade-offs:** selective extraction preserves simplicity/evolution.  
**Consequences:** NestJS never becomes a second competing Core. **Risks:** premature extraction. **Dependencies:** A-01/A-10. **Reversibility:** contract-based extraction/merger.

## ADR-014 — React Native + Expo
**Context:** shared Android/iOS delivery with one Core/API/context model.  
**Decision:** React Native + Expo.  
**Options:** Flutter; fully native per OS; webview-only.  
**Trade-offs:** cross-platform productivity vs some native-edge constraints.  
**Consequences:** native capabilities use governed adapters. **Risks:** native-module compatibility. **Dependencies:** A-08.

## ADR-015 — Tauri 2.0 desktop
**Context:** optional desktop needs Windows/macOS/Linux with local capabilities.  
**Decision:** Tauri 2.0 shell/capability layer.  
**Options:** Windows-only; Electron; three native apps.  
**Trade-offs:** smaller footprint/security surface vs adapter ecosystem maturity.  
**Consequences:** OS packaging/signing is Detailed Design. **Risks:** plugin/native gaps. **Dependencies:** F-10/A-08.

## ADR-016 — Push provider strategy
**Context:** notifications need provider portability.  
**Decision:** Expo Push Notifications primary integration with OneSignal optional/alternative behind PushPort.  
**Options:** FCM-only direct coupling; OneSignal-only.  
**Trade-offs:** adapter work vs lock-in reduction.  
**Consequences:** notification business logic is provider-independent. **Risks:** feature mismatch. **Dependencies:** A-06/A-08.

## ADR-017 — Deployment topology and regional data homes
**Context:** managed web convenience, self-hosted/regional control and residency must coexist.  
**Decision:** Vercel for suitable workloads; Coolify + Dockerized VPS for self-hosted/regional cells; Regional Data Homes pin residency-bound data.  
**Options:** Vercel-only; VPS-only; independent regional forks.  
**Trade-offs:** hybrid operations are more complex but satisfy portability/residency.  
**Consequences:** routing is region-aware; cross-region movement remains policy/contract/legal-basis gated. **Risks:** configuration drift. **Dependencies:** F-11/A-02/A-10/A-11. **Reversibility:** provider portability seams.

## ADR-018 — Shared vs dedicated database option
**Context:** default density and some enterprise isolation/residency needs differ.  
**Decision:** shared RLS DB default; dedicated DB is governed option without schema/code fork.  
**Options:** dedicated always; shared always.  
**Trade-offs:** two operational topologies add migration/ops complexity but preserve efficiency and hard-isolation option.  
**Consequences:** same logical contracts/migrations apply. **Risks:** dedicated-fleet overhead. **Dependencies:** ADR-002/A-05/A-10.

## Cross-ADR constraints
All ADRs obey one Unified Core; one identity boundary; Tenant + Industry Context isolation; server-authoritative authorization/entitlement; no direct client DB access; no hard-coded single AI provider; no Healthcare-derived sibling functionality; no conflicting API authority.

## Detailed Design boundary
Exact schemas, endpoint paths/methods, payload fields, infrastructure scripts, vendor configuration, screen inventories and implementation mechanics are intentionally deferred.
