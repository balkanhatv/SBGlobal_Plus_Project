# AI AgentStep visible-parent + optional AgentApproval + OperationContract + capability current-evidence reader prerequisite ownership audit

**Date:** 2026-10-03  
**Baseline checkpoint:** `DEV-AI-AGENT-STEP-VISIBLE-PARENT-APPROVAL-OPERATION-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `38e0457e1bd774607c429ae767a1495d2d1bca9c`  
**Verified entry tree:** `f3efd822b21101385c2cd515f73ea9f76ae9186e`  
**Governed batch:** DD-413 through DD-417

## Entry gate

DD-408…DD-412 corrected canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37088619585`: Core job `111103950894` **1198/1198 PASS**, PostgreSQL job `111103950781` **529/529 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37088619578` / job `111103950660` PASS, **48 migrations / 42 SQL verification files**. Web run `37088619583` / job `111103950840` PASS.

This closes DD-408…DD-412 at its bounded evidence scope. PR #2 remains open/draft/unmerged; RawSource remains unchanged; `main` remains unmerged.

## Reconciled owners and determination

- DD-412 owns `loadAIAgentStepApprovalOperationCurrentEvidence(...)`: exact DD-407 AgentStep/approval evidence plus conditional exact canonical OperationContract registry evidence for persisted TOOL steps only. Operation metadata remains raw and non-TOOL steps perform zero registry reads.
- Migration 0011 owns global `core_ai.ai_capability` with `code text NOT NULL UNIQUE` and the persisted capability metadata already exposed by DD-109.
- Migration 0013 owns `core_ai.ai_tool_definition.capability_code text NOT NULL REFERENCES core_ai.ai_capability(code)`.
- Migration 0014 grants the dedicated `sbg_ai_gateway_rw` role SELECT on both `ai_capability` and `ai_tool_definition`, with no catalog mutation authority.
- DD-109 owns the immutable AICapability metadata shape and existing exact-by-id PostgreSQL reader; the current store intentionally does not interpret status, entitlement or default policy.
- DD-203 owns `matchesAIToolDefinitionCapabilityBindingFloors(toolDefinition, capability?)`: exact persisted capability-code continuity only, with no lifecycle/eligibility/policy/execution semantics.
- The current capability port exposes `loadById` only. Because the physical FK itself targets the unique `ai_capability(code)`, following one already-preserved ToolDefinition `capabilityCode` requires an exact-by-code read surface; inventing an id lookup, alias resolver, normalization or category search would be incorrect.

**SOURCE-COMPLETE:** add an exact-by-code read capability for the existing immutable capability catalog store, then extend exact DD-412 evidence with the exact capability row referenced by the already-bound TOOL definition and re-apply DD-203. Capability lifecycle/category/entitlement/default-policy/schema semantics remain raw. No authorization, policy, admission, routing or execution semantics are required.

## Frozen decisions

**DD-413 — exact-by-code AICapability catalog read surface.** Add a separate `AICapabilityCatalogMetadataByCodeReadPort` with `loadByCode(code)`, implemented by `PostgresAICapabilityCatalogMetadataStore`. Query exactly `core_ai.ai_capability.code`, return the same DD-109 immutable metadata shape, return null for no row, fail closed for non-string runtime input or ambiguous evidence, and perform no trim/case-fold/alias/fallback. Empty text remains schema-valid input and must not be strengthened into a new non-empty policy.

**DD-414 — DD-412 parent evidence first; non-TOOL zero capability reads.** Add `loadAIAgentStepApprovalOperationCapabilityCurrentEvidence(...)`. Invoke DD-412 first with the exact supplied RequestContext and AgentStep id. Null short-circuits before capability access and dependency errors propagate unchanged. If the preserved step is not TOOL, perform zero capability reads and return only the exact DD-412 parent evidence.

**DD-415 — exact persisted capability-code lookup plus DD-203 continuity floor.** For TOOL evidence, use exactly `parent.parent.parent.toolDefinition.capabilityCode` for one `loadByCode` call. Null returns null; dependency errors propagate unchanged. Re-apply DD-203 against the exact preserved ToolDefinition and returned capability. False returns null. Do not search by capability id/category/entitlement/default policy or any other field.

**DD-416 — immutable layered exact-reference evidence.** Non-TOOL success returns frozen `{ parent }`. TOOL success returns frozen `{ parent, capability }`, preserving the exact DD-412 parent object and exact capability object returned by the catalog reader without clone, normalization or mutation.

**DD-417 — raw capability evidence without eligibility/admission/runtime authority.** Preserve capability id/code/category/requiredEntitlement/defaultPolicyClass/schemaVersion/status as raw catalog evidence only. Do not decide `status='ACTIVE'` currentness, capability entitlement/policy satisfaction, ToolDefinition/OperationContract/capability compatibility, Tenant/Industry allowlisting, RequestContext authorization, approval satisfaction/currentness, GuardPipeline/idempotency/rate/commercial admission, AgentRun transitions, dispatch, provider/model routing or tool/AI execution.

## Fixed acceptance before implementation

- **AICAP-CODE-PG-001** exact code read returns the same complete immutable DD-109 capability metadata.
- **AICAP-CODE-PG-002** absent exact code returns null; case/whitespace variants are not normalized; non-string runtime input fails closed.
- **AICAP-CODE-PG-003** empty-string lookup is not rejected by an invented non-empty rule and the read surface adds no mutation/policy/execution methods.
- **AISTEP-CAPREAD-BASE-001** exact DD-412 parent evidence is reused first with unchanged RequestContext/id.
- **AISTEP-CAPREAD-BASE-002** DD-412 null/error short-circuits or propagates before any capability read.
- **AISTEP-CAPREAD-BRANCH-001** non-TOOL step performs zero capability reads and returns parent-only evidence.
- **AISTEP-CAPREAD-CAP-001** TOOL step reads exactly the preserved ToolDefinition capabilityCode once.
- **AISTEP-CAPREAD-CAP-002** missing capability or reader error returns/propagates without id/category/entitlement/policy fallback.
- **AISTEP-CAPREAD-FLOOR-001** DD-203 exact capability-code continuity passes valid evidence and fails closed on mismatched/malformed evidence.
- **AISTEP-CAPREAD-EVID-001** returned envelope is frozen and preserves exact parent/capability object identity.
- **AISTEP-CAPREAD-RAW-001** capability lifecycle/category/entitlement/default-policy/schema metadata remains uninterpreted and inputs are unchanged.
- **AISTEP-CAPREAD-BOUND-001** successful evidence creates no capability-currentness, authorization, entitlement/policy, approval, admission, routing, dispatch or AI/tool execution authority.

Expected executable delta: Core **1198 → 1207**. PostgreSQL **529 → 532**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, RLS, role, grant, route, frontend, provider SDK, credential, worker, scheduler or RawSource change.

This batch does **not** implement capability ACTIVE/current eligibility, entitlement/default-policy evaluation, Tenant/Industry capability allowlisting, ToolDefinition↔OperationContract↔capability compatibility policy, schema execution, current DD-03/DD-04 authorization, approval satisfaction/currentness, resource/GuardPipeline/idempotency/rate/commercial admission, AgentRun transitions, OperationContract dispatch, provider/model routing or AI/tool execution.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-413…DD-417 and the fixed acceptances.
