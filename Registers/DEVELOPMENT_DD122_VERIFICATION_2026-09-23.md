# DD-122 Development Verification — AI TokenUsage Raw Persistence Reader

**Date:** 2026-09-23  
**Branch:** `docs/architecture-branch-2`  
**Prior promoted checkpoint:** `DEV-AI-CONVERSATION-READ-001`  
**Prior DD-121 final head:** `31cd17af9705697c75f140ab21ce076ad6a3a718`

## 1. Source-first ownership audit

Fresh source reconciliation selected one exact `core_ai.token_usage` row as the next independent source-complete persistence slice.

Audit commit: `8f26274f60fba1e333cf63ab4f25465b2033a80a`.  
Audit artifact: `Development/AI_TOKEN_USAGE_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`.

The audit reconciled migration 0012 TokenUsage schema/RLS, migration 0014 AI Gateway authority, migration 0031 model/provider pair and principal-at-write integrity, DD-09 observability semantics, and existing provider/model catalog reader evidence.

## 2. Bounded implementation

Implementation commit: `bb4dd51ee9732be8ae95e14c72ef1d60c7bac8cb`.  
Implementation tree: `2a3a032a2ea72191878d432c15269cdc563f7dc4`.

Changed implementation/test surface:

- `src/core/ai/token-usage.ts`;
- `src/server/ai/postgres-ai-token-usage-store.ts`;
- `tests/postgres/ai-token-usage-store.test.mjs`;
- `src/core/index.ts` export;
- prerequisite audit numeric-evidence wording corrected to preserve PostgreSQL `numeric::text` without an invented JavaScript decimal grammar.

No migration, schema, verification SQL, role, grant, RLS policy, product policy, public/API route, aggregator, billing engine, router or execution path was added.

## 3. Read contract

The reader returns only exact persisted usage evidence:
- id and Tenant/optional Industry scope;
- optional principal attribution;
- raw capability code;
- provider/model ids;
- exact PostgreSQL numeric-text input/output/optional media units;
- occurred timestamp;
- correlation id.

The database RLS does not use `principal_id`; acceptance explicitly proves principal attribution is not principal-private read ownership.

## 4. Historical catalog evidence is not current routing

Fixtures persist TokenUsage against an exact provider/model pair and capability while those catalog rows are ACTIVE, then retire the provider/model/capability before reads. DD-122 still returns the historical references.

This proves the raw reader does not silently become a current router/eligibility evaluator.

## 5. Exact implementation-head CI

Exact tested implementation head: `bb4dd51ee9732be8ae95e14c72ef1d60c7bac8cb`.

- Core Service Verify run `35829556982`, Core job `107078779517`: **SUCCESS**, **311/311 Core**.
- Same run, PostgreSQL/RLS job `107078779791`: **SUCCESS**, **294/294 PostgreSQL**, including `AIUSAGE-PG-001…007`.
- Database Verify run `35829560812`, job `107078791718`: **SUCCESS** (pull_request event, exact same head).
- Web Boundary Verify run `35829556923`, job `107078779150`: **SUCCESS**.

## 6. Canonical DD / acceptance traceability

Canonical DD/acceptance commit: `ac679e24feb8dc12cc494bca4bd8d0e2fb9724f9` / tree `cf44eda351e6ada82e0213ecc6963408d94d0919`.

It adds exactly one DD-122 definition, exactly one DD-122 acceptance block, and a DD-122 changelog entry.

## 7. Promotion invariant gate

Exact invariant-gate head: `ac679e24feb8dc12cc494bca4bd8d0e2fb9724f9` / tree `cf44eda351e6ada82e0213ecc6963408d94d0919`.

- Core Service Verify run `35829783643`: Core job `107079469547` **SUCCESS**; PostgreSQL job `107079469612` **SUCCESS**.
- Database Verify run `35829783632`, job `107079469285`: **SUCCESS**.
- Web Boundary Verify run `35829783642`, job `107079469687`: **SUCCESS**.
- Counts: **311/311 Core**, **294/294 PostgreSQL**, **47 migrations / 41 SQL verification files**.
- Repository invariants: **9 Industries / 41 canonical Management Systems / 181 registered Industry tables / 2,962 preserved requirement IDs/text / 122 unique contiguous DD definitions**.

This gate authorizes promotion to `DEV-AI-TOKEN-USAGE-READ-001`; it does not expand DD-122 semantics.

## 8. Runtime semantics explicitly unclaimed

DD-122 does not:
- select/revalidate current provider/model/capability eligibility or routing;
- evaluate permission, entitlement, budget, quota or limits;
- aggregate usage or choose metering windows;
- load/finalize `ai_cost`, apply rates, compute cost or bill;
- load conversation/message/prompt content;
- perform inference, embeddings, RAG, media generation, tool or agent execution.

## 9. Safety

- All repository mutations are forward-only; no force-push was used.
- `main` was not merged by this continuation.
- RawSourceCorpus was not edited.
- PR #2 remains review-only/draft unless explicitly authorized.
