# DD-144 Development Verification — AuditEvent Raw Persistence Reader

**Date:** 2026-09-23  
**Branch:** `docs/architecture-branch-2`  
**Prior promoted checkpoint:** `DEV-USAGE-METER-READ-001`  
**Prior DD-143 synchronized state basis:** `beb86ed91defbfa39393c1cd1d5426d4fd752f19`

## 1. Source-first ownership audit

Fresh Core persistence reconciliation selected `core_audit.audit_event` as the next independent source-complete uncovered persistence slice.

Audit commit: `4803ec6fcda6ed3edbf34245abeea8a0560cce7a`.  
Audit artifact: `Development/AUDIT_EVENT_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`.

The audit reconciled migration 0008 partitioned AuditEvent physical ownership/FORCE-RLS, migration 0009 explicit append/read privileges, migration 0029 audit schema-usage repair, migration 0030 final source/target Industry endpoint shape plus `audit_row_visible` policy, migration 0031 write-time routing/actor/evidence integrity, service-role append/read grants and migration 0043 Commercial writer restrictions.

## 2. Bounded implementation

Implementation commit: `862c1b9837419c8787016ce2584f9e433489cc08` / tree `7f59571b2319bc0b3d2fe0d36cd019330a70ea81`.

Implementation surface:
- `src/core/audit/audit-event.ts`;
- `src/server/audit/postgres-audit-event-store.ts`;
- `tests/postgres/audit-event-store.test.mjs`;
- `src/core/index.ts` export.

No migration, partition function, schema, SQL verification file, role/grant/RLS policy, existing audit producer, retention/search/export path, public route or product policy changed.

## 3. Read/security boundary

One AuditEvent id is exact because `audit_event_identity.id` is globally unique and the partition row references the unique `(id,occurred_at)` identity pair.

Final RLS semantics:
- PLATFORM_GLOBAL evidence is platform-context private;
- TENANT_CORE evidence is same-Tenant visible from Core and Industry contexts;
- TENANT_INDUSTRY evidence requires exact Industry Context;
- EXPLICIT_CROSS_CONTEXT evidence is visible only from the same-Tenant source or target Industry Context.

Ordinary RequestScopedSql still rejects PUBLIC and EXPLICIT_CROSS_CONTEXT database contexts; DD-144 creates no generic cross-context bypass.

The reader preserves raw nullable/empty text plus immutable normalized generic JSON evidence. It does not re-run migration-0031 write-time actor/routing/evidence integrity against current state.

## 4. Exact implementation-head CI

Exact tested implementation head: `862c1b9837419c8787016ce2584f9e433489cc08` / tree `7f59571b2319bc0b3d2fe0d36cd019330a70ea81`.

- Core Service Verify run `35903001642`, Core job `107323609343`: **SUCCESS**, **311/311 Core**.
- Same run, PostgreSQL/RLS job `107323609631`: **SUCCESS**, **448/448 PostgreSQL**, including `AUDITEVENT-PG-001…007`.
- Database Verify run `35903001627`, job `107323609555`: **SUCCESS**.
- Web Boundary Verify run `35903001706`, job `107323609747`: **SUCCESS**.

## 5. Canonical DD / acceptance traceability

Canonical DD/acceptance commit: `b736ffc4e367b0b2f3214ca2c8d77b4fcbb7b099` / tree `ed5bf656c6288e7f56fdc51f883cd4909350f3de`.

It adds exactly one DD-144 decision, one DD-144 acceptance block and one DD-144 changelog entry.

## 6. Promotion invariant gate

- Core run `35903393431`, Core job `107324908281`: **SUCCESS**, **311/311 Core**.
- Same run, PostgreSQL job `107324908641`: **SUCCESS**, **448/448 PostgreSQL**, including `AUDITEVENT-PG-001…007`.
- Database run `35903393183`, job `107324908479`: **SUCCESS**.
- Web run `35903393251`, job `107324908154`: **SUCCESS**.
- Direct DD-18 recount: **144 definitions / 144 unique / DD-001…DD-144 / no gaps / no duplicates**.
- Stable product invariants: **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirement IDs/text**.
- Database inventory remains **47 migrations / 41 SQL verification files**.

This gate authorizes `DEV-AUDIT-EVENT-READ-001`; it does not expand DD-144 semantics.

## 7. Explicitly unclaimed

DD-144 does not append/update/delete AuditEvents; replace existing producers; search/list/filter/page/order history; implement retention/legal hold/archive/purge/partition lifecycle; authorize from event contents; revalidate current actor/Tenant/Data-Home routing; dereference resources/decisions/principals; export/report audit data; expose a public route; or create a dedicated EXPLICIT_CROSS_CONTEXT repository.

## 8. Safety

- Forward-only repository mutation; no force-push.
- `main` remains unmerged.
- RawSourceCorpus remains untouched.
- PR #2 remains draft/review-only unless explicitly authorized.
