# SBGlobal Plus — A-06 API, EVENTS & INTEGRATION ARCHITECTURE
**Document ID:** A-06 · **Version:** 1.0 · **Status:** ARCHITECTURE COMPLETE (CP-A1-002) · **Date:** 09-09-2026
**Traces to:** F-01 §7 (API catalog: tRPC-primary internal, REST/OpenAPI external), F-02 (workflow steps as API-invoked transitions), F-05 (AI integration points), UD-TECH-01/02 · **Decisions:** ADR-005, ADR-006, ADR-009 (→ A-12)

---

## 1. API Surface Model (ADR-005)
Two first-class API planes, one Core behind both:
- **tRPC (internal, primary):** all first-party experiences (web apps, mobile, desktop, ops admin) consume typed tRPC routers. End-to-end TypeScript types from Core service contracts to UI — schema drift between client and server is a compile error, not a runtime fault.
- **REST/OpenAPI (external interoperability only):** a stable, versioned REST facade generated from the same service contracts for third-party integrators, government/industry integrations and webhook management. Never used by first-party surfaces; its versioning cadence is slower and contract-reviewed.
Both planes terminate in the same kernel guard pipeline (A-01 §3) — there is no privileged plane.

## 2. Contract Organization & Versioning
- tRPC routers mirror the module catalog (A-01 §2): `core.identity.*`, `core.entitlement.*`, `ind.hlt.lis.*`, etc. Industry routers mount only for tenants with the suite activated (entitlement-gated at router level *and* per-call at guard level — defense in depth).
- DTO schemas (Zod) are the single source for: tRPC input validation (validation-chain stage 1, A-03 §4), REST OpenAPI generation, and webhook payload schemas. One schema, three projections.
- REST versioning: URL-versioned (`/api/v1/...`), additive-only within a version; breaking changes open `v2` with a published deprecation window. tRPC (first-party) versions with the app release train — client and server deploy from the same repository (→ A-10 §6).

## 3. Edge Concerns (both planes)
TLS 1.2+ · Clerk token / API-key verification before any body parsing · Tenant + active Industry Context resolution (A-02 §3) for industry-scoped requests · per-tenant and per-key rate limits (limits are entitlement dimensions, F-14) · request size caps · **idempotency keys** required on externally-invoked mutating REST endpoints (retry-safe integrations) · uniform error envelope carrying the error taxonomy class (A-01 §5) without internal detail leakage.

## 4. Events — Transactional Outbox (ADR-006)
```
Module write TX:  domain writes + outbox row(event id, type, version,
                  tenant, industryContext?, actor/source/correlation,
                  causation, payload, occurred_at) + audit append
                  [ONE Postgres TX]
Dispatcher:       polls outbox per data home → publishes to consumers →
                  marks dispatched; at-least-once, ordered per aggregate
Consumers:        projections (A-05 §6) · notifications · webhook fan-out ·
                  AI ingestion (A-07 §4) · entitlement recompile (A-04 §4)
                  — all idempotent by event id
```
No message broker at v1: Postgres-backed outbox + dispatcher processes (→ A-10 §5) are sufficient at target scale and remove an operational dependency. The dispatcher interface is the upgrade seam to a broker; recorded with trade-offs in ADR-006. Event names form a governed catalog (`<module>.<entity>.<action>`). **Industry-scoped events require Industry Context; Core/global events explicitly declare Core scope. Consumers/projectors cannot process an event under a different Industry Context.** Tenant scope remains mandatory end to end (A-02 §4).

## 5. Webhooks Out (ADR-009)
Tenant-configurable subscriptions: `(event types × tenant/industry-context filters × other allowed filters) → endpoint`. Architecture rules: registration requires endpoint ownership verification (challenge) · every delivery is HMAC-signed with per-subscription secret + timestamp (replay window) · at-least-once with exponential backoff · dead-letter after retry budget with tenant-visible delivery log · payloads carry event id + minimal DTO, never raw entities · an industry-scoped subscription receives only explicitly authorized Industry Contexts (a Healthcare-only subscription cannot receive Retail events merely because tenantId matches) · subscriptions are entitlement/permission/security-policy gated (A-04 §5) and pause on tenant suspension (A-02 §6). Webhook egress runs in worker processes, isolated from request-serving capacity.

## 6. Inbound Integrations — Ports & Adapters
Every external system sits behind a Core-owned **port contract** with swappable adapters:
| Port | Adapters (v1) | Notes |
|---|---|---|
| PaymentPort | Region-appropriate gateways | Webhook-in verified by gateway signature; drives A-04 §3 transitions |
| MailPort / SmsPort | Provider adapters | Notification module routing |
| PushPort | Expo Push (primary) · OneSignal (optional, ADR-016) | Mobile + web push |
| IdentityPort | Clerk adapter (preferred) · Auth.js adapter (fallback where Clerk unsuitable) | One Core identity boundary; providers remain replaceable behind it |
| AIProviderPort | → A-07 §3 | Provider abstraction |
| IndustryIntegrationPorts | Per-suite (e.g. gov e-filing, lab devices, payment rails) | Declared per suite in A-09 §5; adapters are per-tenant configured |
Inbound webhooks (payment, provider callbacks) land on dedicated verified endpoints that translate into domain commands — external systems never write domain state directly.

## 7. API Keys (external consumers)
Scoped API keys bound to tenant + role set (never a human session, A-03 §2): hashed at rest, prefix-identifiable, per-key rate limits and IP allow-lists, rotation with overlap window, revocation effective at next validation. Key scopes are drawn from the same permission catalog as RBAC (A-03 §3) — no parallel permission language.

## 8. Deferred to Detailed Design
Endpoint-level contracts (§26B boundary); full event catalog; webhook subscription/delivery entity design; per-suite integration adapter specifications; rate-limit values per plan; OpenAPI publication pipeline.
