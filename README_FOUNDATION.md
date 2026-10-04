# SBGlobal Plus — Canonical Development Branch
**Current checkpoint:** `DEV-AI-AGENT-STEP-ACTING-TOOL-RBAC-CURRENT-EVIDENCE-READER-001`
**Current executable audit basis:** `ff2aaba886bc1ba2237ffcc7691099cda01d5fb7` / tree `26e5305cb12ce4e50782ba30f71e77091a898733`
**Updated:** 2026-10-04 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-04):** DD-448…DD-452 AgentStep acting-principal TOOL current-RBAC necessary evidence is implemented and exact-head verified at the basis above. This canonical promotion must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-448…DD-452 is the current governed backend-only AgentStep acting-principal TOOL current-RBAC necessary-evidence composition. It reuses exact DD-447 evidence; non-TOOL branches perform zero new acting-principal Authorization reads, while TOOL branches read exactly preserved ToolDefinition.requiredPermission under the unchanged acting RequestContext.

Verified exact-head implementation basis `ff2aaba886bc1ba2237ffcc7691099cda01d5fb7` / tree `26e5305cb12ce4e50782ba30f71e77091a898733`: **1269/1269 Core**, **532/532 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

Applicable ABAC policies plus nested AgentApproval, OperationContract and capability metadata remain raw evidence only. TOOL success proves a necessary current compiled-RBAC ALLOW floor for preserved ToolDefinition.requiredPermission. No permission-compatibility rule, full AuthorizationDecision, approval satisfaction, resource/commercial/entitlement admission, transition, dispatch, mutation/event, provider/model routing or AI/tool execution is introduced.

Evidence: `Registers/DEVELOPMENT_DD448_DD452_VERIFICATION_2026-10-04.md`. Source audit: `Development/AI_AGENT_STEP_ACTING_TOOL_RBAC_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this canonical promotion at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, record promotion evidence and stage DD-448…DD-452 state closure before another source audit.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
