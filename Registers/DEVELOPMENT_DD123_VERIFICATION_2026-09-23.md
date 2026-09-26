# DD-123 Development Verification — AI Cost Raw Persistence Reader

**Date:** 2026-09-23  
**Branch:** `docs/architecture-branch-2`  
**Prior promoted checkpoint:** `DEV-AI-TOKEN-USAGE-READ-001`  
**Prior DD-122 final head:** `9f33230eaf6d4cf9fab093593ca24a5f2d412a58`

## 1. Source-first ownership audit

Fresh source reconciliation selected one exact `core_ai.ai_cost` row as the next independent source-complete persistence slice.

Audit commit: `8a53304626591964e2168da42e3e072feabeaa64`.  
Audit artifact: `Development/AI_COST_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`.

The audit reconciled migration 0012 Cost schema and parent-derived TokenUsage FORCE-RLS, migration 0014 AI Gateway Cost DML authority, DD-09 usage/cost observability ownership, and the existing AI Gateway/RequestScopedSql boundary.

## 2. Bounded implementation

Implementation commit: `38306fac5afb1b93a7ad16123e42c14bd2062f88`.  
Implementation tree: `ba11e9b3eec3e92a749e46b0df1913a06be3e6b4`.

Changed implementation/test surface:

- `src/core/ai/cost.ts`;
- `src/server/ai/postgres-ai-cost-store.ts`;
- `tests/postgres/ai-cost-store.test.mjs`;
- `src/core/index.ts` export only.

The reader returns only exact persisted cost evidence and selects `estimated_minor_units::text` to avoid JavaScript bigint precision loss.

No migration, schema, verification SQL, role, grant, RLS policy, product policy, public/API route, pricing engine, billing engine, finalization workflow or execution path was added.

## 3. Exact implementation-head CI

Exact tested implementation head: `38306fac5afb1b93a7ad16123e42c14bd2062f88`.

- Core Service Verify run `35830485282`, Core job `107081687663`: **SUCCESS**, **311/311 Core**.
- Same run, PostgreSQL/RLS job `107081687487`: **SUCCESS**, **301/301 PostgreSQL**, including `AICOST-PG-001…007`.
- Database Verify run `35830485138`, job `107081686690`: **SUCCESS**.
- Web Boundary Verify run `35830485178`, job `107081686913`: **SUCCESS**.

## 4. Canonical DD / acceptance traceability

Canonical DD/acceptance commit: `68bbf796d747a7a96fd5a95f91472229f3bc7729` / tree `37431df2092822ae8486869b35fb7f1300cbfcbb`.

It adds exactly one DD-123 definition, exactly one DD-123 acceptance block, and a DD-123 changelog entry.

## 5. Promotion invariant gate

Exact invariant-gate head: `68bbf796d747a7a96fd5a95f91472229f3bc7729` / tree `37431df2092822ae8486869b35fb7f1300cbfcbb`.

- Core Service Verify run `35831170612`: Core job `107083868099` **SUCCESS**; PostgreSQL job `107083868071` **SUCCESS**.
- Database Verify run `35831170611`, job `107083868006`: **SUCCESS**.
- Web Boundary Verify run `35831170615`, job `107083867936`: **SUCCESS**.
- Counts: **311/311 Core**, **301/301 PostgreSQL**, **47 migrations / 41 SQL verification files**.
- Repository invariants: **9 Industries / 41 canonical Management Systems / 181 registered Industry tables / 2,962 preserved requirement IDs/text / 123 unique contiguous DD definitions**.

This gate authorizes promotion to `DEV-AI-COST-READ-001`; it does not expand DD-123 semantics.

## 6. Runtime semantics explicitly unclaimed

DD-123 does not:
- look up or apply provider rates;
- convert currencies;
- recompute, reconcile or finalize costs;
- aggregate usage or select metering windows;
- evaluate quota, entitlement or budget;
- interpret billable classes;
- create invoice, tax, payment, dunning or ledger effects;
- select providers/models/routes;
- mutate TokenUsage or Cost through the new read port;
- perform inference/RAG/media/tool/agent execution.

## 7. Safety

- All repository mutations are forward-only; no force-push was used.
- `main` was not merged by this continuation.
- RawSourceCorpus was not edited.
- PR #2 remains review-only/draft unless explicitly authorized.
