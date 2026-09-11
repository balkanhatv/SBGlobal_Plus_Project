# SBGlobal Plus — A-10 INFRASTRUCTURE, DEPLOYMENT, SCALABILITY & RESILIENCE ARCHITECTURE
**Status:** REVALIDATED · **Traces to:** F-01 §8–§9, F-11, F-14, A-01/A-02/A-05/A-06 · **Decisions:** ADR-013, ADR-017, ADR-018 (A-12)

## 1. Deployment topology
SBGlobal Plus remains one logical modular Core deployed through workload-appropriate cells. **Vercel** is suitable for public web/front-door and compatible Next.js workloads. **Coolify + Dockerized VPS** is the self-hosted/regional application topology for residency-bound or operator-controlled workloads. Deployment choice never changes tenant/industry semantics or creates code forks.

A Regional Data Home is the locality boundary for tenant business data: PostgreSQL, object storage, residency-bound queues/workers and, where needed, regional Core replicas. Global/control-plane metadata is minimized per F-11/A-02.

## 2. Next.js vs NestJS workload placement
Next.js server capabilities are default. A dedicated **NestJS** service boundary is justified only when a workload needs materially independent scaling/failure isolation, long-running protocol handling, specialized worker/service lifecycle, or a security/network boundary that would be harmed by remaining in-process. Extraction uses the existing module/service contract; NestJS never becomes a parallel application core.

## 3. Edge, CDN, WAF and routing
Public/static/cacheable content uses CDN/edge delivery where compatible. WAF/rate-limit/bot controls protect public/API ingress. Authenticated tenant requests resolve identity → tenant → industry context → residency route before business-data access. Routing cannot send residency-bound business operations to an impermissible region.

## 4. Stateless scaling and capacity
Request-serving application replicas are stateless with session/identity state externalized through the Core identity boundary and canonical stores. Horizontal scale is preferred before vertical specialization. Capacity signals include latency, CPU/memory, DB-pool pressure, queue lag, webhook volume and AI workload saturation.

## 5. Workers, jobs, queues and outbox
Background work executes in isolated worker capacity: transactional-outbox dispatch, notifications/webhooks, imports/exports, document pipelines, AI ingestion, scheduled commercial evaluators and synchronization tasks. PostgreSQL outbox is the initial durable handoff (ADR-006). Workers are idempotent, retry-bounded and dead-letter capable; poison work cannot consume request-serving capacity indefinitely.

## 6. PostgreSQL, object storage and migration orchestration
Each Regional Data Home uses a PostgreSQL primary topology with replica/backup strategy appropriate to SLA and residency. Shared RLS databases are default; dedicated DB is a governed isolation option under ADR-002/ADR-018. Object storage is region/residency aligned. Release migrations use expand-contract ordering, preflight isolation checks and per-data-home orchestration; failed migrations stop the affected release cell rather than allowing silent partial rollout.

## 7. Secrets, configuration and environment separation
Development, Staging and Production are isolated with separate secrets, configuration and data. Secrets come from deployment secret stores, never repository files. Tenant integration secrets remain tenant-scoped/encrypted. Environment-specific endpoints/credentials do not alter canonical business configuration.

## 8. Release topology and health
Releases are immutable build artifacts promoted through environments/cells. Health includes liveness, readiness and dependency-aware checks. A cell leaves traffic when readiness fails. Progressive/canary or cell-by-cell rollout is preferred for higher-risk changes; exact percentages and commands remain Detailed Design/DevOps runbook concerns.

## 9. Failover and resilience
Failure domains include application replica, worker group, database, object storage, provider integration and Regional Data Home. Resilience uses graceful degradation, provider-adapter fallback, worker retry/DLQ and region-local recovery. **Cross-region failover is not automatic authority to move tenant data**; it is allowed only when tenant policy, contract or legal basis permits the residency event.

## 10. Backup, recovery, RPO/RTO
PITR/WAL, scheduled base backups and object-storage versioning form the baseline. Recovery objectives are service/commercial policy inputs implemented per cell. Backups remain in-region by default; cross-region copies require explicit residency allowance. Recoverability is proven by restore exercises, not backup-job success alone.

## 11. Portability and regional expansion
Containerized self-hosted workloads, standard PostgreSQL, object-storage abstraction and provider adapters reduce lock-in. New regions add deployment/configuration cells and routing metadata; they do not fork code or industry suites.

## 12. Trade-offs
Vercel reduces web operational burden but is not appropriate for every residency/self-hosted workload. Coolify/VPS offers control at higher operating cost. PostgreSQL outbox avoids an early broker dependency but has scale ceilings; its dispatcher remains an extraction seam. Shared DB/RLS maximizes density; dedicated DB increases isolation at higher cost.

## 13. Detailed Design deferrals
Exact infrastructure-as-code, instance sizes, provider regions, firewall rules, Coolify/Vercel configuration, Dockerfiles, migration commands, backup schedules, numeric RPO/RTO values, failover scripts and runbook commands.
