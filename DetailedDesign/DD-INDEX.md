# DD-INDEX — DETAILED DESIGN INDEX
**Updated:** 2026-09-23 · **Historical design checkpoint:** `PHASE3-DD-REVALIDATED` · **Current Development:** `DEV-AI-PROMPT-SET-MEMBER-READ-001`

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

The historical pre-development authorization gate was subsequently satisfied and Development started. Development remains **IN PROGRESS**. Decisions are contiguous through **DD-114**; current evidence is in [CORE_SERVICE_CHECKPOINT](../Development/CORE_SERVICE_CHECKPOINT.md).

DD-114 adds an exact-by-id scoped `core_ai.ai_prompt_set_member` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. Child-row visibility remains parent-derived FORCE-RLS. The reader returns only member id, PromptSet id, PromptTemplate id, raw integer priority, raw enabled flag and created timestamp. It does not calculate effective membership, order/select prompts, revalidate execution eligibility, render a PromptTemplate or execute a prompt. Existing database DML privileges remain migration-owned; PLATFORM-parent writes remain protected by existing definition-member/control-plane policies.

Workflow/Automation runtime execution and concrete AI Gateway execution remain unfinished on source-owned prerequisites. Notification runtime, secret retrieval, webhook/event runtime, Document signing, REST exposure and DD-076 evaluator also remain unfinished where documented.

## Historical all-stages checkpoint evidence
PostgreSQL+pgvector PASS: commit `2c36b43a7d55c6600b71f9714389e025a06df580`, Database Verify run `34800144921`, job `103841023234`. All 32 migrations and 26 verification files executed, including 0099. The workflow log asserts the tested branch commit; the completed all-stages audit and metadata closure are recorded in [ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13](../Registers/ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md).
Earlier Phase-3 labels describe their recorded baseline. Current source-owner reconciliation and the full-file audit supersede inherited traceability/count assumptions without changing the preserved source IDs.

**Historical Development evidence:** `3e7b2927…` — 47 Core/server acceptance tests, 11 PostgreSQL tests, and 34 migrations / 28 verification files passed at that checkpoint.

**Current verified executable evidence:** `33649045e4cf6de2f043614ad07c26ed957ca241` / tree `9749a789be340dffc7b7e502715a5619e8f06624` — 311 Core tests, 238 PostgreSQL tests including `AIPROMPTMEM-PG-001…007`, full 47/41 bootstrap, Database Verify and Next.js build PASS. Promotion invariant gate `c487cb825494bc53fc794202dbe691c8d050f61c` / tree `6e0943855ddcce4cd3dd7bf0f59d24a55a1a7784`: Core run `35819342841` (Core job `107047649300`, PostgreSQL job `107047649020`), Database run `35819342753` (job `107047648783`), Web run `35819342805` (job `107047648893`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 114 unique DD definitions**. See [verification evidence](../Registers/DEVELOPMENT_DD114_VERIFICATION_2026-09-23.md).
