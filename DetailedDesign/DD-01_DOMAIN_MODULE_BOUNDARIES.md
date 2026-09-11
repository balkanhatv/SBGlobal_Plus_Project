# DD-01 — DOMAIN & MODULE BOUNDARIES
**Wave:** 1 · **Status:** DETAILED DESIGN COMPLETE  
**Traces:** F-01 §7 · A-01 §1–§5 · A-09 §3 · ADR-001/012

## 1. Core module contract registry
| Module | Owns | May call | Must not |
|---|---|---|---|
| Identity | principals, provider links, memberships, sessions, credentials, devices | Tenancy, Audit | embed business permissions in provider IDs |
| Tenancy | tenant, org units, industry activations, data-home routing | Identity, Entitlement | own industry business data |
| Authorization | permission definitions, role templates/assignments, ABAC policies, access decisions | Identity, Tenancy, Entitlement, Audit | bypass commercial/security constraints |
| Entitlement | plan/subscription/license/add-on/override/snapshot/usage | Billing, Tenancy, Audit | grant access without Authorization |
| Billing | invoice/payment/dunning facts | Entitlement, Integration, Audit | interpret role permissions |
| Configuration | layered config and feature policy | Tenancy, Audit | become hidden business database |
| Workflow | definitions, instances, tasks, transition history | Authorization, Notification, Audit | invent domain rules absent from owner module |
| Notification | templates, channel routing, delivery status | Integration, Audit | expose cross-context recipient data |
| Document | metadata, ACL, object lifecycle | Authorization, Tenancy, Audit | trust storage path as authorization |
| Search/Projection | derived indexes/read models | owning-module events | write owning module tables |
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
