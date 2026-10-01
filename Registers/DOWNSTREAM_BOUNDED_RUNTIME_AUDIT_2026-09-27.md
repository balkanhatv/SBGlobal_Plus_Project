# DOWNSTREAM BOUNDED RUNTIME AUDIT — 2026-09-27

**Prior tree-qualified verified basis through VC27-69:** `3a6849cd7a10e400674f9d5c80f5d052243868b2` / tree `9372a4c5e5137033fb8bd00cf53c87dce20f5e25`

**Current exact-head correction basis:** `74d09e139d4c6c9e2e922da2a67ff78f9296ed64` / tree `8b6f77c09f74a12dffb864244a3fdc76377c345e`

**Exact-head gate:** Core 1077/1077; PostgreSQL 529/529 with bootstrap PASS; Database 48 migrations / 42 verification files; Web PASS.

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

This bounded report alone did **not** clear the complete-project audit. The 2026-09-28 complete-project semantic/file-coverage/adversarial closure now treats the following as governed future Development surfaces; they remain locked until their own source-complete contracts are promoted: external REST route catalog/machine credentials, webhook runtime, Integration/provider execution, Workflow/Automation/Notification execution, Commercial write/apply path, retention/ACL, AI provider/tool execution, mobile/desktop executable surfaces, and remaining historical/canonical downstream semantics.

DD-243…DD-247 is now the latest implemented governed AIRequest pre-routing prerequisite batch at the exact-head basis above. This bounded report does not convert request-envelope integrity into RequestContext trust, live authorization, routing or AI execution authority.


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
- **VC27-47 — Workspace Tenant-Core exact shape:** WorkspaceService now rejects TENANT_CORE RequestContext carrying an Industry Context before membership/Tenant/Industry dependency use; malformed server scope evidence cannot be silently dropped by ClientWorkspaceContext projection.
- **VC27-48 — exact-null DB/idempotency scope shape:** shared RequestScopedSql and IdempotencyService now reject present Tenant/Industry fields where DD-02 requires exact absence, including empty-string values that truthiness checks previously normalized. No new DB or cross-context authority is added.
- **VC27-49 — Commercial current-state exact scope:** CommercialCurrentStateService and its PostgreSQL reader now reject TENANT_CORE carrying any present Industry Context before current-state store/query use, including empty-string evidence; Tenant-Industry still requires an Industry Context. Commercial semantics remain unchanged.
- **VC27-50 — GuardPipeline exact-null resource scope:** Tenant-Core resource validation now rejects any present Industry Context value, including empty string, before resource PDP/business rules; non-disclosing RESOURCE_NOT_FOUND semantics remain unchanged.
- **VC27-51 — effective-role exact Tenant-Core scope:** IdentityRoleQueryService and PostgresEffectiveRoleReadAdapter now independently reject TENANT_CORE carrying Industry Context before role-store/scoped-SQL use; exact CURRENT compiled snapshot semantics remain unchanged.
- **VC27-52 — tenant rate-limit exact scope:** RateLimitService now validates TENANT_CORE/TENANT_INDUSTRY RequestContext shape against the tenant-scoped OperationContract before bucket construction; malformed empty Tenant, hidden/missing Industry or tenant-scope mismatch cannot skip the mandatory Tenant aggregate bucket.
- **VC27-53 — Authorization read exact-null scope:** PostgresAuthorizationReadStore now treats any present Tenant/Industry field as invalid where PLATFORM_GLOBAL/TENANT_CORE require exact absence, failing before scoped SQL or CURRENT snapshot/ABAC reads instead of relying on the shared lower SQL guard.
- **VC27-54 — AuthorizationContext exact scope:** PostgresAuthorizationContextAdapter now accepts only generic TENANT_CORE/TENANT_INDUSTRY scope, requires non-empty Tenant, exact Industry absence/presence by scope, and rejects malformed/untyped scope before RequestScopedSql or CURRENT role-snapshot reads.
- **VC27-55 — Authorization compiler exact scope:** privileged Core compiler publication/invalidation now accepts only TENANT_CORE/TENANT_INDUSTRY tenant targets, rejects any present Industry evidence for TENANT_CORE and any present Tenant/Industry evidence for PLATFORM_GLOBAL, and fails malformed/untyped scope before compiler store use.
- **VC27-56 — GuardPipeline generic exact scope:** authorization guard entry now rejects private Tenant/Industry evidence on PUBLIC/PLATFORM_GLOBAL, hidden Industry on TENANT_CORE, and missing Tenant/Industry on tenant scopes before Commercial/PDP/resource dependencies. Dedicated cross-context transfer semantics remain separately governed.
- **VC27-57 — Commercial apply/publication exact Tenant-Core scope:** privileged Commercial apply-evidence and publication boundaries now reject any present Industry Context on TENANT_CORE before evidence-store/publication-store use; direct PostgreSQL-store coverage proves the lower scoped-SQL guard is no longer the only fail-closed layer.
- **VC27-58 — OperationContract runtime enums:** OperationExecutor now rejects unsupported runtime scopeClass/kind/idempotencyPolicy values before RequestContext, rate, guard, idempotency or domain execution; an untyped mutation-like kind cannot bypass COMMAND idempotency semantics.
- **VC27-59 — Commercial supporting exact Tenant-Core scope:** six remaining server-only Commercial plan-change evidence/compiler services now reject any present Industry Context on TENANT_CORE before resolver/source/recorder use, including present-empty evidence; lower persistence/RLS is no longer the sole fail-closed layer.
- **VC27-60 — Authorization durable-audit exact scope:** the privileged final Authorization audit writer now accepts only exact PLATFORM_GLOBAL/TENANT_CORE/TENANT_INDUSTRY single-context shapes and rejects malformed/untyped ownership evidence before RequestScopedSql/INSERT. PUBLIC and EXPLICIT_CROSS_CONTEXT remain separate governed audit paths.
- **VC27-61 — Authorization durable-audit principal evidence:** every accepted protected single-context Authorization audit write now requires a valid principal UUID before scoped SQL; malformed missing/empty actor identity cannot degrade into nullable generic AuditEvent evidence.
- **VC27-62 — current governed rate-refill policy:** PostgreSQL rate-limit admission now preserves persisted token/last-refill continuity but applies the current RateLimitStoreRule refill rate and capacity; stale faster persisted operational metadata cannot widen a stricter current rule.
- **VC27-63 — Integration reader exact Tenant-Core scope:** five tenant-scoped Integration PostgreSQL readers now reject any present Industry Context on TENANT_CORE before scoped SQL, including empty-string evidence, while preserving raw reader semantics.
- **VC27-64 — idempotency safe replay metadata:** persisted REPLAY/FINAL_FAILURE response status/reference now revalidate the existing bounded safe-metadata contract, and direct malformed completion is rejected before scoped SQL; no response body or lifecycle semantics are added.
- **VC27-65 — first-party web Origin canonicalization:** incoming Origin evidence must itself be a canonical HTTPS origin with no credentials/path/query/fragment, and an explicitly supplied empty Origin is malformed; URL normalization can no longer erase disallowed syntax before allowlist comparison.
- **VC27-66 — exact session-device binding:** SessionSecurityService now revalidates the returned device id, principal and Tenant against the selected session evidence, accepts only exact TRUSTED status, and preserves exact RISK_HOLD → STEP_UP_REQUIRED; alternate/malformed device-port evidence cannot become trusted ABAC environment state.
- **VC27-67 — exact SessionVersion evidence:** SessionSecurityService now rejects malformed or precision-unsafe current SessionVersion version/changed-at evidence before stale-session comparison or RequestContext projection; alternate/injected invalid session-security state cannot fail open.
- **VC27-68 — exact first-party JSON media type:** POST content-type validation now compares the parsed media-type token exactly to application/json while retaining optional parameters; prefix-smuggled non-JSON types fail 415 before tRPC/schema/domain execution.
- **VC27-69 — exact Clerk session creation time:** ClerkIdentityAdapter now requires provider session createdAtMs to be a safe integer before it becomes VerifiedIdentityEvidence, preserving exact stale-session comparison against Core SessionVersion.changed_at.
- **VC27-70 — Core-authoritative SessionVersion projection:** human RequestContext now projects only the validated current Core SessionVersion from SessionSecurityService; provider/identity sessionVersion metadata cannot fill a missing Core value in Tenant or PLATFORM_GLOBAL context.

### Current bounded verdict

**CLEAN AFTER VERIFIED TARGETED CORRECTIONS / COMPLETE-PROJECT AUDIT CLOSED FOR NORMAL GOVERNED DEVELOPMENT.**

This bounded report does not authorize source-incomplete execution by itself. The subsequent complete-project audit closure authorizes DD-209 source audit only and does not elevate the project to Production Ready, Deployed or Operational.
