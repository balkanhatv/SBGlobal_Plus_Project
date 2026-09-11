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
