# DD-448…DD-452 verification — acting-principal TOOL current RBAC evidence

**Date:** 2026-10-04  
**Source audit:** `Development/AI_AGENT_STEP_ACTING_TOOL_RBAC_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`  
**Source-audit HEAD:** `6fb8c3129d80925b85039398dfa91e4206f8d9e8`  
**Corrected implementation HEAD/tree:** `ff2aaba886bc1ba2237ffcc7691099cda01d5fb7` / `26e5305cb12ce4e50782ba30f71e77091a898733`

## Entry and source-audit gates

DD-443…DD-447 closure/evidence basis `b7b4683b0159c63e3fee93c032cb6bd4269d813f` / tree `d0f629ab16c135057c1174dd9fb7d30f3a018f18` was exact-head green before this batch. DD-448…DD-452 source-audit HEAD `6fb8c3129d80925b85039398dfa91e4206f8d9e8` passed push Core/PostgreSQL run `37181338737` / jobs `111374373691`, `111374373792`; Database run `37181338731` / job `111374373609`; Web run `37181338732` / job `111374373516`. Pull-request gates on the same source-audit HEAD also passed.

## Forward-only implementation correction

Initial implementation `5d059a9b523b2389f1efb3fbb52b6d11fec6df0c` added the bounded reader, generic RBAC floor and nine fixed acceptances, but TypeScript correctly rejected a DD-447 parent-chain access that stopped one wrapper too early. The failure was limited to `step` / `toolDefinition` property access in `agent-step-acting-tool-rbac-current-evidence-reader.ts`.

Forward-only correction `ff2aaba886bc1ba2237ffcc7691099cda01d5fb7` changed only the preserved-evidence parent depth from five to six `.parent` hops. No read order, permission source, RBAC floor, test contract or authority boundary changed.

## Exact-head corrected implementation gate

Corrected implementation HEAD `ff2aaba886bc1ba2237ffcc7691099cda01d5fb7` / tree `26e5305cb12ce4e50782ba30f71e77091a898733` passed:
- Core push run `37182583917` / job `111377960875`: **1269/1269 PASS**, fail/skip 0.
- PostgreSQL same run / job `111377960748`: **532/532 PASS**, fail/skip 0; full database bootstrap PASS.
- Database pull-request run `37182585643` / job `111377966006`: PASS; inventory **48 migrations / 42 SQL verification files**.
- Web push run `37182583962` / job `111377960803`: PASS.
- Pull-request Core and Web workflows on the same corrected HEAD also passed.

## Bounded implementation result

The reader invokes DD-447 first. Non-TOOL evidence performs zero new acting-principal Authorization reads and returns frozen parent-only evidence. TOOL evidence uses exactly the already-preserved ToolDefinition.requiredPermission and exact input acting RequestContext for one current Authorization read, then applies the shared protected-Tenant scope/version/ordered-role/exact-one-ALLOW necessary floor.

The generic floor is shared without widening earlier approval semantics: the approval-specific helper remains a thin wrapper and prior DD-433…DD-447 acceptance suites stay green. Applicable ABAC is raw. ToolDefinition.requiredPermission is not compared with OperationContract.permissionCode or AgentApproval.requiredPermission.

No full AuthorizationDecision, resource/commercial/entitlement admission, approval satisfaction, GuardPipeline/OperationExecutor result, state transition, dispatch, mutation/event, provider/model routing or AI/tool execution authority is added. No schema/RLS/role/grant/route/frontend/RawSource change occurred.

## Promotion gate

Canonical DD/traceability/state promotion must independently pass exact-head Core/PostgreSQL/Database/Web before DD-448…DD-452 can be closed. Production readiness is not claimed.

## Canonical promotion verified; state closure staged — 2026-10-04

Canonical promotion HEAD `2cf2cca23f3d71d0966751c60674965c5ceb93f5` / tree `cfa891011dd0bb562281c1ca58419c74342d5acc` passed exact-head push gates:
- Core run `37183182320` / job `111379678651`: **1269/1269 PASS**, fail/skip 0.
- PostgreSQL same run / job `111379678531`: **532/532 PASS**, fail/skip 0; full database bootstrap PASS.
- Database run `37183182346` / job `111379678453`: PASS with **48 migrations / 42 SQL verification files**.
- Web run `37183182355` / job `111379678366`: PASS.

Pull-request Core/Database/Web workflows on the same promotion HEAD also passed or are redundant to the push evidence. Feature evidence remains anchored to corrected implementation `ff2aaba886bc1ba2237ffcc7691099cda01d5fb7` / tree `26e5305cb12ce4e50782ba30f71e77091a898733`.

This state-closure commit must independently pass Core/PostgreSQL/Database/Web before DD-448…DD-452 is closed and another source audit may open.
