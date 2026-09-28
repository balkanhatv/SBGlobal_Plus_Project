# AI Gateway prerequisite ownership audit

**Date:** 2026-09-21  
**Baseline:** `9f90e0005351747070d941995a8daa40ab8057f3`  
**Scope:** next independent governed continuation after `DEV-API-REST-001`.

## Source reconciliation

F-05, A-07, ADR-010, DD-09, DD-17 and the current executable Core/API boundary were read against the current branch state.

| Concern | Existing owner | Current determination |
|---|---|---|
| Single AI choke point | F-05 §1/§6; A-07 §1–§2; DD-09 §1 | Required; no provider or agent may bypass the AI Gateway |
| Provider abstraction | F-05 §2; A-07 §3; DD-09 §5 | Contract shape is defined; concrete provider adapters are not implemented |
| Context / authorization | A-07 §2/§5; DD-09 §3/§13 | Must use verified RequestContext and existing DD-03/DD-04 guards |
| Residency / sensitivity | A-07 §2–§6; DD-09 §4/§8 | Mandatory before provider selection or fallback |
| Provisioning | A-07 §3; DD-09 §2A | AIProvisioningSnapshot schema is defined, but no current compiler/reader runtime is implemented |
| Routing | A-07 §3; DD-09 §4 | Security filter order is defined; concrete model/provider registry persistence and policy evaluation runtime are not implemented |
| Quota / metering | A-07 §2/§7; DD-09 §6 | Mandatory reserve/usage accounting is required before/after execution; runtime producer is not present |
| Prompt / tool governance | DD-09 §12–§16 | Contracts are defined; concrete registries/policy evaluators are not present |
| Acceptance | DD-17 AI-001…017, INT-005, SEC-009 | Executable coverage is required before claiming the gateway implemented |

## Determination

A concrete AI Gateway implementation is **not source-complete at the current checkpoint**. Implementing it now would require choosing runtime semantics that the repository does not yet own, including:

- AIPolicy `condition_ast_json` evaluation grammar/runtime.
- AIProvisioningSnapshot compilation and authoritative read path.
- AI provider/model registry persistence and active-version selection behavior.
- Entitlement/quota reservation and usage-meter producer behavior.
- Provider adapter implementations, credential loading and provider error normalization.
- Prompt/tool registry execution stores and approval-policy runtime.
- Concrete model preference/health selection mechanics beyond the already-governed security filters.

The defined contract is sufficient to prohibit bypasses and to constrain future implementation, but not to select or invent the missing runtime semantics.

## Authorized continuation boundary

Do **not** add a live AI Gateway, provider SDK, public AI endpoint, provider credential format, routing score, quota algorithm, prompt-policy evaluator or provider fallback implementation from assumption.

Future implementation may begin only after the missing owners above are made executable or a narrower independent slice is demonstrated source-complete. Existing API, auth/authz, RLS, Commercial and 9/41 invariants remain unchanged.

## Verification expectation

This audit introduces no runtime/database behavior. Exact-head Core, PostgreSQL, Database Verify and Web Boundary CI must still pass, and repository invariants must remain unchanged.
