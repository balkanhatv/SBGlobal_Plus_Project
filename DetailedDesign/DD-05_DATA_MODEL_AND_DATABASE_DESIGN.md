# DD-05 — CORE DATA MODEL, DATABASE & RLS DESIGN
**Wave:** 1 · **Status:** DETAILED DESIGN COMPLETE  
**Traces:** F-04 · F-11 · A-02 · A-05 · ADR-002/008/018 · DD-02

## 1. PostgreSQL schema ownership
| Schema | Owner | Scope |
|---|---|---|
| platform_directory | Tenancy/Commercial catalog | PLATFORM_GLOBAL |
| core_identity | Identity | tenant/core mixed by table |
| core_tenancy | Tenancy | TENANT_CORE |
| core_authz | Authorization | tenant/core |
| core_commercial | Entitlement/Billing | tenant/core + global catalog |
| core_config | Configuration | tenant/core |
| core_workflow | Workflow | tenant/core or tenant/industry by instance |
| core_notification | Notification | tenant/core or tenant/industry |
| core_document | Document | tenant/core or tenant/industry |
| core_audit | Audit | scope carried per event |
| core_integration | API/Webhook/adapter config | tenant/core/industry |
| core_projection | derived read models | same source scope |
| ind_hlt/edu/rtl/hsp/mfg/psv/gov/ngo/sfm | Industry suites | TENANT_INDUSTRY |

Schema ownership is organizational, not an authorization boundary by itself.

## 2. Standard column profiles
### TenantCoreMutable
`id uuid PK, tenant_id uuid NOT NULL, row_version bigint NOT NULL DEFAULT 1, created_at timestamptz NOT NULL, created_by uuid?, updated_at timestamptz NOT NULL, updated_by uuid?, deleted_at timestamptz?, deleted_by uuid?`

### TenantIndustryMutable
TenantCoreMutable + `industry_context_id uuid NOT NULL`.

### AppendOnlyEvidence
`id uuid PK, tenant_id uuid?, industry_context_id uuid?, occurred_at timestamptz NOT NULL, actor_principal_id uuid?, correlation_id uuid NOT NULL, payload/reference columns`; no update/delete application permission.

## 3. Core tenancy entities
### tenant
`id uuid PK, tenant_code text UNIQUE NOT NULL, legal_name text NOT NULL, display_name text NOT NULL, status enum(PROVISIONING,ACTIVE,SUSPENDED,OFFBOARDING,ARCHIVED,PURGED), primary_industry_code text NOT NULL, data_home_id uuid NOT NULL, residency_region_code text NOT NULL, current_subscription_id uuid?, config_version bigint NOT NULL, created_at, updated_at`.
Index status, data_home_id.

### industry_context
`id uuid PK, tenant_id uuid NOT NULL, industry_code text NOT NULL, status enum(PENDING,ACTIVE,SUSPENDED,DISABLED), is_primary boolean NOT NULL, activated_at?, deactivated_at?, activation_version bigint NOT NULL, created_at, updated_at`.
UNIQUE(tenant_id, industry_code); one primary per tenant.

### org_unit
`id, tenant_id, parent_id?, unit_type enum(BRANCH,DEPARTMENT,LOCATION,OTHER), code, name, path_key text, status, row_version, created_at, updated_at`.
UNIQUE(tenant_id,code); index(parent_id), path_key. Industry linkage is separate if an org unit is activated per industry.

### org_unit_industry
`tenant_id, org_unit_id, industry_context_id, status, config_json`; composite PK.

### data_home
PLATFORM_GLOBAL: `id, code UNIQUE, region_code, jurisdiction_code, topology_class, status, routing_version, metadata_json`.

## 4. Ownership constraints
- `industry_context.tenant_id` immutable.
- Any TENANT_INDUSTRY FK to industry_context must also match row tenant_id through composite integrity strategy or service/database check contract.
- Cross-tenant FKs are prohibited.
- Soft delete is forbidden for financial/audit/evidence rows; use status/reversal/retention workflow.
- Demo-capable business entities declare `is_demo boolean NOT NULL DEFAULT false`; Core identity/commercial/audit rows are not demo-capable unless explicitly designed.

## 5. RLS context variables — design contract
Transaction-local, server-set after DD-02 resolution:
- `app.tenant_id`
- `app.industry_context_id` nullable only by scope class
- `app.principal_id`
- `app.principal_type`
- `app.operator_elevation_id` nullable
- `app.scope_class`
- `app.service_principal_id` nullable

No client input directly sets these.

## 6. RLS policy catalog
| Policy class | Row class | Predicate contract |
|---|---|---|
| RLS-TENANT-READ/WRITE | TENANT_CORE | row.tenant_id = ctx.tenant_id |
| RLS-INDUSTRY-READ/WRITE | TENANT_INDUSTRY | row.tenant_id = ctx.tenant_id AND row.industry_context_id = ctx.industry_context_id |
| RLS-GLOBAL-READ | PLATFORM_GLOBAL | allowed service/platform principal + permission; no tenant predicate |
| RLS-OPERATOR | tenant rows | valid time-boxed elevation record + purpose + permission + tenant target; industry target required for industry row |
| RLS-SERVICE | tenant rows | service principal allowlist for module/scope + persisted job/event context |
| RLS-CROSS-CONTEXT | explicit transfer/read projection | named cross-context policy + source/target context + field projection; never wildcard tenant-wide |
| RLS-PROJECTION | projection | same tenant/industry ownership as source private data |
| RLS-AI-INGEST | source/index | tenant + industry + ACL/sensitivity/residency preconditions |

Default: RLS enabled + forced for application roles on every tenant-owned table. Missing policy is release-blocking.

## 7. Operator elevation entity
`id, operator_principal_id, tenant_id, industry_context_id?, purpose_code, ticket_reference?, approved_by?, starts_at, expires_at, status, permission_profile_id, created_at, revoked_at?`.  
No evergreen elevation. All use audited.

## 8. Retention/sensitivity catalog
### sensitivity_class
codes: PUBLIC, INTERNAL, CONFIDENTIAL, SENSITIVE_PERSONAL, REGULATED. **Current DD permits no additional free-form sensitivity subclass.** An industry needing finer classification uses a versioned `SensitivityProfile{code,parent_class,industry_context_id?,handling_policy_ref,effective_from,effective_to?,version,status}` owned by DD-16; `parent_class` is one of these five immutable platform classes, so an extension may tighten handling but cannot weaken its parent security floor. Default: no extension profile. Every profile publication/change is audited.

### retention_class
`code, default_policy_reference, erasure_mode, legal_hold_eligible, backup_treatment`. Numeric retention durations are policy/profile data, not invented here.

Each entity/table catalog entry must declare both classes.

## 9. Index conventions
Mandatory:
- PK on id.
- Tenant-owned high-cardinality lookup indexes begin with tenant_id.
- Industry-owned lookups begin `(tenant_id, industry_context_id,...)`.
- Foreign-key columns indexed when used for joins/cascade checks.
- Status + effective-time partial indexes for active records.
- Unique business codes scoped by tenant/context as semantics require.
- Append-only time-series tables index `(tenant_id, occurred_at desc)` and context where applicable.
**PartitionPolicy v1:** ordinary mutable business tables are unpartitioned and use the exact indexes declared by their owning DD. Append-only `audit_event`, outbox/event-delivery and webhook-delivery evidence tables are monthly RANGE-partitioned by `occurred_at/created_at` inside each Data Home; every partition retains the same Tenant/Industry RLS and indexes. No other table is partitioned in the initial implementation. A future partitioning change is an operational schema-change decision triggered by measured capacity evidence, never a developer-selected default.

## 10. Concurrency
Mutable aggregates use row_version optimistic concurrency. Commands send expectedVersion when conflict-sensitive. Mismatch → `CONFLICT`; no last-write-wins for financial, inventory, workflow transition or security/commercial state.

## 11. Erasure contract
1 legal hold/mandatory retention check;
2 if retained: pseudonymize only personal fields, preserve required skeleton;
3 otherwise hard erase governed personal data;
4 propagate to documents/search/vector/projections according to source linkage;
5 audit decision without copying erased PII into audit.

## 12. Residency
Tenant directory resolves data_home before business connection. Tenant business rows, documents, AI/RAG and PII telemetry remain in allowed home. Cross-region copy requires governed migration/backup policy.

## 13. Database design acceptance
No tenant table without tenant ownership; no industry table with nullable industry ownership; no broad wildcard operator policy; no cross-context projection without declared ownership; no schema convention mistaken for permission.
