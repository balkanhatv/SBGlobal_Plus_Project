# DD-160 Development Verification — Current Machine-Principal Floor

**Date:** 2026-09-24  
**Branch:** `docs/architecture-branch-2`  
**Prior promoted checkpoint:** `DEV-MACHINE-PRINCIPAL-METADATA-READ-001`  
**Prior synchronized state basis:** `3bcb5dfeed05e1670ad9aaf72047db820eb7ae16` / tree `5f6c0e46eafc31004500a761cf114971cf3d2f8d`

## 1. Source-first audit

Audit commit: `1634081a15690ec9f99ed94c98c7b7da3e6fced6`.  
Artifact: `Development/API_CREDENTIAL_CURRENT_MACHINE_PRINCIPAL_PREREQUISITE_OWNERSHIP_AUDIT.md`.

DD-03 and migrations 0003/0030 own current machine-principal type/status semantics. The canonical machine-evidence contract accepts only API_CLIENT or SERVICE.

## 2. Bounded implementation

Implementation head: `4aaddec1c42f4004b256401df231319b9ee84850` / tree `4878d9043f4ade7083146ab3cc03b7b400ab8811`.

Files:
- `src/server/identity/machine-principal-currentness.ts`;
- `tests/server/machine-principal-currentness.test.mjs`.

The helper is pure/server-internal and does not interpret requested scope.

## 3. Exact implementation-head CI

- Core run `35953474966`, Core job `107486743530`: **SUCCESS**, **374/374 Core**, including `MACHPRINC-CUR-001…007`, 0 failed/skipped.
- Same run, PostgreSQL job `107486743412`: **SUCCESS**, **497/497 PostgreSQL**, 0 failed/skipped.
- Database run `35953474971`, job `107486743426`: **SUCCESS**.
- Web run `35953474992`, job `107486743452`: **SUCCESS**.

## 4. Canonical traceability

Canonical commit: `94d3767e45b71d9be36e06de0ea7741b4abb193b` / tree `37067fbb0f95e6cd86d87d265adeaaa6e5a9c0fd`.

Exactly one DD-160 decision, one DD-160 acceptance block and one DD-160 changelog entry were added.

## 5. Promotion invariant

- Core run `35953669851`, Core job `107487338208`: **SUCCESS**, **374/374 Core**.
- PostgreSQL job `107487338411`: **SUCCESS**, **497/497 PostgreSQL**.
- Database run `35953669860`, job `107487338128`: **SUCCESS**.
- Web run `35953669843`, job `107487338021`: **SUCCESS**.
- DD-18 recount: **160/160 unique DD-001…160, no gaps/duplicates**.
- Stable invariants: **9 Industries / 41 canonical MS / 181 Industry tables / 2,962 requirements**.
- Database inventory remains **47 migrations / 41 SQL verification files**.

This authorizes `DEV-CURRENT-MACHINE-PRINCIPAL-FLOOR-001` only.

## 6. Explicitly unclaimed

DD-160 does not compose credential lifecycle; decide requested credential/SERVICE scope; execute verifier hashes; enforce CIDR; interpret permission profiles; update usage; emit authentication audit; construct `VerifiedMachineEvidence`; or implement `IdentityPort.verifyMachineCredential`.

## 7. Safety

Forward-only; no force-push; `main` unmerged; RawSource untouched; PR #2 draft/review-only.
