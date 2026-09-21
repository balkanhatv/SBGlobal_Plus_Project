# REST adapter prerequisite ownership audit

**Date:** 2026-09-21
**Baseline:** `c496624681af802d6a5493e79803651103ba69be` / `d5f0aa06d25e6d62893ddd1c53c05dc535336aa8`
**Scope:** next independent source-complete work after `DEV-VISION-AUDIT-INVARIANTS-001`.

## Source reconciliation

F-01, A-01 §3/§5/§6, A-06 §1–§3/§7, ADR-005, DD-02/03/06/16 and
DD-049–056 were read against the current OperationExecutor, DTO registry,
transport projector and first-party tRPC Fetch boundary.

| Concern | Existing owner | Current determination |
|---|---|---|
| API plane | A-06 §1; ADR-005 | REST/OpenAPI is external interoperability over the same Core; it is not a second business implementation |
| Version/path | DD-06 §4/§11 | `/api/v1`; Tenant and Industry path identifiers are selectors only |
| Authentication order | A-06 §3; DD-06 §12; DD-054 | Edge/authenticity and credential verification complete before body parsing |
| Execution | A-01 §3; DD-051 | Route binds one operationId; OperationExecutor owns context, schema, rate, guard, idempotency and domain order |
| DTO and response | A-06 §2; DD-052 | Existing Zod operation DTO and canonical success/error/control projections are reused |
| Headers | DD-06 §5/§19/§25 | Authorization, Idempotency-Key, advisory X-Correlation-Id, no-store and Retry-After behavior are governed |
| Context isolation | A-02; DD-02; DD-06 §4/§9 | Path/header selectors never override credential, membership, Tenant, Industry or resource authority |
| Edge/body limits | A-06 §3; DD-016/DD-054/056 | Mandatory server-owned policy ports; deployment values are configuration |

The reusable Fetch adapter boundary is therefore source-complete. It can enforce
the order above, invoke the existing executor once and serialize only the shared
projection. This is an independent API-first slice and does not depend on the
blocked DD-076 Commercial evaluator.

## Deliberately unresolved dependencies

- Concrete external machine/API-key wire scheme and secret parsing.
- Public route catalog and operation-specific path/query/body mappings.
- Concrete REST deployment route, hosts, origins, TLS/proxy and size values.
- OpenAPI document generation/publication and deprecation-window operations.
- Webhook routes and provider authenticity contracts.
- Public `core.commercial.subscription.changePlan` and its blocked producers.

The adapter keeps these as injected ports or later route registrations. It does
not expose a public endpoint, accept generic Tenant/Industry headers as authority,
invent a credential scheme or duplicate business validation.

## Authorized implementation boundary

Implement a reusable server-side REST Fetch handler with mandatory edge,
authorization, authenticated-context, route and input ports. Metadata-only ports
cannot consume the body. Body preparation and input projection run only after the
authenticated context completes. The handler passes route-bound operationId,
transport metadata and raw projected input to OperationExecutor, then returns the
DD-052 canonical projection with deterministic HTTP control status, correlation,
no-store and Retry-After metadata.

Acceptance: REST-001 authentication before body/input; REST-002 exact executor
handoff and canonical success; REST-003 canonical error/status/Retry-After;
REST-004 explicit idempotency controls without fabricated DTO data; REST-005 no
unknown error leakage; REST-006 early denials; REST-007 selector non-authority;
REST-008 no live external surface claim.
