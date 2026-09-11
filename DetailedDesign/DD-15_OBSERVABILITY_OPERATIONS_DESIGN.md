# DD-15 — AUDIT & OBSERVABILITY FOUNDATIONS
**Wave:** 1 shared foundations · **Status:** DETAILED DESIGN COMPLETE FOR WAVE-1 FOUNDATION  
**Traces:** F-03 · F-04 §7 · A-11 · DD-02/03/07

## 1. AuditEvent
Append-only DB evidence:
`id uuid PK, tenant_id?, industry_context_id?, scope_class, occurred_at timestamptz, actor_principal_id?, actor_type, action_code, resource_type?, resource_id?, outcome enum(SUCCESS,DENIED,FAILED), reason_code?, permission_code?, access_decision_id?, source_module, correlation_id uuid, causation_id?, request_id?, data_home_id?, region_code?, sensitivity_class, evidence_json jsonb, schema_version int`.

Evidence JSON must be minimal and must not duplicate secrets/full sensitive payloads.

Indexes: tenant/context/time; principal/time; resource; action; correlation; denied/security partial index.

## 2. Audit classes
- SECURITY: authn/authz/credential/device/elevation.
- COMMERCIAL: plan/subscription/license/entitlement/usage override.
- CONFIGURATION: policy/config/role changes.
- BUSINESS_HIGH: approvals, financial corrections, regulated actions.
- DATA_GOVERNANCE: export/erasure/retention/residency.
- INTEGRATION: webhook/admin/API-key lifecycle.
- AI_SECURITY: AI/RAG retrieval authorization, tool authorization/execution, provider-policy decisions, prompt-injection/safety denial and sensitive-source access. DD-09 operations use this class now.

Each operation contract declares audit class or NONE with justification.

## 3. Operational structured log fields
Mandatory where applicable:
`timestamp, severity, service/module, environment, releaseVersion, region, dataHomeId, requestId, correlationId, traceId, spanId, tenantId?, industryContextId?, principalType?, operationId?, eventId?, jobId?, errorClass?, errorCode?, durationMs?, retryCount?`.

Sensitive values, raw tokens, secrets, full request bodies and prohibited PII never logged.

## 4. Trace propagation
HTTP/tRPC → domain service → DB/outbox → dispatcher → consumer/provider carries trace/correlation context. Async child work sets causationId/eventId and links trace where tooling supports it.

## 5. Metric catalog — Wave 1
- API request count/error/latency by operation class, not unbounded resource IDs.
- authn/authz deny counts by reason.
- context mismatch/security violation counts.
- DB pool/transaction error/lock/conflict counts.
- outbox pending/lag/retry/dead counts.
- webhook delivery success/failure/lag.
- document upload/scan/quarantine/download grant counts.
- entitlement compile latency/failure and snapshot staleness.
- audit write failure count (**critical**).
No metric labels with raw PII or high-cardinality tenant IDs unless telemetry backend/retention explicitly supports governed tenancy.

## 6. SLI definitions
- protected API availability;
- p95/p99 operation latency by service class;
- authorization decision availability;
- outbox delivery freshness;
- webhook delivery reliability;
- entitlement snapshot compile success/freshness;
- document scan/activation success;
- audit persistence success.

Numeric engineering SLO defaults are resolved by DD-025 [DD-AC] and remain versioned/configurable; customer contractual SLAs are separate approved commercial/legal artifacts.

## 7. Audit durability
A high-risk command that requires audit must not report success if mandatory audit append fails in the owning transaction. Operational log failure must not corrupt business transaction, but audit failure policy is explicit per audit class.

## 8. Security alerts
Trigger classes: repeated tenant/context mismatch, operator elevation misuse, API credential anomalies, session-version failures, RLS policy violation signals, webhook signature/replay abuse, audit pipeline failure.

## 9. Retention/access
Audit and operational telemetry have separate retention classes/access roles. Operator access to tenant-attributed audit evidence is purpose-bound and itself audited.

## 10. Acceptance
A business/security event can be reconstructed from audit references + correlation without relying on mutable operational logs; telemetry cannot become cross-context data leakage.


## 11. Wave-2 observability extension
### Capability dashboard families
- Application: request availability/latency/error by surface/operation class.
- Mobile/Desktop Sync: queue depth, replay success, conflict/reject, stale schema/version, context mismatch.
- Desktop Native: capability invocation/error by capability class, update/signature failures.
- AI: route/provider/model health, latency, usage/cost, grounding failure, guardrail/tool deny/approval.
- Integration: adapter health, auth/rate/error, sync lag/cursor age.
- Webhook: delivery success/lag/retry/DLQ.
- Infrastructure: readiness, replica/pool, worker/outbox lag, storage, migration state, backup/restore evidence.
- Security: identity/authz/context/RLS/elevation/secret/key/upload/AI signals.

### Alert severity classes
`SEV0_SECURITY_OR_DATA_INTEGRITY`: active broad isolation/secret/data-loss threat.  
`SEV1_CRITICAL_SERVICE`: widespread production unavailability or recovery risk.  
`SEV2_DEGRADED`: material subset degraded/backlog.  
`SEV3_WARNING`: trend/capacity/non-urgent operational issue.  
Threshold numbers remain SLO/operations policy inputs.

### Health state contract
`HEALTHY, DEGRADED, NOT_READY, UNAVAILABLE, POLICY_BLOCKED`.
Provider/integration/AI fallback may occur only if policy permits.

### Release telemetry
Every deployment event includes release version/commit, cell/dataHome, migration version, stage, actor/service, started/completed, result and rollback/roll-forward ref.


## 12. Platform retention defaults [DD-AC]
These are SBGlobal Plus defaults, not statutory minimum claims.

| Class | Default |
|---|---:|
| SECURITY_CRITICAL | 7 years |
| FINANCIAL_AUDIT | 10 years |
| ACCESS_DECISION | 2 years |
| ADMIN_CONFIGURATION | 7 years |
| DATA_GOVERNANCE | 10 years |
| AI_GOVERNANCE | 2 years |
| OPERATIONAL_STANDARD | 90 days hot; archive up to 365 days |

Precedence: legal hold → jurisdiction requirement → contract extension → industry policy → platform default. Destruction requires eligibility; pseudonymization may retain the minimum evidentiary skeleton; immutable evidence is corrected by append/supersession, never silent mutation.

## 13. Observability default and internal engineering SLOs [DD-AC]
OpenTelemetry-compatible instrumentation/semantic conventions are mandatory. Default stack profile: OpenTelemetry Collector + Prometheus-compatible metrics + Grafana dashboards + Loki-compatible logs + Tempo-compatible traces; managed equivalents are allowed if they preserve OTel schemas/residency/exportability.

| Class | Availability / 30d | Latency / freshness objective |
|---|---:|---|
| Public Website | 99.90% | p95 server response <1.5s excluding external assets |
| Authenticated Application | 99.90% | p95 protected API <1.0s |
| Transaction API | 99.95% | p95 <750ms excluding declared long jobs |
| Critical Transaction | 99.95% | p95 <1.0s; correctness dominates |
| Worker/Queue | 99.90% | oldest eligible job <5m normal |
| Webhook | 99.90% | first attempt p95 <60s |
| AI Gateway | 99.0% | route decision p95 <250ms; model separately observed |
| Document Pipeline | 99.90% | normal-file activation p95 <5m |
| Data Home | 99.95% | outbox/critical dependency health within class |

Error-budget fast burn (>10% monthly budget in 1h or >25% in 6h) pauses risky releases and escalates. These are engineering SLOs, not contractual SLAs.
