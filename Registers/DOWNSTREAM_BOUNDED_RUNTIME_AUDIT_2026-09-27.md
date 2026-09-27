# DOWNSTREAM BOUNDED RUNTIME AUDIT — 2026-09-27

**Prior tree-qualified verified basis through VC27-45:** `4a926027b0c7116f2ff73d21f76e5469ea07c1fa` / tree `e619c2d53c0768841aa9aef21276fe92328a51ce`

**Current exact-head correction basis:** `6beed80f10571d9a0520dca2aa63fc32930b927e` / tree `175e099b4f3e2a1f7e2e68d93a10701a87db02ee`

**Exact-head gate:** Core 718/718; PostgreSQL 506/506 with bootstrap PASS; Database 48 migrations / 42 verification files; Web PASS.

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
- **VC27-41 — generic cross-context RequestContext denial:** the generic resolver now denies EXPLICIT_CROSS_CONTEXT after authentication/scope allowlist checks and before Tenant lookup because DD-02 requires a dedicated source+target transfer contract plus permission/policy that the generic ContextResolutionInput does not carry. No cross-context workflow is invented.
- **VC27-42 — generic cross-context WorkerContext denial:** createWorkerContext now rejects EXPLICIT_CROSS_CONTEXT because its generic input lacks DD-02 source+target transfer evidence, projection, permission/policy, legal/audit and idempotency fields. TENANT_INDUSTRY keeps its persisted Industry Context requirement; no transfer worker is invented.
- **VC27-43 — DD-081 event occurrence-time parity:** the reusable event-envelope validator now rejects impossible ISO-like calendar dates before the existing Date.parse check, matching migration 0030's timestamptz overflow rejection without inventing a new serialization vocabulary. Payload interpretation still runs only after metadata/catalog/scope validation.
- **VC27-44 — Tenant-Core WorkerContext exact shape:** generic WorkerContext now rejects TENANT_CORE carrying an Industry Context, preserving DD-02's exact Tenant-Core null-Industry contract while retaining VC27-42 generic cross-context denial.
- **VC27-45 — WorkerContext runtime scope enum:** persisted/untyped worker evidence must use the generic worker's closed protected scope set; PUBLIC, PLATFORM_GLOBAL and unknown scope strings now fail closed before context emission, while EXPLICIT_CROSS_CONTEXT remains separately denied.
- **VC27-46 — ABAC timestamp grammar:** Permission/ABAC grammar now rejects impossible UTC calendar dates before PDP evaluation by reusing the strict instant parser; malformed ACTIVE policy state cannot normalize into a boolean DENY/RESTRICT condition.

### Current bounded verdict

**CLEAN AFTER VERIFIED TARGETED CORRECTIONS / COMPLETE-PROJECT AUDIT STILL OPEN.**

This report does not authorize DD-209 and does not elevate the project to Production Ready, Deployed or Operational.
