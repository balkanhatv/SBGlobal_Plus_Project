# NotificationDelivery TenantIntegration current-integrity evidence reader batch ownership audit

**Date:** 2026-09-30  
**Baseline checkpoint:** `DEV-NOTIFICATION-DELIVERY-COMPOSED-EVIDENCE-READER-001`  
**Verified entry HEAD:** `14c70745e352e187e645d9433181df19ceec930c`  
**Verified entry tree:** `4a2835dd6db8549e3a590a896f03b43be6cb432b`  
**Governed batch:** DD-313 through DD-317

## Entry gate

The corrected DD-308…DD-312 state closure is exact-head verified:
- Core Service Verify `36719871351` / `109901944260`: **1026/1026 PASS**, zero failed/skipped.
- PostgreSQL `36719871351` / `109901943929`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36719871350` / `109901943614`: PASS.
- Web Boundary Verify `36719871320` / `109901945516`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of F-01 Notification/Communication + Integration Management capabilities, A-01 Notification/Integration module ownership, A-06 provider-port architecture, DD-06 Integration registry contracts, DD-165…DD-167 current TenantIntegration integrity floors, DD-168 NotificationDelivery→TenantIntegration binding, DD-298…DD-312 visible/composed NotificationDelivery evidence and the existing Integration read ports yields one independently source-complete evidence boundary:

- DD-312 already establishes one RequestContext-visible NotificationDelivery, valid known Integration/Event/Template relationships and coherent raw attempt-history evidence before any deeper Integration evidence is considered;
- when a Delivery is not bound to a TenantIntegration, DD-168/DD-172 already establish that no Integration relationship evidence is required;
- when a Delivery is bound, DD-312 preserves the exact DD-302/DD-307 `PersistedTenantIntegration` reference that satisfied the exact id/Tenant/status/Industry binding;
- DD-165 owns current CredentialReference metadata binding/status/expiry against a server-owned evaluation instant;
- DD-166 owns current IntegrationDefinition/config/enabled-capability integrity;
- DD-167 is the no-new-semantics conjunction of DD-165 + DD-166;
- concrete exact readers already exist for CredentialReference metadata, IntegrationDefinition and exact IntegrationCapability tuples;
- CredentialReference metadata deliberately excludes the secret locator, and DD-167 deliberately does not create provider/network execution authority;
- F-01/A-06 require Notification routing to remain behind Integration/provider ports, so stale Integration relationship/current-integrity evidence must remain distinguishable before any later provider-execution slice;
- no current source owns Notification provider selection, channel→capability mapping, retry/finality, health/fallback, secret retrieval or send execution.

## Determination

**SOURCE-COMPLETE for parent-first composed NotificationDelivery evidence + conditional current TenantIntegration integrity evidence only.**

A successful result means only:
1. DD-312 composed Delivery evidence succeeded under the supplied RequestContext;
2. if that Delivery is Integration-bound, the exact preserved TenantIntegration currently satisfies DD-167 against exact supplied/read CredentialReference metadata, Definition and enabled Capability evidence at the supplied server-owned evaluation instant;
3. if the Delivery is not Integration-bound, no Integration-currentness evidence is required.

It is not send authorization, provider selection, secret access, health/fallback approval or retry authority.

## Locked DD-313…DD-317 contracts

### DD-313 — Establish DD-312 composed Delivery evidence before deeper Integration reads
Add a bounded composition that first invokes `loadNotificationDeliveryComposedEvidence(...)` with the exact supplied:
- RequestContext;
- NotificationDelivery id;
- Delivery/Integration/Event/Template/Attempt read ports.

If DD-312 returns `null`, return `null` and do not read CredentialReference metadata, IntegrationDefinition or IntegrationCapabilities.

Any DD-312 dependency/persistence error propagates unchanged and no deeper Integration read occurs.

### DD-314 — Conditional Integration-bound evidence branch
Inspect only `composed.relationships.integration`.

If it is absent:
- return successful immutable composed evidence with no `integrationCurrentIntegrity` member;
- do not call CredentialReference, IntegrationDefinition or IntegrationCapability readers.

If present:
- preserve that exact Integration object as the sole Integration identity/relationship authority for this batch;
- do not re-select or substitute another TenantIntegration.

No lifecycle/health/provider interpretation is added.

### DD-315 — Exact current-integrity dependency reads
For an Integration-bound Delivery, read:

1. CredentialReference metadata through `CredentialReferenceMetadataReadPort.loadForContext` with:
   - the exact same RequestContext object;
   - exact `integration.credentialReferenceId`.

2. IntegrationDefinition through `IntegrationDefinitionReadPort.loadById` with exact `integration.integrationDefinitionId`.

3. One IntegrationCapability per exact `integration.enabledCapabilities` entry through `IntegrationCapabilityReadPort.loadExact` with:
   - exact `integration.integrationDefinitionId`;
   - exact persisted capability code.

Capability reads use the persisted `enabledCapabilities` order only as deterministic evidence-read order; it is not routing or priority semantics. Empty enabled capabilities produce no capability read.

Any required null evidence returns `null`. Reader errors propagate unchanged. No fallback/latest/alternate Definition, Credential or Capability lookup is allowed.

### DD-316 — Delegate exact evidence to DD-167
Pass the exact:
- preserved TenantIntegration reference;
- exact loaded CredentialReference metadata;
- exact supplied server-owned `evaluatedAt`;
- exact loaded IntegrationDefinition;
- exact loaded capability evidence array

to `matchesCurrentTenantIntegrationIntegrityFloors(...)`.

If DD-167 returns false, return `null`.

Do not add status/health/profile/provider/secret/network predicates beyond DD-167.

### DD-317 — Immutable NotificationDelivery + Integration-currentness evidence envelope
On success return immutable:
- exact DD-312 `composed` evidence reference;
- optional `integrationCurrentIntegrity` only for Integration-bound Delivery, containing:
  - exact preserved Integration reference;
  - exact CredentialReference metadata reference;
  - exact IntegrationDefinition reference;
  - immutable capability evidence array preserving exact loaded row identities and persisted enabled-capability order;
  - exact supplied `evaluatedAt`.

Inputs remain unchanged.

No combined “sendable/executable/healthy” flag may be synthesized.

## Fixed acceptance before implementation

- **NOTIF-INTCUR-BASE-001** DD-312 executes first with exact RequestContext/id and supplied Delivery/relationship/attempt ports.
- **NOTIF-INTCUR-BASE-002** DD-312 null returns null and no current-integrity reader is called.
- **NOTIF-INTCUR-BASE-003** DD-312 error propagates unchanged and no current-integrity reader is called.
- **NOTIF-INTCUR-UNBOUND-001** unbound Delivery succeeds with exact DD-312 evidence and no Integration-currentness evidence/read calls.
- **NOTIF-INTCUR-CRED-001** Integration-bound path forwards exact RequestContext + credentialReferenceId.
- **NOTIF-INTCUR-DEF-001** Integration-bound path forwards exact integrationDefinitionId.
- **NOTIF-INTCUR-CAP-001** exactly one capability read occurs per persisted enabled code in persisted order; empty enabled set makes no capability call.
- **NOTIF-INTCUR-DEP-001** required null Credential/Definition/Capability evidence fails closed as null.
- **NOTIF-INTCUR-DEP-002** Credential/Definition/Capability reader errors propagate unchanged.
- **NOTIF-INTCUR-FLOOR-001** DD-167 true returns immutable evidence preserving exact child identities and supplied evaluatedAt.
- **NOTIF-INTCUR-FLOOR-002** DD-167 false returns null with no fallback or alternate evidence lookup.
- **NOTIF-INTCUR-BOUND-001** inputs remain unchanged and output exposes no sendable/executable/health/fallback/provider/secret/retry/dispatch/scheduling/mutation authority.

Expected executable delta: Core **1026 → 1038**. PostgreSQL remains **525**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider SDK, secret access, frontend or product-policy change.

This batch does **not** implement:
- recipient-principal currentness;
- complete NotificationDelivery validity;
- Delivery/attempt terminality or retryability;
- retry/backoff/exhaustion;
- Notification channel→IntegrationCapability mapping;
- permission-profile resolution;
- TenantIntegration health/fallback approval;
- ProviderAdapter/provider selection;
- CredentialReference secret-locator/material access;
- provider SDK/network execution;
- template fallback/rendering/sanitization;
- source-event readiness/dispatch;
- worker claim/lease/scheduling;
- send/retry/callback reconciliation;
- Delivery/Attempt mutation or audit/metric append.

After DD-313…DD-317 implementation and targeted regression, run the governed Core/PostgreSQL/Database/Web batch-boundary verification before canonical promotion.
