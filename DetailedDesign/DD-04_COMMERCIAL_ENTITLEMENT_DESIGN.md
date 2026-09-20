# DD-04 — COMMERCIAL & ENTITLEMENT DESIGN
**Wave:** 1 · **Status:** DETAILED DESIGN COMPLETE  
**Traces:** F-01 §5 · F-14 · A-04 · ADR-007 · DD-03

## 1. Entity catalog

### plan
| Field | Type | Null | Constraint / Index |
|---|---|---:|---|
| id | uuid | No | PK |
| code | text | No | UNIQUE, canonical FREE/STARTER/PRO/PREMIUM/ENTERPRISE seeds |
| name | text | No | |
| status | enum DRAFT/ACTIVE/RETIRED | No | index(status) |
| created_at/updated_at | timestamptz | No | |

Global PLATFORM_GLOBAL table.

### plan_version
| Field | Type | Null | Rule |
|---|---|---:|---|
| id | uuid | No | PK |
| plan_id | uuid | No | FK plan |
| version_no | int | No | UNIQUE(plan_id,version_no), >0 |
| status | enum DRAFT/ACTIVE/RETIRED | No | |
| effective_from | timestamptz | Yes | |
| effective_to | timestamptz | Yes | > effective_from |
| route_policy_id | uuid | No | FK commercial_route_policy |
| entitlement_template_json | jsonb | No | schema-versioned |
| limit_set_json | jsonb | No | schema-versioned |
| trial_policy_json | jsonb | Yes | |
| billing_policy_json | jsonb | No | |
| support_class | text | No | |
| published_at | timestamptz | Yes | immutable once ACTIVE |
| created_by | uuid | No | principal |
| created_at | timestamptz | No | |

ACTIVE version is immutable; changes publish a new version.

### commercial_route_policy
`id uuid PK, code text UNIQUE, self_serve_enabled boolean, sales_assisted_enabled boolean, market_scope_json jsonb, approval_required boolean, version int, status, created_at`.
Canonical policy semantics: Free/Starter self-serve; Enterprise sales-assisted; Pro/Premium dual-route unless a versioned approved market policy narrows route.

### subscription
`id uuid PK, tenant_id uuid NOT NULL, plan_version_id uuid NOT NULL, state enum(PENDING,TRIAL,ACTIVE,GRACE,SUSPENDED,EXPIRED,CANCELLED), billing_anchor_at timestamptz?, period_start/end timestamptz?, trial_end_at?, grace_end_at?, auto_renew boolean, billing_timezone text, current_invoice_id?, version bigint, created_at, updated_at, cancelled_at?`.
Constraint: only one non-terminal current subscription per tenant by partial unique design. No PAST_DUE enum value.

### subscription_transition
Append-only: `id, tenant_id, subscription_id, from_state?, to_state, trigger_code, actor_principal_id?, source_event_id?, reason_code?, occurred_at, correlation_id`.
Unique idempotency on `(subscription_id, source_event_id)` when source event exists.

### license
`id, tenant_id, subscription_id, license_type enum(INDUSTRY,MANAGEMENT_SYSTEM,SEAT,SURFACE,API_SERVICE), subject_key text, industry_context_id?, principal_id?, status enum(PENDING,ACTIVE,SUSPENDED,REVOKED,EXPIRED), valid_from, valid_until?, limit_json?, assigned_by?, revoked_by?, revoke_reason?, version bigint, created_at, updated_at`.
Indexes: tenant/status; subject; industry_context; principal. Industry/MS license requires industryContextId.

### entitlement_definition
Global catalog: `id, code UNIQUE, category, value_type enum(BOOLEAN,INTEGER,DECIMAL,TEXT,SET), scope_class, description, deny_semantics, version, status`.

### add_on
Global catalog: `id, code UNIQUE, entitlement_delta_json, eligibility_json, status, version`.

### tenant_add_on
`id, tenant_id, add_on_id, subscription_id, status, quantity numeric, effective_from, effective_to?, source_order_id?, version`.

### tenant_override
`id, tenant_id, industry_context_id?, entitlement_code, override_type enum(ALLOW,DENY,LIMIT_SET,LIMIT_DELTA), value_json, reason_code, approved_by, effective_from, expires_at, status, created_at`.
DENY may always restrict; ALLOW cannot override compliance/security deny.

### usage_meter
`id, tenant_id, industry_context_id?, meter_code, period_key, used_value numeric, reserved_value numeric, version bigint, updated_at`.
UNIQUE(tenant_id, industry_context_id, meter_code, period_key).

### entitlement_snapshot
`id uuid PK, tenant_id uuid NOT NULL, version bigint NOT NULL, source_subscription_id uuid NOT NULL, source_plan_version_id uuid NOT NULL, compiled_at timestamptz, valid_from timestamptz, expires_at?, source_fingerprint text, status enum(CURRENT,SUPERSEDED,INVALIDATED), deny_set_json jsonb, metadata_json jsonb`.
UNIQUE(tenant_id,version). Only one CURRENT pointer per tenant.

### entitlement_snapshot_fact
`snapshot_id, entitlement_code, industry_context_id?, value_json, source_type, source_id, effective_from, effective_to?`.
PK(snapshot_id, entitlement_code, industry_context_id).

## 2. Compilation precedence
1 PlanVersion template/limits.
2 Active licenses instantiate eligible scopes.
3 Approved tenant overrides.
4 Active add-ons.
5 Usage/limit state.
6 Compliance/security restrictions.
7 Suspension/grace overlay.
Deny wins. Most-specific limit wins unless add-on definition explicitly additive.

## 3. Snapshot algorithm contract
Input fingerprint = stable digest of plan version + subscription version/state + active license versions + override versions + add-on versions + compliance policy version.  
If fingerprint unchanged, no new snapshot. If changed, compile immutable new version transactionally and update current pointer; emit `entitlement.recompiled`.

## 4. Subscription transition matrix
| Current | Trigger | Preconditions | Next | Side effects |
|---|---|---|---|---|
| PENDING | trial_start | eligibility | TRIAL | compile trial snapshot |
| PENDING | activation | payment/order approved | ACTIVE | licenses + snapshot |
| TRIAL | convert | payment success | ACTIVE | paid snapshot |
| TRIAL | timer | trial ended no conversion | EXPIRED | restricted snapshot |
| ACTIVE | renewal_failed | billable failure not platform outage | GRACE | dunning + grace snapshot |
| ACTIVE | renew_success | payment success | ACTIVE | Renewed event; extend period |
| GRACE | recovery | payment success | ACTIVE | full snapshot |
| GRACE | grace_expired | configured deadline | SUSPENDED | restricted snapshot |
| SUSPENDED | settlement | all reactivation conditions | ACTIVE | recompile |
| SUSPENDED | expiry_timer | policy deadline | EXPIRED | preserve data |
| EXPIRED | governed_reactivate | valid commercial resolution | ACTIVE | explicit plan version selection |
| non-terminal | cancellation_effective | notice/exception satisfied | CANCELLED | export/preservation posture |

Invalid transitions return `SUBSCRIPTION_TRANSITION_INVALID`.

## 5. Runtime decision contract
DD-03 access evaluation reads subscription + applicable licenses + current snapshot. Snapshot is not sufficient if subscription/license record is invalidated after compile; current version checks fail closed and force recompile/retry.

## 6. Usage limits
A limit-bearing command declares `meterCode`, `limitEntitlementCode`, consumption amount and reservation strategy:
- hard atomic counter;
- reservation then commit/release;
- soft warning only.
Limit exhaustion outcome is DENY or UPGRADE_CTA per entitlement definition.

## 7. Invalidation
Events: subscription transition, plan migration, license mutation, add-on mutation, override mutation/expiry, compliance-policy change, industry activation change, usage threshold state where entitlement depends on it.

## 8. Commercial audit
All plan publication, subscription transitions, licenses, overrides, add-ons, snapshot changes and high-impact meter adjustments carry actor/source/reason/correlation. Financial correction never mutates approved history.

## 9. Acceptance contracts
- No PAST_DUE state can be stored.
- Plan alone never grants application access.
- Expired/suspended data is preserved.
- Deny from compliance beats commercial allow.
- Same tenant Industry A license cannot satisfy Industry B requirement.
- Snapshot history can explain each effective entitlement.


## 10. CommercialLifecyclePolicy concrete default [DD-AC]
`CommercialLifecyclePolicy{code,version,marketScope,planScope?,providerScope?,enterpriseContractRef?,retryOffsetsHours[],noticePolicy,graceDurationHours,suspensionPreservationHours,recoveryPolicy,cancellationPolicy,effectiveFrom,approvedBy}`.

**CLP-STD-001:** definitive renewal failure immediately enters GRACE; retry offsets +24h/+72h/+120h; notices at Grace entry, before each retry and 24h before suspension; default Grace 168h; unresolved Grace→SUSPENDED; default suspended preservation 720h before EXPIRED eligibility; successful settlement can restore ACTIVE where policy allows and recompiles entitlements. Contract/market/provider policies may override timings through versioned policies only. Renewed remains an event. PAST_DUE remains prohibited.


## 11. Current-state runtime integration floor [DEV-COMMERCIAL-CURRENT-001]

This executable floor resolves Commercial truth from the existing module-owned persistence; Authorization does not own or copy it.

- RequestContext bootstrap reads exactly one valid CURRENT EntitlementSnapshot joined to its source Subscription, pinned PlanVersion, and the Tenant's exact `current_subscription_id` pointer, then stamps snapshot id + version into RequestContext.
- Runtime guard re-reads current Commercial state and requires exact snapshot id/version equality. Missing, ambiguous, expired or stale current state fails closed.
- Generic protected operations treat `TRIAL`, `ACTIVE` and `GRACE` as usable subscription states. `PENDING`, `SUSPENDED`, `EXPIRED` and `CANCELLED` fail closed in this generic floor until dedicated billing/renewal/export/read-only operation contracts identify the intentionally permitted restricted paths. This avoids widening access from a stale pre-suspension snapshot.
- TENANT_INDUSTRY operations require an effective INDUSTRY license for the exact active Industry Context. A MANAGEMENT_SYSTEM license is revalidated when a license record exists for the operation's canonical module key. Assigned SEAT licensing, when present, requires an effective seat for the current human principal.
- Current snapshot facts are read with Tenant + Industry FORCE RLS. For the same entitlement code, an exact Industry fact overrides the tenant-wide fact. Snapshot deny-set wins.
- `OperationContract.entitlementRequirement` is satisfied only by a currently effective, non-denied entitlement fact. BOOLEAN=false, zero numeric values, empty text and empty sets are not exposed as enabled facts.
- Authorization supplemental facts are server-derived only: `commercial.subscriptionState`; canonical sorted `commercial.licenseSet` tokens as `<LICENSE_TYPE>:<subject_key>`; canonical sorted enabled entitlement codes in `commercial.entitlementFacts`. Set overflow is not truncated; it fails closed under ABAC v1 bounds.
- PLATFORM_GLOBAL receives no tenant Commercial supplemental facts. EXPLICIT_CROSS_CONTEXT remains outside this single-context store and requires its own governed repository.
- SURFACE/API_SERVICE applicability and the dedicated restricted-mode recovery/read-only operation vocabulary remain explicit future work; this floor does not invent client/channel mappings.


## 12. Client-safe current entitlement projection [DD-060]

The first UI-facing Commercial read contract is deliberately narrower than `CommercialCurrentStateRead`.

`CommercialClientCurrentProjectionV1` contains only:
- `snapshotVersion: positive integer`;
- `subscriptionState` using the canonical Commercial subscription enum;
- `entitlements[]`, sorted by entitlement code, where each entry is `{code,valueType,value}`.

The projection omits `snapshotId`, `subscriptionId`, license IDs, license subject/principal/Industry bindings, raw deny-set contents, source IDs and all persistence/audit metadata.

Only currently effective, non-denied, enabled entitlement facts are emitted. BOOLEAN=false, INTEGER/DECIMAL=0, empty TEXT and empty SET values are omitted. SET values are emitted as a deterministic sorted unique string set. Invalid values or overflow fail closed; they are never truncated or coerced into a weaker contract.

The read reuses the same current Commercial store and must require exact equality between RequestContext entitlement snapshot id/version and the freshly loaded current state before projecting. This is a UI projection only; server Authorization/Commercial enforcement remains authoritative.

The first operation using this contract is `core.commercial.entitlements.getCurrent`: TENANT_CORE QUERY, empty input, permission `core.commercial.entitlement.view`, AUTH_STANDARD, STANDARD audit, no operation entitlementRequirement. The generic Commercial guard still applies, so this operation is available only in currently usable TRIAL/ACTIVE/GRACE state under the present runtime floor. Suspended/recovery/billing reads require separate explicit operation contracts and are not widened here.


## 13. Governed plan-change request / resolution contract [DD-062]

`core.commercial.subscription.changePlan` is a **request/orchestration command**, not permission for a transport handler to UPDATE `subscription.plan_version_id` directly.

### 13.1 Client intent

Exact external intent remains:

`{subscriptionId,targetPlanVersionId,effectiveTiming,expectedVersion}`

where `effectiveTiming` is exactly `IMMEDIATE | NEXT_RENEWAL`. The shared `Idempotency-Key` remains transport metadata and is REQUIRED by the OperationContract.

No client field may assert route, payment success, approval success, proration, remediation completion, entitlement diff, effective apply timestamp, source plan version, current usage, or current Commercial state.

### 13.2 Server-owned assessment

Before any apply, Commercial produces an immutable/versioned `PlanChangeAssessmentV1` bound to the resolved Tenant and exact current Subscription:

`assessmentId, tenantId, subscriptionId, sourcePlanVersionId, targetPlanVersionId, effectiveTiming, expectedSubscriptionVersion, routeClass, impactReference, entitlementDiffReference, blockingImpactCodes[], remediationState, assessmentVersion, createdAt, correlationId`.

- `routeClass` is exactly `SELF_SERVE | SALES_ASSISTED`, derived from the active versioned `commercial_route_policy`; it is never client-selected authority.
- `blockingImpactCodes[]` is a deterministic sorted list of governed impact codes. Empty means no downgrade remediation blocker; non-empty means apply is blocked.
- `remediationState` is exactly `NOT_REQUIRED | PENDING | SATISFIED`. It may become SATISFIED only from server-owned remediation evidence bound to the same assessment/version.
- `impactReference` and `entitlementDiffReference` identify immutable server-generated evidence; they do not authorize apply by themselves.

No price/proration formula is interpreted in Commercial. Numeric money calculation remains Billing-owned.

### 13.3 Route-resolution / Billing handoff

The apply gate consumes server-owned `PlanChangeRouteResolutionV1`:

`assessmentId, assessmentVersion, routeClass, resolutionState, evidenceReference?, billingPreviewReference?, effectiveAt?, producerModule, evidenceVersion, resolvedAt?, correlationId`.

`resolutionState` is exactly `PENDING | SATISFIED | REJECTED`.

- For `SELF_SERVE`, only the Billing boundary may produce SATISFIED. Billing decides whether a provider charge is required; Commercial does not infer “free/no-charge” from price data and does not trust a client payment token/reference.
- For `SALES_ASSISTED`, only the governed approval/workflow boundary may produce SATISFIED.
- `billingPreviewReference` is opaque to Commercial and may reference a Billing-owned price/proration preview. Commercial never recalculates or rewrites it.
- For `NEXT_RENEWAL`, `effectiveAt` must be server-owned evidence supplied by the Billing/contract boundary. Client clocks/dates cannot determine the renewal apply instant.
- For `IMMEDIATE`, SATISFIED resolution still remains mandatory before apply.

### 13.4 Apply gate

A future internal apply transition may mutate the Subscription only when **all** of the following are true in the same authoritative transaction boundary:

1. RequestContext Tenant owns the Subscription.
2. current Subscription version exactly equals `expectedSubscriptionVersion`;
3. current `plan_version_id` still equals `sourcePlanVersionId`;
4. target PlanVersion is still valid for the governed route/effective policy;
5. assessment/version is current and bound to the exact source/target/timing tuple;
6. `blockingImpactCodes` is empty and `remediationState` is NOT_REQUIRED or SATISFIED;
7. route resolution is SATISFIED and is produced by the required server-owned module;
8. `NEXT_RENEWAL` has a server-owned `effectiveAt` and is not applied before it;
9. the write-side entitlement compiler/publication + outbox/audit boundary succeeds atomically.

Any mismatch is fail-closed. A stale `expectedVersion`, changed source plan, changed route policy, rejected/pending resolution, or stale assessment requires re-evaluation; no “best effort” update is allowed.

### 13.5 Command result

The public command returns request/evaluation state only, e.g. a server-generated plan-change request/reference, assessment version, route class, impact/entitlement-diff references and a normalized state such as action-required/ready/scheduled/applied. It must not return provider secrets, payment instruments, internal Billing formulas, raw approval payloads or unrestricted Commercial records.

Creating/evaluating the request does **not** by itself update the Subscription or publish a new entitlement snapshot.


## 14. Atomic Commercial publication floor [DD-065]

A bounded internal `CommercialPublicationService` now owns the first executable apply/publication floor. It is **not** the public `changePlan` command and accepts only already server-validated compiled publication input.

Runtime invariants:
- caller must be a trusted `SERVICE` principal in `TENANT_CORE`; no Industry Context is carried;
- RequestContext must contain the current entitlement snapshot id/version plus Tenant/DataHome/region;
- input names exact Subscription id, expected Subscription version, expected source PlanVersion, target PlanVersion, server-owned effective time, trigger/reason references, source fingerprint, deny-set and deterministic compiled facts;
- generated transition/snapshot/outbox/audit IDs are server-owned;
- fact values are bounded by the canonical Commercial value types; duplicate entitlement scope, duplicate deny entries, invalid effective windows and future apply attempts fail before persistence.

The PostgreSQL store then re-locks and revalidates:
1. exact Tenant-owned Subscription + expected version/source PlanVersion;
2. usable current Subscription state;
3. ACTIVE target PlanVersion + Plan + route policy valid at effective time;
4. exact current entitlement snapshot matching RequestContext id/version and current source Subscription/PlanVersion;
5. authoritative Tenant residency for event envelope;
6. ACTIVE entitlement definitions/value types and ACTIVE same-Tenant Industry Context references.

Only after all checks pass does one transaction:
- advance Subscription `plan_version_id/version/updated_at`;
- append `subscription_transition`;
- mark the old CURRENT snapshot SUPERSEDED;
- insert a new immutable CURRENT snapshot and its facts;
- append DD-063 `subscription.transitioned` and `entitlement.recompiled` outbox events;
- append Commercial audit evidence.

Any stale version/source/snapshot, invalid target, invalid fact scope/type, RLS/privilege failure or evidence-write failure aborts the whole transaction.

This floor intentionally does **not** evaluate DD-062 payment/approval/remediation evidence and therefore cannot yet be exposed as the public plan-change command.


## 15. Physical plan-change evidence substrate [DD-066]

DD-062 server authority is now physically represented by three TENANT_CORE evidence families:

1. `plan_change_assessment` — immutable/versioned assessment bound to exact Tenant, Subscription, source/target PlanVersion, effective timing, expected Subscription version, route policy id/version, impact references, blocking codes, remediation state, source fingerprint and correlation.
2. `plan_change_remediation_evidence` — append-only Commercial-produced SATISFIED evidence bound to one assessment version.
3. `plan_change_route_resolution` — append-only route evidence bound to one assessment version and one server producer.

Database invariants:
- assessment insert rechecks the current Subscription source PlanVersion/version and ACTIVE target PlanVersion/Plan/route policy;
- assessment versions are contiguous and cannot change the core Subscription/source/target/timing/version binding;
- initial assessment cannot claim remediation SATISFIED;
- a later SATISFIED assessment requires prior Commercial remediation evidence for the immediately preceding assessment version;
- blocking impact codes are bounded/non-empty/unique when present;
- remediation evidence versions are contiguous and producer_module is fixed to `Commercial`;
- route-resolution evidence versions are contiguous and route must equal the assessment route;
- `SELF_SERVE` evidence can only be `Billing`; `SALES_ASSISTED` evidence can only be `Workflow`;
- SALES_ASSISTED evidence cannot claim a Billing preview;
- SATISFIED NEXT_RENEWAL evidence requires server-owned `effective_at`;
- all three tables are FORCE-RLS, Tenant-owned, scope-immutable and append-only to runtime producer roles.

Producer roles are separate, NOLOGIN/NOBYPASSRLS boundaries:
- `sbg_commercial_plan_change_evidence_rw`: assessment + remediation append;
- `sbg_billing_plan_change_evidence_rw`: SELF_SERVE route-resolution append;
- `sbg_workflow_worker_rw`: SALES_ASSISTED route-resolution append;
- `sbg_commercial_transition_compiler_rw`: read-only consumer of all three evidence families.

`PlanChangeEvidenceService` fixes the producer module by method; callers cannot select producer ownership. It normalizes/bounds server-generated evidence and rejects HUMAN/Industry-scoped use. PostgreSQL acceptance proves stale Subscription assessment rejection, contiguous assessment/remediation/resolution versions, remediation→reassessment binding, NEXT_RENEWAL Billing evidence, SALES_ASSISTED Workflow evidence, wrong-producer denial and append-only immutability.

**Boundary:** DD-066 persists and isolates server evidence but does not itself calculate usage impact, entitlement diff, money/proration, payment status or approval decisions. Those producer computations/integrations remain separate governed runtime work.


## 16. PlanVersion commercial JSON schema v1 [DD-067]

The previously generic `entitlement_template_json` and `limit_set_json` columns now have an executable v1 normalization contract. This does not invent plan values; it defines how already-governed plan-version values are represented and validated.

### 16.1 Entitlement template v1

Top-level shape is exactly:

`{schemaVersion:1,facts:[...]}`

Each fact contains exactly:
- `code`: canonical entitlement code;
- `valueType`: existing Commercial value type `BOOLEAN | INTEGER | DECIMAL | TEXT | SET`;
- `scope`: one of `TENANT`, `LICENSED_INDUSTRIES`, or exact `INDUSTRY_CODE`;
- `grantMode`: `INCLUDED | NOT_INCLUDED | ADD_ON_ONLY`;
- `value`: present only when `grantMode=INCLUDED`, validated against `valueType`.

`LICENSED_INDUSTRIES` means the compiler may instantiate the fact only into same-Tenant Industry Contexts that are independently active/licensed; it does not grant an Industry license by itself. `INDUSTRY_CODE` is a catalog selector, never a Tenant Industry Context id.

### 16.2 Limit set v1

Top-level shape is exactly:

`{schemaVersion:1,limits:[...]}`

Each limit contains:
- `entitlementCode`;
- `meterCode`;
- the same scope selector vocabulary;
- `mode = FINITE | UNLIMITED | NOT_INCLUDED | ADD_ON_ONLY`;
- `value` only for FINITE, as a non-negative finite number.

This directly represents F-14's requirement that each plan dimension has a configured value or an explicit unlimited/not-included/add-on marker.

### 16.3 Fail-closed normalization

The parser:
- rejects unsupported schema versions and unknown fields;
- bounds template/limit/set sizes;
- rejects duplicate entitlement/limit scope keys;
- validates value-type/value consistency;
- canonicalizes SET values and output ordering;
- never interprets Billing/pricing JSON or computes money.

Existing persisted invalid/unversioned JSON is not silently coerced. Any new compiler/assessment consumer must pass these parsers before using plan data.

**Boundary:** DD-067 locks the PlanVersion source schema only. It does not yet instantiate licensed Industry scopes, apply add-ons/overrides/compliance precedence, compile a target preview, or calculate downgrade impact.


## 17. Licensed PlanVersion baseline expansion [DD-068]

The first target-preview compiler stage is now executable but deliberately limited to **PlanVersion baseline expansion**.

Inputs:
- already parsed DD-067 entitlement template + limit set;
- same-Tenant Industry Context inventory with explicit lifecycle status;
- existing Commercial license reads.

Rules:
- TENANT selectors resolve once at Tenant scope;
- LICENSED_INDUSTRIES resolves only ACTIVE Industry Contexts that have an independently effective INDUSTRY license;
- INDUSTRY_CODE resolves only the matching ACTIVE + independently licensed Industry Context;
- plan data never creates or substitutes an Industry license;
- SUSPENDED/DISABLED Industry Contexts are not instantiated;
- stale effective Industry licenses referencing an unavailable Context fail closed;
- INCLUDED / NOT_INCLUDED / ADD_ON_ONLY markers and FINITE / UNLIMITED / NOT_INCLUDED / ADD_ON_ONLY limit modes are preserved unchanged for later precedence/impact stages;
- if different plan selectors resolve to the same entitlement or limit key, expansion fails as ambiguous rather than inventing specificity precedence;
- output is immutable and deterministically sorted.

**Boundary:** this is baseline PlanVersion expansion only. It does not yet apply tenant overrides, active add-ons, compliance/security restrictions, usage-meter impact, subscription overlay or final snapshot publication.


## 18. Commercial adjustment source normalization v1 [DD-069]

The next compiler prerequisite normalizes two previously generic Commercial inputs without inventing pricing or eligibility logic.

### 18.1 Add-on entitlement delta v1

`add_on.entitlement_delta_json` v1 is intentionally bounded to the source-backed additive case: **metered quota deltas**.

Exact top-level shape:

`{schemaVersion:1,quotaDeltas:[...]}`

Each delta contains:
- `entitlementCode`;
- `meterCode`;
- DD-067 scope selector;
- `valueType = INTEGER | DECIMAL`;
- non-negative `amount`.

Tenant add-on `quantity` scales the delta. INTEGER output must remain a safe integer. Duplicate scoped entitlement+meter keys, unknown fields/versions and invalid numeric values fail closed.

This contract does not interpret `eligibility_json`, grant arbitrary boolean features, calculate price or infer payment status. Broader add-on capability forms require a separately governed schema.

### 18.2 Tenant override v1

Persisted `tenant_override` values are normalized against the canonical entitlement-definition value type:

- `ALLOW`: carries a fully typed canonical value.
- `DENY`: persisted `value_json` must be canonical boolean `true`; it never trusts an arbitrary denial payload.
- `LIMIT_SET`: only INTEGER/DECIMAL; value is non-negative.
- `LIMIT_DELTA`: only INTEGER/DECIMAL; signed finite delta is allowed.

DENY representation is scope-aware:
- Tenant-level DENY → add entitlement code to the snapshot Tenant-wide deny set.
- Industry-level DENY → publish a type-specific disabled **Industry-scoped fact** (BOOLEAN=false, INTEGER/DECIMAL=0, TEXT="", SET=[]), not a Tenant-wide deny-set entry.

The scoped representation is required because current-state reads select the exact Industry fact over a Tenant fact. Putting an Industry-only deny into the snapshot-wide deny set would incorrectly deny sibling Industries.

SET and typed values are bounded and deterministic. This normalization does not yet decide precedence among multiple overrides or between overrides and active add-ons.

**Boundary:** add-on eligibility, active-row selection, override/add-on conflict resolution, compliance/security restrictions and final preview compilation remain downstream work.
