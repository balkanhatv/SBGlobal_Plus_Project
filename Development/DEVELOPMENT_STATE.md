# DEVELOPMENT STATE — SBGlobal Plus
**Updated:** 2026-09-14 · **Branch:** `docs/architecture-branch-2` · **Checkpoint:** `DEV-CORE-POSTGRES-001`

Development is **IN PROGRESS — CORE SERVICES**. Core application services and the pooled PostgreSQL transaction adapter are implemented and tested; API transports and UI have not started.

The authoritative scope, corrections and CI evidence are in [CORE_SERVICE_CHECKPOINT](CORE_SERVICE_CHECKPOINT.md). Verified executable commit: `0ada4283959ea4abe39a0980574e2dfdcb62e508`. Core tests: **40/40 PASS**; real PostgreSQL adapter tests: **7/7 PASS**; database regression: **PASS**, all 32 migrations and 26 verification files. Existing SQL coverage remains 9 Industries / 41 canonical MS / 181 canonical Industry tables.

Next governed task: Specify the exact Authorization compiled-permission snapshot/version persistence contract and the Current Supported Industry presentation catalog contract, then implement their module-owned read adapters. Do not infer missing fields, broaden database grants, or join across module ownership.

[CORE_PERSISTENCE_ADAPTER_MAP](CORE_PERSISTENCE_ADAPTER_MAP.md) records the two unbound sources and trusted directory dependency. Full repositories, concrete IdP/PDP/commercial integration, tRPC/REST, rate limiter/idempotency runtime, UI/mobile/desktop and deployment remain unfinished.

RawSourceCorpus remains immutable. `main` remains unmerged; PR #2 is open draft/review only. UD-BACKUP-01 remains active.
