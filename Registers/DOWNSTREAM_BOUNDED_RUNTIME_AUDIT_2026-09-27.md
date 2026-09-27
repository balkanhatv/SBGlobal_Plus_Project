# DOWNSTREAM BOUNDED RUNTIME AUDIT — 2026-09-27

**Prior tree-qualified verified basis through VC27-39:** `b17e9dc4b66617c57449ee3ac180ac1a6d48e0ac` / tree `23c394870febb194ee3f86a3b5ce463d394d01cb`

**Current exact-head correction basis:** `402a17439b26864b50e8f8d781047d8f37b793a2` / tree `b67ef01589afc3c58ebac8a39919032dbb223918`

**Exact-head gate:** Core 713/713; PostgreSQL 506/506 with bootstrap PASS; Database 48 migrations / 42 verification files; Web PASS.

## Scope reviewed

1. DD-206 capability allowlist floor.
2. DD-207 provider allowlist floor.
3. DD-208 model allowlist floor.
4. AIMemory principal-currentness remaining-boundary audit and raw persistence/binding/supersession readers.
5. Physical Next.js `/api/trpc` route and first-party composition.
6. tRPC fetch/context/edge/body/Clerk Bearer adapters.
7. Three mounted OperationContracts and their domain projections.
8. RequestContext Tenant/membership/Industry/OrgUnit/DataHome resolution.
9. Commercial current-state snapshot and GuardPipeline.
10. PostgreSQL context/bootstrap/identity/rate/request-scoped role adapters.
11. Migration 0032 Platform-definition restrictive write floors.
12. Migration 0048 fail-closed definition scope/containment predicates.

## Verdict for this bounded slice

**CLEAN / no correction required.**

The current mounted surface has no discovered transport-controlled Tenant authority, cross-Industry widening, client-owned scopeClass, generic suspended-mode bypass, unaudited guard success, machine-credential acceptance on the human web route, REST exposure, or AI execution path.

DD-206/207/208 remain relationship-evidence floors only. They do not imply effective Tenant AI configuration or execution. AIMemory principal-currentness remains correctly BLOCKED on absent historical provenance and is not guessed by any current path.

The general application role remains an RLS-enforced application role rather than a per-query read-only role. Current canonical DD-05 explicitly recognizes `sbg_app_rw` as the ordinary request role while dedicated sensitive/control-plane/compiler roles own stronger mutation boundaries. Migration 0032 demonstrates that table privilege alone cannot mutate PLATFORM definitions; current definition readers expose no mutation/evaluation/selection authority.

## Still open

This report does **not** clear the complete-project audit. The following remain outside this slice and locked where not source-complete: external REST route catalog/machine credentials, webhook runtime, Integration/provider execution, Workflow/Automation/Notification execution, Commercial write/apply path, retention/ACL, AI provider/tool execution, mobile/desktop executable surfaces, and remaining historical/canonical downstream semantics.

DD-208 remains the latest governed development checkpoint. DD-209 is not authorized.


## Verified continuation through VC27-36

The bounded audit was extended beyond the original DD-206/207/208 + mounted tRPC basis and the resulting corrections are included in the verified executable basis above:

- **VC27-30/31/32 — REST necessary-floor hardening:** transport/network/authentication/selectors remain outer trusted inputs and cannot be rewritten by an authenticated-context port; malformed success-status metadata fails closed before domain execution. No external REST route catalog is published.
- **VC27-33 — Webhook scope evidence:** malformed scope values fail closed instead of falling through to TENANT_INDUSTRY. Endpoint/filter interpretation, signing, SSRF/DNS/redirect control, dispatcher/retry/DLQ/replay and network delivery remain locked.
- **VC27-34/35 — Document ACL subject evidence:** sparse role/OrgUnit arrays fail closed; selected OrgUnit ancestry must be duplicate-free, end at the selected valid OrgUnit and be empty when no OrgUnit is selected. ACL effect/expiry, operation mapping, inheritance/fallback and final ALLOW/DENY remain unresolved.
- **VC27-36 — Document physical binding:** current linked StorageObject size/checksum must still match ACTIVE/CLEAN DocumentMeta before private locator metadata is returned. Signing/provider/TTL/authorization/retention remain outside this floor.
- **VC27-37 — API Credential exact-Industry allowlist parity:** an exact Industry-scoped credential now fails closed when raw `allowedIndustryContextIds` carries any sibling/different Industry, mirroring migration 0030's no-widening invariant. Presented-token parsing/hash verification, CIDR, permission-profile mapping, successful-use mutation/audit and final `VerifiedMachineEvidence` remain blocked.
- **VC27-38 — strict instant validation:** OperatorElevation current-window, API Credential lifecycle, Webhook verification and TenantIntegration CredentialReference expiry/currentness floors now reject calendar-invalid or timezone-ambiguous timestamps that permissive `Date.parse()` could normalize. Valid explicit UTC/offset instants remain accepted; no execution authority is added.
- **VC27-39 — DD-191 MediaRequest completion evidence:** generated Document provenance now reuses the strict instant validator for `completedAt`, so calendar-invalid or timezone-ambiguous completion strings cannot satisfy the migration-0031 direct provenance floor. Model/Provider, moderation/licensing, ACL/storage and AI execution remain outside this floor.
- **VC27-40 — DD-082 resolved Document context shape:** the Core pre-sign candidate boundary now rejects TENANT_CORE contexts carrying an Industry Context before metadata dependency use, rather than relying on the concrete PostgreSQL adapter to reject the malformed shape. ACL evaluation/signing/storage authority remain outside this floor.

### Current bounded verdict

**CLEAN AFTER VERIFIED TARGETED CORRECTIONS / COMPLETE-PROJECT AUDIT STILL OPEN.**

This report does not authorize DD-209 and does not elevate the project to Production Ready, Deployed or Operational.
