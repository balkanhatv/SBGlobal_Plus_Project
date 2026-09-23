# DD CHANGELOG

| Date | Change | Scope |
|---|---|---|
| 2026-09-11 | DetailedDesign zero-start governance, index, decision framework and Wave-1 overview established from certified CP-REM-002. | DD governance |
| 2026-09-11 | DD Wave 1 dependency spine completed: module boundaries, Tenant+Industry Context, identity/authorization, commercial/entitlement, Core database/RLS, API/event/webhook, document/storage, audit/observability, tests, traceability and adversarial audit. | DD Wave 1 |
| 2026-09-11 | DD Wave 2 completed: four application surfaces/shells; mobile/offline; Tauri desktop; AI/RAG/agents; integration registry/adapters; infrastructure/runtime; security/compliance; observability extensions; Wave-2 tests, traceability and adversarial audit. | DD Wave 2 |
| 2026-09-11 | Shared P2 defaults DD-022…DD-027 closed; Wave 3 completed all 41 MS across 9 industries; cross-industry audit, full traceability and full adversarial audit PASS; overall Detailed Design certification earned. | DD Wave 3 / overall Detailed Design |
| 2026-09-11 | Fable 5 requirements audit reopened unsupported DD-COMPLETE/READY FOR DEVELOPMENT gate; current state set to remediation required and development blocked. | DD remediation |
| 2026-09-12 | Fable 5 closure completed: 41-MS substantive re-audit, exact workflows/catalogs/domain rules/KPI coverage, final-head isolation, requirement-level traceability, REVIEW_REQUIRED sweep and overall adversarial DD-20D PASS. New checkpoint DD-F5-RECERTIFIED; Development authorized as next phase. | DD final recertification |
| 12-09-2026 | Final evidence consistency correction: DD-17 summary counts reconciled to authoritative artifacts (DD-22 = 41 major MS workflow matrices / 309 allowed edges; DD-25 = 169 KPI contracts; DD-28 = 165/165 named metrics mapped). HANDOFF/PHASE headers made explicitly current while preserving historical blocks. No product/DD semantics changed; substantive audited HEAD remains 810e43c9c75e3750f52cc7e1954db8f341e6d79b. | Final audit/state evidence; AI |
| 2026-09-13 | Phase 3 fresh DD revalidation: 55/55 DD files full-read; propagated Phase-1/2 deltas into DD-01/05/09/10/11/13/17/18/19/26 and all 9 Industry DD mobile mappings; refreshed DD-20D/DD-29/DD-30/DD-31; DD COMPLETE / ready for final pre-development gate. | PHASE3-DD-REVALIDATED |
| 2026-09-13 | Current-state audit propagated executable database findings into DD-03/05/07/08/09/17/18 and PSV media fields: immutable/same-scope ownership, dedicated roles/elevation, exact event/webhook scope, DocumentMeta dependencies/provenance and physical PromptSet/ToolSet contracts. Runtime verdict remains conditional on exact-head CI. | DEV-DB-AC-008…010 / DD-036…039 |
| 2026-09-14 | All-stages audit reconciliation: 0032 closes general-role platform-definition/child writes; DBA-001…013 and exact-commit CI cover the corrected persistence contracts. Source routes, DD state/traceability and current/historical evidence reconciled. HLT literal newlines and DD-22/22H/changelog table delimiters repaired without changing domain workflow cells. | Current Database checkpoint; audit report and per-file ledger |

## 2026-09-14 — DD-040 / concrete Core SQL adapter binding
Rechecked the current remote Core checkpoint against DD-02/03/04/05/06 and the SQL inventory. Recorded exact field ownership and the unbound compiled-permission/Industry-presentation dependencies in `../Development/CORE_PERSISTENCE_ADAPTER_MAP.md`. DD-040 specifies pool transaction, RLS role, route matching, cleanup and acceptance for the independent application SQL driver prerequisite; no industry schema or RawSource changes.


## 2026-09-17 — DD-043 platform-global scope propagation
Fresh zero-trust continuation found that DD-043 tests and persistence existed but the SQL request-scope implementation and current acceptance/traceability projections were incomplete. RequestScopedSql now denies HUMAN/API_CLIENT PLATFORM_GLOBAL contexts before transaction use; DD-17 adds explicit ID/DB acceptance contracts; DD-19 routes DD-043 through migration/verification 0034 and executable tests. Exact-head Core and Database CI passed at `3e7b2927839d289240eb389902563f5ab3d68074`. No RawSource, Industry/MS model, or main-branch change.

## 2026-09-17 — DD-044 provider/session-security contract
Defined the Clerk human-session → internal principal/session/device security boundary without trusting custom provider claims for SBGlobal authorization. Added a dedicated NOBYPASSRLS identity-service SQL adapter, provider-specific Clerk IdentityPort adapter, server-owned SessionSecurityPort implementation, PostgreSQL identity/security store and executable unit + real-PostgreSQL tests. No RawSource, Industry/MS schema, `main`, production deployment or provider-SDK package bootstrap change.

## 2026-09-20 — Commercial current-state audit correction
Fresh zero-trust audit preserved DD-069 as the last feature slice and corrected only evidence-backed drift: DD-068 now accepts canonical PENDING Industry inventory while remaining ACTIVE-only for baseline expansion; DD-065 publication revalidates snapshot effective dates and Tenant current-subscription authority; A-04/DD-06/DD-17/DD-18 references were reconciled; exact-head CI coverage now includes current checkpoint/state promotion artifacts. No new eligibility, precedence, pricing, approval or public changePlan rule was introduced.



## 2026-09-20 — DD-070 Commercial adjustment-source / eligibility boundary
Recorded the exact implemented source boundary: current Subscription + target PlanVersion revalidation, effective same-Tenant TenantAddOn/override reads under the existing Commercial compiler role, sibling-Tenant isolation, and a server-owned opaque eligibility resolver seam. No concrete eligibility, pricing, market or payment rule is claimed. Exact-head executable evidence is promoted separately through Development/State checkpoint artifacts.

## 2026-09-21 — Published PlanVersion and runtime enum audit correction
Enforced existing DD-04 published-version immutability through additive migration
0046 and real control-plane SQL regressions; retired payloads remain preserved and
runtime deletion is revoked. Added Core regressions for unknown Subscription and
entitlement type values, including rejection before publication persistence. This
is correction of existing contracts; DD-070 remains the latest feature slice.
Full-repository audit completion and the next compiler feature are not claimed.

## 2026-09-21 — DD-071 deterministic adjustment precedence
Locked and implemented the bounded DD-04 precedence stage over DD-068 baseline + DD-070 prepared adjustments: deny-wins access overrides, exact unique-meter limit overrides, resolver-eligible additive quota add-ons, deterministic output and fail-closed missing/ambiguous/type-invalid targets. No eligibility/pricing/payment/compliance/usage/public-changePlan rule was added.

## 2026-09-21 — DD-072 compliance/security restriction input boundary
Verified that current F-03/A-03/DD-03/DD-04/DD-16 contracts provide narrowing-only security/compliance semantics but no authoritative Commercial restriction persistence/reducer. Added a server-owned, exact-target, DENY-only normalized resolver seam with fail-closed target/evidence validation. No migration, compliance business rule, numeric cap, generic RESTRICT reducer or public plan-change binding was introduced.

## 2026-09-21 — DD-073 bounded usage-meter target-impact
Source audit confirmed BR-SUB-04 plus persisted usage_meter/least-privilege read ownership, but found no governed current-period selector or reserved_value downgrade rule. Added a server-owned measurement-source seam and pure evaluator that compares exact selected used_value to DD-071 target limits, treats NOT_INCLUDED/still-ADD_ON_ONLY as zero included capacity, UNLIMITED as non-blocking, and fails closed on missing/multiple periods or non-zero reservations. No DB migration, period convention, reservation formula, remediation producer or public changePlan binding was invented.

## 2026-09-21 — DD-074 subscription lifecycle target overlay
Source audit confirmed exact F-14/A-04/DD-04 lifecycle posture: GRACE retains full access; SUSPENDED is restricted; EXPIRED/CANCELLED preserve data; PENDING is not activated; Renewed is an event and PAST_DUE is invalid. Added a pure deterministic posture overlay without mutating entitlement facts or inventing restricted operation IDs/future lifecycle prediction.

## 2026-09-21 — DD-075 final target-preview materialization
Combined verified DD-071…074 evidence into one deterministic target-PlanVersion-bound preview. Compliance/security DENY now uses the already-governed Tenant deny-set / exact Industry disabled-fact representation; usage-impact and lifecycle evidence are revalidated without changing limits or inventing publication/remediation authority. No migration, fingerprint algorithm, concrete policy source, Billing/Workflow evidence or public changePlan binding was added.

## 2026-09-21 — DD-076 initial plan-change assessment preparation
Source audit found no governed blocking-impact code vocabulary, entitlement-diff evidence schema, full Commercial fingerprint algorithm or deterministic dual-route chooser. Added a SERVICE/TENANT_CORE server-owned evaluator seam that binds exact DD-075 preview to version-1 assessment preparation, derives PENDING/NOT_REQUIRED remediation and refuses to drop DD-073 blocking usage. No DB migration, concrete evaluator policy, DD-066 write, Billing/Workflow evidence or DD-065 publication orchestration was added.

## 2026-09-21 — DD-077 persisted apply-evidence gate
Implemented read-only same-Tenant consumption of DD-066 assessment/remediation/route-resolution evidence through the existing Commercial compiler role. The gate requires latest assessment evidence, exact current Subscription/source/route/fingerprint binding, correct producer-owned SATISFIED route evidence and reached NEXT_RENEWAL effectiveAt. No migration or privilege change was required. This is deliberately not yet atomic with DD-065 publication, so public changePlan remains unbound.

## 2026-09-21 — DD-078 atomic evidence→publication binding
Bound exact DD-066 assessment evidence into the DD-065 publication transaction and added migration 0047 Tenant+assessment transaction-lock serialization across all evidence inserts and publication. Latest assessment/route, remediation provenance, route policy, source fingerprint and NEXT_RENEWAL effectiveAt are revalidated before mutation. No new business table/role/RLS policy or public changePlan binding was added.

## 2026-09-21 — DD-079 prepared initial-assessment persistence
Connected DD-076 version-1 prepared assessment output to the existing DD-066 evidence service with a lossless SERVICE/TENANT_CORE handoff. Assessment identity/time/Tenant/correlation remain DD-066-owned; live Subscription/route validation, FORCE-RLS persistence and 0047 serialization remain unchanged. No migration, evaluator business semantics, Billing/Workflow producer or public changePlan binding was added.

## 2026-09-21 — DEV-VISION-AUDIT-INVARIANTS-001

Fresh baseline 3dabe35 was materialized from all 399 hash-verified remote blobs.
Correction `380ae7b984624ae3842e0293b2c075ac250c08a6` closed VC-01–04 and passed 277 Core / 65 PostgreSQL
plus exact-head DB/Web CI. Continuation `20f1f5531a75a711bb88e013d38454f8c171e6b1` completed the DD-076
prerequisite ownership audit and implemented six repository invariant tests;
283 Core / 65 PostgreSQL / full 47/41 bootstrap / DB / Web PASS.
Current projections were reconciled, including stale manifest current overlays
and already-implemented entries in pending lists; original projection payloads
remain explicitly historical. RawSource/main unchanged; PR #2 draft/unmerged.
Evidence: `Registers/DEVELOPMENT_VISION_AUDIT_VERIFICATION_2026-09-21.md`. Missing evaluator/business definitions remain dependent blocks.

## 2026-09-21 — DD-080 shared external REST Fetch adapter
Implemented auth-before-body ordering, server-owned route/context ports, exact executor handoff and canonical HTTP/error/control projection. Feature `ce4708eec15f6b0a35ae9a77d13505221fe55d51` passed exact-head CI; concrete routes, API-key syntax and OpenAPI publication remain unbound.

## 2026-09-23 — DD-110 AI Tool Definition Catalog Metadata Reader
Fresh source reconciliation corrected the prerequisite audit to include migration 0029's governed AI tool-definition `scope_class` vocabulary, then verified the bounded exact-by-id global catalog reader through the dedicated SELECT-only AI Gateway role. DD-110 preserves constrained scope/side-effect values and raw permission, entitlement, approval, idempotency, audit, status and OperationContract references as metadata evidence only; it does not create tool eligibility, authorization, approval or execution authority. No migration, schema, verification SQL, role, grant, RLS, product-policy or public-route change was introduced.

## 2026-09-23 — DD-111 AI ToolSet raw persistence reader
Fresh source reconciliation selected `core_ai.ai_tool_set` as the next independent source-complete persistence slice. The implementation reads one exact ToolSet through the existing AI Gateway + RequestScopedSql boundary, preserves PLATFORM/TENANT/INDUSTRY FORCE-RLS semantics and raw lifecycle metadata, and deliberately does not claim ACTIVE selection, member resolution, Assistant/Agent binding, tool authorization or execution. Existing Tenant/Industry ToolSet DML privileges and PLATFORM control-plane write protection remain unchanged.

## 2026-09-23 — DD-112 AI PromptSet raw persistence reader
Fresh source reconciliation selected `core_ai.ai_prompt_set` as the next independent source-complete persistence slice. The implementation reads one exact scoped PromptSet through the existing AI Gateway + RequestScopedSql boundary, preserves PLATFORM/TENANT/INDUSTRY FORCE-RLS semantics and raw lifecycle metadata, and deliberately does not claim ACTIVE selection, member resolution, PromptTemplate rendering, IndustryAIConfig resolution or prompt execution. Existing Tenant/Industry PromptSet DML privileges and PLATFORM control-plane write protection remain unchanged.

## 2026-09-23 — DD-113 AI ToolSetMember raw persistence reader
Fresh source reconciliation selected `core_ai.ai_tool_set_member` as the next independent persistence slice. The implementation reads one exact child row through parent-derived FORCE-RLS, freezes raw `constraint_json`, and deliberately does not claim effective membership, constraint interpretation, tool authorization or execution. A PostgreSQL fixture collision with DD-111's global PLATFORM ToolSet code was isolated by giving the DD-113 test fixture a unique platform code; no production schema/runtime semantics changed.

## 2026-09-23 — DD-114 AI PromptSetMember raw persistence reader
Fresh source reconciliation selected `core_ai.ai_prompt_set_member` as the next independent persistence slice. The implementation reads one exact child row through parent-derived FORCE-RLS, preserves raw integer priority and enabled evidence, and deliberately does not claim effective membership, prompt selection, rendering or execution. Fixtures use uniquely-coded PLATFORM PromptSet/PromptTemplate definitions to remain safe under parallel PostgreSQL execution; no production schema/runtime semantics changed.

## 2026-09-23 — DD-115 AI PromptTemplate raw persistence reader
Fresh source reconciliation selected `core_ai.prompt_template` as the next independent persistence slice. The implementation reads one exact scoped PromptTemplate, freezes raw variable-schema JSON and override-field evidence, and deliberately does not claim publication/current selection, approval satisfaction, override authorization, rendering or execution. No migration/schema/role/grant/RLS/product-policy/runtime execution behavior changed.

## 2026-09-23 — DD-116 AI Policy raw persistence reader
Fresh source reconciliation selected `core_ai.ai_policy` as the next independent persistence slice. The implementation reads one exact scoped policy row, freezes raw condition/constraint JSON, preserves schema-valid priority/status evidence, and deliberately does not claim applicability, precedence, evaluation, authorization or execution. No migration/schema/role/grant/RLS/product-policy/runtime evaluator behavior changed.

## 2026-09-23 — DD-117 AI AssistantDefinition raw persistence reader
Fresh source reconciliation selected `core_ai.assistant_definition` as the next independent persistence slice. The implementation reads one exact scoped AssistantDefinition, freezes allowed-capability/RAG-scope evidence, preserves prompt/tool/model/retention references, and deliberately does not claim current Assistant selection, capability eligibility, prompt rendering, RAG resolution, model routing or tool/agent execution. Acceptance also proves the reader does not silently re-evaluate write-time capability/PromptTemplate/ToolSet activity. No production schema/role/grant/RLS/product-policy/runtime execution behavior changed.

## 2026-09-23 — DD-118 AI AgentDefinition raw persistence reader
Fresh source reconciliation selected `core_ai.agent_definition` as the next independent persistence slice. The implementation reads one exact scoped AgentDefinition and preserves raw objective/risk/status plus ToolSet/approval/budget references without claiming current agent selection, effective ToolSet resolution, approval satisfaction, budget enforcement, planning or execution. Acceptance proves that a ToolSet valid at write time may later retire without silently turning the reader into a runtime revalidator. No production schema/role/grant/RLS/product-policy/runtime execution behavior changed.

