# CORE SERVICE CHECKPOINT — DEV-AUTHZ-RESOURCE-RULE-001
**Updated:** 2026-09-18  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — fail-closed resource/workflow authorization PEP boundary; concrete per-module adapters not yet claimed

## Verified executable snapshot
- Commit: `ed36486e45011c6dc2bae1bcc87c2a13574e177c`.
- Tree: `92a5dfc0b2d2e3e8246a75a7eadda52329c5a9e6`.
- Prior executable checkpoint: `e050dc5f52c3e1925c5ea2bce38e886e997be7c1` (`DEV-COMMERCIAL-CURRENT-001`).
- Database remains **37 migrations / 31 verification files**.
- Industry SQL scope remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.
- Core/server acceptance inventory: **108 tests**; real PostgreSQL inventory: **21 tests**.

## Current resource/workflow authorization boundary
DD-046 / `DEV-AUTHZ-RESOURCE-RULE-001` closes the missing executable PEP contract for DD-03 step 10:
- resource-bound operations run module-owned `ResourceBusinessRulePort` only after exact resource resolution/context checks and resource-level PDP allow/restrict;
- the port is narrowing-only and cannot grant over Commercial/RBAC/ABAC denial;
- allowed outputs are only allow, `RESOURCE_SCOPE_DENY`, or `WORKFLOW_STATE_DENY`;
- missing adapter, adapter exception, or malformed result fails closed as non-disclosing `DEPENDENCY_UNAVAILABLE`;
- `RESOURCE_SCOPE_DENY` normalizes to opaque `RESOURCE_NOT_FOUND`;
- `WORKFLOW_STATE_DENY` normalizes to `RESOURCE_STATE_INVALID`;
- the resource PDP decisionId is preserved for rule-denial correlation;
- non-resource operations do not require the rule port;
- Core does not invent a generic executable rule DSL or interpret suite-specific workflow matrices.

This checkpoint proves the shared fail-closed boundary only. It does **not** claim concrete ownership/org/workflow adapters for all Core modules or all 41 Management Systems.

## Exact executable evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35311123639 | 105493200950 | **PASS — 108/108** |
| Core Service Verify / postgres-context-verify | 35311123639 | 105493200603 | **PASS — 21/21** |
| Database Verify / postgres-verify | 35311123714 | 105493201072 | **PASS — 37 migrations / 31 verification files** |

All jobs asserted exact tested HEAD `ed36486e45011c6dc2bae1bcc87c2a13574e177c` and tree `92a5dfc0b2d2e3e8246a75a7eadda52329c5a9e6`.

## Scope limits / next governed work
Next shared-Core unfinished slice: **durable Authorization decision audit emission (AUTH-008) only** — persist/emit safe decision evidence for high-risk allow and every deny without leaking resource content or weakening current fail-closed behavior.

Concrete per-module ResourceResolver/ResourceBusinessRule adapters remain domain implementation work and must follow DD-21/DD-22/DD-24 when those domain services are built. Dedicated Commercial restricted-mode/UPGRADE_CTA, enforceable ABAC RESTRICT payload/reducer, DD-06 transports, UI/mobile/desktop, deployment and production certification remain unfinished. RawSourceCorpus remains immutable. `main` remains unmerged; PR #2 stays review-only/draft.
