# SBGlobal Plus — A-11 OBSERVABILITY, RELIABILITY & OPERATIONS ARCHITECTURE
**Status:** REVALIDATED · **Traces to:** F-01 §9, F-03, F-04 §7, F-11, A-01/A-05/A-07/A-10 · **Decision:** ADR-017 (A-12)

## 1. Observability model
Every request/job/event carries correlation context: request/trace ID, tenant ID where applicable, industry-context ID where applicable, user/service identity, module and region/data-home attribution. Sensitive values are masked according to A-05 classes. Operational telemetry must never become a cross-tenant or cross-industry data side channel.

## 2. Logs, metrics and traces
**Logs** explain events/failures; **metrics** measure rates, saturation, latency and availability; **traces** join request and asynchronous execution across API → Core → database/outbox → worker/provider. Logging is structured and context-attributed.

## 3. Audit vs operational logs
Audit records are business/security evidence: authorization, configuration, commercial transitions, operator elevation, financial corrections, data/AI actions. Operational logs are diagnostic telemetry. They have separate retention/access policies; operational rotation cannot erase mandatory audit history, while audit retention obeys legal/residency constraints.

## 4. SLI/SLO/error budgets
SLIs include availability, request latency/error rate, job success/lag, webhook delivery, database/storage health, AI gateway success/latency and recovery verification. SLO targets are set by service/plan/contract and region. Error-budget burn can pause risky rollout and prioritize reliability work.

## 5. Alerting and incident architecture
Alerts are actionable and ownership/severity-routed. Incident flow: detect → classify → assign → contain/degrade → communicate → recover → verify → post-incident review → action tracking. Tenant-impacting incidents carry tenant/region scope; security incidents follow F-03 policy.

## 6. Health monitoring
Monitor application replicas, edge/CDN/WAF, workers/queues/outbox lag, PostgreSQL primary/replicas/pool, object storage, providers, API/webhooks, AI providers, deployment state and certificate/domain health. Dependency failures remain distinguishable from business-validation failures.

## 7. Queue/job and integration operations
Worker monitoring exposes lag, retries, DLQ, oldest-job age and adapter failure rates. Webhook delivery status/retry evidence is tenant-visible only to principals holding the tenant webhook/integration view permission for that subscription and context; payload-sensitive fields remain masked by DD-07/DD-16 policy. Provider-health fallback cannot bypass tenant security/residency policy.

## 8. AI observability
AI telemetry captures provider/model class, capability, latency, usage/cost class, policy/guardrail outcomes and evaluation signals without logging prohibited sensitive prompt content. Tenant + Industry Context attribution is mandatory. Cross-tenant/cross-industry leakage tests and anomalous retrieval patterns are security signals.

## 9. Security monitoring
Monitor authentication anomalies, authorization denials, privilege elevation, API-key misuse, tenant-isolation violations, WAF/rate-limit events, key/secret lifecycle and data-export/erasure operations. Security telemetry feeds incident response with region/tenant attribution and controlled operator access.

## 10. Backup verification and recovery exercises
A successful backup schedule is not proof of recoverability. Operations runs verification restores and periodic recovery exercises appropriate to RPO/RTO commitments, validating database + object consistency, residency compliance, routing recovery and application readiness. Cross-region exercises occur only where legally/contractually permitted.

## 11. Deployment/release observability
Every release is correlated to build/commit/version, region/cell, migration set and rollout stage. Pre/post-release SLI, queue and DB signals are compared. Application rollback may be automated where safe; database rollback/roll-forward follows migration policy.

## 12. Operational access and runbook ownership
Operational access is least-privilege, purpose-bound and audited. Each service/module has an owner and runbook owner. Runbooks define response intent and escalation; exact commands/vendor configuration remain Detailed Design/Operations artifacts.

## 13. Cost and capacity
Track compute, database/storage, egress, communications and AI/provider costs by platform/region and tenant where allocation is meaningful. Capacity forecasting combines utilization, growth, queue lag and contractual headroom. Cost optimization cannot weaken isolation, residency or security.

## 14. Detailed Design deferrals
Telemetry vendor/configuration, exact log schemas/indexes, dashboards, alert thresholds, paging rotations, retention day counts, runbook commands, numeric SLO targets, synthetic checks and exercise calendars.
