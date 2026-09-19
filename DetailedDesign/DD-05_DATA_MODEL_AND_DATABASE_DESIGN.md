# DD-05 — CORE DATA MODEL, DATABASE & RLS DESIGN
**Wave:** 1 · **Status:** PHASE 3 REVALIDATED — DATA CONTRACTS  
**Traces:** F-04 · F-11 · A-02 · A-05 · ADR-002/008/018 · DD-02

## 1. PostgreSQL schema ownership

**Current implementation binding:** DD-040 and `../Development/CORE_PERSISTENCE_ADAPTER_MAP.md` govern the concrete SQL driver and exact repository field mapping. Data Home/region/dedicated-Tenant route matching precedes connection checkout; transaction scope is never selected from resource IDs. Existing SQL persistence does not imply compiled permission-set or Industry presentation storage exists.
| Schema | Owner | Scope |
|---|---|---|
| platform_directory | Tenancy/Commercial catalog | PLATFORM_GLOBAL |
| core_identity | Identity | tenant/core mixed by table |
| core_tenancy | Tenancy | TENANT_CORE |
| core_authz | Authorization | tenant/core |
| core_commercial | Entitlement/Billing | tenant/core + global catalog |
| core_config | Configuration + Metadata + Rules/Policy + Form/Dynamic Fields + Localization/Country Packs + CMS/Branding | tenant/core/industry by row scope |
| core_master | Master/Reference Data + seed-pack catalog | platform/global + tenant/core + industry materializations |
| core_workflow | Workflow + Automation/Scheduler definitions/instances | tenant/core or tenant/industry by instance |
| core_notification | Notification | tenant/core or tenant/industry |
| core_document | Document | tenant/core or tenant/industry |
| core_audit | Audit | scope carried per event |
| core_integration | API/Webhook/adapter config | tenant/core/industry |
| core_projection | derived read models | same source scope |
| core_ai | AI Gateway / provider-model catalog / RAG / assistants / agents / memory / usage | platform/global + tenant/core/industry by row scope |
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

## 3A. Phase-3 recovered shared-definition entities

### metadata_definition
`id uuid PK, owner_scope enum(PLATFORM,TENANT,INDUSTRY), tenant_id uuid?, industry_context_id uuid?, code text NOT NULL, kind text NOT NULL, version int NOT NULL, status enum(DRAFT,REVIEW,PUBLISHED,ACTIVE,RETIRED), schema_json jsonb NOT NULL, schema_version int NOT NULL, created_by uuid NOT NULL, approved_by uuid?, effective_from timestamptz?, effective_to timestamptz?, created_at, updated_at`.
UNIQUE(owner_scope, COALESCE(tenant_id,zero_uuid), COALESCE(industry_context_id,zero_uuid), code, version). Partial unique index enforces one ACTIVE version per owner/code.

### rule_definition
Same scoped/version columns + `input_schema_json jsonb NOT NULL, condition_ast_json jsonb NOT NULL, decision_json jsonb NOT NULL, priority int NOT NULL DEFAULT 100, safety_class enum(BUSINESS,CONFIGURATION,VALIDATION), required_permission text?`.
AST node/operator allowlist is platform-owned; no arbitrary code/SQL/function import node exists.

### form_definition
Same scoped/version columns + `purpose_code, submit_operation_id text?, layout_schema_json jsonb NOT NULL, validation_rule_refs text[] NOT NULL DEFAULT '{}', localization_key_prefix text?, allowed_surface_classes text[] NOT NULL`.

### form_field_definition
`id, form_definition_id FK, field_key text, field_type enum(TEXT,NUMBER,DECIMAL,DATE,DATETIME,BOOLEAN,SELECT,MULTISELECT,REFERENCE,FILE,JSON_STRUCTURED), label_key, required boolean, read_only boolean, visibility_rule_ref?, validation_schema_json, reference_catalog_ref?, sort_order int, sensitivity_class, created_at`.
UNIQUE(form_definition_id, field_key).

### country_pack
`id uuid PK, country_code char(2) NOT NULL, code text NOT NULL, version int NOT NULL, status enum(DRAFT,REVIEW,PUBLISHED,ACTIVE,RETIRED), locale_codes text[] NOT NULL, default_currency_code char(3)?, default_timezone text?, default_date_format text?, address_schema_json jsonb?, phone_schema_json jsonb?, reference_bundle_ref text?, metadata_json jsonb, created_at, approved_by?, effective_from?`.
UNIQUE(country_code,code,version). Country packs contain reference/default configuration only; permission grants and Industry business rules are prohibited.

### tenant_country_pack_activation
`id, tenant_id NOT NULL, country_pack_id NOT NULL, status enum(PENDING,ACTIVE,DISABLED), config_override_json jsonb, activated_at?, disabled_at?, row_version bigint`.
UNIQUE(tenant_id,country_pack_id) for active lifecycle ownership.

### brand_configuration
`id, owner_scope enum(PLATFORM,TENANT,INDUSTRY), tenant_id?, industry_context_id?, code, version, status enum(DRAFT,REVIEW,PUBLISHED,ACTIVE,RETIRED), token_json jsonb NOT NULL, typography_json jsonb NOT NULL, logo_document_id?, favicon_document_id?, accessibility_validation_status enum(PENDING,PASS,FAIL), created_by, approved_by?, created_at, updated_at`.
Activation requires accessibility_validation_status=PASS. Platform security/warning semantic tokens are non-overridable at lower scopes.

### data_export_request
`id, tenant_id NOT NULL, industry_context_id?, requester_principal_id NOT NULL, subject_principal_id?, scope_class, export_type enum(DATA_ACCESS,PORTABILITY,TENANT_EXPORT,ADMIN_EXPORT), requested_resource_classes text[] NOT NULL, residency_policy_version, sensitivity_ceiling, status enum(REQUESTED,VALIDATING,APPROVAL_REQUIRED,APPROVED,GENERATING,READY,DOWNLOADED,EXPIRED,REJECTED,CANCELLED), approval_ref?, document_id?, expires_at?, created_at, updated_at`.
`scope_class` is exactly TENANT_CORE with null Industry Context or TENANT_INDUSTRY with a non-null same-tenant context; this table does not encode cross-context exports. Requester, optional subject and optional result DocumentMeta are validated against the exact tenant/context, document security state and sensitivity ceiling. A true cross-context export requires a separately governed projection/approval contract. Generation queries execute under the requester/approved export policy and never under wildcard DB authority.

## 3B. Workflow / Automation / Notification completion entities

### workflow_definition
`id uuid PK, owner_scope enum(PLATFORM,TENANT,INDUSTRY), tenant_id?, industry_context_id?, code text, version int, status enum(DRAFT,REVIEW,PUBLISHED,ACTIVE,RETIRED), schema_version int, state_machine_json jsonb, approval_policy_json jsonb, rule_refs text[], created_by, approved_by?, effective_from?, effective_to?, created_at, updated_at`.
One ACTIVE version per scoped code. State names remain definition data so Industry workflows do not become Core enums.

### workflow_instance
`id, tenant_id, industry_context_id?, scope_class enum(TENANT_CORE,TENANT_INDUSTRY), workflow_definition_id, workflow_definition_version, resource_type, resource_id, current_state text, lifecycle_state enum(OPEN,WAITING,COMPLETED,CANCELLED), row_version bigint, started_at, completed_at?, created_by, created_at, updated_at`.
TENANT_INDUSTRY requires non-null Industry Context. Resource ownership is resolved through the owning OperationContract; Workflow does not directly own Industry resource tables.

### workflow_task
`id, tenant_id, industry_context_id?, workflow_instance_id, task_type enum(APPROVAL,REVIEW,ACTION), assigned_subject_type enum(PRINCIPAL,ROLE,ORG_UNIT), assigned_subject_id uuid, permission_code, state enum(PENDING,CLAIMED,APPROVED,REJECTED,COMPLETED,CANCELLED,EXPIRED), due_at?, claimed_by?, completed_by?, completed_at?, row_version, created_at, updated_at`.

### workflow_transition
Append-only: `id, tenant_id, industry_context_id?, workflow_instance_id, from_state, action_code, to_state, actor_principal_id, reason_code?, expected_instance_version, resulting_instance_version, occurred_at, correlation_id`. No update/delete application permission.

### automation_definition
Same scoped/version lifecycle as shared definitions + `trigger_type enum(EVENT,SCHEDULE,MANUAL), trigger_config_json, condition_rule_ref?, operation_contract_id?, workflow_definition_id?, config_json`. Automation can invoke only governed OperationContracts/Workflow definitions.

### automation_run
`id, tenant_id, industry_context_id?, automation_definition_id, trigger_ref, idempotency_key_hash, status enum(PENDING,RUNNING,SUCCEEDED,FAILED,CANCELLED), started_at, completed_at?, correlation_id, last_error_code?`. Unique scoped automation + idempotency key.

### notification_template
`id, owner_scope, tenant_id?, industry_context_id?, code, channel enum(EMAIL,SMS,WHATSAPP,PUSH,IN_APP), locale_code, version, status enum(DRAFT,REVIEW,PUBLISHED,ACTIVE,RETIRED), subject_template?, body_template, safe_preview_template?, variable_schema_json, created_by, approved_by?, created_at, updated_at`.
One ACTIVE version per scoped code/channel/locale.

### notification_delivery
`id, tenant_id, industry_context_id?, scope_class enum(TENANT_CORE,TENANT_INDUSTRY), template_id?, template_version?, recipient_principal_id?, recipient_reference?, channel, tenant_integration_id?, correlation_id, source_event_id?, status enum(QUEUED,SENDING,SENT,DELIVERED,FAILED,SUPPRESSED,CANCELLED), queued_at, sent_at?, delivered_at?, last_error_code?, row_version`. Recipient data is reference/minimized; provider secrets are never stored here.

### notification_delivery_attempt
Append-only: `id, delivery_id, attempt_no, provider_message_ref?, normalized_status, normalized_error_code?, started_at, completed_at?`. Unique `(delivery_id,attempt_no)`.

## 4. Ownership constraints
- `industry_context.tenant_id` immutable.
- Any TENANT_INDUSTRY FK to industry_context must also match row tenant_id through composite integrity strategy or service/database check contract.
- Cross-tenant FKs are prohibited.
- Ownership selectors (`tenant_id`, Industry Context endpoints, `scope_class`, `owner_scope`) are immutable after insert on every Core/Industry table carrying them; a lifecycle transition creates governed evidence rather than reclassifying an existing row.
- A UUID-only parent FK is insufficient when both parent and child carry Tenant/Industry ownership. Use a composite same-scope FK or a fail-closed database integrity trigger, including Commercial, Identity/Authz, Document, Integration, Workflow/Notification and AI relationships.
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

## 13. Phase-3 data acceptance
- activating a Country Pack cannot create permission/entitlement grants;
- form/rule/metadata rows with TENANT_INDUSTRY scope require matching tenant_id + industry_context_id;
- arbitrary executable content in rule/form metadata is rejected;
- Tenant brand activation fails accessibility validation when restricted semantic floors are weakened;
- export/portability generation under wrong Tenant/Industry Context yields no data and a denial audit;
- ACTIVE shared-definition uniqueness is enforced by database constraint/index plus service transaction.

## 14. Database design acceptance
No tenant table without tenant ownership; no industry table with nullable industry ownership; no broad wildcard operator policy; no cross-context projection without declared ownership; no schema convention mistaken for permission.


## Development completion note — AI schema ownership
**DEV-DB-AC-003 (2026-09-13):** DD-09 defines exact AI/RAG/Agent persistence entities but the original DD-05 schema ownership table omitted an AI-owned PostgreSQL schema. `core_ai` is now the canonical schema owner for those shared AI entities. This is an organizational ownership correction only; Tenant/Industry isolation, authorization, entitlement and AI Gateway boundaries are unchanged.


## Development completion note — Workflow/Notification persistence
**DEV-DB-AC-005 (2026-09-13):** Architecture and Foundation defined Workflow, Automation/Scheduler and Notification ownership but their physical persistence contracts were under-specified for implementation. §3B is the canonical completion contract. It keeps Industry workflow states as configuration data, preserves append-only transition/delivery evidence, routes side effects only through governed OperationContracts/integrations, and adds no Industry semantics to Core.

## Current-state database audit corrections

**DEV-DB-AC-008 (2026-09-13):** migrations `0029`–`0031` make ownership immutability and same-scope dependency integrity executable. They close UUID-existence-only gaps across commercial parents, membership/role assignment, exports/documents, integration credentials/cursors/idempotency, event/webhook identity, Workflow/Notification and AI/RAG/Agent references. Every one of the 18 scalar Industry document references is now a composite `(tenant_id, industry_context_id, document_id)` dependency on DocumentMeta; the one document-array reference is validated element-by-element. Physical StorageObject IDs are not Industry references.

**DEV-DB-AC-009 (2026-09-13):** DocumentMeta records generated media provenance explicitly; AI PromptSet/ToolSet and membership owners are physical tables; provider/model pairs and configuration snapshots are relationally bound. Audit/outbox/webhook rows use exact scope semantics, and future partitions receive the corrected policies.

**DEV-DB-AC-010 (2026-09-13):** blanket application default privileges are removed. Identity and control-plane roles are separate, all runtime roles remain `NOBYPASSRLS`, platform catalogs are read-only to request roles, commercial/transition/audit-style evidence is append-only, Industry rows are not directly deletable by the app role, and only migration administration may create evidence partitions. Migration `0032` additionally intersects existing scope policies with restrictive INSERT/UPDATE/DELETE floors on every platform-owned definition and parent-owned role/form/prompt/tool binding. A `PLATFORM_GLOBAL` selector permits only the existing read contract; mutation also requires `sbg_control_plane_rw`, retaining the same Tenant/Industry scope checks.


## 15. Dedicated Commercial transition/compiler database boundary [DD-064]

The plan-change/apply compiler boundary uses a dedicated PostgreSQL group role `sbg_commercial_transition_compiler_rw`.

Role invariants:
- NOLOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOINHERIT, NOBYPASSRLS.
- ordinary `sbg_app_rw` and `sbg_worker_rw` have no Commercial INSERT/UPDATE/DELETE authority on Subscription, transition, license, add-on, override, usage or entitlement snapshot/fact tables.
- catalog/source reads are explicit; catalog mutation remains control-plane only.
- Subscription mutation is column-limited to `plan_version_id`, `version`, and `updated_at`. This role cannot directly change subscription state, billing anchors/periods, invoice references, auto-renew, trial/grace/cancellation fields or Tenant ownership.
- SubscriptionTransition is append-only.
- EntitlementSnapshot may be inserted and only its lifecycle `status` may be updated; snapshot facts are insert-only.
- licenses, tenant add-ons, overrides and usage meters are compiler inputs only and are not mutable through this role.
- same-Tenant compiler SELECT policies intentionally span all Industry Contexts for license/override/usage/snapshot facts under a TENANT_CORE operation. They never span sibling Tenants and do not use BYPASSRLS.
- outbox/audit append is restricted to TENANT_CORE Commercial evidence. Outbox event type is restricted to v1 `subscription.transitioned` / `entitlement.recompiled`; Audit source module must be `Commercial`.
- event catalog remains SELECT-only.

This database role is a publication boundary only. It does not itself calculate plan impact, payment/proration, approval results or entitlement semantics. A server service must still validate DD-062 assessment/resolution evidence and compile deterministic facts before opening this transaction.


## 16. Atomic Commercial publication repository [DD-065]

`PostgresCommercialTransitionCompilerDatabase` is the fixed-role SQL adapter for `sbg_commercial_transition_compiler_rw`. Like the Authorization compiler adapter it:
- begins a transaction;
- SET LOCAL ROLE to the dedicated NOLOGIN/NOBYPASSRLS group role;
- verifies both runtime and login roles are non-superuser/non-bypass;
- clears pooled scope residue;
- lets `RequestScopedSql` set the exact Tenant Core context;
- fails/destroys unsafe pooled connections rather than returning stale scope.

Migration 0044 adds only SELECT on `core_tenancy.tenant` to this role so DD-07 event envelopes can use the authoritative `residency_region_code`. Existing FORCE-RLS `tenant_resolved_context_policy` keeps that read same-Tenant; Tenant mutation remains absent.

The publication store uses row locks/optimistic predicates for Subscription and CURRENT entitlement snapshot, status-only supersession, immutable snapshot/fact insertion, catalog-constrained outbox append and restricted Commercial audit append. No general application role is reused.
