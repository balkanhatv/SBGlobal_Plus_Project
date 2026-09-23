# CORE SERVICE CHECKPOINT — DEV-AI-AGENT-RUN-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `eb814317f0613724c175eaa8181d0e17aad856d3` / tree `42218d9b1794773c1d12c1c23dcda1cef87e9140`: **311/311 Core**, **350/350 PostgreSQL**, **47 migrations / 41 SQL verification files**, Next.js build and Database Verify PASS.

Promotion invariant gate `95827395c065d840b0fd1aff43a7176350385c0b` / tree `7f59266585a8e136afebc4cb6d8c202fbf5ef8c2`: Core run `35851164022`, Database run `35851163994`, Web run `35851163976` — SUCCESS; **130 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

DD-130 adds an exact-by-id principal-scoped `core_ai.agent_run` raw persistence reader. FORCE-RLS remains authoritative. Raw startup versions, requested-resource-scope, status, budget classes and lifecycle timestamps remain persisted evidence only; they do not authorize current access, resume, steps/approvals or tool execution.

`AIAGENTRUN-PG-001`…`AIAGENTRUN-PG-007` cover exact principal-owned read, sibling-Industry isolation, acting-principal privacy, Tenant-Core same-principal visibility, foreign-Tenant/PLATFORM_GLOBAL isolation, fail-closed malformed/route behavior, and non-escalation of raw run evidence.

## Remaining scope

Fresh source-audit the next independent source-complete persistence slice. Keep current AgentRun authorization/resume, AgentStep/Approval execution, tool execution, provider/model runtime, inference/RAG and Workflow/Automation runtime outside scope unless separately source-owned.

Evidence: `Registers/DEVELOPMENT_DD130_VERIFICATION_2026-09-23.md`.
