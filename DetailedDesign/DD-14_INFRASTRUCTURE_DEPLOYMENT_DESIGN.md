# DD-14 — INFRASTRUCTURE / DEPLOYMENT DETAILED DESIGN
**Wave:** 2 · **Status:** DETAILED DESIGN COMPLETE  
**Traces:** F-01 §8–§9 · F-11 · A-10 · A-11 · ADR-013/017/018 · DD-02/DD-05/DD-07/DD-15

## 1. Workload classes
| Class | Preferred placement | Residency/business-data posture |
|---|---|---|
| PUBLIC_WEB | Vercel suitable | public/CMS/cacheable content only |
| AUTH_WEB | Vercel or regional cell depending data route | protected calls route to allowed data home |
| API_SERVER | Next.js server by default; regional Coolify cell when residency/control requires | business data in assigned data home |
| DEDICATED_SERVICE | NestJS only if A-10/ADR-013 criteria met | same Core contracts/data-home rules |
| WORKER | regional Coolify/Docker worker pool | colocated with data home where data-bound |
| SCHEDULER | regional/control as task requires | no ambient tenant context |
| OUTBOX_DISPATCHER | data-home worker | processes only local home events |
| WEBHOOK_DISPATCHER | regional worker | respects endpoint/policy/residency |
| AI_RAG_WORKER | policy-allowed region | no forbidden cross-region provider route |
| DOCUMENT_WORKER | data-home region | scan/derivative within policy |
| POSTGRESQL | regional data home | canonical structured store |
| OBJECT_STORAGE | regional data home | residency aligned |
| OBSERVABILITY | regional or approved aggregate | no prohibited private-data transfer |
| CACHE | only if justified | cache key/context isolation mandatory |

## 2. Vercel application boundary
Suitable:
- Public SaaS Website;
- Payload-rendered public content front-end where supported;
- authenticated Next.js shell/server functions that do not violate region/runtime/residency constraints;
- edge/CDN redirects/cacheable metadata.

Not assumed suitable:
- long-running workers;
- outbox dispatcher;
- heavy document processing;
- residency-pinned long-lived background jobs;
- stateful DB processes;
- workloads needing unsupported native/network protocol.

Environment separation: Development/Staging/Production projects/config are separate. Secrets are environment scoped. Build artifact is promoted by release identity; production data/secrets never enter preview builds.

## 3. Vercel routing/security
Public domain/CDN → WAF/bot/rate policy → public app.  
Authenticated request → Identity verification → tenant/context resolution → Regional Data Home route → governed Core API.  
A serverless/edge location may not directly process prohibited residency-bound payloads merely because a route is geographically convenient.

## 4. Coolify + Dockerized regional cell
Logical service inventory:
- ingress/reverse proxy managed by platform;
- authenticated web/API service replicas;
- optional justified NestJS service(s);
- worker pool;
- outbox dispatcher;
- scheduler leader/elected scheduler;
- webhook delivery workers;
- document processing workers;
- AI/RAG workers where policy allows;
- connection pooler;
- PostgreSQL primary/replica services or managed external DB endpoint;
- object-storage endpoint/service where selected;
- monitoring/log/trace agents.

No Dockerfile/manifests are created in DD.

## 5. Network zones
- PUBLIC_INGRESS: TLS ingress only.
- APP_PRIVATE: application/services.
- DATA_PRIVATE: PostgreSQL/pool/object internal endpoints.
- WORKER_PRIVATE: worker-to-service/data/provider egress.
- OBSERVABILITY_PRIVATE.
- MANAGEMENT: restricted operator access.

Default deny between zones; explicit service-to-service allowlist. Database not internet-exposed. Management access is authenticated, least privilege, audited.

## 6. Service identity
Each deployable workload uses a distinct service principal/secret identity. No shared root credential across apps/workers. Service identity declares allowed scope classes, modules and secret references.

## 7. Regional Data Home
`DataHome{id, code, regionCode, jurisdictionCode, status, topologyClass, postgresEndpointRef, objectStorageRef, workerCellRef, aiPolicyRegionSet, backupPolicyRef, failoverPolicyRef, routingVersion}`.

Tenant directory points to one current data home plus governed migration/failover metadata.

A Data Home contains:
- PostgreSQL business data;
- object storage;
- tenant-scoped workers/outbox;
- private projection/search/vector stores;
- data-bound observability/audit storage;
- allowed regional secret references.

## 8. Request routing
1 resolve tenant from verified selector/membership/domain;
2 read dataHomeId/routingVersion;
3 verify request region/channel allowed;
4 route to cell/API;
5 re-resolve context inside trusted service;
6 reject stale routing version during migration/failover if required.

Client never chooses arbitrary data-home endpoint.

## 9. PostgreSQL runtime topology
Per data home:
- one writable primary role;
- zero/more replicas for approved read workloads;
- connection pooler;
- application role(s) with forced RLS;
- migration/admin role not used by runtime;
- backup/WAL role;
- monitoring role.

Read replica use is allowed only for operations tolerant of replica lag and never for authorization/commercial state that requires current truth unless explicitly consistency-guarded.

Dedicated DB tenants use same schema/contracts/policy catalog; routing selects dedicated database, not separate application code.

## 10. Connection pooling
Pool key includes data home/database topology class, not tenant as a security boundary. Every transaction establishes server-set DD-05 RLS variables transaction-locally and clears them with transaction completion. Session-level leaked context is prohibited.

## 11. Release pipeline
`BUILD → VALIDATE → STAGE → MIGRATION_PREFLIGHT → DEPLOY → READINESS_VALIDATE → TRAFFIC_ENABLE → POST_DEPLOY_VERIFY`.

BUILD: immutable artifact/version.  
VALIDATE: static/security/design compatibility/test evidence.  
STAGE: staging environment with non-production secrets/data.  
MIGRATION_PREFLIGHT: compatibility, RLS catalog, backup/restore readiness, data-home sequencing.  
DEPLOY: app/worker rollout before/after migration per expand-contract step.  
READINESS: health/dependency checks.  
TRAFFIC: progressive/cell-by-cell enablement.  
VERIFY: SLI, errors, queues, DB, webhooks, audit.

## 12. Migration orchestration
Per module migration stream; global release orders dependencies. Data-home coordinator acquires a migration lock. For dedicated DB tenants, coordinator applies same migration version with per-tenant progress ledger.

Preflight blocks if:
- required backup evidence absent for risky change;
- tenant-owned table missing RLS catalog entry;
- incompatible old/new app version;
- migration already failed/inconsistent;
- region policy unavailable.

DB downgrade is not assumed safe. Expand-contract favors roll-forward. Application rollback is allowed only while schema compatibility matrix says previous app version can run against current schema.

## 13. Health/readiness
Liveness = process alive.  
Readiness = can safely serve assigned responsibility: config loaded, required secret refs resolvable, DB/pool reachable, migration compatibility valid, critical dependency posture acceptable.  
Degraded dependencies produce explicit degraded state rather than false readiness where capability is unsafe.

Health states: HEALTHY, DEGRADED, NOT_READY, DRAINING, FAILED.

## 14. Backup classes
- PostgreSQL continuous WAL/PITR.
- scheduled base/snapshot backup.
- object storage versioning/snapshots.
- configuration/secret-reference metadata backup (not plaintext secrets).
- audit evidence backup according to retention/residency.

Encryption at rest/in transit. Backup location defaults in-region. Cross-region copy only by explicit approved policy.

## 15. Recovery
Recovery modes:
- single resource/document version recovery;
- tenant logical export/restore where supported;
- database PITR in same data home;
- dedicated DB restore;
- full regional-cell rebuild;
- governed cross-region failover only when legally/contractually authorized.

Recovery evidence records: exerciseId, scope, backupRef, targetHome, started/completed, integrity checks, application verification, data-loss window observed, policy compliance, approver/result.

## 16. RPO/RTO
Numeric RPO/RTO values are **REVIEW_REQUIRED — business/SLA decision** unless sourced by an approved contract/plan. DD defines fields:
`RecoveryObjectivePolicy{serviceClass, planOrContractRef, rpoValue?, rtoValue?, jurisdictionScope, version, approvedBy, effectiveAt}`.

## 17. Failover
Automatic failover is permitted only inside the same authorized data-home/region topology where policy allows. Cross-region is a residency event requiring pre-approved destination/policy. If no compliant destination exists, system prefers controlled unavailability/recovery over unauthorized data movement.

## 18. Secrets
Runtime receives secret references from approved secret store. No repository/environment file plaintext in design. Rotation supports versioned references. Access by workload service principal and purpose. Secret fetch is auditable at metadata level without logging secret.

## 19. Object storage topology
Provider remains configurable/REVIEW_REQUIRED until selected. Contract requires: private buckets/containers, data-home region, versioning where required, encryption, lifecycle/retention support, signed URL support, malware quarantine area, audit/metrics. DD-08 remains authorization authority.

## 20. Observability placement
Regional agents export only telemetry allowed by residency/security policy. Sensitive logs can remain region-local while aggregated low-sensitivity metrics may centralize. Vendor choice remains deferred.

## 21. Acceptance
No backend workload assumed Vercel-only; no internet DB; no runtime admin DB credentials; RLS context transaction-local; migration failure stops affected cell; cross-region failover never bypasses residency; backup success alone does not equal recoverability.


## 22. Object-storage profile [DD-AC]
Per Data Home use StoragePort with logical buckets/classes: `private-primary`, `quarantine`, `derivatives`, `backup`. Preferred managed profile AWS S3; preferred self-hosted/regional profile MinIO-compatible S3. Primary/private objects are not public. SHA-256 is canonical content checksum. Versioning is enabled for protected document/backup classes. Cross-region replication is disabled unless the tenant Data Home policy explicitly permits the destination. Provider-specific adapter conformance must prove encryption, versioning, lifecycle, signed URLs, quarantine and residency behavior.
