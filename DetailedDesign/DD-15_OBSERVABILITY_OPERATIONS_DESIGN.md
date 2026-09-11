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
- AI_SECURITY later extends with tool/RAG decisions.

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

Numeric SLOs remain REVIEW_REQUIRED/approved policy except existing upstream availability commitments; DD Wave 1 does not invent them.

## 7. Audit durability
A high-risk command that requires audit must not report success if mandatory audit append fails in the owning transaction. Operational log failure must not corrupt business transaction, but audit failure policy is explicit per audit class.

## 8. Security alerts
Trigger classes: repeated tenant/context mismatch, operator elevation misuse, API credential anomalies, session-version failures, RLS policy violation signals, webhook signature/replay abuse, audit pipeline failure.

## 9. Retention/access
Audit and operational telemetry have separate retention classes/access roles. Operator access to tenant-attributed audit evidence is purpose-bound and itself audited.

## 10. Acceptance
A business/security event can be reconstructed from audit references + correlation without relying on mutable operational logs; telemetry cannot become cross-context data leakage.
