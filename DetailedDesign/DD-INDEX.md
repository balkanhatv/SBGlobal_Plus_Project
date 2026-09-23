# DD-INDEX — DETAILED DESIGN INDEX
**Updated:** 2026-09-23 · **Historical design checkpoint:** `PHASE3-DD-REVALIDATED` · **Current Development:** `DEV-AI-MESSAGE-READ-001`

| Range | Historical Phase-3 design status |
|---|---|
| DD-00…DD-08 | Shared/Core DD — fresh revalidated / verified |
| DD-09…DD-16 | Experience/AI/offline/infra/security DD — fresh revalidated / verified |
| DD-17…DD-19 | Acceptance/decisions/traceability — Phase-3, Database audit and current Development propagation |
| DD-20A/B/H | Historical audit evidence |
| DD-20C | Historical prior-head Wave-3 audit |
| DD-20D | Current Phase-3 overall adversarial PASS |
| DD-21 | 41-MS acceptance contracts — verified |
| DD-22 | 41 workflow matrices — verified |
| DD-23/23A | behavioral catalogs/indexes/field registry — verified |
| DD-24 | industry domain-rule decisions — verified |
| DD-25/DD-28 | KPI contracts + 165/165 named coverage — verified |
| DD-26 | surfaces/MS/mobile/Future-Industry canonical IDs — Phase-3 updated |
| DD-27 | 41-MS determinism evidence — verified |
| DD-29 | Phase-3 ambiguity sweep PASS; current Core binding gaps recorded below |
| DD-30 | Phase-3 requirement traceability PASS |
| DD-31 | Phase-3 Development/QA determinism PASS |
| Industries/* | 9/9 Industry DD artifacts fresh read; mobile app mapping normalized |

## Historical design gate and current Development scope
**FOUNDATION PASS · ARCHITECTURE PASS · DETAILED DESIGN COMPLETE / PHASE 3 PASS.**

The historical pre-development authorization gate was subsequently satisfied and Development started. Development remains **IN PROGRESS**. Decisions are contiguous through **DD-126**; current evidence is in [CORE_SERVICE_CHECKPOINT](../Development/CORE_SERVICE_CHECKPOINT.md).

DD-126 adds an exact-by-id scoped `core_ai.ai_message` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. Message visibility remains parent-Conversation-derived FORCE-RLS and therefore Tenant/optional Industry + exact owner-principal private. The reader returns only id, Conversation id, raw role, raw content reference/encrypted content, optional immutable normalized source JSON, optional model-route UUID, created timestamp and optional deleted timestamp. It does not list/order history, interpret roles, decrypt/dereference content, authorize sources, resolve/select model routes/providers/models, evaluate retention/erasure/legal hold, reconstruct prompts or perform inference/RAG. Existing AI Gateway message DML authority remains migration-owned; the DD-126 port itself is read-only.

Workflow/Automation runtime execution and concrete AI Gateway execution remain unfinished on source-owned prerequisites. Notification runtime, secret retrieval, webhook/event runtime, Document signing, REST exposure and DD-076 evaluator also remain unfinished where documented.

## Historical all-stages checkpoint evidence
PostgreSQL+pgvector PASS: commit `2c36b43a7d55c6600b71f9714389e025a06df580`, Database Verify run `34800144921`, job `103841023234`. All 32 migrations and 26 verification files executed, including 0099. The workflow log asserts the tested branch commit; the completed all-stages audit and metadata closure are recorded in [ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13](../Registers/ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md).
Earlier Phase-3 labels describe their recorded baseline. Current source-owner reconciliation and the full-file audit supersede inherited traceability/count assumptions without changing the preserved source IDs.

**Historical Development evidence:** `3e7b2927…` — 47 Core/server acceptance tests, 11 PostgreSQL tests, and 34 migrations / 28 verification files passed at that checkpoint.

**Current verified executable evidence:** `fec7fd3a6c699f1284fe170a92ac68c1d9ecdb2e` / tree `ec0afe1fc58f3be5bf9ed34084a4cd06226a9ed5` — 311 Core tests, 322 PostgreSQL tests including `AIMSG-PG-001…007`, full 47/41 bootstrap, Database Verify and Next.js build PASS. Promotion invariant gate `a3c7dafc0df0dfd01edba42f9dce85c98b9ae9c6` / tree `b66ae8e0935d65e86283624c624511555c54b2b8`: Core run `35839860371` (Core job `107112086949`, PostgreSQL job `107112086571`), Database run `35839860327` (job `107112086412`), Web run `35839860622` (job `107112087219`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 126 unique DD definitions**. See [verification evidence](../Registers/DEVELOPMENT_DD126_VERIFICATION_2026-09-23.md).
