# DD-INDEX — DETAILED DESIGN INDEX
**Updated:** 2026-09-24 · **Historical design checkpoint:** `PHASE3-DD-REVALIDATED` · **Current Development:** `DEV-MACHINE-PRINCIPAL-METADATA-READ-001`

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

The historical pre-development authorization gate was subsequently satisfied and Development started. Development remains **IN PROGRESS**. Decisions are contiguous through **DD-159**; current evidence is in [CORE_SERVICE_CHECKPOINT](../Development/CORE_SERVICE_CHECKPOINT.md).

DD-159 adds a server-internal exact-id machine-principal metadata reader through the fixed Identity-service boundary. Principal type/status/auth epoch and SERVICE scope metadata remain raw evidence; no current-principal or machine-authentication decision is implied.

Workflow/Automation runtime execution and concrete AI Gateway execution remain unfinished on source-owned prerequisites. Notification runtime, secret retrieval, webhook/event runtime, Document signing, REST exposure and DD-076 evaluator also remain unfinished where documented.

## Historical all-stages checkpoint evidence
PostgreSQL+pgvector PASS: commit `2c36b43a7d55c6600b71f9714389e025a06df580`, Database Verify run `34800144921`, job `103841023234`. All 32 migrations and 26 verification files executed, including 0099. The workflow log asserts the tested branch commit; the completed all-stages audit and metadata closure are recorded in [ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13](../Registers/ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md).
Earlier Phase-3 labels describe their recorded baseline. Current source-owner reconciliation and the full-file audit supersede inherited traceability/count assumptions without changing the preserved source IDs.

**Historical Development evidence:** `3e7b2927…` — 47 Core/server acceptance tests, 11 PostgreSQL tests, and 34 migrations / 28 verification files passed at that checkpoint.

**Current verified executable evidence:** `3cbed05188f21ed04ad4c1bb6964e50f6447c940` / tree `bbd14cdb2fc39fd43ef7dce8562e486f4cf2b858` — 367 Core tests, 497 PostgreSQL tests including `MACHPRINC-PG-001…007`, full 47/41 bootstrap, Database Verify and Next.js build PASS. Promotion invariant gate `3504c9f946b68e4dd49eff070bd35694e36c807f` / tree `cad82fb83e0b94771325bb7e53eacdd1604597b7`: Core run `35952927992` (Core job `107485122128`, PostgreSQL job `107485121910`), Database run `35952927996` (job `107485122074`), Web run `35952927991` (job `107485122181`) — SUCCESS; **159 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements. See [verification evidence](../Registers/DEVELOPMENT_DD159_VERIFICATION_2026-09-24.md).

Post-promotion DD-145 fidelity correction `14b69ad4c66d78340c0bd020d65ff1f444b7c02c` / tree `35d7e5dafb39c53384f817cfba3a8d56ffd048ec`: Core run `35909155774` (job `107344302164`) **311/311**, PostgreSQL job `107344301757` **462/462** including corrected `APICRED-META-PG-004`, Database run `35909155819` (job `107344301870`) SUCCESS, Web run `35909155798` (job `107344301871`) SUCCESS. This changes only schema-valid nullable `allowed_cidrs` preservation; DD-146 checkpoint and OperatorElevation semantics are unchanged.
