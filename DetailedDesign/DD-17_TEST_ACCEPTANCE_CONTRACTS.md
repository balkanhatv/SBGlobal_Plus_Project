# DD-17 — WAVE-1 TEST & ACCEPTANCE CONTRACTS
**Wave:** 1–2 · **Status:** DETAILED DESIGN COMPLETE THROUGH WAVE 2  
**Traces:** MI §26B · F-03/F-14 · A-02/A-03/A-04/A-05/A-06/A-11 · DD-01…DD-08/DD-15

These are implementation acceptance contracts, not executable test code.

## 1. Context & isolation
| ID | Scenario | Expected |
|---|---|---|
| TCTX-001 | valid tenant + active industry + valid membership | RequestContext created |
| TCTX-002 | missing industry on TENANT_INDUSTRY operation | INDUSTRY_CONTEXT_REQUIRED |
| TCTX-003 | Healthcare context requests Retail resource | INDUSTRY_CONTEXT_MISMATCH / non-disclosing deny |
| TCTX-004 | tenant A credential requests tenant B resource | TENANT_INVALID/RESOURCE_NOT_FOUND without existence leak |
| TCTX-005 | resource ID belongs to sibling industry | no auto-switch; deny |
| TCTX-006 | disabled industry activation with stale client cache | deny after server re-resolution |
| TCTX-007 | worker job missing persisted required context | reject/dead-letter; no default tenant/context |
| TCTX-008 | explicit cross-context workflow without dedicated permission | deny |

## 2. Identity/session/device/API credential
| ID | Scenario | Expected |
|---|---|---|
| ID-001 | Clerk verified subject maps to PlatformPrincipal | success; provider subject not business PK |
| ID-002 | Auth.js fallback adapter produces same Core principal contract | same downstream behavior |
| ID-003 | revoked membership | next protected request denied |
| ID-004 | sessionVersion mismatch | SESSION_INVALID |
| ID-005 | revoked API credential | CREDENTIAL_REVOKED |
| ID-006 | API credential requests industry outside bound set | deny before resource resolution |
| ID-007 | risky device requires step-up | RESTRICT/STEP_UP_REQUIRED |
| ID-008 | provider outage | dependency error; no fallback that weakens identity policy |

## 3. Authorization
| ID | Scenario | Expected |
|---|---|---|
| AUTH-001 | RBAC allow + all policies pass | ALLOW |
| AUTH-002 | RBAC deny + ABAC condition true | DENY; ABAC cannot widen |
| AUTH-003 | RBAC allow + ABAC deny | DENY |
| AUTH-004 | valid permission but wrong resource org unit | RESOURCE_SCOPE_DENY |
| AUTH-005 | valid permission but workflow state invalid | WORKFLOW_STATE_DENY |
| AUTH-006 | commercial capability absent but upgradeable | UPGRADE_CTA |
| AUTH-007 | suspended restricted mode read permitted/write denied | RESTRICT/deny write |
| AUTH-008 | high-risk deny | audit record with reason/policy versions |

## 4. Commercial/entitlement
| ID | Scenario | Expected |
|---|---|---|
| COM-001 | attempt to store PAST_DUE | schema/enum rejection |
| COM-002 | Active renewal failure | transition ACTIVE→GRACE |
| COM-003 | successful renewal | state remains ACTIVE + Renewed event |
| COM-004 | plan allows feature but required industry license invalid | deny |
| COM-005 | override allow conflicts compliance deny | deny wins |
| COM-006 | snapshot fingerprint unchanged | no duplicate snapshot |
| COM-007 | license/override changes | new immutable snapshot/version |
| COM-008 | hard meter exceeded | deny/upgrade outcome per definition |
| COM-009 | downgrade with excess usage | remediation required; no deletion |
| COM-010 | expired subscription | preservation/export/billing posture only |

## 5. Database/RLS
| ID | Scenario | Expected |
|---|---|---|
| DB-001 | tenant row queried with another tenant context | zero rows/deny |
| DB-002 | industry row queried with same tenant wrong industry | zero rows/deny |
| DB-003 | app role table lacks registered RLS policy | release/design implementation gate fails |
| DB-004 | client attempts setting RLS vars | impossible through public contract |
| DB-005 | operator elevation expired | operator policy denies |
| DB-006 | service worker event context matches row | allowed if service permission |
| DB-007 | service worker missing context | deny |
| DB-008 | ownership update tenant_id/industry_context_id | rejected; transfer workflow required |
| DB-009 | financial/audit row in-place update | rejected by design contract |
| DB-010 | optimistic version mismatch | CONFLICT |

## 6. API/idempotency
| ID | Scenario | Expected |
|---|---|---|
| API-001 | same domain operation through tRPC/REST | same validation/access/events/errors |
| API-002 | same idempotency key/same fingerprint retry | same outcome; no duplicate side effect |
| API-003 | same key/different fingerprint | IDEMPOTENCY_CONFLICT |
| API-004 | wrong-context path IDs | deny; path not authority |
| API-005 | breaking REST schema in v1 | design/versioning review fails |
| API-006 | internal exception | safe error envelope, no secrets/stack |
| API-007 | stale expectedVersion | CONFLICT |
| API-008 | cursor tamper | reject cursor |

## 7. Events/webhooks
| ID | Scenario | Expected |
|---|---|---|
| EVT-001 | event-emitting write commits | business + outbox + audit atomic |
| EVT-002 | duplicate event delivery | one idempotent consumer effect |
| EVT-003 | TENANT_INDUSTRY event missing industryContextId | envelope validation fails |
| EVT-004 | consumer sees wrong industry | reject + security audit |
| EVT-005 | Healthcare-only webhook receives Retail event | filtered; no delivery |
| EVT-006 | invalid webhook signature/replay timestamp | reject |
| EVT-007 | retryable endpoint 5xx | scheduled retry |
| EVT-008 | exhausted delivery | DLQ |
| EVT-009 | manual replay without permission/reason | deny |
| EVT-010 | webhook payload includes unauthorized sensitive field | contract/security review fails |

## 8. Document/storage
| ID | Scenario | Expected |
|---|---|---|
| DOC-001 | clean authorized upload | ACTIVE after scan |
| DOC-002 | infected file | QUARANTINED/REJECTED; no signed URL |
| DOC-003 | correct storage key but wrong context | deny |
| DOC-004 | derivative requests broader ACL | reject/inherit stricter ACL |
| DOC-005 | signed download after document status deleted | deny |
| DOC-006 | high-sensitivity download | required audit/step-up policy |
| DOC-007 | erasure with legal hold | pseudonymized required skeleton only |
| DOC-008 | erasure without retention | governed hard erase + derived cleanup |

## 9. Audit/observability
| ID | Scenario | Expected |
|---|---|---|
| OBS-001 | mandatory audit append fails in high-risk transaction | operation cannot report success |
| OBS-002 | operational log pipeline unavailable | business behavior follows service policy; audit semantics unaffected |
| OBS-003 | raw token/secret in log candidate | redacted/rejected |
| OBS-004 | trace crosses async event | correlation/causation linkage preserved |
| OBS-005 | context mismatch spike | security signal/alert class |
| OBS-006 | metric attempts raw PII label | telemetry schema review fails |

## 10. Wave-1 gate criteria
All contracts above must be implementable without inventing tenant/industry isolation, identity mapping, commercial state, access order, RLS predicate class, API envelope, event envelope, webhook scope, document authorization, or audit correlation. Numeric values explicitly deferred by DD-REVIEW_REQUIRED are not Wave-1 failures.


## 11. Wave-2 Application surface contracts
| ID | Scenario | Expected |
|---|---|---|
| APP-001 | Platform user opens Tenant Management route without tenant membership | deny/redirect; no platform-role shortcut |
| APP-002 | Tenant Admin opens industry operational route lacking permission | server deny regardless of hidden nav |
| APP-003 | same tenant switches Healthcare→Retail | prior private screen/cache state removed before Retail data render |
| APP-004 | disabled module remains in stale navigation cache | server operation denies; navigation invalidates on version change |
| APP-005 | entitlement removed during active session | next protected operation RESTRICT/DENY/UPGRADE_CTA as policy |
| APP-006 | public form sends private tenant selector | ignored/rejected; public flow cannot acquire tenant authority |
| APP-007 | Tenant Management tries operational POS/LIS/exam command | design/route ownership review fails |
| APP-008 | accessibility keyboard-only navigation | all core shell actions reachable/focus visible |

## 12. Wave-2 Mobile / offline
| ID | Scenario | Expected |
|---|---|---|
| MOB-001 | session revoked while app backgrounded | protected resume/sync denied; secure state refreshed/cleared |
| MOB-002 | tenant/context switch with cached private rows | old namespace inaccessible; no stale render |
| MOB-003 | Healthcare queued mutation replayed after user selects Retail | queue retains Healthcare origin; only replays after Healthcare authorization, never rebinds |
| MOB-004 | device registration revoked | sync/push protected actions denied |
| MOB-005 | push token reassigned to another membership/device | old registration revoked/stale; no prior tenant payload |
| MOB-006 | sensitive notification on lock screen | generic safe preview; content fetched after auth |
| MOB-007 | expired app version attempts protected write | blocked per version policy |
| MOB-008 | offline financial/stock conflict | no naive last-write-wins; reconciliation/version/reservation path |

## 13. Wave-2 Desktop / native
| ID | Scenario | Expected |
|---|---|---|
| DESK-001 | web content calls undeclared IPC capability | denied |
| DESK-002 | unauthorized filesystem/process access | no generic capability exists |
| DESK-003 | offline mutation replay wrong context | same DD-11 denial/reconciliation |
| DESK-004 | application update signature invalid | update rejected |
| DESK-005 | disabled peripheral capability invoked | deny with normalized safe error |
| DESK-006 | local DB copied/opened outside app | encrypted; no usable private data without key |
| DESK-007 | context switch | in-memory/private namespace swapped before new render |
| DESK-008 | crash during queued mutation | queue integrity/reconciliation preserves state; no silent success |

## 14. Wave-2 AI / RAG / Agent
| ID | Scenario | Expected |
|---|---|---|
| AI-001 | Tenant A query tries Tenant B source ID | no retrieval/existence leak |
| AI-002 | Healthcare query retrieves Retail chunks same tenant | industry filter denies |
| AI-003 | source document access revoked after indexing | retrieval ACL check filters it |
| AI-004 | preferred provider violates residency | filtered before selection; compliant fallback or controlled failure |
| AI-005 | model proposes tool user lacks | DD-03 deny; no tool execution |
| AI-006 | hallucinated resource ID | treated untrusted; RLS/access deny |
| AI-007 | retrieved text says "ignore permissions" | treated as untrusted content; system/tool policy unchanged |
| AI-008 | high-risk tool requires approval but agent calls directly | WAITING_APPROVAL/deny |
| AI-009 | approver lacks target context/permission | approval denied |
| AI-010 | tenant prompt tries provider/secret/tool bypass | override rejected by prompt governance |
| AI-011 | conversation switches sibling industry | old private history not implicitly injected |
| AI-012 | quota exhausted | entitlement/meter outcome, no hidden overrun |

## 15. Wave-2 Integration
| ID | Scenario | Expected |
|---|---|---|
| INT-001 | credential secret requested by UI | only masked metadata; plaintext unavailable |
| INT-002 | adapter writes domain table directly | design/implementation gate fails |
| INT-003 | provider callback signature invalid | reject before command translation |
| INT-004 | provider rate limit | normalized RATE_LIMITED state/retry policy |
| INT-005 | health fallback targets prohibited region/provider | POLICY_BLOCKED, no fallback |
| INT-006 | sync cursor from wrong Industry Context | deny/reset only through governed context |
| INT-007 | secret rotation | current/retiring versions handled without plaintext persistence |
| INT-008 | provider raw error contains secret/PII | normalized/redacted before logs/audit |

## 16. Wave-2 Infrastructure / recovery
| ID | Scenario | Expected |
|---|---|---|
| INF-001 | deployment readiness fails | no traffic enablement |
| INF-002 | outbox/worker group fails | request-serving capacity isolated; retry/DLQ and alert |
| INF-003 | pooled DB connection retains prior RLS context | prohibited; transaction-local context test fails release if leakage |
| INF-004 | migration preflight finds missing RLS entry | release blocked |
| INF-005 | DB failover inside allowed data home | controlled failover + verification |
| INF-006 | cross-region failover lacks residency permission | blocked; controlled unavailability/recovery |
| INF-007 | backup job succeeded but restore exercise fails | recoverability status fails |
| INF-008 | tenant routed to stale data-home version during migration | stale route rejected/re-resolved |
| INF-009 | runtime service uses admin DB role | security/release gate fails |
| INF-010 | Vercel runtime would process prohibited residency payload | route/workload placement rejects |

## 17. Wave-2 Security
| ID | Scenario | Expected |
|---|---|---|
| SEC-001 | CSRF attempt on cookie-auth mutation | origin/token/SameSite protection rejects |
| SEC-002 | CMS rich-text XSS payload | sanitized/escaped; CSP prevents unsafe execution |
| SEC-003 | webhook endpoint resolves to metadata/private IP | SSRF control rejects |
| SEC-004 | upload MIME extension spoof | content/type verification + scan controls |
| SEC-005 | secret appears in structured log candidate | redacted/rejected |
| SEC-006 | expired operator elevation | deny |
| SEC-007 | high-risk export without permission/residency | deny/audit |
| SEC-008 | retention destroy requested under legal hold | deny destruction |
| SEC-009 | AI provider/tool bypass instruction | policy remains authoritative |
| SEC-010 | unsigned desktop build/update | reject |

## 18. Wave-2 gate criteria
Wave 2 passes only if DD-09/DD-10/DD-11/DD-12/DD-14/DD-16 and the Wave-2 extensions to DD-06/DD-15 are traceable, have no open P0/P1, and a developer would not need to invent shared surface/mobile/desktop/AI/integration/infrastructure/security rules before Wave 3.
