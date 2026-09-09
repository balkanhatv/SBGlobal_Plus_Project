# SBGlobal Plus — A-06 API, EVENTS & INTEGRATION ARCHITECTURE
**Document ID:** A-06 · **Version:** 1.0 · **Status:** ARCHITECTURE BASELINE (CP-A1-002) · **Date:** 09-09-2026
**Traces to:** F-01 (API catalog: tRPC-primary internal, REST/OpenAPI external interoperability), F-02 (workflow events per step), F-05 (AI event hooks), F-14 (commercial events) · **Decisions:** ADR-006, ADR-007 (→ A-12)

---

## 1. API Model (ADR-007)
- **First-party API: tRPC.** One router tree, composed of per-module routers; end-to-end TypeScript types shared with all first-party surfaces (web, mobile, desktop, admin). tRPC procedures are thin adapters over module service contracts (A-01 §4) — no business logic at the API layer.
- **External API: REST/OpenAPI**, exposed only where external interoperability is required. Explicitly versioned (`/api/v1/...`), generated OpenAPI spec, API-key authentication (A-03 §2). REST handlers call the same module contracts — one behavior, two protocols.
- **Payload CMS 3** exposes its own content API for public-site content only; it never serves tenant business data (→ A-08 §6).
- Every entry point passes the kernel guard chain (A-01 §3) — protocol makes no difference to enforcement.

## 2. Contract Conventions
- DTO schema validation at the edge (validation chain stage 1, A-03 §4); error taxonomy (A-01 §5) maps to protocol-appropriate codes with stable machine-readable reason codes.
- **Idempotency keys required on externally-invokable mutations**; the kernel deduplicates by (tenant, key) with a retention window.
- Cursor pagination on all collection reads; per-tenant and per-API-key rate limits at the API edge (A-03 §5); response times measured per procedure (→ A-11 §3).

## 3. Eventing — Transactional Outbox (ADR-006)
No message broker at v1; **Postgres outbox** in each data home:
```
Module write TX = domain writes + audit append + outbox row (single transaction)
Dispatcher workers (PM2 processes) poll outbox → deliver to consumers
  → projections (A-05 §6) · notifications · webhooks (§4) · AI indexing (A-07 §4)
  → entitlement cache invalidation (A-04 §3)
```
Guarantees: **at-least-once delivery, per-aggregate ordering** (dispatch serialized by aggregate key), consumer idempotency mandatory. Retries with exponential backoff; poisoned events land in a **dead-letter table** with an operations alert (→ A-11 §3). Events are named `domain.entity.action`, carry tenant scope + schema version, and constitute the integration contract between modules — the upgrade seam to a broker (recorded in ADR-006) changes transport only, not contracts.

## 4. Webhooks Out
Per-tenant subscription registry (entitlement-gated, → A-04 §4): event filter, endpoint, secret. Deliveries are **HMAC-SHA256 signed with timestamp** (replay-window verification documented for consumers), retried with backoff and a delivery log tenants can inspect; repeated failure disables the subscription with notification. Webhooks pause on tenant suspension (A-02 §6). Payloads honor field-level sensitivity: classes marked non-exportable (A-05 §7) are excluded at source.

## 5. External & Industry Integrations
- **Inbound:** scoped API keys (tenant + role set, A-03 §2); payment-gateway callbacks verified by gateway signature and processed through the same guard chain acting as the Billing module.
- **Industry adapters:** each suite's external interfaces (government portals, lab instruments/HL7-class exchanges, logistics, education boards, donation gateways — per F-07…F-09 dependency lists) are **adapter contracts owned by the respective industry module**, configured per tenant, executed by dispatcher workers with the same retry/DLQ discipline. Adapters translate; they never bypass module contracts or write canonical data directly.

## 6. Push & Notification Delivery
The Notification module (A-01 §2) routes template-rendered messages to channels: email, SMS, in-app, and push via **Expo Push / FCM** (UD-TECH-01; OneSignal remains a swappable adapter option — ADR-011 note). Device token registry per user+device with invalidation on logout/revocation. All channel sends are events consumed off the outbox — a failed provider never breaks the originating transaction.

## 7. Deferred to Detailed Design
Endpoint/procedure catalog (§26B), event schema registry entries, webhook payload schemas per event family, adapter specifications per industry interface, rate-limit values, idempotency retention window values.