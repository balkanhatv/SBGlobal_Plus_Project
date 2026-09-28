# AuditEvent Raw Persistence Reader — Prerequisite / Ownership Audit

**Date:** 2026-09-23  
**Branch:** `docs/architecture-branch-2`  
**Starting checkpoint:** `DEV-USAGE-METER-READ-001`  
**Starting HEAD:** `beb86ed91defbfa39393c1cd1d5426d4fd752f19`

## 1. Candidate selection

Fresh Core persistence reconciliation selected `core_audit.audit_event` as the next independent source-complete uncovered persistence slice after DD-143.

This is not a new audit producer. The existing `PostgresAuthorizationAuditStore` already appends governed Authorization audit evidence. DD-144 is limited to one exact raw persistence read and does not alter producer behavior, retention, search, export, authorization or audit policy.

## 2. Physical owner and final schema

Migration 0008 creates monthly-partitioned `core_audit.audit_event` with identity-backed global uniqueness, raw actor/action/resource/outcome/reason/permission/decision/module/correlation/causation/request/routing/sensitivity/evidence/schema-version fields, FORCE-RLS and explicit scope-class checks.

`core_audit.audit_event_identity.id` is a primary key and `audit_event(id,occurred_at)` references the unique identity pair. Therefore one AuditEvent id can identify at most one persisted event across partitions even though the partitioned parent primary key is `(id,occurred_at)`.

Migration 0030 materially finalizes the scope model:
- adds `source_industry_context_id` and `target_industry_context_id`;
- requires exact physical shapes for `PLATFORM_GLOBAL`, `TENANT_CORE`, `TENANT_INDUSTRY` and `EXPLICIT_CROSS_CONTEXT`;
- requires cross-context endpoints to be non-null, same-Tenant and distinct;
- replaces the original policy with `core_audit.audit_row_visible(...)`;
- reapplies that policy to existing partitions and the partition provisioner for future partitions.

Migration 0031 adds write-time relationship integrity:
- `evidence_json` must be an object for new/updated rows;
- Tenant evidence must carry the Tenant's authoritative Data Home/region;
- optional Tenant actors must be valid for that Tenant at the evidence timestamp;
- optional platform actors must be active SERVICE/PLATFORM_OPERATOR principals.

These are write-time integrity rules. DD-144 does not re-evaluate current actor membership, Tenant routing, Data Home state or JSON-object validity while reading historical evidence.

## 3. Final RLS visibility

The final `core_audit.audit_row_visible` policy owns visibility:
- `PLATFORM_GLOBAL`: visible only from a trusted PLATFORM_GLOBAL RequestScopedSql context;
- `TENANT_CORE`: visible to the same Tenant from TENANT_CORE and same-Tenant TENANT_INDUSTRY contexts;
- `TENANT_INDUSTRY`: visible only to the exact same-Tenant Industry Context;
- `EXPLICIT_CROSS_CONTEXT`: visible only from the same Tenant's source or target Industry Context.

The ordinary `RequestScopedSql` boundary rejects PUBLIC and EXPLICIT_CROSS_CONTEXT database contexts. Therefore cross-context rows are read, if visible, from an exact source/target TENANT_INDUSTRY context; there is no generic cross-context bypass.

Foreign Tenant, unrelated sibling Industry and incompatible PLATFORM_GLOBAL/Tenant contexts remain hidden by FORCE-RLS.

## 4. Runtime privilege ownership

Migration 0009 grants `sbg_app_rw` and `sbg_worker_rw` explicit SELECT+INSERT on `audit_event_identity` / `audit_event`; it does not grant UPDATE/DELETE. `sbg_monitor_ro` receives SELECT.

Migration 0029 restores missing `core_audit` schema usage for `sbg_app_rw` and explicitly describes the existing audit boundary as append/read. It does not widen AuditEvent mutation.

Service-specific migrations grant append/read to AI, Workflow, Notification, Document and Integration roles. Migration 0043 grants the Commercial transition/compiler role audit append authority but explicitly revokes UPDATE/DELETE and adds a restrictive Commercial-only Tenant-Core policy for that role.

DD-144 uses the ordinary application `RequestScopedSql` path only. Dedicated service/compiler/monitor policies do not widen ordinary application visibility.

## 5. Raw-evidence contract

The reader may return only persisted evidence:
- id;
- optional Tenant / Industry / source Industry / target Industry ownership;
- constrained scope class;
- occurred-at;
- optional actor principal id plus raw actor type;
- raw action code;
- optional raw resource type/id;
- constrained outcome;
- optional raw reason / permission / access-decision evidence;
- raw source module;
- correlation id;
- optional causation id / request id;
- optional Data Home id / region code;
- constrained sensitivity class;
- immutable normalized JSON evidence;
- positive schema version.

Raw text is not strengthened into non-empty business semantics unless the physical schema constrains it.

`evidence_json` is deliberately modeled as generic immutable JSON, not object-only. Migration 0031's object rule is trigger-based and does not create a table CHECK that retroactively proves all historical rows are objects.

## 6. Explicitly unclaimed

DD-144 must not:
- append/update/delete AuditEvents or AuditEventIdentity rows;
- become an audit producer;
- search/list/filter audit history;
- paginate or order by time;
- implement retention, legal hold, archive, purge or partition lifecycle;
- authorize access based on the event contents;
- revalidate current actor membership/principal status/Tenant routing/Data Home/region;
- reinterpret `reason_code`, `permission_code`, `access_decision_id`, sensitivity or evidence JSON;
- dereference resources, decisions, principals, Data Homes or Industry Contexts;
- expose audit export/reporting APIs or public routes;
- implement a dedicated EXPLICIT_CROSS_CONTEXT repository;
- alter migrations, partitions, roles, grants, RLS, producer code or product policy.

## 7. Acceptance shape

DD-144 implementation must add seven PostgreSQL acceptance cases:
1. exact same-Tenant Core raw event evidence;
2. Tenant-Core event visibility from same-Tenant Industry context;
3. exact Tenant-Industry isolation;
4. explicit cross-context visibility from source/target only, hidden from Tenant-Core and unrelated sibling;
5. PLATFORM_GLOBAL isolation plus raw nullable/text/JSON evidence preservation;
6. missing/malformed/route mismatch fail-closed behavior;
7. append/read privilege proof and read-port-only surface with no search/mutation/retention/authorization methods.

Expected PostgreSQL suite count after implementation: **448/448** if no unrelated test-count change occurs. Core count is expected to remain **311/311** because this slice adds PostgreSQL acceptance only.
