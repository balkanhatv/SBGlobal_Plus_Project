# DATABASE CHECKPOINT — DEV-DB-CURRENT-STATE-AUDITED-001
**Date:** 2026-09-17  
**Branch:** `docs/architecture-branch-2`

**Scope:** Historical SQL persistence checkpoint. Current Development scope and continuation are owned by [DEV-AUTHZ-POLICY-GRAMMAR-001](CORE_SERVICE_CHECKPOINT.md). The SQL inventory below remains applicable; former application-not-started statements are historical.

## Repository implementation result
### Shared Core
Implemented SQL migrations for:
- Tenant + Industry Context and org ownership;
- Config/Metadata/Rules/Forms/Country Packs/Branding/Export;
- Identity/Authz, devices, credentials and SessionVersion;
- Commercial subscriptions/licenses/entitlements;
- Documents/private storage/ACL;
- Audit/Event/Outbox/Webhook partitioned evidence;
- Integration Registry/idempotency;
- Workflow/Automation/Tasks;
- Notification templates/delivery;
- AI/RAG/Memory/Agents;
- RLS registry/migration ledger;
- least-privilege app/worker/service DB roles.

### Industry wave
- 9/9 Current Supported Industry schemas implemented.
- 41/41 canonical MS owners represented.
- 181 canonical Industry tables registered with TENANT_INDUSTRY scope.
- Cross-industry database verification: `database/verification/0099_all_industries.verify.sql`.

| Schema | MS | Tables |
|---|---:|---:|
| ind_hlt | 5 | 37 |
| ind_edu | 5 | 20 |
| ind_rtl | 5 | 20 |
| ind_hsp | 4 | 16 |
| ind_mfg | 5 | 20 |
| ind_psv | 5 | 20 |
| ind_gov | 4 | 16 |
| ind_ngo | 4 | 16 |
| ind_sfm | 4 | 16 |
| **Total** | **41** | **181** |

## Targeted implementation decisions
- DEV-DB-AC-001 — global evidence identity + monthly partitioned detail.
- DEV-DB-AC-002 — DB runtime role classes.
- DEV-DB-AC-003 — canonical core_ai schema.
- DEV-DB-AC-004 — dedicated AI Gateway DB role.
- DEV-DB-AC-005 — Workflow/Automation/Notification persistence.
- DEV-DB-AC-006 — Workflow/Notification worker roles.
- DEV-DB-AC-007 — Document/Integration service roles.
- DEV-DB-AC-008 — immutable ownership and exact same-scope dependency enforcement.
- DEV-DB-AC-009 — Document/Workflow/Notification/AI cross-layer integrity, PromptSet/ToolSet and generated-media provenance.
- DEV-DB-AC-010 — Identity/control-plane separation, RLS completion and least-privilege/default-grant correction.

## Historical validation truth
- Historical run `34736717516` / job `103669335983`: successful for migrations `0001`–`0028`; the old default PR checkout did not establish the exact tested branch commit and is insufficient for defects found by the later audit.
- Corrected historical executable scope: migrations/verifications `0029`–`0033` plus unchanged `0099` all-industry suite.
- First corrected substantive HEAD: `1c4033ca0af3501099a014f9a34d0bad3c21c7dd`.
- Corrected historical executable checkpoint: PostgreSQL+pgvector PASS at commit `2c36b43a7d55c6600b71f9714389e025a06df580`, Database Verify run `34800144921`, job `103841023234`. All 32 migrations and 26 verification files executed, including 0099.

## 2026-09-17 Authorization persistence correction
Exact executable `54e6fd0972699e31c4650e54faa9e41086f55755` extended the database chain to **35 migrations / 29 verification files** and passed Database Verify `35242938026` / job `105275719655` plus the real PostgreSQL regression. The first 0035 completion claim (`c4ceff50…`) failed because the legacy RLS registry CHECK did not admit the already-governed `PLATFORM_GLOBAL` scope; `07d7a760…` then exposed an unqualified schema-local deferred-FK verification defect. `54e6fd09…` corrected both without rewriting historical migrations or weakening Tenant/Industry RLS.

## Current regression evidence — DEV-AUTHZ-POLICY-GRAMMAR-001
The current grammar slice does **not** change database schema or migration inventory. Exact verified executable `1b0f90dc900e0ab49cde2f8305f11cfadadae31c` (tree `a48a2b8cd4d9447522ca2c5721d23a85175dbfa8`) passed:
- Database Verify `35247193986` / job `105290285053`: complete migrations `0001`–`0035` + all 29 verification files including 0099;
- Core Service Verify postgres-context job `105290285531`: **13/13 real PostgreSQL tests**.

The SQL Industry scope remains **9/41/181**. `DEV-AUTHZ-POLICY-GRAMMAR-001` adds only the deterministic application-side Permission Set v1 / ABAC Expression v1 grammar and tests; no database owner, RLS policy, migration, privilege or Industry schema is changed by that slice.

## Current gate / next database-facing work
**DATABASE PERSISTENCE CHECKPOINT: VERIFIED FOR CURRENT BOUNDED SCOPE.**

Next governed Development slice is the Authorization read store for exact tenant/platform CURRENT compiled snapshots and applicable ACTIVE ABAC policies. It may add read-side application adapter code against existing persistence, but no new migration or privilege expansion is justified unless fresh evidence proves a missing physical contract. PDP evaluation/compiler, Commercial integration, transports/UI and production readiness remain unclaimed.
