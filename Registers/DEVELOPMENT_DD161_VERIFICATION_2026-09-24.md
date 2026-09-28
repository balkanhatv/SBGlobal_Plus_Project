# DD-161 Development Verification — API Credential Requested-Scope Floor

**Date:** 2026-09-24  
**Branch:** `docs/architecture-branch-2`  
**Prior promoted checkpoint:** `DEV-CURRENT-MACHINE-PRINCIPAL-FLOOR-001`  
**Prior synchronized state basis:** `7acfa70bfc9ba0488ea7b729a75a00c3aed0b0ee` / tree `e6281e06db44002d97e53728aaae9e2f64854d7b`

## 1. Source-first audit

Audit commit: `c53c94f6f044e957af0cbb4effe07168ad1243d0`.  
Artifact: `Development/API_CREDENTIAL_REQUESTED_SCOPE_PREREQUISITE_OWNERSHIP_AUDIT.md`.

DD-03 plus migrations 0030/0034 own requested machine-scope compatibility. DD-147 supplies raw credential scope material, DD-159 principal metadata and DD-160 current machine-principal admissibility.

## 2. Bounded implementation

Implementation head: `3c9fad6e0df4e0f2b1c048ee49fff5767ecbb6c7` / tree `f338bb14bef9e1919bd5aa455013a8d90a289c10`.

Files:
- `src/server/identity/api-credential-requested-scope.ts`;
- `tests/server/api-credential-requested-scope.test.mjs`.

The helper is server-internal and deterministic. No database, migration, RLS, role/grant, RequestContext, transport or product policy changed.

## 3. Exact implementation-head CI

- Core run `35954313756`, Core job `107489264781`: **SUCCESS**, **381/381 Core**, including `APICRED-SCOPE-001…007`, 0 failed/skipped.
- Same run, PostgreSQL job `107489264862`: **SUCCESS**, **497/497 PostgreSQL**, 0 failed/skipped.
- Database run `35954313773`, job `107489265179`: **SUCCESS**.
- Web run `35954313781`, job `107489264997`: **SUCCESS**.

## 4. Canonical traceability

Canonical commit: `dc1891c8dea75ce257729dd320cb6086716ecda1` / tree `85a6f0794c352a44f1ce282511ce803620c4896b`.

Exactly one DD-161 decision, one DD-161 acceptance block and one DD-161 changelog entry were added.

## 5. Promotion invariant

- Core run `35954596377`, Core job `107490107603`: **SUCCESS**, **381/381 Core**.
- PostgreSQL job `107490107434`: **SUCCESS**, **497/497 PostgreSQL**.
- Database run `35954596379`, job `107490107463`: **SUCCESS**.
- Web run `35954596384`, job `107490107321`: **SUCCESS**.
- DD-18 recount: **161/161 unique DD-001…161, no gaps/duplicates**.
- Stable invariants: **9 Industries / 41 canonical MS / 181 Industry tables / 2,962 requirements**.
- Database inventory remains **47 migrations / 41 SQL verification files**.

This authorizes `DEV-API-CREDENTIAL-REQUESTED-SCOPE-FLOOR-001` only.

## 6. Explicitly unclaimed

DD-161 does not evaluate DD-158 lifecycle or DD-160 current-principal floor on the caller's behalf; verify current status itself; parse presented credentials; compare verifier hashes; enforce CIDR; interpret permission profiles; mutate use evidence; emit authentication/use audit; construct final `VerifiedMachineEvidence`; or implement `IdentityPort.verifyMachineCredential`.

## 7. Safety

Forward-only; no force-push; `main` unmerged; RawSource untouched; PR #2 draft/review-only.
