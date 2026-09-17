# DATABASE CHECKPOINT — DEV-DB-CURRENT-STATE-AUDITED-001
**Date:** 2026-09-18  
**Branch:** `docs/architecture-branch-2`

**Scope:** Historical SQL persistence checkpoint. Current Development scope and continuation are owned by [DEV-AUTHZ-READ-STORE-001](CORE_SERVICE_CHECKPOINT.md). Former application-not-started statements are historical.

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
- least-privilege app/worker/service DB roles;
- PLATFORM_GLOBAL identity/Authorization persistence and governed ABAC write boundary.

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
- First corrected substantive HEAD: `1c4033ca0af3501099a014f9a34d0bad3c21c7dd`.
- Corrected historical executable checkpoint: PostgreSQL+pgvector PASS at `2c36b43a7d55c6600b71f9714389e025a06df580`, Database Verify `34800144921`, job `103841023234`; all 32 migrations and 26 verification files executed, including 0099.
- `DEV-AUTHZ-PDP-001` exact executable `54e6fd0972699e31c4650e54faa9e41086f55755` extended the chain to 35 migrations / 29 verification files after correcting the legacy PLATFORM_GLOBAL registry vocabulary and deferred-FK verification defects.
- `DEV-AUTHZ-POLICY-GRAMMAR-001` at `1b0f90dc900e0ab49cde2f8305f11cfadadae31c` added application-side deterministic policy grammar only; no schema change.

## Current regression evidence — DEV-AUTHZ-READ-STORE-001
The current executable chain contains **36 migrations / 30 verification files** through `0036_platform_global_abac_write_boundary.sql`. Exact verified executable `4916b30359cea056a352245176dcb33f739fc0a0` (tree `16e1a322620de4a0591222356e6db3dd5f0428bf`) passed:
- Database Verify `35252274557` / job `105307253170`: migrations `0001`–`0036` + all 30 verification files including 0099;
- Core Service Verify postgres-context job `105307252908`: **15/15 real PostgreSQL tests**, including exact CURRENT tenant/platform Authorization reads and sibling-Industry / PLATFORM_GLOBAL separation.

The reader commit itself adds no migration or privilege expansion. Migration 0036 is the preceding governed PLATFORM_GLOBAL ABAC write-boundary hardening and is covered by the same exact-head bootstrap. SQL Industry scope remains **9/41/181**.

## Current gate / next database-facing work
**DATABASE PERSISTENCE CHECKPOINT: VERIFIED FOR CURRENT BOUNDED SCOPE.**

The Authorization read store is implemented and independently verified against the existing persistence. The next governed Development slice is the fail-closed PDP/ABAC evaluator; no new migration or privilege expansion is justified unless fresh evaluator evidence proves a missing physical contract. Compiler publication, Commercial integration, transports/UI and production readiness remain unclaimed.
