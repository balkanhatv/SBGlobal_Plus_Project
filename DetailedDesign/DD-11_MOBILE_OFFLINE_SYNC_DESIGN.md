# DD-11 — MOBILE & OFFLINE SYNC DETAILED DESIGN
**Wave:** 2 · **Status:** DETAILED DESIGN COMPLETE  
**Traces:** F-06/F-10 · A-08 §7–§8 · ADR-014/016 · DD-02/DD-03/DD-06/DD-07/DD-08

## 1. Technology / application model
React Native + Expo only. One reusable mobile shell consumes tenant/industry experience packages; roles do not create separate apps. Platform Mobile, where justified, consumes the same identity/context/API contracts with PLATFORM_GLOBAL scope. Tenant industry mobile uses explicit Tenant + Industry Context.

## 2. Mobile bootstrap
1 app integrity/version check;
2 load secure identity/session reference;
3 IdentityPort verification;
4 fetch memberships/workspace candidates;
5 explicit tenant/context selection where ambiguous;
6 fetch ClientWorkspaceContext + navigation manifest;
7 open context-partitioned local store namespace;
8 register/refresh device and push token;
9 sync allowed datasets;
10 enter shell.

Revoked session/device/membership halts bootstrap and clears protected active material according to local-data class.

## 3. Secure storage
OS keychain/secure enclave-backed storage through Expo-supported secure storage for refresh/session references and device keys. Never store raw API credentials, provider secrets, webhook secrets or unencrypted sensitive business payloads in general preferences.

## 4. Local data classes
| Class | Examples | Encryption | Expiry | Logout | Tenant/context switch |
|---|---|---|---|---|---|
| EPHEMERAL_CACHE | read-only lists/search/nav | encrypted app DB where private | short policy TTL | clear private | clear or namespace-switch |
| OFFLINE_OPERATIONAL | explicitly offline-capable records | encrypted local DB | module policy | preserve only if policy permits same user; otherwise clear | hard namespace isolation; never merge |
| PENDING_MUTATION | queued commands | encrypted local DB | until success/final reject/policy TTL | pause + require same principal reauth | remains bound to origin context; never rebind |
| DOCUMENT_METADATA | download refs/status | encrypted | document/session policy | clear sensitive cache | context namespace |
| LOCAL_PREFERENCES | theme/non-sensitive UI | platform storage | durable | may persist | no private business data |

No sibling Industry private rows can remain visible after context switch. Namespace key concept: `tenantId:industryContextId:principalId:datasetClass`. TENANT_CORE uses explicit core marker, never null-as-all.

## 5. Queued mutation exact contract
`QueuedOperation{operationId uuid, operationContractId, operationSchemaVersion, scopeClass, tenantId, industryContextId?, principalId, membershipId, moduleId, managementSystemId?, resourceType, resourceId?, operationType, baseVersion?, payloadSchemaVersion, payloadEncrypted, createdAt, deviceId, retryCount, idempotencyKey, correlationId, sensitivityClass, state}`.

States: `QUEUED → REPLAYING → ACKNOWLEDGED`; failure branches `RETRYABLE_FAILED`, `CONFLICT_REVIEW`, `PERMANENTLY_REJECTED`, `EXPIRED`.

## 6. Replay pipeline
1 connectivity available;
2 refresh/verify identity/session;
3 re-resolve tenant membership;
4 re-resolve current active Industry Context against queued origin;
5 verify device registration;
6 fetch current subscription/license/entitlement versions;
7 re-run RBAC/ABAC/security/residency;
8 validate OperationContract/schema version;
9 validate server resource version/state;
10 execute with original idempotency key;
11 consume result/events/audit;
12 acknowledge/remove or retain reconciliation record.

A queued Healthcare operation under current Retail context is not rewritten; replay establishes the queued origin context only after verifying the principal still has that context. Otherwise deny/permanent reject.

## 7. Conflict classes
### SAFE_LOW_RISK
Examples: user-owned draft text/preferences where server contract permits merge. Allowed strategies: field merge, server-wins, client-resubmit after refresh; strategy is declared by future module DD.

### CONTROLLED
Shared mutable operational records. Requires server version comparison; conflict produces fresh server snapshot + reconciliation action. No automatic last-write-wins unless later module DD explicitly proves low risk.

### FINANCIAL_STOCK_REGULATED
Invoices/postings, payments, stock movements/reservations, regulated results/approvals and equivalent high-integrity records. Never naive last-write-wins. Requires version/reservation/state guard and may require approval/reconciliation workflow.

## 8. Optimistic UI
Allowed only when OperationContract declares `optimisticClass=SAFE`. UI must visibly reconcile rollback/reject. Financial/stock/regulated commands render pending/processing, not fabricated success.

## 9. DeviceRegistration mobile extension
Fields from DD-03 plus: `push_capability, app_version, os_version_class, integrity_signal?, last_context_id?, notification_permission_state, sync_capability_version`. Device disable/revoke invalidates push registration and queued replay authorization.

## 10. PushPort / DevicePushRegistration
`DevicePushRegistration{id, tenant_id, industry_context_id?, membership_id, principal_id, device_id, provider(EXPO|ONESIGNAL), provider_token_encrypted, token_fingerprint, status(ACTIVE,STALE,REVOKED), categories[], last_verified_at, created_at, updated_at}`.

Push message contract:
`notificationId, category, tenantId, industryContextId?, safeTitleKey, safeBodyKey/previewClass, deepLinkDescriptor, sensitivityClass, expiryAt`.

Sensitive medical/financial/identity content is not placed in lock-screen body. High sensitivity push says generic "New secure notification" and fetches content after app authorization.

## 11. Deep links
Deep link contains route intent + opaque resource reference, not authoritative tenant/context. App resolves current verified context; if target belongs to different permitted context, user confirms switch and server reauthorizes. Unauthorized target shows non-disclosing denied state.

## 12. Files/camera/QR
Camera, QR/barcode and file pickers expose capability only to screens declaring permission/capability. Captured files flow through DD-08 upload session/scan. QR payloads are untrusted input; they never set privileged context without server resolution.

## 13. Background tasks
Permitted: push registration refresh, bounded sync of explicitly eligible datasets, queued replay, expiry cleanup. Background task runs with stored origin scope and must fail closed if identity/entitlement cannot be refreshed.

## 14. Version policy
`MobileVersionPolicy{platform, minimumSupportedVersion, recommendedVersion, forceAfter?, schemaCompatibilityFloor, status}`. Numeric/version values are release policy, not invented here. Unsupported version blocks protected sync/write; read-only local posture only where policy allows.

## 15. Logout/revocation
Logout clears session tokens and sensitive ephemeral data, pauses queues. Queued operations are retained only encrypted and bound to the same principal/context if tenant policy permits; another user can never inherit them. Security revocation may mandate destructive purge of protected local data.

## 16. Acceptance
Context switch cannot expose sibling data; wrong-context queue never mutates another context; revoked device cannot sync; push reassignment cannot leak old tenant data; offline state never becomes permanent authorization.
