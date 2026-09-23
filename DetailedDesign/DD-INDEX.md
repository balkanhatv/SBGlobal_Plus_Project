# DD-INDEX — DETAILED DESIGN INDEX
**Updated:** 2026-09-23 · **Historical design checkpoint:** `PHASE3-DD-REVALIDATED` · **Current Development:** `DEV-AI-TOOL-SET-READ-001`

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

The historical pre-development authorization gate was subsequently satisfied and Development started. Development remains **IN PROGRESS**. Decisions are contiguous through **DD-111**; current evidence is in [CORE_SERVICE_CHECKPOINT](../Development/CORE_SERVICE_CHECKPOINT.md).

DD-111 adds an exact-by-id owner-scoped `core_ai.ai_tool_set` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. PLATFORM/TENANT/INDUSTRY ownership, raw code, positive version, constrained lifecycle status and timestamps remain persisted evidence only; they do not select an ACTIVE/current ToolSet, resolve members, bind an Assistant/Agent, authorize a tool, or execute anything. Existing schema-owned Tenant/Industry ToolSet DML privileges of `sbg_ai_gateway_rw` remain unchanged, while migration-0032 continues to protect PLATFORM ToolSet writes behind the control-plane role. No migration, schema, verification SQL, role, grant, RLS, product-policy or public-route change is introduced by DD-111.

Workflow/Automation runtime execution and concrete AI Gateway execution remain unfinished on source-owned prerequisites. Notification runtime, secret retrieval, webhook/event runtime, Document signing, REST exposure and DD-076 evaluator also remain unfinished where documented.

## Historical all-stages checkpoint evidence
PostgreSQL+pgvector PASS: commit `2c36b43a7d55c6600b71f9714389e025a06df580`, Database Verify run `34800144921`, job `103841023234`. All 32 migrations and 26 verification files executed, including 0099. The workflow log asserts the tested branch commit; the completed all-stages audit and metadata closure are recorded in [ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13](../Registers/ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md).
Earlier Phase-3 labels describe their recorded baseline. Current source-owner reconciliation and the full-file audit supersede inherited traceability/count assumptions without changing the preserved source IDs.

**Historical Development evidence:** `3e7b2927…` — 47 Core/server acceptance tests, 11 PostgreSQL tests, and 34 migrations / 28 verification files passed at that checkpoint.

**Current verified executable evidence:** `e37e3bf6647677aceac4ae1fef4431583c014333` / tree `3054cb79bac53a6d938de4cba22f50cf0256eeb3` — 311 Core tests, 217 PostgreSQL tests including `AITOOLSET-PG-001…007`, full 47/41 bootstrap, Database Verify and Next.js build PASS. Promotion invariant gate `cab052297cdc7445c95c20bf08b96fb24bc6d8e1` / tree `b1ec4f689a900d89a0deeee6d6988172825a1ae6`: Core run `35816606234` (Core job `107039362630`, PostgreSQL job `107039362430`), Database run `35816606217` (job `107039362608`), Web run `35816606237` (job `107039362540`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 111 unique DD definitions**. See [verification evidence](../Registers/DEVELOPMENT_DD111_VERIFICATION_2026-09-23.md).
