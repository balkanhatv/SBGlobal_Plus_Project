# DD-16 — SECURITY / COMPLIANCE DETAILED DESIGN
**Wave:** 2 · **Status:** DETAILED DESIGN COMPLETE  
**Traces:** F-03/F-11 · A-03/A-05/A-06/A-07/A-10/A-11 · ADR-002/003/004/009/010/017 · DD-02/DD-03/DD-05/DD-07/DD-08/DD-09/DD-11/DD-12/DD-14/DD-15

## 1. Security control model
Controls are grouped: Identity, Authorization, Isolation, Application/API, Data/Document, Secrets/Crypto, Device/Client, Integration/Webhook, AI, Operator, Audit/Monitoring, Retention/Erasure/Residency.

Regulatory certification is not claimed. This document defines security/compliance readiness controls and evidence.

## 2. Authentication/session
- IdentityPort only; Clerk preferred/Auth.js fallback.
- tokens verified issuer/audience/signature/expiry/session version.
- MFA/SSO policy configurable per tenant/role/risk.
- step-up required by permission/sensitivity policy.
- session revocation increments version and invalidates cached workspace.
- concurrent-session/device policy is server authoritative.

## 3. MFA/SSO boundary
Core stores policy/status/provider references, not provider password secrets. SSO tenant/domain binding is verified before enabling. Break-glass recovery uses separate governed operator workflow, never hidden bypass.

## 4. API credentials/service principals
Generated secret shown once, stored hashed or in secret store as appropriate; prefix for lookup; fixed tenant/scope; optional industry allowlist/CIDR; rotation/revocation; expiry policy; rate class; audit. Service principals are module/workload identities, not omnipotent machine users.

## 5. Tenant/Industry isolation
Application guard + repository filters + forced RLS. TENANT_INDUSTRY requires both tenant and industry. Null industry never wildcard. Context mismatch produces security signal. Explicit cross-context flows require DD-02 contract.

## 6. RLS verification
Every tenant-owned table registered with scope class and policy class. Migration preflight compares physical table catalog against RLS registry; missing/disabled policy blocks release. Runtime application roles cannot bypass RLS.

## 7. Encryption
TLS for network transport. DB/storage encryption at rest through infrastructure provider/key management. Field-level/application encryption required for secrets and selected sensitive fields defined by data classification. Keys referenced/versioned; plaintext key material never stored in business DB.

## 8. Key rotation
`KeyReference{id,keyPurpose,providerRef,keyVersion,status,activatedAt,retireAfter?,ownerScope,region}`.
Rotation supports active + retiring keys for decrypt/verify window. New encryption/signatures use current key. Rotation event audited. Crypto algorithm/provider choice must meet approved security standard at implementation review.

## 9. Secrets
Secrets never in source, logs, analytics, client bundles or general config tables. SecretReference access restricted by service principal, environment, region and purpose. Secret values are redacted from errors/audit.

## 10. CSRF
Cookie-authenticated browser mutations require framework-supported CSRF/origin protections: SameSite policy, origin/host validation, anti-CSRF token where required. Bearer machine APIs do not rely on cookie CSRF defense but remain auth/rate protected.

## 11. XSS/CSP
Output encoding by framework; no unsafe HTML unless sanitized governed CMS content. CSP baseline uses explicit script/style/connect/img/frame sources, nonces/hashes where needed; no broad `unsafe-eval` production default. CMS rich text sanitization and preview isolation required.

## 12. SSRF
Server-side URL fetch/webhook verification/integration callbacks use:
- scheme allowlist;
- DNS/IP resolution checks;
- block loopback/link-local/private/internal metadata networks unless an explicitly trusted connector design says otherwise;
- redirect revalidation;
- destination port policy;
- response size/time limits;
- egress proxy/policy where available.
Webhook endpoints failing SSRF policy cannot activate.

## 13. Injection/input validation
All DD-06 inputs schema-validated. Parameterized ORM/query APIs; no string-concatenated SQL. Template/path/command inputs normalized. Native desktop IPC uses typed schemas and capability allowlist. AI generated parameters remain untrusted and schema/access validated.

## 14. Upload/malware
DD-08 quarantine-first. Verify actual MIME/signature, size, filename normalization, decompression/archive limits, malware scan, derivative isolation. Infected/unknown unsafe files never active/downloadable.

## 15. Rate limiting/abuse
Symbolic configurable classes:
`PUBLIC_LOW, PUBLIC_STANDARD, AUTH_STANDARD, BULK, WEBHOOK, AI, ADMIN_SENSITIVE`.
Each policy can define burst/sustained/concurrency/cost dimensions by plan/security posture. Numeric limits remain REVIEW_REQUIRED unless approved. Abuse signals can tighten policy temporarily without changing business entitlement truth.

## 16. Webhook/integration security
HMAC timestamp/signature, replay window, secret rotation, endpoint verification, SSRF egress rules, minimal payload, tenant/industry filters. Provider inbound callbacks verify provider signature before OperationContract.

## 17. Operator elevation
Uses DD-05 elevation record: purpose, tenant/context target, bounded permission, approver where policy requires, start/expiry, ticket/ref, audit. No permanent production wildcard. High sensitivity tenant access may require tenant/compliance approval by policy.

## 18. Document/data export
Export is a governed OperationContract with permission, entitlement, scope, sensitivity, data volume/rate class, format, residency and audit. Large exports use async document pipeline; signed download expires. Export does not bypass row/field security.

## 19. Erasure/retention/legal hold
Retention policy resolves jurisdiction + data class + tenant/contract + industry requirement. Fields:
`RetentionPolicy{code,jurisdiction,resourceClass,minimumPeriod?,maximumPeriod?,legalHoldEligible,erasureMode,destructionEligibilityRule,approvedRef,version}`.
Universal duration is not invented. Legal hold overrides destruction; release of hold re-evaluates current policy.

## 20. Residency
Every tenant has data home. Documents/RAG/workers/backups obey data-home/policy. Provider AI/integration transfer classified before execution. Cross-region recovery/migration requires explicit allowance and audit.

## 21. Mobile security
Secure token storage, device registration, app-version policy, encrypted local namespaces, context-switch purge, screenshot/clipboard restrictions where later sensitivity policy requires, jailbreak/root/integrity signal may restrict high-risk operations but cannot be sole identity proof. Push payload minimizes sensitive data.

## 22. Desktop security
Signed application/update; Tauri allowlist; no generic OS shell; encrypted local DB; OS keychain; explicit file/printer/device capabilities; IPC origin/schema validation; logs redacted.

## 23. AI security
- prompt content untrusted;
- RAG tenant/context/ACL/residency filters;
- retrieved instructions do not override policy;
- model never receives secrets unless a narrowly approved tool/provider contract requires secure derived access (no plaintext secret prompt);
- tools bind OperationContract and acting principal;
- approval gates mandatory for configured high-risk side effects;
- model hallucinated IDs are untrusted;
- provider fallback policy-filtered.

## 24. Security headers/browser baseline
Authenticated/public web defines HSTS on production, CSP, frame-ancestors, referrer policy, content-type protections and permissions policy appropriate to features. Exact header syntax/value tuning belongs implementation/security validation but insecure omissions are not allowed.

## 25. Audit/security evidence
Security events: auth failures, session/device revoke, permission/ABAC deny, RLS/context mismatch, API credential use anomalies, elevation, secret/key rotation metadata, export/erasure, webhook signature/replay failure, malware, AI tool deny/approval, residency policy block.

## 26. Incident linkage
Security signal includes correlationId, tenant/context when applicable, actor/device/credential reference, control ID, severity class, safe evidence. Incident tooling must not centralize prohibited payloads.

## 27. Compliance readiness matrix
| Area | Evidence |
|---|---|
| Access control | DD-03 decisions/audits |
| Tenant/Industry isolation | DD-02/DD-05 tests |
| Data lifecycle | DD-08/DD-16 retention/erasure |
| Residency | DD-14 routing/backup + DD-16 |
| Change/release | DD-14 migration/release evidence |
| Auditability | DD-15 |
| AI governance | DD-09 |
| Vendor/integration | DD-06 extension |
No external certification claim follows merely from this matrix.

## 28. Acceptance
No alternate auth chain; no client trust for context; no wildcard RLS/elevation; secrets absent from logs/DB config; SSRF/internal metadata blocked; unsigned desktop update denied; sensitive push minimized; AI/tool cannot elevate; prohibited cross-region route fails closed.


## 29. Numeric security floor [DD-AC]
DD-06 §19 is the default policy. AUTH_SECURITY and ADMIN_SENSITIVE are security-floor classes; commercial plan scaling cannot relax them without versioned Security approval. Rate policies are observable/auditable and can be tightened by bounded abuse override.

## 30. Retention qualification [DD-AC]
DD-15 §12 defaults provide implementation values while preserving jurisdiction/legal/contract overrides. Production in a specific jurisdiction still requires external legal validation; that does not alter the generic DD contract.
