# DD-12 — DESKTOP DETAILED DESIGN
**Wave:** 2 · **Status:** DETAILED DESIGN COMPLETE  
**Traces:** F-10 · A-08 §7 · ADR-015 · DD-02/DD-03/DD-06/DD-08/DD-11

## 1. Product model
Tauri 2.0 shell for Windows, macOS and Linux. It hosts the shared authenticated web experience and exposes a narrow Rust/native capability boundary. No Windows-only product assumptions.

## 2. Desktop layers
1 Web UI shell — same navigation/access semantics as DD-10.
2 IPC client — typed capability requests only.
3 Tauri command/capability boundary — explicit allowlist.
4 OS adapter layer — keychain/files/printers/scanners/serial/update/network.
5 Encrypted local database — offline datasets/queues per DD-11.
6 Sync agent — same queued-operation/replay contract as DD-11.

## 3. Native capability catalog
| Capability | Scope | Permission/policy | Notes |
|---|---|---|---|
| secureStore.read/write | app-private | identity/device policy | credentials/keys only |
| file.select | user-mediated | screen capability | no arbitrary filesystem crawl |
| file.writeExport | user-approved destination | export permission | sensitive export warning/audit |
| printer.print | selected printer | business permission + device policy | document/receipt payload from authorized server/local source |
| barcode.read | device adapter | screen capability | untrusted input |
| serial.exchange | allowlisted adapter | integration/device policy | disabled by default |
| network.status | app | none sensitive | connectivity only |
| app.update | signed update channel | release policy | signature required |
| app.logs.export | support permission | redacted | explicit user/operator action |

No generic shell/native command or unrestricted filesystem/process execution.

## 4. IPC contract
`NativeCapabilityRequest{requestId, capabilityId, tenantId?, industryContextId?, principalId, deviceId, operation, parametersSchemaVersion, parameters, correlationId}`.
Native boundary validates capability allowlist + app origin + device registration + applicable local permission token issued by trusted shell bootstrap. High-risk capability may require server access decision or user confirmation.

Response: `NativeCapabilityResult{requestId,status, safeResult?, errorCode?, auditRef?}`.

## 5. Local encrypted database
Logical stores:
- context-scoped read cache;
- context-scoped offline operational records;
- mutation queue;
- document metadata/download cache;
- device/integration metadata;
- non-sensitive preferences.

Encryption key is stored through OS credential/keychain facility, not beside DB. Key rotation/logout/security purge design must support re-encryption or destructive cache reset.

## 6. Context isolation
Local primary namespace includes tenantId + explicit industry/core scope + principal. Changing tenant/industry closes active views, clears in-memory state, swaps namespace and rehydrates only after server revalidation. Files downloaded for context A are inaccessible in context B through application catalog.

## 7. Peripheral adapters
Each adapter defines: adapterId, capability, supported OS, transport, permission, initialization, health, timeout, normalized errors, audit class, sensitive-data behavior.
Wave 2 defines framework only; industry/device-specific protocols belong Wave 3/integration detail.

## 8. Printer contract
Print command requires document/receipt render payload generated from authorized source, printer capability, copies/options, context, correlation. Printing sensitive records is audited where policy requires. No native adapter can query business DB directly.

## 9. Update model
Signed application packages; channels `STABLE`, optional `PILOT`, `INTERNAL`. Update manifest includes version, platform/arch, minimum supported version, digest/signature, rollout eligibility, release notes ref. Failed signature → reject. No silent unsigned fallback.

## 10. Crash/recovery
Crash reports exclude secrets/private payloads. On restart: verify app integrity/version, identity/session, DB schema compatibility, queued-operation integrity, then resume. Corrupt local cache can be safely discarded because server is authority; pending mutations require recovery/reconciliation, not silent loss.

## 11. Logging
Uses DD-15 schema plus desktop fields: appVersion, OS class, deviceId pseudonym, nativeCapabilityId, IPC requestId. No raw document/business payloads.

## 12. Offline sync
Exactly DD-11 replay contract. Tauri native layer does not grant offline permission; server remains final authority.

## 13. Cross-platform differences
OS-specific keychain/signing/notarization/package formats are implementation/provider details. Capability semantics remain identical; unsupported device integrations are explicitly unavailable, not replaced by insecure workarounds.

## 14. Acceptance
Web content cannot invoke undeclared native capabilities; unsigned update rejected; local DB remains context isolated; peripherals cannot bypass OperationContract/access decision; crash recovery preserves queued-operation integrity.
