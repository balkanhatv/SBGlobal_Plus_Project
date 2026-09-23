# CORE SERVICE CHECKPOINT — DEV-AI-TOOL-SET-MEMBER-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `85e16581eb117314ada8ab9ba137768371016bf3` / tree `69a30456316baac98c439499b73669be8af445b2`: **311/311 Core**, **231/231 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `1ee703d58d21a25f7c96ad056b34c1f0babb554a` / tree `24d7702008d3c77f7c54ea7d9379f7422e113402`: Core run `35818233377` (Core job `107044302891`, PostgreSQL job `107044302945`), Database run `35818233384` (job `107044303161`), Web run `35818233378` (job `107044302822`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 113 unique DD definitions**.

## Implemented boundary

DD-113 adds an exact-by-id scoped `core_ai.ai_tool_set_member` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. Child-row visibility remains parent-derived FORCE-RLS. The reader returns only member id, ToolSet id, Tool Definition id, raw enabled flag, immutable normalized `constraint_json`, and created timestamp. It does not calculate effective membership, interpret constraints, select ACTIVE/current ToolSets, revalidate execution eligibility or execute a tool. Existing database DML privileges remain migration-owned; PLATFORM-parent writes remain protected by existing definition-member/control-plane policies.

`AITOOLMEM-PG-001`…`AITOOLMEM-PG-007` prove exact immutable scoped member read, sibling-Industry and foreign-Tenant isolation through the parent, same-Tenant visibility, PLATFORM_GLOBAL-only platform-parent read, safe missing/malformed/route-mismatch behavior, immutable raw JSON evidence, and preservation of existing write governance without exposing mutation/list/effective-resolution/constraint-evaluation/execute methods through the new port.

## Remaining scope

ToolSet member listing/effective resolution, constraint interpretation, current ToolDefinition activity revalidation for execution, tool eligibility/permission/entitlement/approval/side-effect/resource-scope enforcement, Assistant/Agent binding, AgentStep execution, Tool Definition/OperationContract execution, AI provisioning/configuration, provider/model/prompt/policy/routing selection, credentials, inference/RAG and Workflow/Automation runtime semantics remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open effective ToolSet membership, constraint interpretation, tool authorization/execution, provider/model selection, eligibility/routing, secret resolution, fallback/retry, inference/embedding, RAG, assistant/agent execution, `AIProvisioningSnapshot` compilation/current-selection, prompt rendering/policy evaluation or Workflow/Automation runtime semantics without source-owned authority.

Evidence: `Registers/DEVELOPMENT_DD113_VERIFICATION_2026-09-23.md`.

RawSource accepted blobs unchanged; `main` remains outside this branch continuation; PR #2 remains review-only/draft until explicitly authorized.
