# Event envelope / catalog prerequisite ownership audit

**Date:** 2026-09-21  
**Baseline:** `b269f9131226def2ea582835e074ab7d6571d9ad`  
**Scope:** next independent source-complete work after `DEV-API-REST-001`.

## Source reconciliation

A-06 §4–§5, DD-07 §§1–5/13–15, DD-17 EVT-001…010 / DBA-005, migrations 0008/0030/0042 and the current Commercial publication outbox writer were read against the current executable source.

| Concern | Existing owner | Current determination |
|---|---|---|
| Canonical envelope fields | DD-07 §1 | Exact required metadata and scope-dependent ownership fields are defined |
| Event catalog binding | DD-07 §3; migration 0030 | eventType/version/scope, producer module and sensitivity must agree with the catalog |
| Physical scope binding | DD-07 §§1–2; migration 0030 | platform/tenant/industry/cross-context ownership rules are exact and already enforced in PostgreSQL |
| Tenant residency | DD-07 §1; migration 0030 | tenant event envelope residency must match authoritative Tenant residency |
| Cross-context endpoints | DD-07 §1; migration 0030 | source/target must be distinct Industry Contexts owned by the same Tenant |
| Payload validation order | DD-07 §1/§4 | catalog/envelope validation precedes payload interpretation |
| Delivery semantics | DD-07 §§4–5/11 | consumer idempotency/retry/DLQ are governed, but concrete dispatcher scheduling/runtime composition is not implemented |
| Webhook transport | DD-07 §§7–12 | persistence integrity exists; endpoint verification, signing/rotation, SSRF resolution and retry operations are separate runtime work |

## Determination

A reusable **Core event-envelope/catalog validation boundary** is source-complete. It can validate canonical JSON-compatible envelope structure, exact catalog identity/scope/producer/sensitivity binding, physical Tenant/Industry/residency binding, and cross-context ownership through an injected authoritative verifier. Payload validation remains an injected catalog-schema port and runs only after envelope/catalog/scope checks.

This slice does not need a new database schema, route, retry duration, broker, webhook signing algorithm, provider, endpoint policy or delivery scheduler.

## Deliberately unresolved / excluded

- Outbox polling/claim concurrency and concrete dispatcher worker composition.
- Retry timing/backoff values and DLQ operational thresholds.
- Webhook challenge lifetime, redirect policy values, DNS/IP resolution implementation and signing-secret rotation overlap values.
- External webhook routes or public REST/OpenAPI publication.
- Event-specific payload-schema execution engine selection; the validator consumes an injected catalog payload validator rather than inventing one.
- New event catalog entries beyond already governed definitions.

## Authorized implementation boundary

Implement one reusable Core validator and contracts that:

1. reject malformed/non-JSON envelopes and invalid required metadata;
2. bind event id/type/version/scope to the authoritative persistence binding;
3. bind source module and sensitivity to the catalog entry;
4. enforce PLATFORM_GLOBAL / TENANT_CORE / TENANT_INDUSTRY / EXPLICIT_CROSS_CONTEXT ownership rules and tenant residency;
5. require an authoritative same-Tenant verifier for explicit cross-context endpoints;
6. invoke the injected payload-schema validator only after all metadata/catalog/scope checks succeed;
7. expose no dispatcher, webhook or external endpoint.

Acceptance is added as EVT-CAT-001…006. No SQL or privilege change is authorized by this slice.
