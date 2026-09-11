# SBGlobal Plus — A-01 CORE PLATFORM ARCHITECTURE
**Document ID:** A-01 · **Version:** 1.1 · **Status:** ARCHITECTURE BASELINE (CP-A1-002) · **Date:** 10-09-2026
**Traces to:** F-01 (platform model, Core capability catalog), F-02 (end-to-end workflow), F-00 §5 (canonical business model) · **Decisions:** ADR-001, ADR-005, ADR-006 (→ A-12)

---

## 1. Core Style & Boundary
The Unified Core uses **Next.js 15 server capabilities by default** (React 19, TypeScript 5.x, Node.js 22+) as one logical modular Core. **NestJS is introduced only where a dedicated backend/service boundary is architecturally justified** by isolation, independent scaling, protocol, workload or operational needs (ADR-013); it never becomes a second competing Core. The logical Core remains partitioned into domain modules with enforced boundaries (ADR-001). Rationale: a single Core matches the "one Unified Enterprise Core" vision, keeps tenant-context and entitlement enforcement in one process, and avoids premature distributed-systems cost; horizontal scaling is by stateless replicas (→ A-10 §4). Each module is an extraction seam: if a module later needs independent scaling (e.g. AI Gateway, Notification), it can be split along its existing contract without redesign.

The Core owns: all business logic, all writes to the canonical database, authorization decisions, entitlement checks, event publication. The Core does not render tenant-specific UI directly; experiences consume it via L5 APIs (→ A-06).

## 2. Module Catalog (platform modules)
| Module | Responsibility | Owns data (→ A-05) |
|---|---|---|
| Identity | Users, sessions, IdP federation, token exchange | User, Session, IdP link |
| Tenancy | Tenants, branches/departments, tenant lifecycle, context | Tenant, OrgUnit |
| Authorization | RBAC roles/permissions + ABAC policies, PDP | Role, Permission, Policy |
| Entitlement | Plans, subscriptions, licenses, entitlements, limits | Plan, Subscription, License, Entitlement |
| Billing | Invoicing, payment-gateway integration, dunning | Invoice, Payment |
| Configuration | Platform/tenant/industry/module config layers | ConfigItem (layered) |
| Workflow | State machines, approvals, transitions (F-02 steps) | WorkflowDef, Instance, Task |
| Notification | Template + channel routing (email/SMS/push/in-app) | Template, Delivery |
| Document | Managed documents/media, storage abstraction | DocumentMeta |
| Search | Tenant-scoped indexing/query facade | Index metadata |
| Audit | Append-only audit trail for every material action | AuditEvent |
| AI Gateway | → A-07 (hosted in-process, extraction seam) | AI config, usage |
| Industry modules | 9 suites' Management Systems → A-09 | Industry-context + transaction data |

## 3. Canonical Request Flow (synchronous)
```
Client (L6) → L5 API (tRPC/REST)
  1 Authenticate principal through Core Identity boundary
  2 Validate Tenant and resolve immutable Tenant Context
  3 Resolve active Industry Context for every industry-scoped operation
     (absent only for explicitly Core/shared/global resources)
  4 Validate subscription + applicable licenses; resolve current compiled
     EntitlementSnapshot (snapshot does not erase subscription/license semantics)
  5 Validate session/device/API-credential context where applicable
  6 Authorization: RBAC permission → ABAC/context policy →
     security/compliance/residency constraints
  7 Resource/workflow/business-rule guard
  8 Module service executes domain logic
  9 Transaction: domain writes + context-scoped outbox event + audit append
     atomically in PostgreSQL → response DTO
```
All cross-cutting checks are implemented once in the Core kernel and applied to every entry point; a module cannot opt out. **Industry-scoped operations fail closed when the active Industry Context is absent or does not own the requested resource.** The compiled entitlement snapshot is derived from valid plan/subscription/license/override/add-on/compliance inputs (A-04) and is an optimization of those semantics, not a replacement for them.

## 4. Module Boundary Rules
- A module exposes a **typed service contract** (TypeScript interface) and **domain events**; consumers depend on the contract, never on another module's tables (no cross-module SQL joins across ownership boundaries).
- Industry modules may depend on platform modules; platform modules never depend on industry modules.
- Shared read models needed across modules are produced by event projection, not shared writes (→ A-05 §6).
- All inter-module async coupling goes through the outbox/event dispatcher (→ A-06 §4).

## 5. Kernel (cross-cutting) Services
Core kernel provides: immutable `RequestContext{tenantId, industryContextId?, dataHome, principalId, principalType, orgUnitContext, roles, permissions, entitlementSnapshot, deviceOrCredentialContext, securityContext, correlationContext}`; Industry Context is mandatory for industry-scoped operations and optional only for explicitly classified Core/shared/global operations; guard pipeline (steps 1–7 above); transaction manager (write + outbox + audit atomically); validation chain executor (F-03's chain: schema → business rules → tenant rules → policy); error taxonomy (user error / policy denial / entitlement denial / system fault — distinct, audit-logged classes).

## 6. Technology Mapping
Next.js 15 · React 19 · TypeScript 5.x · Node.js 22 · tRPC · Clerk · PostgreSQL · Payload CMS 3 · Tailwind CSS + Shadcn UI · React Native / Expo for mobile · **Tauri 2.0 for Windows/macOS/Linux desktop** · Vercel for suitable web workloads · Coolify + Dockerized VPS for self-hosted workloads. REST/OpenAPI remains available where required for external interoperability; it is not the primary internal application API. PostgreSQL is the single canonical store (→ A-05) · No message broker at v1: Postgres outbox + dispatcher (ADR-006, upgrade seam to a broker recorded in A-12).

## 7. Deferred to Detailed Design
Per-module service contract signatures; entity field lists (F-00 §6 ledger targets, e.g. 500+ tables); endpoint-level API contracts (§26B); workflow definitions per Management System; permission matrix instantiation (1000+ permissions target).
