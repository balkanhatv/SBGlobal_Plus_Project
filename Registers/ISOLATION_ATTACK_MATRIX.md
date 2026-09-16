# Isolation Attack Matrix — Current Core/Database Checkpoint

**Updated:** 2026-09-14 · **Authority:** DD-02/03/05/07/08/09/16/17/21 and current Industry contracts  
**Executable checkpoint:** `2c36b43a7d55c6600b71f9714389e025a06df580` · Database Verify run `34800144921`, job `103841023234` · **SUCCESS**

This overlay supersedes the current-status use of the Phase-4 design-only matrix retained below. SQL evidence proves only the named persistence invariant; future application/service attacks are acceptance contracts, not executed penetration tests. Final documentary commit/CI identities are recorded in [the current audit](ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md).

| Adversarial attempt | Current enforced/verified boundary | Executable evidence or honest remaining boundary |
|---|---|---|
| Tenant A reads/writes Tenant B | Forced RLS, immutable ownership, same-Tenant references | 0029/0030 non-bypass role and constraint checks; 0099 registry checks PASS |
| Same-Tenant Industry A accesses sibling B | Required exact context, same-context composite parents and explicit selectors | 0030/0031 negative relationship checks; 0099 all 181 Industry tables PASS |
| Missing Industry Context interpreted as wildcard | Null is never all Industries; TENANT_INDUSTRY requires concrete context | 0001 helper and 0029/0030 scope/policy checks PASS |
| Disabled Industry, revoked credential or stale entitlement request | DD-02/03/04/06 require fail-closed access revalidation | Identity/entitlement relationships checked in SQL; authenticated request/guard execution NOT_YET_STARTED_FUTURE_SCOPE |
| Document references sibling context or raw physical storage | Exact DocumentMeta parent; StorageObject hidden from app; DataHome/integrity/provenance checks | 0010/0028 role separation and 0031 document/scalar/array reference tests PASS; signed-URL service remains future |
| Event/catalog/envelope context disagreement | Mandatory scope envelope, version/catalog match and immutable evidence identity | 0030 positive/negative outbox and exact RLS checks PASS |
| Unverified or sibling-context webhook | Verified activation, allowlists and exact event/subscription/identity tuple | 0030 persistence checks PASS; network signature/DNS/retry executor remains future |
| Export/report widens null/sibling context | Export exact scope plus scoped document relationship; Industry RLS | 0030/0031 persistence checks PASS; report/export endpoint execution remains future |
| Worker operates without stored context | Persisted envelope/parent ownership cannot omit mandatory scope | 0030/0031 checks PASS; runtime queue reauthorization/DLQ remains future |
| Pooled connection retains prior context | DD-05/17 require transaction-local set/reset and fail-closed release | SQL fixtures set local role/context; real application connection-pool reuse NOT_YET_STARTED_FUTURE_SCOPE |
| Offline replay switches original context | DD-11 preserves original Tenant/Industry/device/time and reauthorizes | Design contract revalidated; executable clients/queues NOT_YET_STARTED_FUTURE_SCOPE |
| Support elevation is self-approved, unbounded or points to foreign target | Physical elevation requires independent active approver and bounded/current target | 0031 relationship/approval checks PASS; MFA/step-up endpoint execution remains future |
| General app selects PLATFORM_GLOBAL then mutates a global definition or permission child | Restrictive write floor requires Control Plane role in addition to contextual policy | 0032 insert/update/delete/child denial and permitted Control Plane mutation PASS |
| PLATFORM_GLOBAL HUMAN/API_CLIENT reaches SQL transaction | DD-043 requires protected platform principal floor at RequestContext and SQL boundary | `request-context.test.mjs` + `request-scoped-sql.test.mjs`; HUMAN/API_CLIENT deny before transaction; PLATFORM_OPERATOR/SERVICE pass only the scope floor |
| App/domain module accesses private AI or provider credentials | Dedicated Gateway/Integration roles; no general app direct access | 0011–0014/0028/0029 privilege checks PASS; live provider execution remains future |
| AI RAG/model/prompt/tool/agent references foreign Tenant/Industry or incompatible parent | Same-scope provider/config/set/document/member/run validation | 0031 negative dependency checks PASS; live retrieval ACL recheck remains future |
| AI tool or prompt injection widens acting-principal permission | DD-03/09/17 require permissions bounded by acting principal and governed tools | Physical dependency and Gateway boundary PASS; live prompt-injection/tool-executor campaign NOT_YET_STARTED_FUTURE_SCOPE |
| Explicit cross-context request lacks endpoints or dedicated authorization | Exact persisted endpoints and scope predicates; DD-02/03 require explicit permission/audit | 0030 policy checks PASS; dedicated endpoint authorization remains future |
| Workflow/notification binds foreign actor/definition/source event or edits immutable evidence | Exact parent/version/scope and actor validation; append-only evidence privileges | 0026/0027/0031 checks PASS; shared engine/provider execution remains future |
| Future partition loses scope enforcement or runtime caller provisions it | Governed migration helper installs exact forced RLS; PUBLIC execution revoked | 0029/0030 catalog/privilege checks PASS; production partition operations remain future |
| Brand/country pack creates permissions or weakens safety | DD-05/10/17/26 protected security/accessibility and activation contracts | Design contract revalidated; publish/render/service tests NOT_YET_STARTED_FUTURE_SCOPE |

Current exact-head regression at `3e7b2927839d289240eb389902563f5ab3d68074` passes Core Service Verify and Database Verify. The current tree contains 34 migrations and 28 verification SQL files; the added 0034 pair enforces the persisted PLATFORM_GLOBAL machine-credential floor. These are behavioral fixtures plus relevant policy/registry checks, not a claim that every service-level attack was executed. Current audited persistence/Core isolation blockers: **P0 0 / P1 0**.

---

## Historical Phase-4 design-contract evidence
**Evaluated substantive DD HEAD:** `b4bba9c4764025af3d4546644f7c67efa463c86d`  
**Date:** 2026-09-13 · **Status:** PASS — DESIGN-CONTRACT LEVEL

This is architecture/DD contract evidence, not executable penetration testing. Runtime/security validation remains a Development/Test responsibility.

## Fresh attack matrix
| Attack | Enforcement owner | Acceptance/Test ID | Expected result | Result |
|---|---|---|---|---|
| Tenant A → Tenant B resource | DD-02/DD-05/DD-21 | TCTX-004 + <MS>-T007 | non-disclosing deny; mutation/event=0 | PASS |
| Same Tenant Industry A → Industry B | DD-02/DD-05/DD-21 | TCTX-003 + <MS>-T008 | INDUSTRY_CONTEXT_MISMATCH; no auto-switch | PASS |
| wrong-context resource ID | DD-02/DD-06 | TCTX-005/API-004 | deny; active context unchanged | PASS |
| document/signed URL sibling-context | DD-08 | <MS>-T010 / DOC-003 | deny; no signed URL | PASS |
| event/projector wrong context | DD-07/DD-05 | <MS>-T011 / EVT-004 | reject; consumer effect=0 | PASS |
| webhook sibling-context delivery | DD-07 | EVT-005 | no delivery | PASS |
| report/KPI sibling rows | DD-05/DD-25/DD-28 | <KPI-ID>-T02 | foreign rows contribute 0 | PASS |
| export/portability sibling context | DD-05/DD-16 | DATA-ACCESS-001 | deny; zero foreign rows/documents | PASS |
| offline replay wrong context | DD-11 | <MS>-T012 / MOB-003 | retain origin; reauthorize or reject | PASS |
| worker missing persisted context | DD-02/DD-07 | TCTX-007/DB-007 | reject/dead-letter | PASS |
| pooled DB context residue | DD-05/DD-17 | INF-003/015 | reset/set transaction-local context; release blocked on leak | PASS |
| dedicated/shared DB route confusion | DD-05/DD-14 | INF-014 | DB_ROUTE_CONTEXT_MISMATCH; no query | PASS |
| missing RLS policy | DD-05 | DB-003/INF-004 | release blocked | PASS |
| AI/RAG sibling retrieval | DD-09 | <MS>-T013 / AI-002 | unauthorized retrieval=0 | PASS |
| AI tool privilege escalation | DD-09/DD-03 | AI-005/008/009 | deny or approval gate; side effect=0 | PASS |
| AI API class not provisioned | DD-09/DD-17 | AI-013 | deny before provider call | PASS |
| AI memory sibling Industry | DD-09/DD-17 | AI-017 | excluded/deny by context+ACL | PASS |
| AI media without governed provenance | DD-09/DD-08 | AI-016 | not publishable/attachable | PASS |
| Country Pack permission widening | DD-05/DD-17 | LOC-001 | validation/policy deny | PASS |
| tenant rule arbitrary executable payload | DD-01/DD-05 | CFG-001 | VALIDATION_FAILED | PASS |
| role-specific Tenant app class | DD-10/DD-11/DD-26 | APP-009/ID-T005 | validation failure | PASS |
| Platform Mobile counted as Tenant app | DD-10/DD-26 | APP-013/ID-T007 | validation failure | PASS |
| Tenant brand weakens security/a11y token | DD-05/DD-10 | APP-010/BRAND-002 | publish denied | PASS |
| Future Industry live before promotion | DD-13/DD-26 | APP-011/ID-T008 | deny; no live Industry Context | PASS |
| EXPLICIT_CROSS_CONTEXT without policy | DD-02/DD-03 | TCTX-008 | deny | PASS |
| support/operator elevation outside target | DD-03/DD-05/DD-16 | operator elevation tests | deny/audit | PASS |

## 41-MS instantiation result
DD-21 contains all 41 canonical MS acceptance namespaces; DD-22 contains all 41 workflow matrices. For every MS, test families include wrong Tenant, wrong Industry Context, document, event/webhook, offline (where applicable), AI/tool and entitlement/permission behavior. DD-25/DD-28 provide Tenant+Industry isolation acceptance for every KPI contract.

## New Phase-3 contract isolation
- Shared Metadata/Rules/Form definitions use scoped owner fields; TENANT_INDUSTRY definitions require tenant_id + industry_context_id.
- Country/Localization Packs cannot create permissions, entitlements or live Industry activation.
- AIProvisioningSnapshot cannot widen entitlement/Tenant AI policy; API/media/memory remain Gateway/context controlled.
- Exactly two Tenant mobile app classes are schema-level canonical identifiers.
- Future Industry states below PROMOTED cannot become live Tenant contexts.
- Brand overrides cannot weaken protected security/accessibility semantics.
- Data export/portability remains authorization/residency/retention governed.

## Verdict
Open isolation P0: **0**  
Open isolation P1: **0**

**PHASE 4 CROSS-LAYER ISOLATION: PASS.**
