# DD-01 — DOMAIN & MODULE BOUNDARIES
**Wave:** 1 · **Status:** PHASE 3 REVALIDATED — SHARED ENGINE BOUNDARIES  
**Traces:** F-01 §7 · A-01 §1–§5 · A-09 §3 · ADR-001/012

## 1. Core module contract registry
| Module | Owns | May call | Must not |
|---|---|---|---|
| Identity | principals, provider links, memberships, sessions, credentials, devices | Tenancy, Audit | embed business permissions in provider IDs |
| Tenancy | tenant, org units, industry activations, data-home routing | Identity, Entitlement | own industry business data |
| Authorization | permission definitions, role templates/assignments, ABAC policies, access decisions | Identity, Tenancy, Entitlement, Audit | bypass commercial/security constraints |
| Entitlement | plan/subscription/license/add-on/override/snapshot/usage | Billing, Tenancy, Audit | grant access without Authorization |
| Billing | invoice/payment/dunning facts | Entitlement, Integration, Audit | interpret role permissions |
| Configuration | layered values, feature flags, versioned publish/activate/rollback | Tenancy, Audit | become hidden business database |
| Metadata | reusable descriptors/catalog/schema-independent definitions | Configuration, Audit | own domain transactions or executable code |
| Rules/Policy | declarative business/configuration rules and safe expression evaluation | Metadata, Configuration, Authorization, Audit | widen RBAC/ABAC or execute arbitrary tenant code |
| Form/Dynamic Fields | form/field definitions, validation composition, presentation schema | Metadata, Rules/Policy, Configuration, Audit | persist domain transactions outside owning module contracts |
| Workflow | definitions, instances, tasks, transition history | Authorization, Notification, Rules/Policy, Audit | invent domain rules absent from owner module |
| Notification | templates, channel routing, delivery status | Integration, Audit | expose cross-context recipient data |
| Document | metadata, ACL, object lifecycle | Authorization, Tenancy, Audit | trust storage path as authorization |
| Search/Projection | derived indexes/read models | owning-module events | write owning module tables |
| Reporting/BI | report/dashboard/KPI definitions over governed projections | Search/Projection, owning query contracts, Authorization | direct cross-module writes or bypass row/context filters |
| Integration | provider/connector definitions, credential refs, mappings and sync profiles | Configuration, Authorization, Audit | write domain tables directly from adapters |
| Automation/Scheduler | versioned automation definitions, scheduled/event triggers and worker orchestration | Workflow, Rules/Policy, Notification, Audit | bypass OperationContracts or authorization |
| Localization/Country Packs | locale/currency/timezone/date-number/language/reference packs | Configuration, Master/Reference Data, Audit | grant permissions or hard-code one country's domain semantics globally |
| Master/Reference Data | global/reference/lookup catalogs + seed-pack ownership | Tenancy, Configuration, Audit | own industry transactions |
| CMS/Branding | public/Tenant content + brand-token configuration | Configuration, Document, Audit | weaken security/accessibility semantic floors |
| Marketplace/Plugin | extension catalog/installations/capability manifests | Entitlement, Integration, Authorization, Audit | direct DB/provider bypass or unreviewed executable authority |
| Audit | append-only evidentiary events | none required for writes | mutable business correction |
| AI Gateway | provider/model/tool/RAG policy boundary | Authorization, Entitlement, Document/Search, Audit | direct provider SDK use by domain modules |
| Industry MS modules | own industry domain entities/workflows/rules | Core contracts + same-suite contracts/events | cross-suite direct table/contract coupling |

## 2. Dependency rule
Allowed direction: Experience/API adapter → module service → owned repository + Core contracts → outbox/audit.  
Forbidden: experience→DB, module→another module table, industry A→industry B service contract, provider SDK→domain module.

## 3. Contract types
Each module publishes:
- Command service contracts for state-changing operations.
- Query contracts for owned views.
- Domain event contracts.
- Permission/capability declarations.
- Scope classification metadata.
- Validation/error catalog.
- Projection contracts where cross-module read composition is required.

## 4. Scope metadata
Every exported command/query/event/document/projection declares:
`scopeClass`, `requiredPermission`, `requiredEntitlement?`, `resourceResolver?`, `auditClass`, `sensitivityClass`, `residencyClass`.

## 5. Transaction boundary
A command transaction may atomically write:
1. owning-module rows;
2. outbox rows;
3. audit rows;
4. usage/limit counters owned by a Core contract when the write is authorized for atomic participation.

It may not atomically mutate another business module's owned tables. Cross-module effects use events or an explicitly documented orchestration contract.

## 6. Idempotency
Externally retryable commands expose a stable idempotency key contract. Internal command handlers define whether repeat invocation is:
- naturally idempotent;
- key-deduplicated;
- forbidden after terminal state.

## 7. Error classes
Common envelope classes:
`AUTHENTICATION_REQUIRED`, `TENANT_INVALID`, `INDUSTRY_CONTEXT_REQUIRED`, `INDUSTRY_CONTEXT_MISMATCH`, `SUBSCRIPTION_INVALID`, `LICENSE_INVALID`, `CREDENTIAL_INVALID`, `ENTITLEMENT_DENIED`, `PERMISSION_DENIED`, `POLICY_DENIED`, `RESOURCE_NOT_FOUND`, `RESOURCE_STATE_INVALID`, `VALIDATION_FAILED`, `CONFLICT`, `RATE_LIMITED`, `DEPENDENCY_UNAVAILABLE`, `INTERNAL_ERROR`.

## 8. Wave-1 acceptance
PASS when no Wave-1 contract requires cross-module table writes, no scope is implicit, and every downstream DD artifact references this boundary model.


## 9. Shared definition lifecycle contract — Phase 3
All versioned shared definitions (Metadata, Rule, Form, Country/Localization Pack, Brand configuration, Automation and Extension manifest) use:
`DRAFT → REVIEW → PUBLISHED → ACTIVE → RETIRED`.
Only one ACTIVE version per `(owner_scope, owner_id, code)` unless the owning contract explicitly allows parallel effective-dated versions. Activation is atomic and auditable; rollback activates a prior PUBLISHED version and creates a new activation audit record rather than mutating history.

Every definition carries: `id, owner_scope, tenant_id?, industry_context_id?, code, version, status, schema_version, created_by, approved_by?, effective_from?, effective_to?, created_at, updated_at`. TENANT_INDUSTRY definitions require both Tenant and Industry Context. Lower scopes may tighten/configure allowed fields but may not widen permission/security/accessibility floors.

**Safety:** Rules/metadata/forms are declarative data. No tenant-provided JavaScript, SQL, shell command, dynamic module import or equivalent arbitrary executable payload is accepted by these engines.

**Acceptance:** definition activation without approval where required → deny; wrong Tenant/Industry Context → deny; retired version execution → deny; rollback preserves prior audit/version history; tenant rule attempting arbitrary code → VALIDATION_FAILED.
