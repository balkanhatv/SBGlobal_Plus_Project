# DD-141 Development Verification — SubscriptionTransition Raw Persistence Reader

**Date:** 2026-09-23  
**Branch:** `docs/architecture-branch-2`  
**Prior promoted checkpoint:** `DEV-DATA-EXPORT-REQUEST-READ-001`  
**Prior DD-140 promoted state basis:** `21bf3db684d11b1168301d4bd50e5447dcb08dbc`

## 1. Source-first ownership audit

Fresh reconciliation selected one exact `core_commercial.subscription_transition` row as the next independently source-complete uncovered persistence slice.

Audit commit: `951660f684768517e6ffe9f8b535af02bd2ba4a0`.  
Audit artifact: `Development/SUBSCRIPTION_TRANSITION_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`.

The audit reconciled migration 0004 Commercial schema/FORCE-RLS, migration 0007 governance ownership, migration 0009 baseline privileges, migration 0029 immutable Tenant ownership and append-style hardening, migration 0030 same-Tenant Subscription reference, migrations 0043–0047 Commercial transition/compiler/publication boundaries, DD-05, DD-064/DD-065/DD-078/DD-079 and the existing Commercial publication store.

## 2. Bounded implementation and correction provenance

Initial implementation commit: `9cc9e8f312b8376b1531adbb0ebbc42500742420`.

That head failed Core/Web compile because the new module re-exported a duplicate `CommercialSubscriptionState`. Minimal correction `05f0e62ea30e204a04ba08cdd3590e8b15bad8d2` reused the existing canonical state type. PostgreSQL then exposed a fixture-only governance violation: active Tenant B declared primary Industry `EDU` but lacked its required primary Industry Context. Fixture-only correction `39ad7e1f7fd39401811de0b6efa7f3bf0d35c3ff` added the missing Tenant B primary Industry fixture. Reader semantics, RLS boundary and acceptance contract were unchanged.

Corrected implementation head: `39ad7e1f7fd39401811de0b6efa7f3bf0d35c3ff` / tree `f184bfc07a41c1199568f10ca45e2ddb6aa39da5`.

Implementation surface:
- `src/core/commercial/subscription-transition.ts`;
- `src/server/commercial/postgres-subscription-transition-store.ts`;
- `tests/postgres/subscription-transition-store.test.mjs`;
- `src/core/index.ts` export.

No migration, schema, SQL verification file, role/grant/RLS policy, Commercial publication mutation path, public route or product policy changed.

## 3. Read/security boundary

The reader returns one exact persisted SubscriptionTransition: id, Tenant/subscription ids, optional from-state, to-state, raw trigger, optional actor/source-event/reason, occurred-at and correlation id.

Tenant-only FORCE-RLS makes the owning row visible from same-Tenant Core and Industry contexts; foreign Tenant and PLATFORM_GLOBAL remain hidden. Migration 0030 preserves same-Tenant Subscription ownership. Ordinary app role is SELECT-only; `sbg_commercial_transition_compiler_rw` remains SELECT+INSERT/no UPDATE/DELETE. The new port is read-only.

Equal from/to states, null fields, empty text and arbitrary occurrence chronology remain raw persistence evidence. DD-141 does not infer lifecycle legality/current state/replayability/authorization.

## 4. Exact corrected implementation-head CI

Exact tested implementation head: `39ad7e1f7fd39401811de0b6efa7f3bf0d35c3ff` / tree `f184bfc07a41c1199568f10ca45e2ddb6aa39da5`.

- Core Service Verify run `35881272582`, Core job `107250059405`: **SUCCESS**, **311/311 Core**.
- Same run, PostgreSQL/RLS job `107250059962`: **SUCCESS**, **427/427 PostgreSQL**, including `SUBTRANS-PG-001…007`.
- Database Verify run `35881272494`, job `107250040251`: **SUCCESS**.
- Web Boundary Verify run `35881272439`, job `107250040455`: **SUCCESS**.

## 5. Canonical DD / acceptance traceability

Canonical DD/acceptance commit: `882ecc5532c81dedc3f4b3f983a7edfc12a49dd0` / tree `409ed54a8c3cacd7500c5c03aa27560147c4b25e`.

It adds exactly one DD-141 decision, one DD-141 acceptance block and one DD-141 changelog entry with correction provenance.

## 6. Promotion invariant gate

- Core run `35881695463`, Core job `107251481728`: **SUCCESS**, **311/311 Core**.
- Same run, PostgreSQL job `107251481464`: **SUCCESS**, **427/427 PostgreSQL**, including `SUBTRANS-PG-001…007`.
- Database run `35881695666`, job `107251483307`: **SUCCESS**.
- Web run `35881695790`, job `107251483129`: **SUCCESS**.
- `REPO-004` and direct DD-18 recount: **141 definitions / 141 unique / DD-001…DD-141 / no gaps / no duplicates**.
- Stable product invariants: **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirement IDs/text**.
- Database inventory remains **47 migrations / 41 SQL verification files**.

This gate authorizes `DEV-SUBSCRIPTION-TRANSITION-READ-001`; it does not expand DD-141 semantics.

## 7. Explicitly unclaimed

DD-141 does not execute Subscription transitions; validate lifecycle legality; reconstruct chains; select current/latest transition; compare against current Subscription state; resolve source-event/idempotency/causality/replay; validate actor current membership/authorization; perform plan-change assessment/routing/remediation/approval; compile/publish entitlements; emit audit/outbox; perform billing/proration/payment; roll back/reverse transitions; mutate SubscriptionTransition; or expose a public route.

## 8. Safety

- Forward-only repository mutation; no force-push.
- `main` remains unmerged.
- RawSourceCorpus remains untouched.
- PR #2 remains draft/review-only unless explicitly authorized.
