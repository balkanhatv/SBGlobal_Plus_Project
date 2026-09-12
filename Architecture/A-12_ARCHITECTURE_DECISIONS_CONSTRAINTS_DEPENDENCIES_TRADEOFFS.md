# SBGlobal Plus — A-12 ARCHITECTURE DECISIONS, CONSTRAINTS, DEPENDENCIES & TRADE-OFFS
**Status:** AUTHORITATIVE ARCHITECTURE ADR REGISTER — PHASE 2 REVALIDATED · **Date:** 2026-09-12

This file is the authoritative Architecture ADR owner. Other A-documents cross-reference these IDs; no one-line ADR is authoritative elsewhere.

## ADR-001 — Unified modular Core
**Context:** nine industries and many tenants must share one platform without backend forks.  
**Decision:** one logical modular Core with enforced domain boundaries and extraction seams.  
**Options:** per-industry services; microservices-first; modular Core.  
**Trade-offs:** modular Core lowers distributed complexity but needs strong internal boundaries.  
**Consequences:** industry/tenant are activation/context dimensions, not deployments.  
**Risks:** accidental module coupling. **Dependencies:** A-01, A-09. **Affected:** A-00/A-01/A-09. **Reversibility:** modules can be extracted behind contracts.

## ADR-002 — Tenant + Industry Context data isolation
**Context:** strong tenant isolation is necessary but insufficient when one tenant enables multiple private Industry Contexts.  
**Decision:** shared PostgreSQL + tenant RLS remains default and dedicated DB remains optional; industry-owned resources additionally carry Industry Context ownership and every industry-scoped access is constrained by immutable Tenant + active Industry Context. Exact RLS expressions are Detailed Design.  
**Options:** tenant-only RLS; database/schema per industry; Tenant + Industry Context logical boundary on common topology.  
**Trade-offs:** dual-context enforcement adds policy/testing complexity but prevents same-tenant cross-industry leakage without deployment forks.  
**Consequences:** resource lookup, repositories, documents, events, projections and offline replay fail closed on wrong/missing Industry Context; Core/shared resources are explicitly classified.  
**Risks:** context omission or accidental Core classification. **Dependencies:** A-02/A-05/A-06/A-08/A-09. **Affected Architecture:** request context, data ownership, storage, events, sync, suite modules. **Reversibility:** storage topology may evolve without changing logical context contracts.

## ADR-003 — Identity provider abstraction
**Context:** current preference is Clerk but deployment/contract constraints can vary.  
**Decision:** one Core Identity contract; Clerk preferred, Auth.js fallback where Clerk is unsuitable.  
**Options:** hard-couple Clerk; custom auth; separate auth per surface.  
**Trade-offs:** abstraction adds adapter work; prevents identity fragmentation/lock-in.  
**Consequences:** no competing identity core. **Risks:** lowest-common-denominator abstraction. **Dependencies:** A-03/A-08. **Affected:** every authenticated surface.

## ADR-004 — Canonical effective-access ordering
**Context:** Foundation requires authentication, tenant/context, subscription/license, credentials/device, entitlement, RBAC/ABAC and security/business constraints without competing runtime chains.  
**Decision:** Authenticate → Tenant → active Industry Context → Subscription → License → credential/device/session context where applicable → current compiled EntitlementSnapshot → RBAC → ABAC/context → security/compliance/residency → resource/workflow rules → Effective Access.  
**Options:** entitlement-first ad hoc checks; RBAC-only; independent per-surface chains.  
**Trade-offs:** one richer guard pipeline is more explicit/testable but requires cross-module orchestration.  
**Consequences:** deny is fail-closed and audit-attributed; compiled entitlement snapshots optimize but never erase subscription/license semantics.  
**Risks:** duplicated checks drifting from canonical order. **Dependencies:** F-03/F-14/A-01/A-03/A-04. **Affected Architecture:** Core kernel, API edge, workflows, AI tools, offline replay.

## ADR-005 — tRPC + REST boundary
**Context:** first-party TypeScript clients need typed contracts; external integrations need stable interoperable APIs.  
**Decision:** tRPC for first-party typed APIs; REST/OpenAPI for external interoperability.  
**Options:** REST-only; GraphQL-only; tRPC-only.  
**Trade-offs:** two projections require governance but optimize both audiences.  
**Consequences:** one underlying service/schema model. **Risks:** projection drift. **Dependencies:** A-06. **Affected Architecture:** owning ADR consumers and referenced A-documents.

## ADR-006 — Transactional outbox with context envelope
**Context:** domain writes and async publication must not diverge or lose Tenant/Industry ownership.  
**Decision:** atomically write business change + outbox event carrying event/version, tenant, Industry Context where applicable, actor/source/correlation/causation context and payload; dispatch asynchronously.  
**Options:** direct publish; tenant-only event envelope; broker-first distributed transaction.  
**Trade-offs:** contextual outbox adds envelope discipline but prevents cross-industry projection/webhook leakage while retaining simple v1 operations.  
**Consequences:** at-least-once consumers are idempotent and preserve source context; Core/global events explicitly declare Core scope.  
**Risks:** outbox lag or context omission. **Dependencies:** A-01/A-02/A-06/A-10. **Affected Architecture:** domain transactions, workers, projections, notifications, webhooks. **Reversibility:** dispatcher seam permits broker extraction.

## ADR-007 — Entitlement compilation
**Context:** runtime cannot reinterpret commercial policy independently per surface.  
**Decision:** compile versioned entitlement snapshots from plan/license/overrides/add-ons/constraints.  
**Options:** ad hoc checks; plan-only access.  
**Trade-offs:** invalidation complexity for consistent runtime behavior.  
**Consequences:** one server-authoritative guard consumes snapshots. **Risks:** stale snapshot. **Dependencies:** F-14/A-04. **Affected Architecture:** owning ADR consumers and referenced A-documents.

## ADR-008 — PostgreSQL + pgvector/search with dual-context enforcement
**Context:** preserve structured/search/RAG capability without premature infrastructure while enforcing both tenant and industry isolation.  
**Decision:** PostgreSQL structured store + FTS + pgvector initially; tenant RLS plus Industry Context ownership applies to industry data/vector rows; Search/Retrieval facade is extraction seam.  
**Options:** tenant-only filtering; external search/vector from day one; no vector search.  
**Trade-offs:** fewer dependencies and stronger locality vs future scale ceiling and dual-context policy complexity.  
**Consequences:** structured data, indexes and RAG retain Tenant + Industry Context/ACL ownership; country/localization packs are versioned reference/configuration packages, and governed access/export/portability paths preserve the same authorization/residency boundary. **Risks:** vector/index scale, inconsistent context classification or pack/default leakage into global semantics. **Dependencies:** A-02/A-05/A-07. **Affected Architecture:** data/search/RAG/projections. **Reversibility:** facade permits external engines.

## ADR-009 — Context-safe webhook architecture
**Context:** tenants/integrators need reliable outbound events without exposing sibling Industry Contexts.  
**Decision:** tenant-configurable, entitlement/permission-gated, HMAC-signed at-least-once delivery with retry/DLQ/log and explicit Industry Context filtering for industry events.  
**Options:** tenant-wide implicit subscriptions; synchronous callbacks; unsigned fire-and-forget.  
**Trade-offs:** richer subscription policy increases delivery infrastructure but prevents same-tenant cross-industry disclosure.  
**Consequences:** Healthcare-only subscriptions cannot receive Retail payloads unless explicitly configured/authorized; suspended/prohibited subscriptions pause. **Risks:** replay, endpoint abuse, filter misconfiguration. **Dependencies:** A-02/A-06/A-10/A-11. **Affected Architecture:** integration subscriptions, dispatcher, audit/operations.

## ADR-010 — AI Gateway/provider abstraction
**Context:** multiple AI providers/models require central policy/isolation/residency enforcement.  
**Decision:** all AI passes through AI Gateway + provider/model registry/adapters.  
**Options:** direct module SDKs; single hard-coded vendor.  
**Trade-offs:** extra control hop vs provider portability and policy consistency.  
**Consequences:** Tenant + Industry Context + ACL + entitlement + security/residency gates apply before inference/RAG/tools; AI API exposure, provisioning, governed memory/document intelligence, prompt management and media generation remain projections/capability families behind the same Gateway rather than bypass paths. **Risks:** gateway bottleneck or capability-specific adapter drift. **Dependencies:** A-07/A-10/A-11. **Affected Architecture:** owning ADR consumers and referenced A-documents.

## ADR-011 — Design/admin/CMS technology choices
**Context:** public CMS, product UI and CRUD-heavy internal ops have different needs.  
**Decision:** Shadcn/Tailwind shared design system; Payload CMS 3 for content; Refine where internal CRUD/admin is more suitable.  
**Options:** one framework for all; custom CMS/admin.  
**Trade-offs:** specialized tools vs tool-count complexity.  
**Consequences:** shared identity/API/design contracts prevent silos; Platform Brand Default is canonical, Industry Experience overrides are bounded, Tenant branding/white-label is configuration-driven, and user preference is presentation-only. Accessibility/security semantic tokens cannot be weakened by lower layers. **Risks:** duplicate primitives or unrestricted token overrides. **Dependencies:** A-08. **Affected Architecture:** owning ADR consumers and referenced A-documents.

## ADR-012 — Industry-suite module architecture and isolation
**Context:** nine equal industries need domain specificity without nine platforms and without sibling-industry leakage inside one tenant.  
**Decision:** suites/MSs are Core-hosted modular domains activated by Tenant + Industry Context + entitlement; every industry-owned service/entity/document/event/experience operation requires its active context, while governed Core/shared capabilities preserve source ownership.  
**Options:** per-industry backend; tenant-only generic domain model; modular suites with active context.  
**Trade-offs:** shared platform discipline plus explicit context propagation adds testing/policy complexity but prevents forks and leakage.  
**Consequences:** no Healthcare template; no cross-industry-context leakage; wrong/missing active context fails closed. **Risks:** over-generalization or accidental Core classification. **Dependencies:** A-02/A-05/A-06/A-09. **Affected Architecture:** all suite modules, data, events, documents, experiences, AI/offline scopes.

## ADR-013 — Next.js vs NestJS service-boundary rule
**Context:** Next.js server capabilities cover most Core needs; some workloads may need independent service behavior.  
**Decision:** Next.js by default; NestJS only for justified scale/isolation/protocol/long-running/security boundaries.  
**Options:** NestJS everywhere; Next.js-only regardless of workload.  
**Trade-offs:** selective extraction preserves simplicity/evolution.  
**Consequences:** NestJS never becomes a second competing Core. **Risks:** premature extraction. **Dependencies:** A-01/A-10. **Reversibility:** contract-based extraction/merger. **Affected Architecture:** owning ADR consumers and referenced A-documents.

## ADR-014 — React Native + Expo
**Context:** shared Android/iOS delivery with one Core/API/context model.  
**Decision:** React Native + Expo with exactly two logical Tenant mobile app roles per Tenant + enabled Industry Experience: Tenant Staff App and Tenant User App. Platform Mobile belongs to the separate Platform Application surface; role-specific binaries are prohibited.  
**Options:** Flutter; fully native per OS; webview-only.  
**Trade-offs:** cross-platform productivity vs some native-edge constraints.  
**Consequences:** reusable Staff/User shells compose role/context-specific experiences; Patient/Doctor/Teacher/Student/Cashier/Guard remain roles inside those apps, and native capabilities use governed adapters. **Risks:** native-module compatibility or accidental app-family proliferation. **Dependencies:** A-08. **Affected Architecture:** owning ADR consumers and referenced A-documents.

## ADR-015 — Tauri 2.0 desktop
**Context:** optional desktop needs Windows/macOS/Linux with local capabilities.  
**Decision:** Tauri 2.0 shell/capability layer.  
**Options:** Windows-only; Electron; three native apps.  
**Trade-offs:** smaller footprint/security surface vs adapter ecosystem maturity.  
**Consequences:** OS packaging/signing is Detailed Design. **Risks:** plugin/native gaps. **Dependencies:** F-10/A-08. **Affected Architecture:** owning ADR consumers and referenced A-documents.

## ADR-016 — Push provider strategy
**Context:** notifications need provider portability.  
**Decision:** Expo Push Notifications primary integration with OneSignal optional/alternative behind PushPort.  
**Options:** FCM-only direct coupling; OneSignal-only.  
**Trade-offs:** adapter work vs lock-in reduction.  
**Consequences:** notification business logic is provider-independent. **Risks:** feature mismatch. **Dependencies:** A-06/A-08. **Affected Architecture:** owning ADR consumers and referenced A-documents.

## ADR-017 — Deployment topology and regional data homes
**Context:** managed web convenience, self-hosted/regional control and residency must coexist.  
**Decision:** Vercel for suitable workloads; Coolify + Dockerized VPS for self-hosted/regional cells; Regional Data Homes pin residency-bound data.  
**Options:** Vercel-only; VPS-only; independent regional forks.  
**Trade-offs:** hybrid operations are more complex but satisfy portability/residency.  
**Consequences:** routing is region-aware; cross-region movement remains policy/contract/legal-basis gated. **Risks:** configuration drift. **Dependencies:** F-11/A-02/A-10/A-11. **Reversibility:** provider portability seams. **Affected Architecture:** owning ADR consumers and referenced A-documents.

## ADR-018 — Shared vs dedicated database option
**Context:** default density and some enterprise isolation/residency needs differ.  
**Decision:** shared RLS DB default; dedicated DB is governed option without schema/code fork.  
**Options:** dedicated always; shared always.  
**Trade-offs:** two operational topologies add migration/ops complexity but preserve efficiency and hard-isolation option.  
**Consequences:** same logical contracts/migrations and Tenant+Industry Context ownership rules apply. **Risks:** dedicated-fleet overhead. **Dependencies:** ADR-002/A-05/A-10. **Affected Architecture:** tenancy routing, data topology, provisioning/migration operations.


## ADR-019 — Shared configurable-engine boundaries
**Context:** Foundation requires Configuration, Metadata, Rules/Policy, Form Builder/Dynamic Fields and Workflow as reusable Core capabilities. Treating them as one vague “configuration” bucket would make ownership, safety and versioning non-deterministic.  
**Decision:** maintain distinct architectural responsibilities behind Core-owned contracts: Configuration owns layered values/versioned publication; Metadata owns descriptors/catalog definitions; Rules/Policy owns declarative safe rule evaluation; Form/Dynamic Fields owns field/form definitions and validation composition; Workflow owns state/transition/approval execution. They may share infrastructure but not authority.  
**Options:** one generic configuration engine; per-industry private engines; distinct Core contracts.  
**Trade-offs:** more explicit contracts and lifecycle rules vs fewer ambiguous cross-domain shortcuts.  
**Consequences:** Industry modules consume shared engines; tenant-defined rules cannot execute arbitrary code; draft/publish/activate/rollback and audit are enforceable per definition type.  
**Risks:** overlapping concepts or duplicated definitions. **Dependencies:** F-01/A-01/A-05/A-06. **Affected Architecture:** Core module catalog, configuration data, workflow/rule/form APIs and extension model. **Reversibility:** internal implementation may consolidate physically while preserving logical contracts.

## ADR-020 — Future Industry promotion gate
**Context:** the platform must remain extensible beyond the nine Current Supported Industries without silently turning a draft industry concept into a production-supported suite.  
**Decision:** Future Industries occupy a separate governance/catalog state and cannot be licensed or enabled for live Tenant production contexts until explicit user/governance approval plus Foundation specification, MS depth, Architecture isolation/ownership, experience, AI/integration, acceptance and traceability gates are complete. Promotion adds catalog/module/experience/configuration artifacts on the same Core; it never creates a new Core or copies sibling-industry semantics.  
**Options:** auto-enable any documented industry; hard-code exactly nine forever; governed future-industry promotion.  
**Trade-offs:** promotion requires evidence and governance effort but preserves extensibility without weakening product truth.  
**Consequences:** nine industries remain the Current Supported set until explicitly promoted; future-industry prototypes cannot leak into commercial entitlements or permissions.  
**Risks:** stale draft catalog entries or premature commercial enablement. **Dependencies:** F-01/A-04/A-09/A-12. **Affected Architecture:** industry catalog, entitlement activation, module/experience registration and certification evidence. **Reversibility:** a promoted industry can later be retired through governed lifecycle without changing Core architecture.

## Cross-ADR constraints
All ADRs obey one Unified Core; one identity boundary; Tenant + Industry Context isolation; server-authoritative authorization/entitlement; no direct client DB access; no hard-coded single AI provider; no Healthcare-derived sibling functionality; no conflicting API authority.

## Detailed Design boundary
Exact schemas, endpoint paths/methods, payload fields, infrastructure scripts, vendor configuration, screen inventories and implementation mechanics are intentionally deferred.
