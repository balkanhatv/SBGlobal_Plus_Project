# DATABASE CHECKPOINT — DEV-DB-CURRENT-STATE-AUDITED-001
**Date:** 2026-09-13  
**Branch:** `docs/architecture-branch-2`

**Scope:** Historical SQL persistence checkpoint. Current Development scope and continuation are owned by [DEV-CORE-PLATFORM-SCOPE-001](CORE_SERVICE_CHECKPOINT.md). The SQL inventory below remains applicable; its former application-not-started state is historical.

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
- Historical run `34736717516` / job `103669335983`: successful for migrations `0001`–`0028`; the old default PR checkout did not establish the exact tested branch commit and is insufficient for the defects found by the current audit.
- Corrected executable scope: migrations and verifications `0029`–`0033` plus the unchanged `0099` all-industry suite.
- First corrected substantive HEAD: `1c4033ca0af3501099a014f9a34d0bad3c21c7dd`.
- Corrected complete executable checkpoint: PostgreSQL+pgvector PASS: commit `2c36b43a7d55c6600b71f9714389e025a06df580`, Database Verify run `34800144921`, job `103841023234`. All 32 migrations and 26 verification files executed, including 0099. The workflow log asserts the tested branch commit; the completed all-stages audit and metadata closure are recorded in `Registers/ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md`.

## Historical gate and current continuation
**DATABASE PERSISTENCE CHECKPOINT: VERIFIED.** At this historical SQL checkpoint, Core application services/API/UI had not started.

Core services, the pooled PostgreSQL transaction adapter, compiled-Authorization read persistence/adapters and Current Supported Industry presentation catalog/read adapter have since been implemented and tested. Current database regression and next governed work are recorded in [CORE_SERVICE_CHECKPOINT](CORE_SERVICE_CHECKPOINT.md). API transports and UI remain unstarted.


## Current regression extension — 2026-09-17
Exact executable `3e7b2927839d289240eb389902563f5ab3d68074`: Database Verify 35139097903/job 104938820048 PASS with current inventory **34 migrations / 28 verification files**; Core Service Verify 35139097825 postgres-context job 104938820027 PASS with **11 PostgreSQL tests**. Migration/verification 0034 adds the DD-043 persisted PLATFORM_GLOBAL machine-credential floor; existing 9/41/181 Industry counts remain unchanged.
