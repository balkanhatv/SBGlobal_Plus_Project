# DD-358…DD-362 verification — WorkflowTask visible WorkflowInstance current-evidence reader

**Date:** 2026-10-01  
**Source audit:** `Development/WORKFLOW_TASK_VISIBLE_INSTANCE_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`  
**Source-audit HEAD:** `9d5c0e699801fb0d45708045371f2286d2957310` / tree `c48baf0b3c99c92d2a05484068eb40e83aa51443`  
**Verified implementation:** `6dfdc0b9041186e91c94e5f39f0a9f8a4e9e9328` / tree `66c35b1de6d9ac5baf0dab260e2b39dca3023e6e`

## Exact-head gate

- Core Service Verify `36907597215` / `110521936022`: **1117/1117 PASS**, zero failed/skipped.
- PostgreSQL `36907597215` / `110521935418`: **529/529 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36907596824` / `110521933055`: PASS; inventory remains **48 migrations / 42 verification files**.
- Web Boundary Verify `36907596858` / `110521932582`: PASS.

## Bounded result

DD-358 reads the exact visible WorkflowTask first. DD-359 follows only its persisted WorkflowInstance id under the exact same RequestContext. DD-360 re-applies DD-174. DD-361 preserves exact identities in immutable evidence. DD-362 preserves raw task/workflow semantics and adds no action/execution authority.

A successful result is **not** assignee PRINCIPAL/ROLE/ORG_UNIT resolution/currentness, claimant/completer currentness, permission evaluation, due/expiry determination, task claim/approve/reject/complete authorization, WorkflowTransition authorization, WorkflowDefinition/state-machine validation, optimistic mutation, event emission or worker execution.

No schema, migration, RLS, role, grant, public route, UI/frontend or product-policy change is introduced.

## Canonical promotion gate

This register is created by the DD-358…DD-362 canonical promotion. The promotion head must independently pass exact-head Core/PostgreSQL/Database/Web before state closure and before another governed backend source audit opens.
