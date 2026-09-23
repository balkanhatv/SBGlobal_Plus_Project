# CORE SERVICE CHECKPOINT — DEV-AI-POLICY-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `248c8c244451dbd5de1ab4dad1ef918ad2c27c6a` / tree `fb45303a943d0815d0f39572b1fe50d0b55cdac4`: **311/311 Core**, **252/252 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `748c5ef4d279449153ea21415991a8ca25b41ff3` / tree `4e00936add146abd78bf697076af37b2de6601e3`: Core run `35821125279` (Core job `107052982234`, PostgreSQL job `107052982386`), Database run `35821125067` (job `107052981695`), Web run `35821125257` (job `107052982573`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 116 unique DD definitions**.

## Implemented boundary

DD-116 adds an exact-by-id scoped `core_ai.ai_policy` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. FORCE-RLS scope, raw code/priority/status, constrained effect, immutable condition/constraint JSON, positive version and timestamps remain persisted evidence only. The new port is read-only; it does not determine policy applicability, evaluate conditions/constraints, apply ALLOW/DENY/RESTRICT precedence or authorize any AI runtime action. Existing migration-owned AI Policy DML authority remains unchanged, while PLATFORM mutation remains protected by migration 0032.

`AIPOLICY-PG-001`…`AIPOLICY-PG-007` prove exact immutable scoped AI Policy read, sibling-Industry and foreign-Tenant isolation, same-Tenant visibility, PLATFORM_GLOBAL-only platform read, safe missing/malformed/route-mismatch behavior, raw integer/text/JSON preservation, and existing write governance without exposing mutation/list/sort/evaluate/decision/execute methods through the new port.

## Remaining scope

AI Policy listing/priority ordering/applicability, condition-AST evaluation, constraint interpretation, ALLOW/DENY/RESTRICT precedence, effective policy inheritance/current selection, capability eligibility, entitlement evaluation, provider/model/prompt/tool/agent routing, prompt override/grounding enforcement, credentials, inference/RAG/media generation, tool/agent execution and Workflow/Automation runtime semantics remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open AI Policy evaluation, provider/model selection, eligibility/routing, secret resolution, fallback/retry, inference/embedding, RAG, assistant/agent/tool execution, `AIProvisioningSnapshot` compilation/current-selection, prompt rendering/policy evaluation or Workflow/Automation runtime semantics without source-owned authority.

Evidence: `Registers/DEVELOPMENT_DD116_VERIFICATION_2026-09-23.md`.

RawSource accepted blobs unchanged; `main` remains outside this branch continuation; PR #2 remains review-only/draft until explicitly authorized.
