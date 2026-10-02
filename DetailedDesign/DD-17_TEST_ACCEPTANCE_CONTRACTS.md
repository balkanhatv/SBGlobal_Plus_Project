# DD-17 — AUTHORITATIVE TEST & ACCEPTANCE CONTRACT OWNER
**Wave:** 1–3 · **Status:** PHASE 3 REVALIDATED — authoritative acceptance index
**Traces:** MI §26B · F-03/F-14 · A-02/A-03/A-04/A-05/A-06/A-11 · DD-01…DD-08/DD-15

These are implementation acceptance contracts, not executable test code.

## Repository verification invariants — current Development overlay

The existing Core CI suite executes `tests/core/repository-invariants.test.mjs`.
REPO-001 preserves accepted RawSource hashes; REPO-002 preserves all 2,962 source
IDs and source-corrected text, compares every row to its immutable source parent,
and rejects repeated-heading contamination/extraction placeholders (VC27-01).
The 21 preserved provenance aliases are not additional product obligations.
REPO-003 checks nine/41 canonical MS owner and acceptance references;
REPO-004 requires contiguous unique ADR/DD definitions; REPO-005 compares actual
migration/verification inventories with current manifest counts; REPO-006 resolves
local Markdown file links. These checks implement MI §25/§26B/§33A and DD-26
without substituting counts or references for substantive runtime acceptance.

## 1. Context & isolation
| ID | Scenario | Expected |
|---|---|---|
| TCTX-001 | valid tenant + active industry + valid membership | RequestContext created |
| TCTX-002 | missing industry on TENANT_INDUSTRY operation | INDUSTRY_CONTEXT_REQUIRED |
| TCTX-003 | Healthcare context requests Retail resource | `INDUSTRY_CONTEXT_MISMATCH`; no resource existence detail/mutation/event |
| TCTX-004 | tenant A credential requests tenant B resource | `RESOURCE_NOT_FOUND`; no foreign existence detail/mutation/event |
| TCTX-005 | resource ID belongs to sibling Industry, or TENANT_CORE resource evidence carries any present Industry Context value including an empty string | no auto-switch; non-disclosing deny |
| TCTX-006 | disabled industry activation with stale client cache | deny after server re-resolution |
| TCTX-007 | worker job missing persisted required context, runtime scope is outside the generic worker's closed TENANT_CORE/TENANT_INDUSTRY contract, TENANT_CORE carries an Industry Context, or generic WorkerContext attempts EXPLICIT_CROSS_CONTEXT without the DD-02 governed source+target transfer contract | reject/dead-letter or RESOURCE_SCOPE_DENY; exact protected scope shape only, no default tenant/context and no generic cross-context widening |
| TCTX-008 | generic RequestContext resolution requests EXPLICIT_CROSS_CONTEXT without the dedicated source+target transfer contract and permission/policy | RESOURCE_SCOPE_DENY; no generic Tenant/Industry lookup or cross-context widening |
| TCTX-009 | Tenant-Core effective-role query carries any present Industry Context value, including empty string | TENANT_INVALID / no role-store use; PostgreSQL effective-role adapter also refuses the malformed exact-scope shape |
| TCTX-010 | GuardPipeline receives an operation-aligned but malformed generic RequestContext shape (private Tenant/Industry evidence on PUBLIC/PLATFORM_GLOBAL, hidden Industry on TENANT_CORE, or missing Industry on TENANT_INDUSTRY) | fail closed before Commercial/PDP/resource dependencies; no malformed scope normalization |

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
| ID-009 | ordinary HUMAN/API_CLIENT requests protected PLATFORM_GLOBAL scope | deny before tenant/resource lookup; no DB transaction |
| ID-010 | interactive PLATFORM_OPERATOR or unbound allowlisted SERVICE requests PLATFORM_GLOBAL | identity/scope floor passes; downstream platform PDP still required |
| ID-011 | Clerk token verifies but live provider session is revoked/inactive or session user != signed subject | SESSION_INVALID; no internal principal authority returned |
| ID-012 | live provider session was created before exact internal SessionVersion.changed_at | SESSION_INVALID on next protected request |
| ID-013 | selected device registration is missing/foreign/mismatched, has an unsupported runtime status, is PENDING/REVOKED, or is RISK_HOLD | exact device id + principal + Tenant binding is required; DEVICE_UNTRUSTED for missing/mismatched/untrusted/unsupported, STEP_UP_REQUIRED for exact RISK_HOLD |
| ID-014 | Clerk Backend API or internal identity/session-security store is unavailable | DEPENDENCY_UNAVAILABLE; no weaker provider/claim fallback |
| ID-015 | Clerk fva shows second-factor verification vs first-factor-only | MFA when second-factor age >=0; otherwise baseline PASSWORD; never infer SSO/PHISHING_RESISTANT from fva alone |
| ID-016 | Clerk custom claim attempts to supply SBGlobal role/permission/entitlement/sessionVersion truth | ignored as authority; current server-owned Core records govern |
| ID-017 | verified machine evidence omits the requested Tenant scope from allowedScopeClasses | CREDENTIAL_INVALID before Tenant/Industry/directory lookup; no generic cross-context widening |
| ID-018 | validated Core SessionVersion differs from provider evidence metadata | Tenant RequestContext carries validated Core sessionVersion, consistent with PLATFORM_GLOBAL |
| ID-019 | current SessionVersion record carries malformed or precision-unsafe version/changed-at evidence | DEPENDENCY_UNAVAILABLE; malformed Core security state cannot bypass stale-session invalidation or enter RequestContext |
| ID-020 | live provider session carries a non-integral or precision-unsafe creation timestamp | SESSION_INVALID; malformed provider time evidence cannot bypass exact SessionVersion.changed_at invalidation |
| ID-021 | provider/identity evidence carries sessionVersion while no validated current Core SessionVersion exists | RequestContext omits sessionVersion; provider metadata never fills or replaces current Core truth |

## 3. Authorization
| ID | Scenario | Expected |
|---|---|---|
| AUTH-001 | RBAC allow + all policies pass | ALLOW |
| AUTH-002 | RBAC deny + ABAC condition true | DENY; ABAC cannot widen |
| AUTH-003 | RBAC allow + ABAC deny | DENY |
| AUTH-004 | valid permission but wrong resource org unit | RESOURCE_SCOPE_DENY |
| AUTH-005 | valid permission but workflow state invalid | WORKFLOW_STATE_DENY |
| AUTH-006 | commercial capability absent but upgradeable | UPGRADE_CTA |
| AUTH-007 | suspended restricted mode: explicit dedicated restricted-operation read is permitted; generic reads/writes remain denied | RESTRICT; allow only the dedicated restricted contract, deny generic read/write |
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
| DB-011 | PLATFORM_GLOBAL SQL context carries HUMAN/API_CLIENT principal type | `DATABASE_CONTEXT_INVALID`; connection/transaction not opened |
| DB-012 | PLATFORM_GLOBAL SQL context carries PLATFORM_OPERATOR/SERVICE principal type | scope floor passes; no tenant/industry authority is implied |

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
| API-009 | runtime OperationContract carries unsupported scopeClass/kind/idempotencyPolicy, including a mutation-like kind outside COMMAND/QUERY | OPERATION_CONTRACT_INVALID before RequestContext/rate/guard/idempotency/domain use; unknown kind cannot bypass command idempotency |

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
All contracts above must be implementable without inventing tenant/industry isolation, identity mapping, commercial state, access order, RLS predicate class, API envelope, event envelope, webhook scope, document authorization, or audit correlation. Former shared numeric/provider P2 items are now resolved by DD-022…DD-027 [DD-AC]; historical Wave-1 deferral remains provenance only, not an active ambiguity.


## 11. Wave-2 Application surface contracts
| ID | Scenario | Expected |
|---|---|---|
| APP-001 | Platform user opens Tenant Management route without tenant membership | deny/redirect; no platform-role shortcut |
| APP-002 | Tenant Admin opens industry operational route lacking permission | server deny regardless of hidden nav |
| APP-003 | same tenant switches Healthcare→Retail | prior private screen/cache state removed before Retail data render |
| APP-004 | disabled module remains in stale navigation cache | server operation denies; navigation invalidates on version change |
| APP-005 | entitlement removed during active session | next protected operation RESTRICT/DENY/UPGRADE_CTA as policy |
| APP-006 | public form sends private tenant selector | ignored/rejected; public flow cannot acquire tenant authority |
| APP-007 | Tenant Management Application has valid tenant admin session but attempts an operational RTL-POS / HLT-LIS / EDU-EMS mutation whose OperationContract allows only INDUSTRY_EXPERIENCE | server returns `POLICY_DENIED` with `reasonCode=SURFACE_OPERATION_NOT_ALLOWED`; domain mutation=0; event=0; authorization audit records surfaceClass/operationId |
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
| INF-014 | dedicated-DB tenant resolves shared pool route or shared-DB tenant resolves another tenant dedicated route | `DB_ROUTE_CONTEXT_MISMATCH`; connection not acquired; no query; security audit |
| INF-015 | pooled connection begins transaction with residue from prior Tenant/Industry context | transaction setup resets/sets transaction-local context before query; leakage assertion must be zero or release blocked |
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


## 19. Shared-P2 closure tests [DD-AC]
| ID | Scenario | Expected |
|---|---|---|
| P2-RATE-001 | PUBLIC_LOW exceeds 30/min sustained | 429/RATE_LIMITED + Retry-After |
| P2-RATE-002 | plan override tries to relax AUTH_SECURITY floor | rejected absent Security-approved policy |
| P2-COM-001 | definitive renewal failure | ACTIVE→GRACE + retries +24/+72/+120h |
| P2-COM-002 | unresolved at 168h | GRACE→SUSPENDED |
| P2-COM-003 | successful recovery during allowed window | ACTIVE + entitlement recompile/audit |
| P2-RET-001 | delete under legal hold | destruction denied |
| P2-RET-002 | platform default overridden by stricter jurisdiction | stricter rule wins |
| P2-SLO-001 | fast error-budget burn | release pause + severity escalation |
| P2-STO-001 | object key known without DocumentMeta authorization | deny |
| P2-STO-002 | cross-region replication not authorized | blocked |
| P2-STO-003 | quarantined object requests signed URL | deny |


## 19. Recovery objective defaults [DD-AC]
| ID | Scenario | Expected |
|---|---|---|
| RCV-001 | Critical transaction backup/recovery policy | RPO ≤5m / RTO ≤30m target selected unless approved tighter override |
| RCV-002 | Standard transaction service | RPO ≤15m / RTO ≤60m |
| RCV-003 | Document pipeline | RPO ≤15m / RTO ≤4h |
| RCV-004 | Rebuildable search/vector projection lost | source truth preserved; rebuild target RTO ≤8h |
| RCV-005 | Enterprise contract requires tighter objective | versioned contract policy wins |
| RCV-006 | operator attempts weaker objective without approval | policy validation rejects/records exception workflow |
| RCV-007 | baseline BackupPolicy for a production Data Home is validated | continuous WAL/PITR is accompanied by scheduled daily, weekly and monthly base/snapshot recovery-point classes; retention/timing may be tightened by policy but none of the three source-required classes is silently omitted |


## 20. Cross-industry Wave-3 isolation tests
| ID | Scenario | Expected |
|---|---|---|
| W3-XI-001 | Same tenant Healthcare principal supplies Retail resource ID | deny/non-disclosing; no context auto-switch |
| W3-XI-002 | Same tenant Retail event consumed by Healthcare projector | reject by scope/context |
| W3-XI-003 | Education RAG query attempts Government source | filter/deny before retrieval |
| W3-XI-004 | Manufacturing offline queue replayed while Professional Services context selected | queue retains origin; reauthorize origin or reject |
| W3-XI-005 | NGO document signed URL requested from Security/Facility context | deny |
| W3-XI-006 | Hospitality role attempts Manufacturing permission | RBAC deny; code namespaces do not imply grant |
| W3-XI-007 | Industry A MS reads Industry B table directly | design/implementation review fails; service/event/projection required |
| W3-XI-008 | Core reporting combines sibling private rows without cross-context contract | deny; EXPLICIT_CROSS_CONTEXT required |
| W3-XI-009 | AI agent tool targets sibling context | current acting-principal/context check denies unless explicit cross-context tool exists |
| W3-XI-010 | Tenant operates all nine industries | each private entity/query/event/document remains separately context-keyed |

## 21. Wave-3 structural acceptance
For every one of the 41 MSs, implementation acceptance includes: happy path; validation failure; wrong permission; wrong tenant; same-tenant wrong Industry Context; disabled entitlement; invalid workflow transition; wrong-context offline replay where applicable; unauthorized AI retrieval/tool; unauthorized document; wrong-context event consumer; mandatory audit evidence for critical mutation.


## 22. Wave-3 authoritative acceptance ownership
DD-17 is the top-level acceptance owner for all Detailed Design waves. It incorporates by normative reference:
- `DD-21_MS_ACCEPTANCE_TEST_CONTRACTS.md` — 574 per-MS deterministic test IDs for all 41 Management Systems.
- `DD-22_MS_WORKFLOW_TRANSITION_MATRICES.md` — 41 authoritative per-MS major workflow matrices and 309 explicit allowed transition rows plus fail-closed forbidden/cancel/reversal rules. `DD-22H` remains non-authoritative generation history.
- `DD-24_INDUSTRY_DOMAIN_RULE_DECISIONS.md` — domain-critical DD-AC defaults and rule-specific tests.
- `DD-25_KPI_CALCULATION_CATALOG.md` — 169 KPI formula contracts with two acceptance IDs per KPI; DD-28 independently maps all 165 KPI/report metric names found in canonical industry DD with 0 unmapped.
- `DD-26_CANONICAL_SURFACES_MS_IDENTIFIERS.md` — surface/identifier validation tests.
- `Registers/DD_REQUIREMENT_TRACEABILITY_F5.md` — requirement-ID → acceptance-ID chains.

A Development/QA implementation is incomplete if any applicable referenced acceptance ID is absent from executable test coverage later. This DD phase defines the contracts only; it does not create executable tests.

## 23. Deterministic error rule
No acceptance row may use "design review fails", "developer decides", "manual review", or equivalent as runtime expected behavior. Denials resolve through DD-01/DD-03 taxonomy. Design-lint assertions use a named design validation error and are not substituted for runtime behavior.


## 24. Phase-3 recovered-requirement acceptance contracts

| ID | Scenario | Expected |
|---|---|---|
| CFG-001 | Tenant rule contains arbitrary JavaScript/SQL/shell expression | VALIDATION_FAILED; definition not publishable |
| CFG-002 | TENANT_INDUSTRY Form/Rule/Metadata definition omits industry_context_id | schema/ownership validation fails |
| CFG-003 | retired shared-definition version is invoked | RESOURCE_STATE_INVALID; no execution |
| CFG-004 | rollback requested to prior published definition | new activation record created; immutable history preserved |
| LOC-001 | Country Pack activation attempts permission or entitlement grant | validation/policy denial; pack remains reference/config only |
| LOC-002 | Tenant activates valid Country Pack | allowed locale/reference/default configuration only |
| DATA-ACCESS-001 | portability/export request targets sibling Industry Context | deny; zero foreign rows/documents |
| DATA-ACCESS-002 | access/export under legal hold/retention restriction | policy-constrained behavior; audit recorded |
| DATA-BOOT-001 | fresh platform installation or Tenant/Industry activation reaches success/READY | all required versioned baseline-package entries for the enabled scope are materialized before success: required seed/reference data, applicable master defaults, configuration/templates and required production content/assets; no manual creation of essential baseline records is needed |
| DATA-BOOT-002 | same baseline package/version is re-run after retry/recovery | idempotent success; no duplicate baseline rows and no tenant-customized value is overwritten |
| DATA-BOOT-003 | required baseline entry fails during installation/activation | activation remains non-ready/non-published; partial state is auditable/resumable; no success claim or experience mount that depends on the missing baseline |
| DATA-BOOT-004 | production activation has demo package available but demo mode is not enabled | no synthetic transactional demo records are inserted into production truth; normal empty operational state is allowed where no real transactions exist |
| DATA-BOOT-005 | governed demo mode/import is enabled for a Tenant/Industry | realistic synthetic demo rows are tenant/industry-scoped, `is_demo=true`, resettable/rebuildable, contain no real PII, and are excluded from production KPIs by default |
| PUBLIC-CLAIM-001 | public certification/accreditation/compliance badge, uptime/SLA value, named customer endorsement/logo/case-study outcome or measured quantitative claim lacks approved current evidence | claim is not publishable/rendered as verified truth; no fabricated proof or stale badge remains visible |
| PUBLIC-CLAIM-002 | AI-generated testimonial/customer profile/result is synthetic | it may appear only as explicitly illustrative/demo content that cannot be represented as a real customer endorsement or measured production result |
| PUBLIC-CLAIM-003 | previously valid public claim evidence expires or is revoked | subsequent publish/serve policy suppresses or marks the claim non-current; cached presentation cannot continue asserting current verified status |
| HLT-AI-001 | Healthcare AI summary/risk/health score or diet/lifestyle suggestion attempts to mutate verified laboratory value/reference range/flag or satisfy required pathologist/clinician approval | deny mutation/approval; AI output remains assistive evidence only and the owning Healthcare workflow remains authoritative |
| HLT-AI-002 | Healthcare AI output attempts to publish autonomous diagnosis, prescription or treatment decision, or release a report that still requires clinician/pathologist approval | no autonomous clinical release; required authorized review/approval remains mandatory and is audited |
| AI-013 | AI API class absent from AIProvisioningSnapshot | deny before provider call |
| AI-014 | Country Pack changes AI language/reference behavior | allowed only within already-entitled capability set; no permission widening |
| AI-015 | retired PromptTemplate version invoked | deny; current ACTIVE version required |
| AI-016 | generated media lacks DD-08 provenance/DocumentMeta registration | result not publishable as governed product asset |
| AI-017 | sibling-Industry AIMemoryRecord requested | excluded/deny by context + ACL |
| AI-018 | Current Supported Industry assistant catalog is validated | nine independent suite-owned assistant families exist for HLT/EDU/RTL/HSP/MFG/PSV/GOV/NGO/SFM; a combined GOV+NGO definition cannot satisfy both suite-owned entries |
| AI-019 | AI-generated approval/recommendation attempts to satisfy an approval checkpoint that requires an authorized principal | does not approve/execute; governed human/authorized-principal approval remains required and is revalidated in current context |
| APP-009 | Tenant mobile manifest declares DOCTOR_APP/STUDENT_APP/GUARD_APP or another role-specific appClass | validation failure; map to TENANT_STAFF_APP or TENANT_USER_APP |
| APP-010 | Tenant brand override weakens protected danger/warning/focus/security token | publish/activation denied |
| APP-011 | Future Industry licensed/enabled before promotion gate | deny; no Industry Context created |
| APP-012 | Future Industry reaches PROMOTED with all evidence + explicit approval | catalog activation allowed; promotion evidence audited |
| APP-013 | Platform Mobile treated as one of the two Tenant app classes | validation failure; separate Platform Application channel |
| BRAND-001 | Platform Brand resolves F-06 canonical defaults | exact active version used; no scattered hard-coded screen literals |
| BRAND-002 | user preference alters protected security semantic token | denied/ignored for protected token |
| TRACE-P3-001 | Phase-1 recovered requirement lacks Architecture + DD + acceptance owner | Phase-3 gate fails |
| TRACE-P3-002 | ADR-019 or ADR-020 lacks DD implementation contract | Phase-3 gate fails |

## 25. Phase-3 gate criteria
- every Phase-1 recovered requirement has current Architecture and DD ownership;
- ADR-019 and ADR-020 have deterministic schemas/lifecycles/tests;
- all nine Current Supported Industry artifacts remain compatible with the canonical two-app model;
- 41/41 MS acceptance ownership remains intact;
- historical DD-F5-RECERTIFIED evidence is not treated as proof of this phase;
- final isolation/determinism/adversarial evidence is rerun against the Phase-3 substantive HEAD.

## 26. Current-state database adversarial contracts

| ID | Scenario | Expected |
|---|---|---|
| DBA-001 | application mutates tenant/context/scope ownership after insert | database rejects; original ownership unchanged |
| DBA-002 | human role/API credential/device/session references a foreign tenant | database rejects before authorization use |
| DBA-003 | Platform Operator presents no/expired/foreign/self-approved elevation | tenant operation denies; active independent same-target elevation required |
| DBA-004 | active webhook lacks verification or contains foreign/duplicate context IDs | database rejects before delivery |
| DBA-005 | event row/catalog/envelope scope, identity, sensitivity or residency differs | outbox insert rejects; no dispatchable row |
| DBA-006 | Commercial/Integration/Workflow/Notification child points to foreign parent scope | composite FK/trigger rejects |
| DBA-007 | Industry entity points at sibling-context DocumentMeta or raw StorageObject | composite FK/array validator rejects |
| DBA-008 | ACTIVE document is unscanned, wrong Data Home/checksum/size, or derivative lowers security | database rejects |
| DBA-009 | AI provider/model, PromptSet/ToolSet, RAG, memory, media or agent chain crosses scope | database rejects before provider/tool execution |
| DBA-010 | ordinary app/worker writes platform catalog, sensitive identity material, immutable evidence or Industry DELETE | database privilege/RLS denial |
| DBA-011 | migration creates a future evidence partition | exact audit/outbox/webhook forced-RLS policy is installed; PUBLIC cannot execute provisioner |
| DBA-012 | migration and all verification files run on clean PostgreSQL+pgvector | exact-head CI is successful; run/job/step evidence recorded before any PASS claim |
| DBA-013 | CI checkout differs from submitted branch SHA, inventory is empty, or psql fails | job exits nonzero; no PASS; expected and actual Git SHA recorded; source traceability does not substitute for runtime proof |


### Authorization evaluator continuation acceptance — DD-045 / DEV-AUTHZ-EVAL-001

| ID | Scenario | Expected |
|---|---|---|
| AUTH-009 | RBAC allow + matching persisted ABAC `RESTRICT` while no governed restriction payload/reducer exists | fail closed as `DENY / ABAC_DENY`; never allow-like RESTRICT |
| AUTH-010 | base-stage applicable policy references `resource.*` before resource resolution | defer that policy to resource evaluation; do not treat missing resource attribute as false/allow |
| AUTH-011 | non-`exists` ABAC operator requires a server fact that is unavailable | dependency unavailable; no access decision that widens |
| AUTH-012 | tenant RequestContext permissionVersion/role set differs from exact CURRENT compiled snapshot, Authorization read scope carries a present Tenant/Industry field where exact absence is required, or AuthorizationContext adapter receives unsupported/malformed TENANT_CORE/TENANT_INDUSTRY scope shape | stale/unsupported authorization context; fail closed before scoped SQL/PDP use |
| AUTH-013 | PLATFORM_GLOBAL PDP decision | uses dedicated platform CURRENT snapshot; no tenant entitlementSnapshotVersion sentinel is invented |
| AUTH-014 | resource-stage evaluation after a successful base allow | re-reads current Authorization state and re-evaluates full applicable policy set so a newly active deny cannot be skipped |


### Authorization durable audit continuation — DD-047 / DEV-AUTHZ-AUDIT-001

| ID | Scenario | Expected |
|---|---|---|
| AUTH-015 | protected access passes Commercial/PDP/resource/rules | exactly one final SUCCESS audit is durably appended before success returns |
| AUTH-016 | direct PDP deny | exactly one DENIED audit with exact decision ID, policy IDs and permission/entitlement versions |
| AUTH-017 | Commercial/context/resource denial occurs without a final PDP deny | DENIED audit records final safe reason; no fabricated access decision identity |
| AUTH-018 | resource/workflow rule denies after resource PDP allowed | final audit outcome DENIED; preceding PDP decision may be referenced only for correlation |
| AUTH-019 | mandatory Authorization audit append fails | no success returned; denial path remains fail closed as dependency unavailable; private DB/audit diagnostics are not exposed |
| AUTH-020 | durable Authorization audit writer receives malformed/untyped RequestContext ownership shape | AUTHORIZATION_AUDIT_UNAVAILABLE before scoped SQL/insert; only exact PLATFORM_GLOBAL, TENANT_CORE and TENANT_INDUSTRY single-context shapes are accepted |
| AUTH-021 | protected durable Authorization audit writer receives missing/empty/malformed principal identity | AUTHORIZATION_AUDIT_UNAVAILABLE before scoped SQL/insert; every accepted protected decision audit carries a valid principal UUID |


### Authorization source compiler continuation — DD-048 / DEV-AUTHZ-SOURCE-COMPILER-001

| ID | Scenario | Expected |
|---|---|---|
| AUTH-020 | same permission ALLOW and DENY arrive from multiple active exact-scope roles | compiled permission is DENY |
| AUTH-021 | ALLOW RolePermission has non-empty constraints_json but Permission Set v1 cannot encode it | compiled permission is DENY; constraint is never dropped into an unconstrained allow |
| AUTH-022 | Tenant Industry compilation sees tenant-null or sibling-Industry assignment | neither participates; no implicit null→all-industries inheritance |
| AUTH-023 | RolePermission version differs from active RoleTemplate version or permission scope differs from target | compilation fails closed and current compiled snapshot is invalidated where possible |
| AUTH-024 | identical canonical source is compiled repeatedly | deterministic sorted role/permission payload and deterministic SHA-256 source fingerprint |
| AUTH-025 | compiler runtime attempts source mutation | database privilege denial; compiler may SELECT source and mutate only governed compiled publication tables |
| AUTH-026 | compiler publication/invalidation receives malformed or untyped scope evidence: TENANT_CORE carries any Industry field, PLATFORM_GLOBAL carries any Tenant/Industry field, or Tenant target scope is unsupported | AUTHORIZATION_COMPILER_SCOPE_INVALID before compiler store/SQL use; exact snapshot publication authority is not widened |


### API idempotency runtime — DD-049 / DEV-API-IDEMPOTENCY-001

| ID | Scenario | Expected |
|---|---|---|
| API-IDEM-001 | REQUIRED command has no idempotency key | deterministic IDEMPOTENCY_REQUIRED before domain mutation |
| API-IDEM-002 | OPTIONAL command has no key / NONE operation | bypass idempotency persistence |
| API-IDEM-003 | same scoped key + same fingerprint is already IN_PROGRESS | no second execution claim; IN_PROGRESS returned |
| API-IDEM-004 | same scoped key + different canonical request fingerprint | IDEMPOTENCY_CONFLICT; original state unchanged |
| API-IDEM-005 | prior SUCCEEDED record | REPLAY only stored safe status/reference metadata; no domain re-execution |
| API-IDEM-006 | FAILED_RETRYABLE / FAILED_FINAL | retryable atomically reclaims; final remains FINAL_FAILURE |
| API-IDEM-007 | Tenant Industry session queries same-Tenant null-Industry or sibling-Industry idempotency row | zero visibility; null never means all Industries |
| API-IDEM-008 | concurrent identical first claims | exactly one STARTED; contender becomes IN_PROGRESS; runtime role cannot DELETE records |
| API-IDEM-009 | TENANT_CORE idempotency context carries a present Industry Context value, including an empty string | IDEMPOTENCY_SCOPE_UNSUPPORTED before store use; exact Tenant-Core null-Industry shape only |
| API-IDEM-010 | persisted replay/final-failure response status/reference is empty or exceeds the bounded safe metadata contract, or direct completion supplies oversized metadata | IDEMPOTENCY_DEPENDENCY_UNAVAILABLE; unsafe metadata never reaches transport replay and direct malformed completion does not reach scoped SQL |


### API rate-limit runtime — DD-050 / DEV-API-RATE-LIMIT-001

| ID | Scenario | Expected |
|---|---|---|
| API-RATE-001 | SecurityRatePolicy v1 is loaded | DD-022 numeric windows/bursts/concurrency are exact; unknown class denies |
| API-RATE-002 | authenticated request has principal + credential + IP + Tenant | all applicable primary/API_CREDENTIAL/TENANT_AGGREGATE buckets participate; tightest wins |
| API-RATE-003 | tenant/plan/risk override is stricter / attempts relaxation | stricter accepted; any v1 relaxation is POLICY_DENIED |
| API-RATE-004 | two concurrent requests compete for the last token | atomic backend admits exactly one; no partial multi-bucket token consumption |
| API-RATE-005 | AI tenant already has 8 live leases | RATE_LIMITED with retry metadata; releasing/expiry reopens capacity |
| API-RATE-006 | limiter database inspected by ordinary app/integration role | permission denied; persisted bucket identity is SHA-256 only |
| API-RATE-007 | tenant-scoped rate-limit call has scope mismatch, missing/empty Tenant, hidden Industry on TENANT_CORE, or missing Industry on TENANT_INDUSTRY | RATE_CONTEXT_INVALID before limiter store use; Tenant aggregate cannot be bypassed by malformed context |
| API-RATE-008 | persisted bucket carries a stale faster refill/capacity than the current governed rule | admission/refill uses the current rule; stale operational metadata cannot widen the current limit |


### Canonical API execution kernel — DD-051 / DEV-API-EXECUTOR-001

| ID | Scenario | Expected |
|---|---|---|
| API-EXEC-001 | transport input includes a conflicting scope suggestion | executor uses OperationContract.scopeClass only |
| API-EXEC-002 | schema parser applies defaults/reorders object fields | deterministic frozen canonical JSON is produced from validated data |
| API-EXEC-003 | resource-bound operation has raw client ID | GuardPipeline receives only resource reference derived from validated input |
| API-EXEC-004 | rate admission denies | guard/idempotency/domain do not execute; normalized RATE_LIMITED retains retry metadata |
| API-EXEC-005 | guard denies after rate admission | rate lease cleanup runs; idempotency/domain do not execute |
| API-EXEC-006 | existing idempotency replay | current context/rate/guard execute first; domain/output execution does not repeat |
| API-EXEC-007 | declared DomainOperationError | safe declared code returned and STARTED idempotency is completed as retryable/final accordingly |
| API-EXEC-008 | undeclared/unknown domain error | dependency-unavailable; private/internal error is not exposed |
| API-EXEC-009 | output validation fails / success-completion persistence fails | output failure finalizes safely; post-domain success-completion failure leaves IN_PROGRESS and never marks retryable |
| API-EXEC-010 | concurrency lease release cleanup fails after completed result | completed business result is not rewritten; expiry bounds the stale lease |


### Zod DTO + transport projection — DD-052 / DEV-API-DTO-PROJECTION-001

| ID | Scenario | Expected |
|---|---|---|
| API-DTO-001 | operation DTO registered once | executor adapter and future transport retrieve the same Zod schema objects |
| API-DTO-002 | Zod defaults/coercion/transforms apply | DD-051 canonical JSON is produced from parsed output, not raw input |
| API-DTO-003 | invalid Zod input contains private raw values | INPUT_INVALID fieldErrors contain only safe paths + issue codes; no raw value/message leakage |
| API-DTO-004 | operation/schema version has no exact DTO definition | SCHEMA_UNAVAILABLE fail closed |
| API-DTO-005 | EXECUTED result projected | exact DD-06 success envelope with request/correlation/operation/version |
| API-DTO-006 | idempotency replay projected | explicit replay control; no fabricated output-schema data |
| API-DTO-007 | user/policy/entitlement/system errors and rate retry metadata | exact A-01 class mapping; safe error envelope; retryAfter remains adapter metadata |


### First-party tRPC adapter — DD-053 / DEV-API-TRPC-001

| ID | Scenario | Expected |
|---|---|---|
| API-TRPC-001 | protected context has valid/invalid human or machine credential | IdentityPort preflight runs before procedure invocation; invalid credential does not create usable context |
| API-TRPC-002 | advisory correlation is valid/invalid | valid UUID is normalized; invalid/missing value is replaced by server-generated UUID |
| API-TRPC-003 | `core.identity.roles.listEffective` procedure is created | nested route is fixed to the canonical OperationContract and exact registered Zod DTO objects |
| API-TRPC-004 | DTO includes a Zod transform/default | transform executes once; prepared canonical input is derived without a second Zod parse |
| API-TRPC-005 | executor returns RATE_LIMITED / policy / system error | shared DD-052 projection is retained; tRPC adds only transport code and retry metadata |
| API-TRPC-006 | procedure resolver executes | no router-local Commercial/Authorization/rate/idempotency/domain/database rule exists; all execution delegates to OperationExecutor |


### Physical first-party tRPC Fetch handler — DD-054 / DEV-API-TRPC-HTTP-001

| ID | Scenario | Expected |
|---|---|---|
| API-TRPC-HTTP-001 | GET real `core.identity.roles.listEffective` via Fetch handler | 200; canonical tRPC success; exact correlation echoed; no router-local business rule |
| API-TRPC-HTTP-002 | invalid credential + malformed POST body | canonical 401 authentication denial occurs before tRPC/body parsing |
| API-TRPC-HTTP-003 | missing Authorization | canonical AUTH_REQUIRED 401; Authorization resolver/domain are not invoked |
| API-TRPC-HTTP-004 | executor returns RATE_LIMITED with retry seconds | tRPC 429 retains DD-052 envelope and HTTP Retry-After |
| API-TRPC-HTTP-005 | edge origin/host/size/CSRF policy denies | denial occurs before auth resolver/body processing and exposes no internal policy detail |


### First-party Clerk Authorization — DD-055 / DEV-WEB-AUTH-001

| ID | Scenario | Expected |
|---|---|---|
| WEB-AUTH-001 | `Authorization: Bearer <token>` | resolver returns HUMAN AuthenticationInput with opaque credential only |
| WEB-AUTH-002 | Basic/custom/machine-like/ambiguous Authorization scheme | fail closed 401 before IdentityPort |
| WEB-AUTH-003 | Clerk token verification | official verifier receives pinned JWT public key + non-empty authorizedParties |
| WEB-AUTH-004 | valid signed Clerk token | only subject, session ID and valid fva pair cross ClerkBackendPort |
| WEB-AUTH-005 | live Clerk session get/revoke | exact session ID/user/status/createdAt mapped; revoke delegates to Backend API |
| WEB-AUTH-006 | invalid token / session 404 / provider outage | TOKEN_INVALID / SESSION_NOT_FOUND / DEPENDENCY_UNAVAILABLE respectively; no provider detail leakage |


### First-party web selector + edge/body policy — DD-056 / DEV-WEB-EDGE-001

| ID | Scenario | Expected |
|---|---|---|
| WEB-EDGE-001 | request host matches exact configured Tenant host | only configured Tenant selector is produced; RequestContext remains authoritative |
| WEB-EDGE-002 | request supplies `X-Tenant-Id` / `X-Industry-Context-Id` | headers are ignored as selector authority |
| WEB-EDGE-003 | host/origin is unknown, Origin is non-canonical/malformed (including credentials/path/query/fragment/non-HTTPS), or browser Sec-Fetch-Site is cross-site | canonical transport context/policy denial before domain execution; Origin normalization cannot erase disallowed syntax |
| WEB-EDGE-004 | Content-Length exceeds configured ceiling | 413 before Authorization resolver/body parsing |
| WEB-EDGE-005 | Content-Length absent but streamed body exceeds ceiling | authentication succeeds first, then 413 before tRPC/schema parsing |
| WEB-EDGE-006 | same-origin bounded GET/POST | request proceeds through existing tRPC Fetch handler and canonical executor |
| WEB-EDGE-007 | POST supplies a non-JSON media type that merely begins with `application/json` | 415 before tRPC/schema/domain execution; exact `application/json` media type with optional parameters remains accepted |


### Context bootstrap — DD-057 / DEV-CONTEXT-BOOTSTRAP-001

| ID | Scenario | Expected |
|---|---|---|
| CTX-BOOT-001 | human principal has two active Tenant memberships and no selector | ambiguous resolution returns no Tenant; no implicit choice |
| CTX-BOOT-002 | selector names Tenant without current membership / machine selects outside bound Tenant | no Tenant resolves |
| CTX-BOOT-003 | Industry selector belongs to sibling Tenant | no Industry Context resolves |
| CTX-BOOT-004 | membership default/explicit OrgUnit | exact Tenant unit resolves with server-derived root→leaf UUID path |
| CTX-BOOT-005 | Tenant DataHome | ACTIVE directory route returns exact id/region/routingVersion |
| CTX-BOOT-006 | bootstrap DB role attempts write or sensitive identity read | permission denied; role remains NOLOGIN/NOBYPASSRLS |
| CTX-BOOT-007 | self-parent or multi-node cycle reached through explicit/default OrgUnit selection | traversal terminates; no OrgUnit/path resolves; foreign Tenant remains hidden; repaired hierarchy and subsequent pool use remain valid |


### Concrete Next.js first-party composition — DD-058 / DEV-WEB-COMPOSITION-001

| ID | Scenario | Expected |
|---|---|---|
| WEB-COMP-001 | package/lock install on Node 22 | exact pinned Next 15 + React/ReactDOM 19 + React type boundary installs with `npm ci`; package-lock regeneration yields no diff |
| WEB-COMP-002 | server composition module is imported/built without runtime secrets being supplied | import/compile succeeds; secrets/config are read only when the handler composition is initialized; missing required runtime values then fail closed |
| WEB-COMP-003 | App Router `/api/trpc/[trpc]` is built | Node runtime dynamic route compiles; GET and POST delegate to one shared handler; no route-local Commercial/Authorization/domain/database rule exists |
| WEB-COMP-004 | NodeNext server modules use `.js` imports inside Next source graph | Next resolves TypeScript sources through governed extension aliases while root Core NodeNext compilation remains unchanged |
| WEB-COMP-005 | Next production type/build pipeline runs | `tsconfig.web.json` owns Next/generated types; root `tsconfig.json` remains the Core emit boundary and is not mutated |
| WEB-COMP-006 | first-party human web composition receives a machine-like credential path | machine credential verification is not inferred from Clerk Bearer; this bounded route fails closed |
| WEB-COMP-007 | production build completes | dynamic `/api/trpc/[trpc]` route is emitted and the governed package/config files remain clean after build |


### Tenant workspace bootstrap query — DD-059 / DEV-WORKSPACE-BOOTSTRAP-001

| ID | Scenario | Expected |
|---|---|---|
| WS-BOOT-001 | procedure input attempts tenantId or parallel Tenant authority | exact v1 Zod DTO rejects it; Tenant selector remains transport/server-owned |
| WS-BOOT-002 | exact active Tenant Core context resolves workspace with no Industry selector; malformed Tenant Core carrying Industry Context is rejected before workspace dependency use | sanitized Tenant display projection only for exact Tenant Core; hidden Industry Context cannot be silently dropped or widened |
| WS-BOOT-003 | optional Industry selector names ACTIVE current-Tenant Industry | sanitized selected Industry projection returned |
| WS-BOOT-004 | optional Industry selector resolves to sibling Tenant | INDUSTRY_CONTEXT_MISMATCH fail closed |
| WS-BOOT-005 | membership becomes inactive after RequestContext creation | WorkspaceService revalidation fails closed; stale membership is not trusted |
| WS-BOOT-006 | canonical Core router enables Workspace capability | fixed OperationContract + exact DTO + shared OperationExecutor path; no router-local auth/commercial/database rule |
| WS-BOOT-007 | production Next composition builds with Workspace enabled | Core tests, PostgreSQL isolation, full DB verification and Next production build remain exact-head green |


### Client-safe current Commercial query — DD-060 / DEV-COMMERCIAL-ENTITLEMENTS-QUERY-001

| ID | Scenario | Expected |
|---|---|---|
| COMM-UI-001 | getCurrent input includes tenantId/industryId/other field | strict empty v1 DTO rejects it |
| COMM-UI-002 | current snapshot contains enabled + false/zero/empty + deny-set facts | output includes only effective enabled non-denied facts |
| COMM-UI-003 | SET entitlement contains duplicate/invalid/over-bound values | projection fails closed; no truncation/coercion |
| COMM-UI-004 | RequestContext snapshot id/version differs from freshly loaded current state | COMMERCIAL_CONTEXT_STALE normalizes to dependency-unavailable; no stale projection |
| COMM-UI-005 | client projection serialized | snapshotId, subscriptionId, license IDs/tokens, principal bindings and deny-set/source metadata are absent |
| COMM-UI-006 | procedure executes | fixed OperationContract + exact Zod DTO + shared OperationExecutor/GuardPipeline; no router-local Commercial rule |
| COMM-UI-007 | PENDING/SUSPENDED/EXPIRED/CANCELLED under generic guard | access remains restricted; this query does not invent a recovery/billing exception |
| COMM-UI-008 | TENANT_CORE current-state context carries a present Industry Context value, including an empty string | COMMERCIAL_SCOPE_UNSUPPORTED before store use; exact Tenant-Core null-Industry shape only |


### Commercial plan-change request / resolution contract — DD-062

| ID | Scenario | Expected |
|---|---|---|
| COMM-PLAN-001 | client sends route/payment/approval/remediation/effectiveAt fields | strict external contract rejects/ignores them as authority; server derives all gates |
| COMM-PLAN-002 | identical externally retried request uses same Idempotency-Key | shared REQUIRED idempotency prevents duplicate plan-change request side effects |
| COMM-PLAN-003 | request is evaluated | Subscription plan_version_id and current entitlement snapshot remain unchanged |
| COMM-PLAN-004 | downgrade assessment has blockingImpactCodes | apply blocked until server-owned remediationState becomes SATISFIED |
| COMM-PLAN-005 | SELF_SERVE resolution | only Billing-owned SATISFIED evidence can clear the route gate |
| COMM-PLAN-006 | SALES_ASSISTED resolution | only governed workflow/approval SATISFIED evidence can clear the route gate |
| COMM-PLAN-007 | NEXT_RENEWAL | effectiveAt comes from server-owned Billing/contract evidence; client date/clock cannot schedule apply |
| COMM-PLAN-008 | Subscription version/source plan changed after assessment | apply fails closed as stale/conflict and requires re-evaluation |
| COMM-PLAN-009 | route policy/assessment version changed | stale resolution evidence cannot authorize apply |
| COMM-PLAN-010 | request/result serialized | no provider secret, payment instrument, pricing formula or raw approval payload crosses the Commercial API |


### Commercial event catalog — DD-063 / DEV-COMMERCIAL-EVENT-CATALOG-001

| ID | Scenario | Expected |
|---|---|---|
| COMM-EVT-001 | database bootstrap applies catalog migration | exactly active v1 rows exist for subscription.transitioned and entitlement.recompiled |
| COMM-EVT-002 | catalog row inspected | producer=Commercial, scope=TENANT_CORE, sensitivity=INTERNAL, webhook_eligible=false |
| COMM-EVT-003 | subscription.transitioned payload schema | exact required state/plan/version/transition fields; no price/payment/approval/secret fields |
| COMM-EVT-004 | entitlement.recompiled payload schema | exact snapshot/version/source metadata; no entitlement facts/licenses/deny-set/pricing fields |
| COMM-EVT-005 | ordinary app runtime privileges event catalog | SELECT permitted; INSERT/UPDATE/DELETE denied |
| COMM-EVT-006 | future outbox write names an unknown Commercial event/version | FK/catalog validation rejects it |
| COMM-EVT-007 | future tenant-core outbox event carries Industry Context | scope mismatch must be rejected by writer/envelope validation; null Industry is canonical for these events |


### Commercial transition/compiler DB boundary — DD-064 / DEV-COMMERCIAL-WRITER-BOUNDARY-001

| ID | Scenario | Expected |
|---|---|---|
| COMM-DBW-001 | inspect writer role flags | NOLOGIN/NOBYPASSRLS/no elevated role attributes |
| COMM-DBW-002 | ordinary app/worker attempts Commercial DML | INSERT/UPDATE/DELETE privilege absent |
| COMM-DBW-003 | dedicated writer updates Subscription | only plan_version_id/version/updated_at columns are writable; state/billing fields are not |
| COMM-DBW-004 | dedicated writer reads compiler sources in TENANT_CORE | all same-Tenant Industry-scoped license/override/usage/fact rows visible; sibling Tenant rows invisible |
| COMM-DBW-005 | dedicated writer mutates compiler source license/override/usage | privilege denied |
| COMM-DBW-006 | snapshot publication | snapshot INSERT + status-only UPDATE and fact INSERT allowed; fact UPDATE/DELETE denied |
| COMM-DBW-007 | outbox append | only TENANT_CORE subscription.transitioned / entitlement.recompiled accepted by writer restrictive policy + catalog FK |
| COMM-DBW-008 | audit append | writer limited to TENANT_CORE source_module=Commercial evidence |


### Atomic Commercial publication — DD-065 / DEV-COMMERCIAL-PUBLICATION-001

| ID | Scenario | Expected |
|---|---|---|
| COMM-PUB-001 | HUMAN / Industry-scoped / missing-current-snapshot caller, or TENANT_CORE carries any present Industry Context | rejected before store; SERVICE + exact TENANT_CORE (Industry absent) + current snapshot required |
| COMM-PUB-002 | duplicate facts/deny entries, invalid type/window, future effectiveAt | payload/state rejected before persistence |
| COMM-PUB-003 | stale Subscription expectedVersion/source PlanVersion | transaction fails closed; no transition/snapshot/event/audit side effect |
| COMM-PUB-004 | RequestContext snapshot id/version differs from locked CURRENT snapshot | transaction fails closed as stale |
| COMM-PUB-005 | target PlanVersion/Plan/route is not ACTIVE/effective | transaction fails closed |
| COMM-PUB-006 | compiled fact type disagrees with ACTIVE entitlement definition or Industry belongs elsewhere/inactive | transaction fails closed |
| COMM-PUB-007 | successful apply | Subscription version/Plan advances, transition appended, old snapshot SUPERSEDED, new CURRENT snapshot/facts published |
| COMM-PUB-008 | successful apply evidence | exactly subscription.transitioned + entitlement.recompiled outbox and one Commercial audit append in same transaction |
| COMM-PUB-009 | writer attempts Subscription state or Tenant mutation | dedicated role privilege denies it |
| COMM-PUB-010 | any evidence/privilege/RLS write fails | PostgreSQL transaction rolls back all business/publication evidence |
| COMM-PUB-011 | matching CURRENT snapshot is expired or not yet effective | publication fails closed with all subscription/snapshot/event/audit state unchanged |
| COMM-PUB-012 | Tenant current_subscription_id no longer selects the supplied Subscription | publication fails closed despite matching snapshot/source/version |
| COMM-PUB-013 | unknown/missing runtime fact valueType | COMMERCIAL_PUBLICATION_PAYLOAD_INVALID before any persistence call |


### Governed plan-change evidence — DD-066 / DEV-COMMERCIAL-PLAN-CHANGE-EVIDENCE-001

| ID | Scenario | Expected |
|---|---|---|
| COMM-PCE-001 | HUMAN, Industry-scoped, unresolved caller, or TENANT_CORE carrying any present Industry Context records evidence | rejected before persistence; SERVICE + exact TENANT_CORE (Industry absent) required |
| COMM-PCE-002 | assessment source Subscription version/PlanVersion is stale | DB guard rejects; no evidence inserted |
| COMM-PCE-003 | target PlanVersion/Plan/route invalid or route policy version changed | assessment insert rejects |
| COMM-PCE-004 | assessment version skips/rebinds subscription/source/target/timing/version | rejects; versions are contiguous and core binding immutable |
| COMM-PCE-005 | blocking impacts exist but remediation is NOT_REQUIRED/SATISFIED | rejects initial inconsistent assessment |
| COMM-PCE-006 | remediation evidence | Commercial-only, append-only, contiguous evidence version |
| COMM-PCE-007 | reassessment becomes SATISFIED | requires prior SATISFIED Commercial remediation evidence for previous assessment version |
| COMM-PCE-008 | SELF_SERVE route resolution | only Billing producer role/method can append |
| COMM-PCE-009 | SALES_ASSISTED route resolution | only Workflow producer role/method can append; Billing preview forbidden |
| COMM-PCE-010 | SATISFIED NEXT_RENEWAL resolution | server-owned effectiveAt required |
| COMM-PCE-011 | wrong producer attempts route evidence | RLS/producer check denies |
| COMM-PCE-012 | runtime attempts evidence UPDATE/DELETE | privilege + immutable ownership boundary denies |


### PlanVersion commercial schema v1 — DD-067 / DEV-COMMERCIAL-PLAN-SCHEMA-001

| ID | Scenario | Expected |
|---|---|---|
| COMM-PLAN-SCHEMA-001 | schemaVersion != 1 | fail closed as unsupported |
| COMM-PLAN-SCHEMA-002 | unknown top-level/fact/limit/scope field | fail closed; no permissive passthrough |
| COMM-PLAN-SCHEMA-003 | INCLUDED entitlement | value required and validated against canonical valueType |
| COMM-PLAN-SCHEMA-004 | NOT_INCLUDED / ADD_ON_ONLY entitlement | value forbidden |
| COMM-PLAN-SCHEMA-005 | FINITE limit | non-negative finite value required |
| COMM-PLAN-SCHEMA-006 | UNLIMITED / NOT_INCLUDED / ADD_ON_ONLY limit | numeric value forbidden |
| COMM-PLAN-SCHEMA-007 | duplicate code+scope or entitlement+meter+scope | fail closed |
| COMM-PLAN-SCHEMA-008 | SET input | bounded, unique, deterministic sorted output |
| COMM-PLAN-SCHEMA-009 | LICENSED_INDUSTRIES selector | remains a selector only; parser does not grant Industry access |


### Licensed PlanVersion baseline expansion — DD-068 / DEV-COMMERCIAL-PLAN-BASELINE-001

| ID | Scenario | Expected |
|---|---|---|
| COMM-PLAN-BASE-001 | TENANT selector | one Tenant-scoped resolved entry |
| COMM-PLAN-BASE-002 | LICENSED_INDUSTRIES | only ACTIVE Contexts with effective INDUSTRY license resolve |
| COMM-PLAN-BASE-003 | INDUSTRY_CODE | exact matching ACTIVE + licensed Context only |
| COMM-PLAN-BASE-004 | inactive/non-effective Industry license | no Industry-scoped grant is instantiated |
| COMM-PLAN-BASE-005 | effective license points to missing Context | fail closed |
| COMM-PLAN-BASE-006 | generic + specific selectors collide after resolution | fail closed as ambiguous; no guessed precedence |
| COMM-PLAN-BASE-007 | explicit plan markers | grant/limit marker semantics preserved unchanged |
| COMM-PLAN-BASE-008 | input order changes | resolved output remains deterministic |
| COMM-PLAN-BASE-009 | inventory includes PENDING/SUSPENDED/DISABLED Contexts, even with effective licenses | no grants/limits for inactive Contexts; eligible Contexts and Tenant baseline remain; unknown lifecycle status rejects |


### Commercial adjustment source normalization — DD-069 / DEV-COMMERCIAL-ADJUSTMENT-SCHEMA-001

| ID | Scenario | Expected |
|---|---|---|
| COMM-ADJ-001 | add-on delta schemaVersion/unknown field invalid | fail closed |
| COMM-ADJ-002 | add-on Boolean/TEXT/SET capability delta | unsupported in v1; fail closed rather than invent additive semantics |
| COMM-ADJ-003 | quota delta + Tenant add-on quantity | non-negative delta scales deterministically; INTEGER result must remain safe integer |
| COMM-ADJ-004 | Tenant DENY override | canonical value=true; normalized to Tenant-wide deny-set representation |
| COMM-ADJ-005 | Industry DENY override | canonical value=true; normalized to type-specific scoped disabled fact |
| COMM-ADJ-006 | ALLOW override | value validated against entitlement-definition value type |
| COMM-ADJ-007 | LIMIT_SET | only numeric type; non-negative replacement value |
| COMM-ADJ-008 | LIMIT_DELTA | only numeric type; signed finite delta |
| COMM-ADJ-009 | SET ALLOW | bounded, unique, deterministic sorted value |


### Commercial adjustment source + eligibility resolver — DD-070 / DEV-COMMERCIAL-ADJUSTMENT-SOURCE-001

| ID | Scenario | Expected |
|---|---|---|
| COMM-ADJ-SRC-001 | HUMAN / Industry-scoped caller or TENANT_CORE carrying any present Industry Context | rejected; SERVICE + exact TENANT_CORE (Industry absent) required |
| COMM-ADJ-SRC-002 | supplied Subscription version/source PlanVersion stale | source load fails closed |
| COMM-ADJ-SRC-003 | Tenant current_subscription_id no longer points to supplied Subscription | source load fails closed |
| COMM-ADJ-SRC-004 | target PlanVersion/Plan/route inactive or outside effective window | source load fails closed |
| COMM-ADJ-SRC-005 | TenantAddOn expired/inactive/wrong Subscription | excluded |
| COMM-ADJ-SRC-006 | sibling-Tenant TenantAddOn or override exists | invisible; cannot enter prepared adjustments |
| COMM-ADJ-SRC-007 | override expired/inactive or entitlement definition inactive | excluded |
| COMM-ADJ-SRC-008 | add-on eligibility | only server-owned resolver may return ELIGIBLE/INELIGIBLE + policyVersion/evidenceReference |
| COMM-ADJ-SRC-009 | INELIGIBLE add-on | retained as ineligible evidence; delta is not applied |
| COMM-ADJ-SRC-010 | ELIGIBLE add-on | DD-069 delta parses/scales only after eligibility succeeds |
| COMM-ADJ-SRC-011 | malformed resolver status/version/evidence | fail closed |
| COMM-ADJ-SRC-012 | concrete production eligibility business rule | NOT CLAIMED; requires separately governed resolver implementation |

### Commercial audit regressions — 2026-09-21

| ID | Scenario | Required result / executable owner |
|---|---|---|
| COMM-PV-IMM-001 | edit unpublished DRAFT, then first publication | allowed; verification 0046 checks affected rows |
| COMM-PV-IMM-002 | rewrite published entitlement/limit/trial/billing policy, identity, validity, provenance or version | rejected by the specific immutability guard; verification 0046 |
| COMM-PV-IMM-003 | retire published version | status-only update succeeds; entire pinned payload stays identical |
| COMM-PV-IMM-004 | reopen DRAFT, clear publication marker, or rewrite RETIRED content | rejected; no edit bypass through lifecycle state |
| COMM-PV-IMM-005 | runtime deletes published catalog history or retains TRUNCATE/DELETE grants | actual delete rejected and all non-migration sbg roles checked |
| COMM-PV-IMM-006 | publish successor after retirement | new version row succeeds; previous payload remains intact |
| COMM-ENUM-001 | unknown/missing Subscription state from a store port | COMMERCIAL_STATE_INVALID before guard can grant access; core current-state regression |
| COMM-ENUM-002 | unknown/missing entitlement value type | client projection and Authorization supplemental reads reject, rather than silently omitting invalid data |

### Commercial adjustment precedence — DD-071 / DEV-COMMERCIAL-ADJUSTMENT-PRECEDENCE-001

| ID | Scenario | Expected |
|---|---|---|
| COMM-ADJ-PRE-001 | Plan marker/value with no adjustment | preserved in deterministic intermediate preview |
| COMM-ADJ-PRE-002 | exact-scope ALLOW | existing baseline entitlement becomes VALUE with canonical typed value |
| COMM-ADJ-PRE-003 | same exact scope has ALLOW + DENY | DENY wins; Tenant deny-set or Industry disabled scoped fact |
| COMM-ADJ-PRE-004 | multiple ALLOW rows and no DENY | ambiguous; fail closed |
| COMM-ADJ-PRE-005 | LIMIT_SET/LIMIT_DELTA has zero matching target meter | invalid; fail closed |
| COMM-ADJ-PRE-006 | LIMIT_SET/LIMIT_DELTA maps to multiple meters | ambiguous; fail closed; never guess meter |
| COMM-ADJ-PRE-007 | LIMIT_DELTA target non-FINITE or result negative/non-finite/unsafe integer | invalid; fail closed |
| COMM-ADJ-PRE-008 | ELIGIBLE quota add-on after override | additive result uses override-adjusted limit |
| COMM-ADJ-PRE-009 | multiple eligible add-ons same finite target | deterministic additive sum |
| COMM-ADJ-PRE-010 | ADD_ON_ONLY target + eligible quota delta | becomes FINITE starting from zero |
| COMM-ADJ-PRE-011 | add-on targets NOT_INCLUDED/UNLIMITED, missing target, wrong type or inactive INDUSTRY_CODE | invalid; fail closed |
| COMM-ADJ-PRE-012 | LICENSED_INDUSTRIES add-on selector | applies only to already-resolved Industry baseline targets |
| COMM-ADJ-PRE-013 | input ordering changes | output entitlements, limits and Tenant deny set remain deterministically sorted |

### Commercial compliance/security restriction input — DD-072

| ID | Scenario | Expected |
|---|---|---|
| COMM-CSR-001 | HUMAN / Industry-scoped / unresolved caller or TENANT_CORE carrying any present Industry Context | rejected before resolver; SERVICE + exact TENANT_CORE (Industry absent) required |
| COMM-CSR-002 | resolver invocation | receives exact target PlanVersion id and exact DD-071 preview; client cannot supply restriction authority |
| COMM-CSR-003 | authoritative evaluation returns no restrictions | empty set remains versioned/evidenced; dependency absence is not treated as empty allow-like output |
| COMM-CSR-004 | exact Tenant or Industry entitlement DENY | accepted only when the exact entitlement key already exists in DD-071 preview |
| COMM-CSR-005 | missing entitlement target / implicit fan-out required | fail closed; compiler never invents or expands a target selector |
| COMM-CSR-006 | ALLOW, LIMIT_CAP/LIMIT_DELTA or opaque effect | unsupported in v1; fail closed rather than invent compliance semantics |
| COMM-CSR-007 | duplicate control + exact target tuple | fail closed; independent controls may separately deny the same exact target |
| COMM-CSR-008 | target PlanVersion mismatch or malformed policyVersion/evidence/control id | fail closed |
| COMM-CSR-009 | malformed/duplicate DD-071 entitlement target set | fail before resolver use |
| COMM-CSR-010 | resolver dependency error | propagates as failure; no implicit no-restriction fallback |

### Commercial usage-meter target impact — DD-073

| ID | Scenario | Expected |
|---|---|---|
| COMM-USAGE-001 | HUMAN / Industry-scoped caller or TENANT_CORE carrying any present Industry Context | rejected before usage source; SERVICE + exact TENANT_CORE (Industry absent) required |
| COMM-USAGE-002 | usage source invocation | exact target PlanVersion/effectiveAt + deterministic DD-071 target limits; caller cannot provide authoritative usage |
| COMM-USAGE-003 | FINITE used_value equals/below target | WITHIN_TARGET |
| COMM-USAGE-004 | FINITE used_value above target | EXCEEDS_TARGET; aggregate blocking usage=true |
| COMM-USAGE-005 | NOT_INCLUDED or still-ADD_ON_ONLY target with used_value > 0 | EXCEEDS_TARGET against zero included capacity |
| COMM-USAGE-006 | UNLIMITED target | UNLIMITED, non-blocking; no selected measurement required |
| COMM-USAGE-007 | bounded target missing measurement / source selects unknown target / multiple periods | fail closed; no zero/current-period guess |
| COMM-USAGE-008 | relevant reserved_value > 0 | fail closed as reservation semantics unresolved; do not add reservation to used_value |
| COMM-USAGE-009 | target PlanVersion/evidence/measurement/version malformed | fail closed |
| COMM-USAGE-010 | input target/measurement order changes | deterministic impact order unchanged |
| COMM-USAGE-011 | concrete current-period selector or reservation reconciliation policy | NOT CLAIMED; requires separately governed source semantics |

### Commercial subscription lifecycle target overlay — DD-074

| ID | Scenario | Expected |
|---|---|---|
| COMM-LIFE-001 | TRIAL / ACTIVE | FULL_ACCESS; generic protected operations and ordinary writes remain eligible subject to later guards |
| COMM-LIFE-002 | GRACE | FULL_ACCESS retained; no punitive entitlement reduction is invented |
| COMM-LIFE-003 | SUSPENDED | RESTRICTED; generic protected operations/writes denied; dedicated non-generic path required |
| COMM-LIFE-004 | EXPIRED / CANCELLED | PRESERVATION_ONLY; generic protected operations/writes denied; data preservation remains required |
| COMM-LIFE-005 | PENDING | ACTIVATION_PENDING; generic application access not activated |
| COMM-LIFE-006 | PAST_DUE / Renewed as state | fail closed; neither is a canonical resting state |
| COMM-LIFE-007 | unknown/malformed lifecycle state | fail closed |
| COMM-LIFE-008 | lifecycle classification repeated | deterministic immutable result |
| COMM-LIFE-009 | restricted-state read-only/recovery/export operation IDs | NOT CLAIMED; require separately governed dedicated OperationContracts |
| COMM-LIFE-010 | future NEXT_RENEWAL lifecycle state | NOT PREDICTED; authoritative state must be re-read at apply time |

### Commercial final target-preview materialization — DD-075

| ID | Scenario | Expected |
|---|---|---|
| COMM-TARGET-001 | Tenant compliance/security DENY | entitlement code joins Tenant deny set; underlying scoped fact is not widened |
| COMM-TARGET-002 | Industry compliance/security DENY | exact Industry entitlement becomes type-specific disabled fact; sibling scope unaffected |
| COMM-TARGET-003 | multiple distinct controls deny same exact target | one effective denial; all sorted evidence preserved |
| COMM-TARGET-004 | DD-072 or DD-073 target PlanVersion mismatches | fail closed |
| COMM-TARGET-005 | restriction targets missing DD-071 entitlement / duplicate control-target | fail closed |
| COMM-TARGET-006 | DD-073 impact does not exactly cover DD-071 limits or target mode/value differs | fail closed |
| COMM-TARGET-007 | usage status/aggregate blocker contradicts used-value comparison | fail closed |
| COMM-TARGET-008 | DD-074 posture fields contradict canonical lifecycle state | fail closed |
| COMM-TARGET-009 | lifecycle is restricted/non-active | posture attached; entitlement/limit facts are not rewritten |
| COMM-TARGET-010 | input ordering differs | deterministic immutable final preview is identical |
| COMM-TARGET-011 | snapshot fact/source-id/fingerprint/remediation/publication authority | NOT CLAIMED; remains separate governed orchestration |

### Commercial initial assessment preparation — DD-076

| ID | Scenario | Expected |
|---|---|---|
| COMM-ASSESS-001 | no governed blockers | version 1 preparation; remediationState=NOT_REQUIRED |
| COMM-ASSESS-002 | governed blockers present | sorted blockers; remediationState=PENDING |
| COMM-ASSESS-003 | DD-073 has blocking usage but evaluator returns no blocker | fail closed; BR-SUB-04 blocker cannot disappear |
| COMM-ASSESS-004 | non-usage governed blocker with usage non-blocking | PENDING is allowed |
| COMM-ASSESS-005 | evaluator receives Subscription/source/target/version/timing + exact DD-075 preview | exact server-owned binding |
| COMM-ASSESS-006 | DD-075/evaluator target differs from requested target | fail closed |
| COMM-ASSESS-007 | duplicate/malformed/oversized blocking codes | fail closed |
| COMM-ASSESS-008 | malformed route/evidence/fingerprint | fail closed |
| COMM-ASSESS-009 | HUMAN / TENANT_INDUSTRY / unresolved Tenant context, or TENANT_CORE carrying any present Industry Context | fail closed before evaluator; exact Tenant-Core Industry absence required |
| COMM-ASSESS-010 | source PlanVersion equals target | fail before evaluator |
| COMM-ASSESS-011 | same evidence prepared repeatedly | deterministic immutable output |
| COMM-ASSESS-012 | concrete blocker vocabulary/diff format/fingerprint/dual-route chooser | NOT CLAIMED; production evaluator remains required |

### Persisted Commercial apply-evidence gate — DD-077

| ID | Scenario | Expected |
|---|---|---|
| COMM-APPLY-GATE-001 | current assessment + SATISFIED correct producer route | ALLOW_APPLY_GATE |
| COMM-APPLY-GATE-002 | current assessment has blocking impacts/PENDING remediation | BLOCK_REMEDIATION_PENDING |
| COMM-APPLY-GATE-003 | no route evidence or latest route PENDING | BLOCK_ROUTE_PENDING |
| COMM-APPLY-GATE-004 | latest route REJECTED after earlier evidence | BLOCK_ROUTE_REJECTED; latest evidence wins |
| COMM-APPLY-GATE-005 | NEXT_RENEWAL SATISFIED but effectiveAt is future | BLOCK_EFFECTIVE_TIME_PENDING |
| COMM-APPLY-GATE-006 | NEXT_RENEWAL effectiveAt reached | ALLOW_APPLY_GATE |
| COMM-APPLY-GATE-007 | SATISFIED reassessment without prior Commercial remediation evidence | fail closed |
| COMM-APPLY-GATE-008 | requested assessment version is not latest | fail closed as stale |
| COMM-APPLY-GATE-009 | Subscription/source/version/current pointer changed | fail closed |
| COMM-APPLY-GATE-010 | target route policy/version/enablement changed | fail closed |
| COMM-APPLY-GATE-011 | current compiler fingerprint differs from assessment fingerprint | fail closed |
| COMM-APPLY-GATE-012 | SELF_SERVE producer is not Billing / SALES_ASSISTED producer is not Workflow | fail closed |
| COMM-APPLY-GATE-013 | compiler role reads evidence | same-Tenant FORCE-RLS only; no evidence mutation |
| COMM-APPLY-GATE-014 | separate gate then later DD-065 publication | atomic evidence-to-mutation guarantee NOT CLAIMED; same-transaction binding remains later work |
| COMM-APPLY-GATE-015 | SERVICE TENANT_CORE context carries any present Industry Context, including empty string | COMMERCIAL_APPLY_EVIDENCE_SCOPE_INVALID before evidence-store use |

### Atomic Commercial evidence→publication — DD-078

| ID | Scenario | Expected |
|---|---|---|
| COMM-ATOMIC-001 | publication omits/uses missing assessment binding | fail closed before mutation |
| COMM-ATOMIC-002 | supplied assessment version is not latest | fail closed; no Subscription/snapshot/outbox/audit mutation |
| COMM-ATOMIC-003 | assessment Subscription/source/target/version/fingerprint differs | fail closed |
| COMM-ATOMIC-004 | blockers/PENDING remediation remain | fail closed |
| COMM-ATOMIC-005 | SATISFIED reassessment lacks prior Commercial remediation evidence | fail closed |
| COMM-ATOMIC-006 | target route policy id/version/enablement changed | fail closed |
| COMM-ATOMIC-007 | latest route is PENDING/REJECTED/wrong producer | fail closed; earlier SATISFIED evidence cannot authorize |
| COMM-ATOMIC-008 | NEXT_RENEWAL effectiveAt differs from route evidence or has not arrived | fail closed |
| COMM-ATOMIC-009 | valid latest evidence + existing DD-065 guards | publication succeeds atomically |
| COMM-ATOMIC-010 | concurrent DD-066 evidence insert for same Tenant+assessment | database transaction lock serializes against publication |
| COMM-ATOMIC-011 | inspect compiler privileges | evidence remains read-only; only lock-helper EXECUTE is added |
| COMM-ATOMIC-012 | migration/bootstrap | 0047 lock helper + three insert triggers verified |

### Prepared initial assessment persistence — DD-079

| ID | Scenario | Expected |
|---|---|---|
| COMM-ASSESS-PERSIST-001 | valid DD-076 version-1 prepared assessment | exact fields forwarded to DD-066; assessment id/time/Tenant/correlation remain server-owned |
| COMM-ASSESS-PERSIST-002 | prepared PENDING blockers | blockers/remediation forwarded unchanged |
| COMM-ASSESS-PERSIST-003 | assessmentVersion != 1 / malformed UUID, route, timing or evidence | fail before recorder |
| COMM-ASSESS-PERSIST-004 | unsorted/duplicate blockers or blocker/remediation contradiction | fail before recorder |
| COMM-ASSESS-PERSIST-005 | HUMAN / Industry-scoped / unresolved Tenant caller or TENANT_CORE carrying any present Industry Context | fail before recorder; exact Tenant-Core Industry absence required |
| COMM-ASSESS-PERSIST-006 | DD-066 returns different Tenant/correlation/source/target/evidence | fail closed as persisted mismatch |
| COMM-ASSESS-PERSIST-007 | live Subscription version/source/current pointer stale | existing DD-066 PostgreSQL guard rejects; no assessment row |
| COMM-ASSESS-PERSIST-008 | current target PlanVersion/route policy invalid | existing DD-066 PostgreSQL guard rejects |
| COMM-ASSESS-PERSIST-009 | DB privileges | existing DD-066 producer role/0047 serialization only; no new migration/grant |
| COMM-ASSESS-PERSIST-010 | blocker/diff/fingerprint/route business semantics | NOT CLAIMED; concrete DD-076 evaluator remains required |

### Shared external REST Fetch adapter — DD-080

| ID | Scenario | Expected |
|---|---|---|
| REST-001 | request has body but authentication/context is invalid | edge/route/authenticated context complete or deny before body preparation/input parsing |
| REST-002 | valid registered route | exact route-bound operationId, selector facts, idempotency metadata and raw projected input handed once to OperationExecutor; canonical success envelope |
| REST-003 | executor returns RATE_LIMITED or another governed error | DD-052 error envelope; deterministic HTTP status; Retry-After remains header metadata |
| REST-004 | executor returns replay/in-progress/final-failure control | explicit control projection; no fabricated output DTO; 200/202/409 respectively |
| REST-005 | transport/input port throws unknown error | safe DEPENDENCY_UNAVAILABLE/503; no private detail |
| REST-006 | missing Authorization or edge denial | canonical 401/declared denial before context/body/input/executor as applicable |
| REST-007 | generic Tenant/Industry headers are present | no authority unless an explicitly governed route/context port maps a selector; DD-02 still revalidates it |
| REST-008 | live route/API-key/OpenAPI/webhook/deployment inspection | NOT CLAIMED; adapter floor is not externally mounted |
| REST-009 | authenticated-context implementation returns substitute idempotency/rate metadata | ignored; executor receives exact transport Idempotency-Key and only the trusted network-port verified rate subject |
| REST-010 | route resolver returns unsupported/malformed success status | fail closed as transport-contract invalid before authorization/body/input/executor; only 200 or 201 are accepted success statuses |
| REST-011 | authenticated-context implementation rewrites Authorization-derived authentication, route selectors or trusted network identity/context | fail closed before body/input/executor; executor context is reconstructed only from the original authoritative transport/route/network facts |


### Event envelope / catalog validation — DD-081

| ID | Scenario | Expected |
|---|---|---|
| EVT-CAT-001 | valid catalog-bound Tenant Core envelope | metadata/catalog/scope validates, then payload-schema port executes |
| EVT-CAT-002 | event id/type/version/scope, catalog producer/sensitivity, or mandatory metadata is malformed/inconsistent; calendar-invalid occurredAt must not pass through permissive runtime normalization | fail before payload interpretation |
| EVT-CAT-003 | TENANT_INDUSTRY envelope omits or changes authoritative Industry Context | fail before payload interpretation |
| EVT-CAT-004 | tenant event residency differs from authoritative Tenant residency | fail before payload interpretation |
| EVT-CAT-005 | EXPLICIT_CROSS_CONTEXT source/target are missing, equal, foreign, or ownership verifier unavailable | fail before payload interpretation |
| EVT-CAT-006 | catalog payload-schema validator rejects payload | normalized event validation failure; no dispatcher/webhook side effect |


### Document pre-sign access candidate — DD-082

| ID | Scenario | Expected |
|---|---|---|
| DOC-PRE-001 | exact ACTIVE/CLEAN Tenant Industry DocumentMeta | immutable internal candidate; no external URL/token/object key |
| DOC-PRE-002 | Tenant Core DocumentMeta loaded while operating in a Tenant Industry workspace | remains Tenant-scoped candidate; later authorization still required |
| DOC-PRE-003 | sibling Industry or foreign Tenant metadata | non-disclosing RESOURCE_NOT_FOUND |
| DOC-PRE-004 | QUARANTINED/DELETED/non-CLEAN metadata | RESOURCE_STATE_INVALID; cannot progress toward signing |
| DOC-PRE-005 | missing metadata or unresolved/malformed Tenant/Industry/principal context, including TENANT_CORE carrying an Industry Context | RESOURCE_NOT_FOUND before metadata dependency/signing; no existence disclosure |
| DOC-PRE-006 | metadata reader failure or malformed authoritative row | safe DEPENDENCY_UNAVAILABLE; no provider/storage detail leakage |


### PostgreSQL Document access metadata — DD-083

| ID | Scenario | Expected |
|---|---|---|
| DOC-PG-001 | exact Tenant Industry document read through Document service role | exact DD-082 metadata projection; no object key/provider credential |
| DOC-PG-002 | sibling Industry document id queried from current Industry context | FORCE-RLS returns no row; exact sibling context may read it |
| DOC-PG-003 | Tenant Core document read from same-Tenant Industry and Tenant Core contexts | visible as Tenant Core metadata in both; no Industry widening |
| DOC-PG-004 | real PostgreSQL QUARANTINED/non-CLEAN row composed with DD-082 | candidate service rejects before any signer surface |
| DOC-PG-005 | database route/context mismatch | fail closed before metadata disclosure |


### Raw PostgreSQL Document ACL reader — DD-084

| ID | Scenario | Expected |
|---|---|---|
| DOC-ACL-PG-001 | same-context ACL rows include ALLOW/DENY and validUntil | immutable typed rows preserve persisted values; no authorization decision |
| DOC-ACL-PG-002 | sibling Industry document ACL requested from current Industry | parent FORCE-RLS yields no ACL rows; sibling context can read its own |
| DOC-ACL-PG-003 | Tenant Core document ACL requested from same-Tenant Industry and Tenant Core contexts | same Tenant Core ACL row visible in both |
| DOC-ACL-PG-004 | persisted ACL row is expired | raw reader still returns expiry/effect evidence; effectiveness is not interpreted |


### Document ACL subject-match evidence — DD-085

| ID | Scenario | Expected |
|---|---|---|
| DOC-ACL-MATCH-001 | PRINCIPAL row + exact requested ACL permission | matching row only; immutable evidence |
| DOC-ACL-MATCH-002 | ROLE rows include one effective and one foreign role | only resolved RequestContext role id matches |
| DOC-ACL-MATCH-003 | ORG_UNIT rows target current unit and ancestor | both ids in resolved orgUnitPath match |
| DOC-ACL-MATCH-004 | matched rows contain expired/future validUntil and ALLOW/DENY | values are preserved; no expiry/effect interpretation |
| DOC-ACL-MATCH-005 | no subject matches | empty evidence; no access decision is invented |
| DOC-ACL-MATCH-006 | unresolved context or cross-document evidence | fail closed |
| DOC-ACL-MATCH-007 | sparse `roleIds` or `orgUnitPath` contains an otherwise matching valid UUID plus a hole | fail closed as malformed RequestContext; no ACL subject evidence is returned |
| DOC-ACL-MATCH-008 | `orgUnitId` is malformed/absent while path is non-empty, path leaf differs from selected `orgUnitId`, or ancestry repeats an OrgUnit UUID | fail closed as malformed RequestContext; no ORG_UNIT ACL subject evidence is returned |


### Linked physical Document StorageObject binding — DD-086

| ID | Scenario | Expected |
|---|---|---|
| DOC-STO-PG-001 | exact ACTIVE/CLEAN RLS-visible DocumentMeta + linked ACTIVE object | immutable private physical binding |
| DOC-STO-PG-002 | caller supplies known but unlinked StorageObject id | no binding; object id cannot bypass DocumentMeta |
| DOC-STO-PG-003 | sibling Industry document/object requested from current Industry | no binding; exact sibling context may resolve its own |
| DOC-STO-PG-004 | Tenant Core document/object requested from same-Tenant Industry and Tenant Core contexts | same linked physical binding visible in both |
| DOC-STO-PG-005 | Document or StorageObject is unsafe/non-active | no physical binding; cannot progress toward signing |
| DOC-STO-PG-006 | resolved RequestContext Data Home mismatches database route/object | fail closed before locator disclosure |
| DOC-STO-PG-007 | linked ACTIVE StorageObject current `size_bytes` or `checksum_sha256` drifts from ACTIVE DocumentMeta | no physical binding; current physical locator evidence fails closed until exact parity is restored |


### Raw PostgreSQL Document upload-session reader — DD-087

| ID | Scenario | Expected |
|---|---|---|
| DOC-UP-PG-001 | exact Tenant Industry upload session | immutable typed persistence facts preserved exactly |
| DOC-UP-PG-002 | sibling Industry session requested from current Industry | FORCE-RLS returns no row; exact sibling context may read it |
| DOC-UP-PG-003 | Tenant Core session requested from same-Tenant Industry and Tenant Core contexts | same Tenant Core session visible in both |
| DOC-UP-PG-004 | persisted session is EXPIRED / past expiresAt | raw reader still returns evidence; no usability decision |
| DOC-UP-PG-005 | malformed session id or database route/context mismatch | fail closed before session disclosure |



### Raw PostgreSQL Webhook Subscription reader — DD-088

| ID | Scenario | Expected |
|---|---|---|
| WH-SUB-PG-001 | exact Tenant ACTIVE subscription | immutable persisted endpoint/status/version/filter/allowed-context facts; no secret plaintext |
| WH-SUB-PG-002 | foreign-Tenant subscription id queried | FORCE-RLS returns no row; exact owning Tenant context may read it |
| WH-SUB-PG-003 | Tenant subscription read from same-Tenant Industry and Tenant Core contexts | same Tenant Core subscription visible in both |
| WH-SUB-PG-004 | PENDING_VERIFICATION subscription without verifiedAt | raw non-executable evidence; no verified/deliverable decision |
| WH-SUB-PG-005 | malformed id, malformed exact Tenant scope shape (including TENANT_CORE with any present Industry Context), or database route/context mismatch | fail closed before subscription disclosure / scoped SQL use |


### Raw PostgreSQL Webhook Delivery reader — DD-089

| ID | Scenario | Expected |
|---|---|---|
| WH-DEL-PG-001 | exact Tenant Industry delivery attempt | immutable raw attempt evidence including persisted status/HTTP/error/nextAttempt; no retry/delivery decision |
| WH-DEL-PG-002 | sibling Industry queries delivery whose parent event is Industry-scoped | parent RLS returns no row; exact Industry context may read it |
| WH-DEL-PG-003 | Tenant-Core event delivery read from same-Tenant Tenant Core and Industry contexts | same delivery evidence visible in both |
| WH-DEL-PG-004 | foreign-Tenant delivery id queried | parent subscription/event RLS returns no row; owning Tenant/context may read it |
| WH-DEL-PG-005 | malformed id, malformed exact Tenant scope shape (including TENANT_CORE with any present Industry Context), or database route/context mismatch | fail closed before delivery evidence disclosure / scoped SQL use |


### Raw PostgreSQL Outbox Event reader — DD-090

| ID | Scenario | Expected |
|---|---|---|
| EVT-OUT-PG-001 | exact Tenant Industry outbox event with persisted dispatcher evidence | immutable raw event/envelope/status/attempt/lock/error facts; no dispatch/retry decision |
| EVT-OUT-PG-002 | sibling Industry queries Tenant Industry event | FORCE-RLS returns no row; exact Industry context may read it |
| EVT-OUT-PG-003 | Tenant-Core outbox event read from same-Tenant Tenant Core and Industry contexts | same raw event evidence visible in both |
| EVT-OUT-PG-004 | foreign-Tenant outbox event id queried | FORCE-RLS returns no row; owning Tenant/context may read it |
| EVT-OUT-PG-005 | malformed id or database route/context mismatch | fail closed before event evidence disclosure |


### Exact PostgreSQL Event Catalog reader — DD-091

| ID | Scenario | Expected |
|---|---|---|
| EVT-CAT-PG-001 | exact type/version/scope tuple | immutable authoritative catalog facts compatible with DD-081 contract |
| EVT-CAT-PG-002 | exact catalog row status is RETIRED | raw RETIRED evidence returned; no publish/consume decision |
| EVT-CAT-PG-003 | event type exists but requested version or scope differs | null; no fallback to another tuple |
| EVT-CAT-PG-004 | empty type, non-positive version or invalid scope | fail closed before persistence query |


### Exact PostgreSQL IntegrationDefinition reader — DD-092

| ID | Scenario | Expected |
|---|---|---|
| INT-DEF-PG-001 | exact definition primary key | immutable exact registry fields, capability list and residency JSON |
| INT-DEF-PG-002 | INDUSTRY definition has raw RETIRED status | ownerScope/status/classification preserved; no selectable/enabled/healthy decision |
| INT-DEF-PG-003 | unknown valid definition UUID | null; no fallback by code/provider/capability |
| INT-DEF-PG-004 | malformed definition UUID | fail closed before persistence query |


### Exact PostgreSQL IntegrationCapability reader — DD-093

| ID | Scenario | Expected |
|---|---|---|
| INT-CAP-PG-001 | exact definition id + capability code tuple | immutable exact direction/operation/event/class/status registry facts |
| INT-CAP-PG-002 | tuple has INBOUND + raw RETIRED status | raw evidence preserved; no enabled/executable/authorized decision |
| INT-CAP-PG-003 | capability code belongs to another definition / unknown definition | null; no fallback by code/provider/event |
| INT-CAP-PG-004 | malformed definition UUID or empty capability code | fail closed before persistence query |


### Exact PostgreSQL ProviderAdapter reader — DD-094

| ID | Scenario | Expected |
|---|---|---|
| INT-ADAPTER-PG-001 | exact definition + adapter code + contract version | immutable exact auth/timeout/retry/circuit/health/error-map/status metadata |
| INT-ADAPTER-PG-002 | exact tuple has raw RETIRED status | evidence preserved; no selected/client/healthy/authorized runtime decision |
| INT-ADAPTER-PG-003 | adapter exists under another version/code | null; no version/adapter fallback |
| INT-ADAPTER-PG-004 | malformed definition UUID or empty adapter/version | fail closed before persistence query |


### Raw PostgreSQL TenantIntegration reader — DD-095

| ID | Scenario | Expected |
|---|---|---|
| INT-TENANT-PG-001 | exact Tenant Industry integration id | immutable raw scope/definition/status/credential-id/config/capability/health/version facts; no secret/runtime authority |
| INT-TENANT-PG-002 | sibling Industry TenantIntegration requested from current Industry | FORCE-RLS returns no row; exact sibling context may read its own |
| INT-TENANT-PG-003 | Tenant Core integration requested from same-Tenant Industry and Tenant Core contexts | same Tenant Core row visible in both; raw PAUSED/health evidence preserved |
| INT-TENANT-PG-004 | foreign-Tenant integration id queried | FORCE-RLS returns no row; owning Tenant may read raw ACTIVE/health evidence without execution authority |
| INT-TENANT-PG-005 | malformed id, malformed exact Tenant scope shape (including TENANT_CORE with any present Industry Context), or database route/context mismatch | fail closed before TenantIntegration disclosure / scoped SQL use |


### Tenant-scoped CredentialReference metadata reader — DD-096

| ID | Scenario | Expected |
|---|---|---|
| INT-CRED-META-PG-001 | exact Tenant Industry credential reference | immutable provider/type/key/status metadata; no secret locator/material field |
| INT-CRED-META-PG-002 | sibling Industry credential id requested from current Industry | FORCE-RLS returns no row; exact sibling context may read its metadata |
| INT-CRED-META-PG-003 | Tenant Core credential requested from same-Tenant Industry and Tenant Core contexts | same metadata visible; rotation/expiry evidence preserved without usability decision |
| INT-CRED-META-PG-004 | foreign-Tenant credential id queried | FORCE-RLS returns no row; owning Tenant sees metadata only |
| INT-CRED-META-PG-005 | malformed id, malformed exact Tenant scope shape (including TENANT_CORE with any present Industry Context), or database route/context mismatch | fail closed before credential metadata disclosure / scoped SQL use |


### Raw PostgreSQL SyncCursor reader — DD-097

| ID | Scenario | Expected |
|---|---|---|
| INT-CURSOR-PG-001 | exact Tenant Industry integration/capability/context tuple | immutable raw opaque cursor/watermark/source-version evidence; no execution decision |
| INT-CURSOR-PG-002 | sibling Industry cursor tuple requested from current Industry | parent FORCE-RLS returns no row; exact sibling context may read its raw cursor |
| INT-CURSOR-PG-003 | Tenant Core cursor read from same-Tenant Industry and Tenant Core contexts after parent later PAUSED | same raw cursor visible; parent status is not converted into resume authority |
| INT-CURSOR-PG-004 | foreign Tenant or mismatched capability/context tuple | null; no fallback to another cursor |
| INT-CURSOR-PG-005 | malformed tuple, malformed exact Tenant scope shape (including TENANT_CORE with any present Industry Context), or database route/context mismatch | fail closed before cursor disclosure / scoped SQL use |


### Raw PostgreSQL NotificationDelivery reader — DD-098

| ID | Scenario | Expected |
|---|---|---|
| NOTIF-DEL-PG-001 | exact Tenant Industry delivery id | immutable raw scoped recipient/channel/status/time/error/version evidence; no send/retry/provider decision |
| NOTIF-DEL-PG-002 | sibling Industry delivery requested from current Industry | FORCE-RLS returns no row; exact sibling context may read its own |
| NOTIF-DEL-PG-003 | Tenant Core delivery requested from same-Tenant Industry and Tenant Core contexts | same Tenant Core delivery visible in both; raw FAILED/error evidence preserved |
| NOTIF-DEL-PG-004 | foreign-Tenant delivery id queried | FORCE-RLS returns no row; owning Tenant sees raw terminal evidence without finality/provider authority |
| NOTIF-DEL-PG-005 | malformed id or database route/context mismatch | fail closed before delivery disclosure |


### Raw PostgreSQL NotificationDeliveryAttempt reader — DD-099

| ID | Scenario | Expected |
|---|---|---|
| NOTIF-ATT-PG-001 | exact Tenant Industry delivery has multiple persisted attempts | immutable rows returned in attempt-number order; raw provider/status/error/time evidence preserved; no retry/finality decision |
| NOTIF-ATT-PG-002 | sibling Industry delivery attempts requested from current Industry | parent FORCE-RLS yields no rows; exact sibling context may read its own |
| NOTIF-ATT-PG-003 | Tenant Core delivery attempts requested from same-Tenant Industry and Tenant Core contexts | same raw attempt evidence visible in both |
| NOTIF-ATT-PG-004 | foreign-Tenant delivery attempts requested | no rows; owning Tenant sees raw terminal/provider-reference evidence without authority |
| NOTIF-ATT-PG-005 | malformed delivery id or database route/context mismatch | fail closed before attempt disclosure |
| NOTIF-ATT-PG-006 | Notification worker attempts UPDATE/DELETE on attempt evidence | privilege denial; persisted attempt remains unchanged |


### Raw PostgreSQL NotificationTemplate reader — DD-100

| ID | Scenario | Expected |
|---|---|---|
| NOTIF-TPL-PG-001 | exact Tenant Industry template id | immutable raw code/channel/locale/version/status/content/variable-schema/creator evidence; no rendered/selected decision |
| NOTIF-TPL-PG-002 | sibling Industry template requested from current Industry | owner-scope FORCE-RLS returns no row; exact sibling context may read its own |
| NOTIF-TPL-PG-003 | Tenant template requested from same-Tenant Industry and Tenant Core contexts with raw RETIRED status | same raw template visible in both; RETIRED remains evidence, not selection/send authority |
| NOTIF-TPL-PG-004 | PLATFORM template requested from Tenant then PLATFORM_GLOBAL service context | Tenant gets no implicit fallback; trusted PLATFORM_GLOBAL context may read exact platform template |
| NOTIF-TPL-PG-005 | foreign-Tenant template requested | no row; owning Tenant sees raw evidence |
| NOTIF-TPL-PG-006 | malformed template id or database route/context mismatch | fail closed before template disclosure |


### Raw PostgreSQL WorkflowDefinition reader — DD-101

| ID | Scenario | Expected |
|---|---|---|
| WFD-PG-001 | exact Tenant Industry definition id | immutable raw version/status/schema/state-machine/approval/rule/effective evidence; no selected/executable decision |
| WFD-PG-002 | sibling Industry definition requested from current Industry | owner-scope FORCE-RLS returns no row; exact sibling context may read its own |
| WFD-PG-003 | Tenant definition requested from same-Tenant Industry and Tenant Core contexts | same raw definition visible; schema-allowed empty text / optional effective evidence preserved |
| WFD-PG-004 | PLATFORM definition requested from Tenant then PLATFORM_GLOBAL service context | Tenant gets no implicit fallback; trusted PLATFORM_GLOBAL context may read exact platform definition |
| WFD-PG-005 | foreign-Tenant definition requested | no row; owning Tenant sees raw lifecycle evidence |
| WFD-PG-006 | malformed definition id or database route/context mismatch | fail closed before definition disclosure |
| WFD-PG-007 | Workflow worker attempts UPDATE of WorkflowDefinition catalog | privilege denial; raw definition remains unchanged |


### Raw PostgreSQL WorkflowInstance reader — DD-102

| ID | Scenario | Expected |
|---|---|---|
| WFI-PG-001 | exact Tenant Industry WorkflowInstance | immutable raw definition/resource/state/lifecycle/row-version evidence preserved |
| WFI-PG-002 | sibling Industry instance requested from current Industry | FORCE-RLS returns no row; exact sibling context may read its own |
| WFI-PG-003 | Tenant Core instance requested from same-Tenant Industry and Tenant Core contexts | same Tenant Core row visible in both; schema-allowed raw empty text / row-version values preserved |
| WFI-PG-004 | foreign Tenant instance requested | hidden; owning Tenant context may read it |
| WFI-PG-005 | COMPLETED/CANCELLED lifecycle evidence | raw evidence only; no transition/finality/execution authority surfaced |
| WFI-PG-006 | malformed UUID or database route/context mismatch | fail closed before instance disclosure |
| WFI-PG-007 | exact-by-id read | no alternate instance/definition selection side effect |


### Raw PostgreSQL WorkflowTask reader — DD-103

| ID | Scenario | Expected |
|---|---|---|
| WFT-PG-001 | exact Tenant Industry task assigned to PRINCIPAL | immutable raw task/assignment/state/due/row-version evidence preserved |
| WFT-PG-002 | ROLE and ORG_UNIT assigned tasks | persisted subject type/id, claim/completion evidence preserved; no eligibility decision |
| WFT-PG-003 | sibling Industry task requested from current Industry | parent FORCE-RLS returns no row; exact sibling context may read it |
| WFT-PG-004 | Tenant Core task requested from same-Tenant Industry and Tenant Core contexts | same task visible in both; schema-allowed empty permission/non-positive row-version evidence preserved |
| WFT-PG-005 | foreign Tenant task requested | hidden; owning Tenant context may read it |
| WFT-PG-006 | terminal/claimed/completed task evidence | raw evidence only; no claim/approve/reject/complete or parent-transition authority surfaced |
| WFT-PG-007 | malformed UUID or database route/context mismatch | fail closed before task disclosure |


### Raw PostgreSQL WorkflowTransition reader — DD-104

| ID | Scenario | Expected |
|---|---|---|
| WTR-PG-001 | exact Tenant Industry transition | immutable raw from/action/to, actor/reason, version, time and correlation evidence preserved |
| WTR-PG-002 | sibling Industry transition requested from current Industry | parent FORCE-RLS returns no row; exact sibling context may read its own |
| WTR-PG-003 | Tenant Core transition with very large bigint versions / empty raw text | same-Tenant visible; exact decimal version and schema-allowed text evidence preserved without JS-number coercion |
| WTR-PG-004 | foreign Tenant transition requested | hidden; owning Tenant context may read it |
| WTR-PG-005 | persisted transition evidence read | no next-transition selection, authorization or execution authority surfaced |
| WTR-PG-006 | malformed UUID or database route/context mismatch | fail closed before transition disclosure |
| WTR-PG-007 | Workflow worker attempts UPDATE/DELETE of transition evidence | privilege denial; append-only row remains unchanged |


### Raw PostgreSQL AutomationDefinition reader — DD-105

| ID | Scenario | Expected |
|---|---|---|
| WFA-DEF-PG-001 | exact Tenant Industry AutomationDefinition id | immutable raw trigger/config/reference/lifecycle/effective evidence; no selected/executable decision |
| WFA-DEF-PG-002 | sibling Industry definition requested from current Industry | owner-scope FORCE-RLS returns no row; exact sibling context may read its own raw definition |
| WFA-DEF-PG-003 | Tenant definition requested from same-Tenant Industry and Tenant Core contexts | same raw definition visible; schema-allowed empty text and optional effective evidence preserved |
| WFA-DEF-PG-004 | PLATFORM definition requested from Tenant then PLATFORM_GLOBAL service context | Tenant gets no implicit fallback; trusted PLATFORM_GLOBAL context may read exact platform definition |
| WFA-DEF-PG-005 | foreign-Tenant definition requested | no row; owning Tenant sees raw lifecycle/trigger/config evidence without execution authority |
| WFA-DEF-PG-006 | malformed definition id or database route/context mismatch | fail closed before AutomationDefinition disclosure |
| WFA-DEF-PG-007 | Workflow worker attempts UPDATE of AutomationDefinition catalog | privilege denial; raw definition remains unchanged |


### Raw PostgreSQL AutomationRun reader — DD-106

| ID | Scenario | Expected |
|---|---|---|
| WFA-RUN-PG-001 | exact Tenant Industry AutomationRun id | immutable raw trigger/idempotency/status/time/correlation/error evidence; no execution or next-state decision |
| WFA-RUN-PG-002 | sibling Industry run requested from current Industry | FORCE-RLS returns no row; exact sibling context may read its own raw run |
| WFA-RUN-PG-003 | Tenant Core run requested from same-Tenant Industry and Tenant Core contexts | same raw run visible; schema-allowed empty text evidence preserved |
| WFA-RUN-PG-004 | foreign-Tenant run requested | no row; owning Tenant sees raw evidence without execution authority |
| WFA-RUN-PG-005 | persisted terminal/non-terminal run evidence read | no trigger/retry/finality/next-state execution decision is surfaced |
| WFA-RUN-PG-006 | malformed run id or database route/context mismatch | fail closed before AutomationRun disclosure |
| WFA-RUN-PG-007 | Workflow worker privilege/read-port surface inspected | schema-owned AutomationRun UPDATE privilege remains; DD-106 read port exposes no mutation method |

### AIPROV-PG-001 — Exact provider catalog metadata read
Given a persisted `core_ai.ai_provider` row and its exact identifier, the PostgreSQL AI provider catalog metadata reader returns the authorized metadata projection, preserves schema-owned evidence, returns an immutable/frozen contract, and never selects or exposes `credential_ref`; a secret sentinel persisted in `credential_ref` must not leak through the returned object.

### AIPROV-PG-002 — Missing and malformed identifier behavior
An exact well-formed provider identifier with no matching row returns `null`; a malformed provider UUID fails closed rather than being normalized into another identity.

### AIPROV-PG-003 — Schema-valid raw evidence preservation
The reader preserves schema-valid empty text values and nullable/empty array elements instead of inventing non-empty normalization or runtime policy semantics not owned by the source schema.

### AIPROV-PG-004 — Catalog state is not runtime routing authority
Raw provider `status` and `health_state` values, including `ACTIVE`, remain catalog evidence only. The reader exposes no selected/eligible/route/fallback/generate/select-provider authority and does not convert catalog state into AI Gateway execution semantics.

### AIPROV-PG-005 — Dedicated AI role remains read-only for provider catalog
The dedicated `sbg_ai_gateway_rw` role can select provider catalog metadata but has no `INSERT`, `UPDATE`, or `DELETE` authority over `core_ai.ai_provider`; an attempted provider update is rejected, and the bounded reader exposes no mutation methods.


## DD-108 AI Model Catalog Metadata Reader Acceptance

### AIMODEL-PG-001 — Exact immutable catalog evidence
Exact model-id lookup returns only the bounded AI Model metadata contract, preserving provider relation, model code/name, capabilities, context-window class, input/output modalities, residency regions, sensitivity ceiling, cost/latency classes, raw status, version, and metadata as immutable/frozen evidence.

### AIMODEL-PG-002 — Absence and malformed identity fail closed
An absent well-formed UUID returns `null`; a malformed model UUID fails closed rather than being normalized into another identity or unbounded query.

### AIMODEL-PG-003 — Schema-valid empty evidence is preserved
Schema-valid empty text plus nullable/empty array elements remain raw evidence and are not strengthened into invented non-empty runtime rules.

### AIMODEL-PG-004 — Catalog facts are not routing/execution authority
Raw `ACTIVE`, sensitivity, residency, cost, latency, capability, or provider-link facts do not create selected/eligible/current/preferred/route/fallback authority. The store exposes no model-selection, generation, or embedding operation.

### AIMODEL-PG-005 — Provider relation is preserved under SELECT-only AI role
`providerId` is returned as raw relation evidence. `sbg_ai_gateway_rw` can SELECT the model catalog but cannot INSERT/UPDATE/DELETE; a mutation attempt is rejected, and the bounded store exposes no create/update/delete methods.

## DD-109 AI Capability Catalog Metadata Reader Acceptance

### AICAP-PG-001 — Exact immutable capability catalog evidence
Exact capability-id lookup returns only the bounded AI Capability metadata contract, preserving code, constrained category, nullable required-entitlement evidence, default-policy-class evidence, positive schema version, and raw status as an immutable/frozen result.

### AICAP-PG-002 — Absence and malformed identity fail closed
An absent well-formed UUID returns `null`; a malformed capability UUID fails closed rather than being normalized into another identity or unbounded query.

### AICAP-PG-003 — Schema-valid nullable and empty evidence is preserved
`required_entitlement=NULL`, schema-valid empty text, and raw status evidence remain distinct persisted facts and are not strengthened into invented non-empty entitlement/policy rules.

### AICAP-PG-004 — Catalog facts are not authorization, routing, or execution authority
Raw `ACTIVE`, `required_entitlement`, `default_policy_class`, category, or schema-version facts do not create eligible/entitled/allowed/selected/route/policy-decision authority. The store exposes no entitlement evaluator, policy evaluator, route selector, or AI execution operation.

### AICAP-PG-005 — Dedicated AI role remains read-only for capability catalog
`sbg_ai_gateway_rw` can SELECT the capability catalog but cannot INSERT/UPDATE/DELETE; a mutation attempt is rejected, and the bounded store exposes no create/update/delete methods.

## DD-110 AI Tool Definition Catalog Metadata Reader Acceptance

### AITOOLDEF-PG-001 — Exact immutable tool-definition catalog evidence
Exact tool-definition-id lookup returns only the bounded AI Tool Definition metadata contract, preserving capability linkage, OperationContract reference, constrained scope class, permission/entitlement references, positive schema versions, constrained side-effect class, approval-policy reference, idempotency flag, audit class, raw status/version and timestamps as an immutable/frozen result.

### AITOOLDEF-PG-002 — Absence and malformed identity fail closed
An absent well-formed UUID returns `null`; a malformed tool-definition UUID fails closed rather than being normalized into another identity or unbounded query.

### AITOOLDEF-PG-003 — Schema-valid nullable and empty/raw evidence is preserved
Nullable approval/entitlement evidence, governed scope-class evidence, and schema-valid empty raw text remain distinct persisted facts and are not strengthened into invented non-empty runtime policy or execution rules.

### AITOOLDEF-PG-004 — Catalog facts are not authorization, approval, or execution authority
Raw `ACTIVE`, permission/entitlement references, side-effect class, idempotency flag, audit class, scope class and OperationContract reference do not create eligible/authorized/permission-granted/entitlement-granted/approval-satisfied/executable authority. The store exposes no permission evaluator, entitlement evaluator, approval, invocation, idempotency reservation, audit append, or execution operation.

### AITOOLDEF-PG-005 — Dedicated AI role remains read-only for tool-definition catalog
`sbg_ai_gateway_rw` can SELECT the tool-definition catalog but cannot INSERT/UPDATE/DELETE; the bounded store exposes no create/update/delete methods.

## DD-111 AI ToolSet Raw Persistence Reader Acceptance

### AITOOLSET-PG-001 — Exact Industry ToolSet raw evidence
Exact ToolSet-id lookup in the owning Industry Context returns immutable owner scope, Tenant/Industry ownership, raw code, positive version, constrained lifecycle status and timestamps without selected/member/executable authority.

### AITOOLSET-PG-002 — Sibling Industry isolation
An Industry ToolSet requested from a sibling Industry Context is hidden by FORCE-RLS; the exact sibling context may read its own raw ToolSet evidence.

### AITOOLSET-PG-003 — Tenant ToolSet same-Tenant visibility
A Tenant-owned ToolSet is visible from the same Tenant Core and Tenant Industry contexts. Schema-valid empty code and raw lifecycle status are preserved rather than strengthened.

### AITOOLSET-PG-004 — PLATFORM ToolSet requires PLATFORM_GLOBAL context
A Tenant context receives no implicit PLATFORM ToolSet fallback. Trusted PLATFORM_GLOBAL service/operator context may read the exact PLATFORM ToolSet; timestamp ordering is preserved as persisted rather than inferred.

### AITOOLSET-PG-005 — Foreign Tenant isolation
A foreign-Tenant ToolSet is hidden; its owning Tenant context may read the raw row.

### AITOOLSET-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed ToolSet UUID returns `null`; malformed UUID or database route/context mismatch fails closed before disclosure.

### AITOOLSET-PG-007 — Read-port boundary preserves existing write governance
The dedicated AI Gateway role retains the migration-owned ToolSet table privileges rather than being falsely described as read-only, but the DD-111 store exposes no create/update/delete/member-load/active-select/execute method. PLATFORM ToolSet mutation remains blocked for the AI Gateway role by the migration-0032 restrictive write floor.

## DD-112 AI PromptSet Raw Persistence Reader Acceptance

### AIPROMPTSET-PG-001 — Exact Industry PromptSet raw evidence
Exact PromptSet-id lookup in the owning Industry Context returns immutable owner scope, Tenant/Industry ownership, raw code, positive version, constrained lifecycle status and timestamps without selection/member/render/execution authority.

### AIPROMPTSET-PG-002 — Sibling Industry isolation
An Industry PromptSet requested from a sibling Industry Context is hidden by FORCE-RLS; the exact sibling context may read its own raw PromptSet evidence.

### AIPROMPTSET-PG-003 — Tenant PromptSet same-Tenant visibility
A Tenant-owned PromptSet is visible from the same Tenant Core and Tenant Industry contexts. Schema-valid empty code and raw lifecycle status remain persisted evidence rather than being strengthened.

### AIPROMPTSET-PG-004 — PLATFORM PromptSet requires PLATFORM_GLOBAL context
A Tenant context receives no implicit PLATFORM PromptSet fallback. Trusted PLATFORM_GLOBAL service/operator context may read the exact PLATFORM PromptSet; timestamp ordering is preserved as stored rather than inferred.

### AIPROMPTSET-PG-005 — Foreign Tenant isolation
A foreign-Tenant PromptSet is hidden; its owning Tenant context may read the raw row.

### AIPROMPTSET-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed PromptSet UUID returns `null`; malformed UUID or database route/context mismatch fails closed before disclosure.

### AIPROMPTSET-PG-007 — Read-port boundary preserves prompt write governance
The dedicated AI Gateway role retains migration-owned PromptSet table privileges, but the DD-112 store exposes no create/update/delete/member-load/active-select/render/execute method. PLATFORM PromptSet mutation remains blocked for the AI Gateway role by the migration-0032 restrictive write floor.

## DD-113 AI ToolSetMember Raw Persistence Reader Acceptance

### AITOOLMEM-PG-001 — Exact visible member raw evidence
Exact member-id lookup in an authorized parent scope returns immutable ToolSet id, Tool Definition id, raw enabled state, normalized/frozen constraint JSON and created timestamp without effective/eligible/executable authority.

### AITOOLMEM-PG-002 — Sibling Industry parent isolation
A member whose ToolSet parent belongs to a sibling Industry Context is hidden; the exact sibling context may read its own raw member evidence.

### AITOOLMEM-PG-003 — Tenant-parent same-Tenant visibility
A member under a Tenant-owned ToolSet is visible from the same Tenant Core and Tenant Industry contexts. Raw enabled/constraint evidence is preserved rather than interpreted.

### AITOOLMEM-PG-004 — PLATFORM-parent member requires PLATFORM_GLOBAL
A Tenant context receives no implicit PLATFORM-parent member fallback. Trusted PLATFORM_GLOBAL service/operator context may read the exact child row.

### AITOOLMEM-PG-005 — Foreign Tenant parent isolation
A member under a foreign-Tenant ToolSet is hidden; the owning Tenant context may read it.

### AITOOLMEM-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed member UUID returns `null`; malformed UUID or database route/context mismatch fails closed before disclosure.

### AITOOLMEM-PG-007 — Raw child evidence is not effective membership or execution authority
The AI Gateway role retains migration-owned ToolSet-member DML privileges, but the DD-113 store exposes no create/update/delete/list/effective-resolution/constraint-evaluation/execute method. PLATFORM-parent mutation remains blocked by the existing write-governance policies.

## DD-114 AI PromptSetMember Raw Persistence Reader Acceptance

### AIPROMPTMEM-PG-001 — Exact visible member raw evidence
Exact member-id lookup in an authorized parent scope returns immutable PromptSet id, PromptTemplate id, raw integer priority, raw enabled state and created timestamp without effective/selected/renderable/executable authority.

### AIPROMPTMEM-PG-002 — Sibling Industry parent isolation
A member whose PromptSet parent belongs to a sibling Industry Context is hidden; the exact sibling context may read its own raw member evidence.

### AIPROMPTMEM-PG-003 — Tenant-parent same-Tenant visibility
A member under a Tenant-owned PromptSet is visible from the same Tenant Core and Tenant Industry contexts. Schema-valid priority values including zero/negative values and raw enabled evidence are preserved rather than strengthened.

### AIPROMPTMEM-PG-004 — PLATFORM-parent member requires PLATFORM_GLOBAL
A Tenant context receives no implicit PLATFORM-parent member fallback. Trusted PLATFORM_GLOBAL service/operator context may read the exact child row.

### AIPROMPTMEM-PG-005 — Foreign Tenant parent isolation
A member under a foreign-Tenant PromptSet is hidden; the owning Tenant context may read it.

### AIPROMPTMEM-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed member UUID returns `null`; malformed UUID or database route/context mismatch fails closed before disclosure.

### AIPROMPTMEM-PG-007 — Raw child evidence is not effective prompt selection/rendering/execution authority
The AI Gateway role retains migration-owned PromptSet-member DML privileges, but the DD-114 store exposes no create/update/delete/list/effective-resolution/render/execute method. PLATFORM-parent mutation remains blocked by existing write-governance policies.

## DD-115 AI PromptTemplate Raw Persistence Reader Acceptance

### AIPROMPTTPL-PG-001 — Exact Industry PromptTemplate raw evidence
Exact PromptTemplate-id lookup in the owning Industry Context returns immutable raw scope, code/version, system-template text, variable-schema JSON, grounding flag, override fields, lifecycle status, creator/approver references and timestamps without selected/approved/rendered/executable authority.

### AIPROMPTTPL-PG-002 — Sibling Industry isolation
An Industry PromptTemplate requested from a sibling Industry Context is hidden by FORCE-RLS; the exact sibling context may read its own raw persisted template.

### AIPROMPTTPL-PG-003 — Tenant same-Tenant visibility and raw-value preservation
A Tenant-owned PromptTemplate is visible from same-Tenant Core and Industry contexts. Schema-valid empty code/template text, duplicate/empty override fields and raw JSON are preserved rather than strengthened into invented policy constraints.

### AIPROMPTTPL-PG-004 — PLATFORM PromptTemplate requires PLATFORM_GLOBAL context
A Tenant context receives no implicit PLATFORM PromptTemplate fallback. Trusted PLATFORM_GLOBAL service/operator context may read the exact PLATFORM row. An approver reference remains persisted evidence rather than an independent approval verdict.

### AIPROMPTTPL-PG-005 — Foreign Tenant isolation
A foreign-Tenant PromptTemplate is hidden; its owning Tenant context may read the raw row.

### AIPROMPTTPL-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed PromptTemplate UUID returns `null`; malformed UUID or database route/context mismatch fails closed before disclosure.

### AIPROMPTTPL-PG-007 — Raw template evidence is not lifecycle/approval/render/execution authority
The AI Gateway role retains migration-owned PromptTemplate DML privileges, but the DD-115 store exposes no create/update/delete/active-select/variable-validation/override/render/execute method. PLATFORM mutation remains blocked by existing write governance.

## DD-116 AI Policy Raw Persistence Reader Acceptance

### AIPOLICY-PG-001 — Exact Industry AI Policy raw evidence
Exact policy-id lookup in the owning Industry Context returns immutable raw scope, code, priority, effect, condition AST, constraint JSON, version, status and timestamps without applicable/effective/decision authority.

### AIPOLICY-PG-002 — Sibling Industry isolation
An Industry AI Policy requested from a sibling Industry Context is hidden by FORCE-RLS; the exact sibling context may read its own raw policy evidence.

### AIPOLICY-PG-003 — Tenant same-Tenant visibility and raw-value preservation
A Tenant-owned AI Policy is visible from same-Tenant Core and Industry contexts. Schema-valid negative/zero priority, empty code/status and raw JSON are preserved rather than strengthened into invented policy grammar or lifecycle constraints.

### AIPOLICY-PG-004 — PLATFORM AI Policy requires PLATFORM_GLOBAL context
A Tenant context receives no implicit PLATFORM AI Policy fallback. Trusted PLATFORM_GLOBAL service/operator context may read the exact PLATFORM row. Raw `DENY` or `ALLOW` effect remains evidence rather than an evaluated decision.

### AIPOLICY-PG-005 — Foreign Tenant isolation
A foreign-Tenant AI Policy is hidden; its owning Tenant context may read the raw row.

### AIPOLICY-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed policy UUID returns `null`; malformed UUID or database route/context mismatch fails closed before disclosure.

### AIPOLICY-PG-007 — Raw policy evidence is not evaluator/execution authority
The AI Gateway role retains migration-owned AI Policy DML privileges, but the DD-116 store exposes no create/update/delete/list/sort/condition-evaluation/constraint-evaluation/decision/execute method. PLATFORM mutation remains blocked by existing write governance.

## DD-117 AI AssistantDefinition Raw Persistence Reader Acceptance

### AIASSIST-PG-001 — Exact Industry AssistantDefinition raw evidence
Exact AssistantDefinition-id lookup in the owning Industry Context returns immutable scope, raw code, allowed-capability set, RAG-scope JSON, prompt/tool/model/retention references, version, raw status and timestamps without selected/eligible/rendered/executable authority.

### AIASSIST-PG-002 — Sibling Industry isolation
An Industry AssistantDefinition requested from a sibling Industry Context is hidden by FORCE-RLS; the exact sibling context may read its own persisted definition.

### AIASSIST-PG-003 — Tenant same-Tenant visibility and raw-value preservation
A Tenant-owned AssistantDefinition is visible from same-Tenant Core and Industry contexts. Schema-valid empty code/status, empty capability set, nullable optional references and raw JSON are preserved rather than strengthened into invented lifecycle/runtime rules.

### AIASSIST-PG-004 — PLATFORM AssistantDefinition requires PLATFORM_GLOBAL context
A Tenant context receives no implicit PLATFORM Assistant fallback. Trusted PLATFORM_GLOBAL service/operator context may read the exact PLATFORM definition; timestamp ordering remains persisted evidence rather than an invented invariant.

### AIASSIST-PG-005 — Foreign Tenant isolation
A foreign-Tenant AssistantDefinition is hidden; its owning Tenant context may read the raw row.

### AIASSIST-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed AssistantDefinition UUID returns `null`; malformed UUID or database route/context mismatch fails closed before disclosure.

### AIASSIST-PG-007 — Persisted references are not current selection/render/RAG/tool-execution authority
After valid write-time insertion, referenced capability/PromptTemplate/ToolSet rows may later become non-ACTIVE without turning this raw reader into a revalidation or selection engine. The AI Gateway role retains migration-owned AssistantDefinition DML privileges, but the DD-117 store exposes no create/update/delete/active-select/capability-resolution/prompt-render/RAG-resolution/execute method. PLATFORM mutation remains blocked by existing write governance.

## DD-118 AI AgentDefinition Raw Persistence Reader Acceptance

### AIAGENTDEF-PG-001 — Exact Industry AgentDefinition raw evidence
Exact AgentDefinition-id lookup in the owning Industry Context returns immutable scope, raw code/objective/risk/status, allowed ToolSet, approval/budget policy references, version and timestamps without selected/authorized/approved/budget-satisfied/executable authority.

### AIAGENTDEF-PG-002 — Sibling Industry isolation
An Industry AgentDefinition requested from a sibling Industry Context is hidden by FORCE-RLS; the exact sibling context may read its own persisted definition.

### AIAGENTDEF-PG-003 — Tenant same-Tenant visibility and raw-value preservation
A Tenant-owned AgentDefinition is visible from same-Tenant Core and Industry contexts. Schema-valid empty code/objective/risk/status text is preserved rather than strengthened into invented enums or lifecycle rules.

### AIAGENTDEF-PG-004 — PLATFORM AgentDefinition requires PLATFORM_GLOBAL context
A Tenant context receives no implicit PLATFORM Agent fallback. Trusted PLATFORM_GLOBAL service/operator context may read the exact PLATFORM definition; timestamp ordering remains persisted evidence rather than an invented invariant.

### AIAGENTDEF-PG-005 — Foreign Tenant isolation
A foreign-Tenant AgentDefinition is hidden; its owning Tenant context may read the raw row and its distinct approval/budget references.

### AIAGENTDEF-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed AgentDefinition UUID returns `null`; malformed UUID or database route/context mismatch fails closed before disclosure.

### AIAGENTDEF-PG-007 — Persisted ToolSet/objective/risk/policy evidence is not agent execution authority
After valid write-time insertion, the referenced ToolSet may later become non-ACTIVE without turning this raw reader into a current selector. The AI Gateway role retains migration-owned AgentDefinition DML privileges, but the DD-118 store exposes no create/update/delete/active-select/plan/approve/budget-evaluate/execute method. PLATFORM mutation remains blocked by existing write governance.

## DD-119 AI TenantConfig Raw Persistence Reader Acceptance

### AITENCFG-PG-001 — Exact Tenant configuration raw evidence
Exact config-id lookup in the owning Tenant context returns immutable Tenant id, raw enabled state, capability/provider/model allowlists, sensitivity ceiling, policy references, positive version and updated timestamp without current/effective/provisioned authority.

### AITENCFG-PG-002 — Same-Tenant Core/Industry visibility
The same TenantAIConfig row is visible from Tenant Core and Tenant Industry RequestContexts because the table is Tenant-scoped rather than Industry-owned.

### AITENCFG-PG-003 — Foreign Tenant isolation
A foreign-Tenant TenantAIConfig row is hidden by FORCE-RLS; the owning Tenant may read the exact persisted row.

### AITENCFG-PG-004 — PLATFORM_GLOBAL does not bypass Tenant RLS
Trusted PLATFORM_GLOBAL context does not implicitly expose TenantAIConfig rows through the Tenant-scoped reader.

### AITENCFG-PG-005 — Exact versions remain distinct
Two persisted versions for the same Tenant remain independently addressable by id. Raw nullable/empty monthly-budget-policy evidence is preserved and the reader does not choose latest/current/effective configuration.

### AITENCFG-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed config UUID returns `null`; malformed UUID or database route/context mismatch fails closed before disclosure.

### AITENCFG-PG-007 — Database DML privilege is not application mutation/provisioning authority
The AI Gateway role retains migration-owned TenantAIConfig DML privileges, but the DD-119 store exposes no create/update/delete/latest/effective/provision/route/execute method.

## DD-120 AI IndustryAIConfig Raw Persistence Reader Acceptance

### AIINDCFG-PG-001 — Exact Industry configuration raw evidence
Exact config-id lookup in the owning Tenant+Industry Context returns immutable raw enablement, capability/provider/model allowlists, optional domain PromptSet reference, country-pack refs, optional localization-profile reference, positive version and updated timestamp without current/effective/provisioned authority.

### AIINDCFG-PG-002 — Tenant Core and sibling Industry non-visibility
Tenant Core and sibling Industry Contexts cannot read an IndustryAIConfig row; the exact owning Industry Context may read it.

### AIINDCFG-PG-003 — Foreign Tenant isolation
A foreign-Tenant IndustryAIConfig row is hidden; its owning Tenant+Industry Context may read the exact persisted row.

### AIINDCFG-PG-004 — PLATFORM_GLOBAL does not bypass Industry RLS
Trusted PLATFORM_GLOBAL context does not implicitly expose IndustryAIConfig rows through the exact-Industry reader.

### AIINDCFG-PG-005 — Exact versions remain distinct
Two persisted versions for one Industry Context remain independently addressable by id. Nullable/empty localization and optional PromptSet evidence is preserved; the reader does not choose latest/current/effective configuration or merge Tenant policy.

### AIINDCFG-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed config UUID returns `null`; malformed UUID or database route/context mismatch fails closed before disclosure.

### AIINDCFG-PG-007 — Database DML privilege is not application merge/provision authority
The AI Gateway role retains migration-owned IndustryAIConfig DML privileges, but the DD-120 store exposes no create/update/delete/latest/effective/Tenant-merge/provision/route/execute method.

## DD-121 AI Conversation Raw Persistence Reader Acceptance

### AICONV-PG-001 — Exact owner + Industry raw evidence
Exact conversation-id lookup by the owning principal in the exact Industry Context returns immutable raw scope/sensitivity/retention/status/timestamp evidence without messages, effective Assistant or executable authority.

### AICONV-PG-002 — Sibling Industry isolation
A Tenant-Industry conversation is hidden from a sibling Industry Context; the exact owning Industry Context may read it.

### AICONV-PG-003 — Tenant-Core owner visibility without history merge
A Tenant-Core conversation remains visible to its owner from same-Tenant Core and Industry RequestContexts because its persisted Industry Context is null. The reader does not list or merge history.

### AICONV-PG-004 — Same-Tenant principal isolation
A same-Tenant different principal cannot read another principal's conversation; that principal may read its own persisted conversation.

### AICONV-PG-005 — Foreign Tenant and PLATFORM_GLOBAL isolation
Foreign-Tenant and PLATFORM_GLOBAL contexts cannot bypass conversation FORCE-RLS; the foreign owning Tenant/principal context may read its own row.

### AICONV-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed UUID returns `null`; malformed UUID or database route/context mismatch fails closed. Schema-valid empty retention/status text and persisted timestamp ordering are preserved without strengthening.

### AICONV-PG-007 — Database DML remains schema-owned while read port adds no runtime authority
The AI Gateway role retains migration-owned conversation DML privileges, but the DD-121 store exposes no create/update/delete/list/message/history/Assistant-selection/retention/execute method.

## DD-122 AI TokenUsage Raw Persistence Reader Acceptance

### AIUSAGE-PG-001 — Exact Industry usage raw evidence
Exact usage-id lookup in the owning Industry Context returns immutable Tenant/Industry/principal attribution, capability/provider/model references, exact PostgreSQL numeric-text units, occurrence timestamp and correlation id without selected/eligible/cost/billable/executable authority.

### AIUSAGE-PG-002 — Sibling Industry isolation
An Industry usage row is hidden from a sibling Industry Context; the exact sibling context may read its own raw usage evidence.

### AIUSAGE-PG-003 — Tenant-Core usage same-Tenant visibility
A Tenant-Core usage row is visible from same-Tenant Core and Industry contexts. Nullable principal evidence and raw numeric-text units are preserved without aggregation or policy interpretation.

### AIUSAGE-PG-004 — Principal id is attribution, not TokenUsage RLS ownership
A different active current principal in the same authorized Tenant/Industry context may read a row attributed to another principal because the persisted TokenUsage RLS predicate is Tenant/Industry scoped rather than principal scoped.

### AIUSAGE-PG-005 — Foreign Tenant and PLATFORM_GLOBAL isolation
Foreign-Tenant and PLATFORM_GLOBAL contexts cannot bypass TokenUsage FORCE-RLS; the owning Tenant/Industry context may read its row.

### AIUSAGE-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed usage UUID returns `null`; malformed UUID or database route/context mismatch fails closed before disclosure.

### AIUSAGE-PG-007 — Historical usage evidence is not routing/billing/quota/execution authority
Historical provider/model/capability references remain readable even after those catalog rows are retired. The AI Gateway role retains migration-owned TokenUsage DML privileges, but the DD-122 store exposes no create/update/delete/aggregate/cost/quota/route/execute method.

## DD-123 AI Cost Raw Persistence Reader Acceptance

### AICOST-PG-001 — Exact Industry cost raw evidence
Exact usage-id lookup in the owning Industry Context returns immutable raw currency, exact PostgreSQL bigint-text estimated minor units, provider-rate version, billable class and optional finalized timestamp without computed/invoice/finalization authority.

### AICOST-PG-002 — Sibling Industry isolation
An Industry cost row is hidden from a sibling Industry Context; the exact sibling context may read its raw cost evidence.

### AICOST-PG-003 — Tenant-Core same-Tenant visibility
A Tenant-Core cost row is visible from same-Tenant Core and Industry contexts. Zero estimated units and schema-valid empty raw rate-version/billable text remain persisted evidence rather than strengthened semantics.

### AICOST-PG-004 — Parent principal attribution is not cost-row read ownership
A different active principal in the same authorized Tenant/Industry context may read cost whose TokenUsage parent is attributed to another principal because Cost visibility derives from TokenUsage Tenant/Industry RLS rather than principal ownership.

### AICOST-PG-005 — Foreign Tenant and PLATFORM_GLOBAL isolation
Foreign-Tenant and PLATFORM_GLOBAL contexts cannot bypass the parent-derived cost visibility; the owning Tenant/Industry context may read its row.

### AICOST-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed usage UUID returns `null`; malformed UUID or database route/context mismatch fails closed before disclosure.

### AICOST-PG-007 — Raw cost evidence is not pricing/billing/finalization/execution authority
The AI Gateway role retains migration-owned Cost DML privileges, but the DD-123 store exposes no create/update/delete/aggregate/rate/currency-conversion/finalize/invoice/execute method.

## DD-124 AI ProvisioningSnapshot Raw Persistence Reader Acceptance

### AIPROVSNAP-PG-001 — Exact Industry snapshot raw evidence
Exact snapshot-id lookup in the owning Industry Context returns immutable Tenant/Industry ownership, exact bigint-text version evidence, frozen pack maps, frozen governed/raw allowlists, optional budget-policy reference, raw lifecycle status and timestamps without current/effective/authorized authority.

### AIPROVSNAP-PG-002 — Sibling Industry isolation
An Industry snapshot is hidden from a sibling Industry Context; the exact sibling context may read its raw persisted snapshot.

### AIPROVSNAP-PG-003 — Tenant-Core same-Tenant visibility and raw lifecycle preservation
A Tenant-Core snapshot is visible from same-Tenant Core and Industry contexts. Nullable Industry activation evidence, SUPERSEDED status, schema-valid empty budget-policy text and an already elapsed valid-until timestamp remain persisted evidence rather than being converted into selection/validity decisions.

### AIPROVSNAP-PG-004 — Snapshot visibility is not principal-private
A different active principal in the same authorized Tenant/Industry context may read the same snapshot because ProvisioningSnapshot RLS is Tenant/Industry scoped rather than principal scoped.

### AIPROVSNAP-PG-005 — Foreign Tenant and PLATFORM_GLOBAL isolation
Foreign-Tenant and PLATFORM_GLOBAL contexts cannot bypass ProvisioningSnapshot FORCE-RLS; the owning Tenant/Industry context may read the exact row.

### AIPROVSNAP-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed snapshot UUID returns `null`; malformed UUID or database route/context mismatch fails closed before disclosure.

### AIPROVSNAP-PG-007 — Raw snapshot evidence is not current/compile/authorize/route/execute authority
The AI Gateway role retains migration-owned ProvisioningSnapshot DML privileges, but the DD-124 store exposes no create/update/delete/current-selector/compile/revalidate/authorize/route/execute method.

## DD-125 AI MediaRequest Raw Persistence Reader Acceptance

### AIMEDIAREQ-PG-001 — Exact Industry request raw evidence
Exact MediaRequest-id lookup in the owning Industry Context returns immutable ownership, principal attribution, raw capability, constrained media type, prompt/version evidence, exact bigint-text brand version, frozen input-document refs, sensitivity/residency/moderation/status fields and timestamps without generated/moderated/published/authorized authority.

### AIMEDIAREQ-PG-002 — Sibling Industry isolation
A MediaRequest owned by a sibling Industry Context is hidden; the exact sibling context may read its own persisted request evidence.

### AIMEDIAREQ-PG-003 — Tenant-Core same-Tenant visibility and nullable/raw preservation
A Tenant-Core request is visible from same-Tenant Tenant Core and Tenant Industry contexts. Nullable prompt/brand fields, raw localization/moderation/status evidence and completed timestamp are preserved without reinterpretation.

### AIMEDIAREQ-PG-004 — SELECT visibility is scope-based, not principal-private
Another active principal in the same visible Industry scope may read the request and receives the original persisted principal attribution; write-time principal equality is not invented as a SELECT restriction.

### AIMEDIAREQ-PG-005 — Foreign Tenant and PLATFORM_GLOBAL isolation
A foreign-Tenant request is hidden while its owning context may read it. PLATFORM_GLOBAL context does not bypass Tenant/Industry MediaRequest RLS.

### AIMEDIAREQ-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed MediaRequest UUID returns `null`; malformed UUID or database route/context mismatch fails closed before disclosure.

### AIMEDIAREQ-PG-007 — Raw request evidence is not generation/moderation/publication/execution authority
The AI Gateway role retains migration-owned MediaRequest DML privileges, but the DD-125 store exposes no create/update/delete/render/generate/moderate/publish/route/execute method.

## DD-126 AIMessage Raw Persistence Reader Acceptance

### AIMSG-PG-001 — Exact visible Industry message raw evidence
Exact message-id lookup through the owning Conversation returns immutable raw role/content/source JSON/model-route/timestamp evidence without decrypted/authorized-source/selected-model authority.

### AIMSG-PG-002 — Sibling Industry parent isolation
A message whose parent Conversation belongs to a sibling Industry Context is hidden; the exact sibling owner context may read its own message.

### AIMSG-PG-003 — Tenant-Core parent visibility
A Tenant-Core parent message remains visible to its owner from Tenant Core and same-Tenant Industry contexts. Empty raw text, nullable fields and schema-valid timestamp ordering are preserved.

### AIMSG-PG-004 — Principal-private parent boundary
A different same-Tenant principal cannot read another principal's message; its own parent Conversation/message remains visible.

### AIMSG-PG-005 — Foreign Tenant and PLATFORM_GLOBAL isolation
Foreign-Tenant and PLATFORM_GLOBAL contexts cannot bypass the parent Conversation RLS boundary.

### AIMSG-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed UUID returns `null`; malformed UUID or route/context mismatch fails closed.

### AIMSG-PG-007 — Raw message evidence is not runtime authority
The AI Gateway role retains migration-owned message DML, while the DD-126 store exposes no create/update/delete/list-history/decrypt/source-resolve/model-route/retention/execute method.

## DD-127 AI RAGSource Raw Persistence Reader Acceptance

### AIRAGSRC-PG-001 — Exact Industry source raw evidence
Exact source-id lookup in the owning Industry Context returns immutable raw registration metadata, exact bigint-text source version and persisted timestamps without retrievable/authorized/embedded authority.

### AIRAGSRC-PG-002 — Sibling Industry isolation
A RAGSource in a sibling Industry Context is hidden; the exact sibling context may read its own raw source evidence.

### AIRAGSRC-PG-003 — Tenant-Core same-Tenant visibility
A Tenant-Core RAGSource is visible from the same Tenant Core and Tenant Industry contexts. Schema-valid raw empty/null text/document/ACL evidence remains unstrengthened.

### AIRAGSRC-PG-004 — Scope-based rather than principal-private visibility
A different principal in the same visible Tenant+Industry scope may read the RAGSource because the persisted RLS policy does not predicate on principal id.

### AIRAGSRC-PG-005 — Foreign Tenant and PLATFORM_GLOBAL isolation
Foreign-Tenant and PLATFORM_GLOBAL contexts cannot read a Tenant RAGSource; the exact owning foreign-Tenant context may read its own source row.

### AIRAGSRC-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed source UUID returns `null`; malformed UUID or database route/context mismatch fails closed.

### AIRAGSRC-PG-007 — Raw source registration is not retrieval/authorization/execution authority
The AI Gateway role retains migration-owned RAGSource DML privileges, but the DD-127 store exposes no create/update/delete/list-chunks/document-revalidation/ACL-evaluation/retrieve/embed/search/execute method.

## DD-128 AI RAGChunk Raw Metadata Reader Acceptance

### AIRAGCHUNK-PG-001 — Exact Industry chunk returns immutable non-vector metadata
Exact chunk-id lookup in the owning Industry Context returns immutable raw chunk metadata while excluding the persisted embedding vector payload and without adding authorized/relevance authority.

### AIRAGCHUNK-PG-002 — Sibling Industry chunk isolation
A chunk owned by a sibling Industry Context is hidden; the exact sibling context may read its own raw metadata.

### AIRAGCHUNK-PG-003 — Tenant-Core chunk same-Tenant visibility
A Tenant-Core chunk is visible from the same Tenant Core and Tenant Industry contexts. Schema-valid empty/raw text and immutable JSON evidence are preserved rather than strengthened.

### AIRAGCHUNK-PG-004 — RAGChunk visibility is scope-based rather than principal-private
A different active principal in the same visible Tenant/Industry scope may read the chunk because the persisted RLS policy does not predicate on principal ownership.

### AIRAGCHUNK-PG-005 — Foreign Tenant and PLATFORM_GLOBAL isolation
A foreign-Tenant context and a PLATFORM_GLOBAL context cannot expose a Tenant-owned RAGChunk; the owning Tenant/Industry context may read it.

### AIRAGCHUNK-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed chunk UUID returns `null`; malformed UUID or database route/context mismatch fails closed before disclosure.

### AIRAGCHUNK-PG-007 — Raw metadata is not ACL/vector/retrieval/grounding/inference authority
A referenced embedding model may later be RETIRED without changing the persisted row. The DD-128 store exposes no create/update/delete/vector-load/ACL-evaluate/retrieve/search/rerank/ground/execute method, and raw ACL/model/text/hash/metadata evidence does not authorize retrieval or inference.

## DD-129 AI MemoryRecord Raw Persistence Reader Acceptance

### AIMEM-PG-001 — Exact principal-owned Industry memory raw evidence
Exact MemoryRecord-id lookup in the owning principal + Industry Context returns immutable Tenant/Industry/principal ownership, memory/content/source/sensitivity/retention/ACL/status/expiry/supersession evidence without current/authorized/decrypted authority.

### AIMEM-PG-002 — Sibling Industry isolation
An Industry-scoped memory row requested from a sibling Industry Context is hidden; the exact owning Industry Context may read the raw row.

### AIMEM-PG-003 — Principal-private versus scope-shared memory
Another principal cannot read a principal-owned memory row. A row with `principal_id IS NULL` is visible within the same governed scope because the persisted RLS policy intentionally treats it as scope-shared evidence.

### AIMEM-PG-004 — Tenant-Core visibility is not automatic cross-context history carry
A same-principal Tenant-Core MemoryRecord is visible from Tenant Core and same-Tenant Industry contexts according to the persisted RLS predicate, including schema-valid raw empty text. The reader exposes no history-list/carry semantics and does not turn this raw visibility into automatic Industry-context history reuse.

### AIMEM-PG-005 — Foreign Tenant and PLATFORM_GLOBAL isolation
A foreign-Tenant context cannot expose the row, and trusted PLATFORM_GLOBAL context does not bypass Tenant MemoryRecord RLS.

### AIMEM-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed memory UUID returns `null`; malformed UUID or database route/context mismatch fails closed before disclosure.

### AIMEM-PG-007 — Raw lifecycle/ACL/supersession evidence is not current/retrieval/retention/execution authority
ACTIVE/SUPERSEDED/ERASED/EXPIRED, expiry, supersedes, ACL, retention and raw content/source fields remain persistence evidence only. The DD-129 store exposes no create/update/delete/list/current-selection/supersession-resolution/ACL-evaluation/decrypt/retention/execute method.

## DD-130 AI AgentRun Raw Persistence Reader Acceptance

### AIAGENTRUN-PG-001 — Exact principal-owned Industry run evidence
Exact run-id lookup returns immutable raw AgentRun evidence, including exact bigint-text startup versions and frozen requested-resource-scope JSON, without authorized/resumable/executable authority.

### AIAGENTRUN-PG-002 — Sibling Industry isolation
An Industry-scoped AgentRun is hidden from a sibling Industry Context; the matching sibling context may read its own run.

### AIAGENTRUN-PG-003 — Acting-principal privacy
Another principal in the same Tenant/Industry cannot read the run; the owning principal may read its own persisted run.

### AIAGENTRUN-PG-004 — Tenant-Core visibility is not continuation authority
A Tenant-Core run is same-principal/same-Tenant visible from Tenant Core and Tenant Industry contexts, while raw status/version/scope evidence does not authorize cross-context continuation.

### AIAGENTRUN-PG-005 — Foreign Tenant and PLATFORM_GLOBAL isolation
Foreign-Tenant and PLATFORM_GLOBAL contexts cannot expose Tenant AgentRun rows.

### AIAGENTRUN-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed UUID returns `null`; malformed id or database route/context mismatch fails closed.

### AIAGENTRUN-PG-007 — Startup evidence is not current authorization/resume/tool execution authority
The AI Gateway role retains migration-owned AgentRun DML privileges, but the DD-130 store exposes no create/update/delete/list/current-selection/steps/approvals/resume/execute method.

## DD-131 AI AgentStep Raw Persistence Reader Acceptance

### AIAGENTSTEP-PG-001 — Exact visible step evidence
Exact step-id lookup returns immutable raw AgentStep evidence without current/authorized/executable semantics.

### AIAGENTSTEP-PG-002 — Sibling Industry isolation
A step under an Industry AgentRun is hidden from a sibling Industry Context.

### AIAGENTSTEP-PG-003 — Acting-principal privacy inheritance
Another principal in the same Tenant/Industry cannot read the step under the first principal's AgentRun.

### AIAGENTSTEP-PG-004 — Tenant-Core parent visibility is not continuation authority
A Tenant-Core AgentRun step is same-principal/same-Tenant visible from Core and Industry contexts without becoming automatic continuation/next-step authority.

### AIAGENTSTEP-PG-005 — Foreign Tenant and PLATFORM_GLOBAL isolation
Foreign-Tenant and PLATFORM_GLOBAL contexts cannot expose the step.

### AIAGENTSTEP-PG-006 — Missing/malformed/route mismatch behavior
Missing well-formed id returns `null`; malformed id or route/context mismatch fails closed.

### AIAGENTSTEP-PG-007 — Raw step fields are not current eligibility/approval/execution authority
The store exposes no mutation/list/plan/next-step/tool-binding-resolution/approval-resolution/execute method; migration-owned DML privileges remain unchanged.

## DD-132 AI AgentApproval Raw Persistence Reader Acceptance

### AIAGENTAPP-PG-001 — Exact Industry approval evidence
Exact approval-id lookup returns immutable raw scope/status/permission/approver/timestamp evidence without approval-satisfied/resumable/executable semantics.

### AIAGENTAPP-PG-002 — Sibling Industry isolation
An Industry approval is hidden from a sibling Industry Context; its exact context may read it.

### AIAGENTAPP-PG-003 — Tenant-Core visibility and raw evidence preservation
A Tenant-Core approval is same-Tenant visible from Core and Industry contexts; schema-valid empty and nullable evidence remains raw.

### AIAGENTAPP-PG-004 — Scope-only RLS is not approver authority
Another principal in the same Tenant/Industry may read approval evidence because AgentApproval RLS is scope-only; the read result confers no approval authority.

### AIAGENTAPP-PG-005 — Foreign Tenant and PLATFORM_GLOBAL isolation
Foreign-Tenant and PLATFORM_GLOBAL contexts cannot expose Tenant approval rows.

### AIAGENTAPP-PG-006 — Missing/malformed/route mismatch behavior
Missing well-formed id returns `null`; malformed id or route/context mismatch fails closed.

### AIAGENTAPP-PG-007 — APPROVED persistence is not current satisfaction/resume/execution authority
Migration-owned DML privileges remain unchanged; the DD-132 store exposes no mutation/revalidation/satisfaction/resume/tool-execution method.

## DD-133 MetadataDefinition Raw Persistence Reader Acceptance

### METADATADEF-PG-001 — Exact Industry definition raw evidence
Exact MetadataDefinition-id lookup in the owning Industry Context returns immutable scope, code/kind, version/status, frozen schema JSON, schema version, creator/approver and timestamp evidence without selected/validated/effective/compiled authority.

### METADATADEF-PG-002 — Sibling Industry isolation
A sibling-Industry MetadataDefinition is hidden by FORCE-RLS; its exact Industry Context may read the row.

### METADATADEF-PG-003 — Tenant definition same-Tenant visibility and raw evidence preservation
A Tenant-owned definition is visible from same-Tenant Core and Industry contexts. Schema-valid empty code/kind, nullable approver and unordered effective timestamps remain raw persistence facts.

### METADATADEF-PG-004 — PLATFORM definition requires PLATFORM_GLOBAL
Tenant contexts receive no implicit PLATFORM MetadataDefinition fallback. Trusted PLATFORM_GLOBAL service/operator context may read the exact PLATFORM row.

### METADATADEF-PG-005 — Foreign Tenant isolation
A foreign-Tenant definition is hidden; the owning Tenant context may read its raw row.

### METADATADEF-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed UUID returns `null`; malformed id or database route/context mismatch fails closed before disclosure.

### METADATADEF-PG-007 — Raw ACTIVE/schema/effective evidence is not selection/validation/compile authority
The application role retains migration-owned MetadataDefinition DML privileges, but DD-133 exposes no create/update/delete/current-selection/effective-resolution/schema-validation/compile method.

## DD-134 RuleDefinition Raw Persistence Reader Acceptance

### RULEDEF-PG-001 — Exact Industry definition raw evidence
Exact RuleDefinition-id lookup in the owning Industry Context returns immutable scope, code/version/status/schema-version, frozen input-schema/condition-AST/decision JSON, raw priority/safety/permission, creator/approver and timestamp evidence without selected/evaluated/authorized/applied authority.

### RULEDEF-PG-002 — Sibling Industry isolation
A sibling-Industry RuleDefinition is hidden by FORCE-RLS; its exact Industry Context may read the row.

### RULEDEF-PG-003 — Tenant definition same-Tenant visibility and raw evidence preservation
A Tenant-owned RuleDefinition is visible from same-Tenant Core and Industry contexts. Schema-valid empty code/permission, negative priority, nullable approver and unordered effective timestamps remain raw persistence facts.

### RULEDEF-PG-004 — PLATFORM definition requires PLATFORM_GLOBAL
Tenant contexts receive no implicit PLATFORM RuleDefinition fallback. Trusted PLATFORM_GLOBAL service/operator context may read the exact PLATFORM row.

### RULEDEF-PG-005 — Foreign Tenant isolation
A foreign-Tenant RuleDefinition is hidden; the owning Tenant context may read its raw row.

### RULEDEF-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed UUID returns `null`; malformed id or database route/context mismatch fails closed before disclosure.

### RULEDEF-PG-007 — Raw rule evidence is not selection/evaluation/authorization/application authority
The application role retains migration-owned table privileges subject to current RLS/write floors, but DD-134 exposes no create/update/delete/current-selection/effective-resolution/evaluate/authorize/apply method.

## DD-135 FormDefinition Raw Persistence Reader Acceptance

### FORMDEF-PG-001 — Exact Industry parent definition raw evidence
Exact FormDefinition-id lookup in the owning Industry Context returns immutable parent scope, code/version/status/schema-version, purpose/submit references, frozen layout JSON and raw validation-rule/surface arrays, creator/approver and timestamp evidence without field/render/validation/submit authority.

### FORMDEF-PG-002 — Sibling Industry isolation
A sibling-Industry FormDefinition is hidden by FORCE-RLS; its exact Industry Context may read the row.

### FORMDEF-PG-003 — Tenant definition same-Tenant visibility and raw evidence preservation
A Tenant-owned FormDefinition is visible from same-Tenant Core and Industry contexts. Schema-valid empty text, duplicate/null array elements, nullable approver and unordered effective timestamps remain raw persistence facts.

### FORMDEF-PG-004 — PLATFORM definition requires PLATFORM_GLOBAL
Tenant contexts receive no implicit PLATFORM FormDefinition fallback. Trusted PLATFORM_GLOBAL service/operator context may read the exact PLATFORM row.

### FORMDEF-PG-005 — Foreign Tenant isolation
A foreign-Tenant FormDefinition is hidden; the owning Tenant context may read its raw row.

### FORMDEF-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed UUID returns `null`; malformed id or database route/context mismatch fails closed before disclosure.

### FORMDEF-PG-007 — Raw form evidence is not field/render/validation/submit authority
The application role retains migration-owned table privileges subject to current RLS/write floors, but DD-135 exposes no create/update/delete/current-selection/list-fields/compile/render/validate/submit method.

## DD-136 FormFieldDefinition Raw Persistence Reader Acceptance

### FORMFIELD-PG-001 — Exact Industry-parent field raw evidence
Exact FormFieldDefinition-id lookup in the owning Industry Context returns immutable parent id, raw key/type/label/required/read-only/visibility/validation/reference/sort/sensitivity and created timestamp evidence without field enforcement/render/validation/catalog/access/submit authority.

### FORMFIELD-PG-002 — Sibling Industry parent-scope isolation
A FormFieldDefinition under a sibling-Industry FormDefinition is hidden by parent-derived FORCE-RLS; its exact Industry Context may read the child.

### FORMFIELD-PG-003 — Tenant-parent same-Tenant visibility and raw evidence preservation
A child under a Tenant FormDefinition is visible from same-Tenant Core and Industry contexts even when the parent is non-ACTIVE. Schema-valid empty text, nullable references, negative sort order and raw validation JSON remain persistence facts.

### FORMFIELD-PG-004 — PLATFORM-parent field requires PLATFORM_GLOBAL
Tenant contexts receive no implicit PLATFORM-parent field fallback. Trusted PLATFORM_GLOBAL service/operator context may read the exact child.

### FORMFIELD-PG-005 — Foreign Tenant parent isolation
A child under a foreign-Tenant FormDefinition is hidden; the owning Tenant context may read its raw row.

### FORMFIELD-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed UUID returns `null`; malformed id or database route/context mismatch fails closed before disclosure.

### FORMFIELD-PG-007 — Raw field evidence is not enforcement/render/validation/catalog/access/submit authority
The application role retains migration-owned table privileges subject to parent-derived RLS and PLATFORM-parent write floors, but DD-136 exposes no create/update/delete/list/sort/render/validate/evaluate-visibility/resolve-catalog/submit method.

## DD-137 CountryPack Raw Persistence Reader Acceptance

### COUNTRYPACK-PG-001 — Exact global catalog row raw evidence
Exact CountryPack-id lookup returns immutable country/code/version/status, raw locale/default/reference evidence, normalized immutable address/phone/metadata JSON, approver and timestamp evidence without current/effective/activated/materialized authority.

### COUNTRYPACK-PG-002 — Global read requires no Tenant/Industry RequestContext
CountryPack is a platform/reference global-read catalog rather than a Tenant-RLS table. The ordinary application role may read the exact row with cleared Tenant/Industry/scope settings; no Tenant or Industry visibility is invented.

### COUNTRYPACK-PG-003 — Lifecycle/effective evidence stays raw
DRAFT, RETIRED and future-effective rows remain readable as persisted evidence. Status or `effective_from` is not converted into current/effective/activated selection.

### COUNTRYPACK-PG-004 — Raw locale/default/nullable evidence is preserved
Locale-array order/duplicates/null elements, schema-valid empty text, nullable defaults and nullable JSON remain raw persistence facts; no locale/currency/timezone/date/address/phone vocabulary or default interpretation is added.

### COUNTRYPACK-PG-005 — Missing/malformed behavior
A missing well-formed UUID returns `null`; malformed id fails closed before SQL.

### COUNTRYPACK-PG-006 — Runtime application role is SELECT-only
`sbg_app_rw` retains SELECT and has no INSERT/UPDATE/DELETE on `core_config.country_pack`; Control Plane mutation ownership remains schema-owned.

### COUNTRYPACK-PG-007 — Raw pack evidence is not selection/activation/materialization/authorization authority
DD-137 exposes no current-selection, activation/deactivation, Tenant override merge, materialization, permission/entitlement grant or mutation method.

## DD-138 TenantCountryPackActivation Raw Persistence Reader Acceptance

### TENANTPACK-PG-001 — Exact Tenant activation raw evidence
Exact activation-id lookup in the owning Tenant returns immutable activation/Tenant/CountryPack identifiers, constrained raw status, frozen override JSON, optional timestamps and exact PostgreSQL bigint row-version text without current/effective/applied/materialized authority.

### TENANTPACK-PG-002 — Same-Tenant Core and Industry visibility
TenantCountryPackActivation uses Tenant-only FORCE-RLS. The same owning row is visible from Tenant Core and Tenant Industry contexts for that Tenant; Industry Context is not added as a selector.

### TENANTPACK-PG-003 — Foreign Tenant isolation
A foreign-Tenant activation is hidden by FORCE-RLS; the owning Tenant context may read its exact raw row.

### TENANTPACK-PG-004 — PLATFORM_GLOBAL does not bypass Tenant RLS
Trusted PLATFORM_GLOBAL context does not make Tenant-owned CountryPack activation visible without a Tenant id.

### TENANTPACK-PG-005 — Raw lifecycle/timestamp/override/row-version evidence is preserved
PENDING/DISABLED status, nullable or non-ordered lifecycle timestamps, frozen raw override JSON and zero/negative bigint row-version evidence remain persisted facts; they do not become current/effective/applied/materialized configuration.

### TENANTPACK-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed UUID returns `null`; malformed id or database route/context mismatch fails closed before disclosure.

### TENANTPACK-PG-007 — Schema-owned DML/ownership is not application-port activation authority
The ordinary application role retains migration-owned DML subject to Tenant RLS and immutable Tenant ownership, while DD-138 exposes no create/update/delete/current-selection/activate/deactivate/override-merge/materialize/default-application/AI-eligibility method.

## DD-139 BrandConfiguration Raw Persistence Reader Acceptance

### BRANDCFG-PG-001 — Exact Industry BrandConfiguration raw evidence
Exact BrandConfiguration-id lookup returns immutable owner/scope/code/version/lifecycle/accessibility evidence, immutable raw token/typography JSON, raw logo/favicon/creator/approver UUID references and audit timestamps without hierarchy/render/document-access authority.

### BRANDCFG-PG-002 — Exact Industry scope isolation
An Industry-owned row is hidden from sibling Industry Context and visible only to its exact Tenant + Industry Context under FORCE-RLS.

### BRANDCFG-PG-003 — Tenant row same-Tenant visibility and raw non-ACTIVE evidence
Tenant-owned BrandConfiguration is visible from same-Tenant Core and Industry contexts. DRAFT/FAIL, schema-valid empty code, raw JSON, null references and duplicate/null JSON-array elements remain persisted evidence only.

### BRANDCFG-PG-004 — PLATFORM row requires PLATFORM_GLOBAL and is not Tenant fallback
PLATFORM BrandConfiguration is hidden from Tenant contexts and visible only in trusted PLATFORM_GLOBAL context. Raw PLATFORM evidence is not automatically resolved/applied to a Tenant.

### BRANDCFG-PG-005 — Foreign Tenant isolation and ACTIVE/PASS non-resolution
Foreign-Tenant configuration remains hidden. ACTIVE + accessibility PASS remains database-valid raw evidence and is not converted into current/resolved/effective/protected-token-applied authority.

### BRANDCFG-PG-006 — Missing/malformed/route mismatch fail closed
Missing well-formed UUID returns `null`; malformed id and mismatched Data Home route/context fail closed.

### BRANDCFG-PG-007 — Raw brand evidence adds no hierarchy/render/document authority
Existing application-role DML and migration-0032 PLATFORM write floor remain schema-owned. The read port exposes no create/update/delete, current selection, hierarchy resolution, protected-token enforcement, accessibility validation, theme rendering or logo/favicon document-loading method.

## DD-140 DataExportRequest Raw Persistence Reader Acceptance

### DATAEXPORT-PG-001 — Exact Tenant-Industry export raw evidence
Exact DataExportRequest-id lookup in the owning Industry Context returns immutable Tenant/Industry/requester/subject/scope/export/resource/residency/sensitivity/status/approval/document/expiry/timestamp evidence without approval, generation, download or authorization authority.

### DATAEXPORT-PG-002 — Sibling Industry isolation
A Tenant-Industry DataExportRequest is hidden from a sibling Industry Context; its exact Industry Context may read the row.

### DATAEXPORT-PG-003 — Tenant-Core same-Tenant visibility is not requester-private
A Tenant-Core DataExportRequest is visible from same-Tenant Core and Tenant Industry contexts under the final FORCE-RLS policy. A different active principal in the same Tenant may read the row; requester identity is evidence, not an RLS ownership predicate.

### DATAEXPORT-PG-004 — Foreign Tenant and PLATFORM_GLOBAL isolation
Foreign-Tenant and PLATFORM_GLOBAL contexts do not bypass DataExportRequest FORCE-RLS. The owning Tenant context may read its raw row.

### DATAEXPORT-PG-005 — Lifecycle/reference/expiry evidence stays raw
Persisted status, approval/document references, requested resource classes, residency-policy version and expiry remain raw evidence. Duplicate/null/empty resource-class values and an expiry preceding creation remain preserved when physically schema-valid; none becomes current authorization, generation or download authority.

### DATAEXPORT-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed UUID returns `null`; malformed id or database route/context mismatch fails closed before disclosure.

### DATAEXPORT-PG-007 — Raw export evidence is not export-operation authority
Existing application-role DML, immutable scope columns and migration-0031 relationship integrity remain schema-owned, while DD-140 exposes no create/update/delete/list/approve/generate/download/authorize/document-revalidation/residency-resolution method.

## DD-141 SubscriptionTransition Raw Persistence Reader Acceptance

### SUBTRANS-PG-001 — Exact Tenant transition raw evidence
Exact SubscriptionTransition-id lookup returns immutable Tenant/subscription/state/trigger/actor/source-event/reason/occurrence/correlation evidence without converting it into lifecycle legality, current-state or replay authority.

### SUBTRANS-PG-002 — Tenant-owned visibility from Core and Industry contexts
Because SubscriptionTransition RLS is Tenant-only, the same owning Tenant transition is visible from both TENANT_CORE and TENANT_INDUSTRY contexts for that Tenant.

### SUBTRANS-PG-003 — Foreign Tenant and PLATFORM_GLOBAL isolation
Foreign-Tenant and PLATFORM_GLOBAL contexts do not bypass Tenant FORCE-RLS.

### SUBTRANS-PG-004 — Nullable/raw evidence remains unstrengthened
Nullable from-state, actor, source-event and reason fields remain absent when null; schema-valid empty trigger/reason text remains raw persisted evidence.

### SUBTRANS-PG-005 — Equal states and arbitrary chronology remain evidence only
Schema-valid equal from/to states and arbitrary past/future occurred-at evidence are preserved and are not interpreted as legal/current/replayable/authorized transition semantics.

### SUBTRANS-PG-006 — Missing/malformed/route mismatch fail closed
Missing well-formed UUID returns `null`; malformed id and mismatched Data Home route/context fail closed.

### SUBTRANS-PG-007 — Append-only write ownership remains schema-owned
Ordinary application role remains SELECT-only. Dedicated Commercial transition compiler remains SELECT+INSERT with no UPDATE/DELETE. The read port exposes no create/update/delete/list/latest/execute/authorize/replay/publish method.

## DD-142 OrgUnitIndustry Raw Persistence Reader Acceptance

### ORGIND-PG-001 — Exact Industry-private link raw evidence
Exact OrgUnit id lookup in the owning Tenant Industry context returns immutable Tenant/OrgUnit/Industry ownership, raw lifecycle status and normalized immutable config JSON without activation, hierarchy or authorization authority.

### ORGIND-PG-002 — Exact Industry isolation
The same OrgUnit may have independently persisted links in multiple Industry Contexts. FORCE-RLS exposes only the link for the exact current Tenant + Industry Context; a sibling context cannot see another link.

### ORGIND-PG-003 — No Tenant-Core / foreign-Tenant / PLATFORM_GLOBAL bypass
The read port requires a resolved TENANT_INDUSTRY context. Tenant-Core and PLATFORM_GLOBAL contexts fail closed, while a foreign-Tenant Industry context cannot see another Tenant's link.

### ORGIND-PG-004 — Status/config evidence stays raw
ACTIVE, SUSPENDED and ARCHIVED status plus arbitrary schema-valid config JSON remain persisted evidence only. The reader does not infer effective/current status, OrgUnit/Industry activation, authorization or config materialization.

### ORGIND-PG-005 — No cross-Industry fallback
A shared OrgUnit id may resolve to distinct exact-context links. Missing linkage in the current Industry Context returns `null`; no fallback to another Industry Context is permitted.

### ORGIND-PG-006 — Missing/malformed/route mismatch behavior
A missing well-formed OrgUnit UUID returns `null`; malformed id or Data Home route/context mismatch fails closed.

### ORGIND-PG-007 — Raw link read does not become mutation or authorization authority
Existing application-role table DML and migration-0029 immutable Tenant/Industry ownership remain schema-owned. The DD-142 port exposes no create/update/delete/list/activate/deactivate, hierarchy resolution, config resolution, document authorization or workflow-assignment authorization method.

## DD-143 UsageMeter Raw Persistence Reader Acceptance

### USAGEMETER-PG-001 — Exact Tenant-Core meter preserves lossless raw evidence
Exact UsageMeter-id lookup in the owning Tenant-Core context returns immutable Tenant ownership, raw meter/period text, exact PostgreSQL numeric evidence, exact bigint version and updated timestamp without JavaScript-number coercion or usage semantics.

### USAGEMETER-PG-002 — Tenant-Core row remains visible from same-Tenant Industry context
Because the physical RLS permits null-Industry rows within the same Tenant, a Tenant-Core UsageMeter is visible from both TENANT_CORE and same-Tenant TENANT_INDUSTRY application contexts.

### USAGEMETER-PG-003 — Industry row requires exact Industry Context
A non-null Industry-scoped UsageMeter is hidden from Tenant-Core and sibling Industry contexts and is visible only from its exact owning Tenant + Industry Context.

### USAGEMETER-PG-004 — Foreign Tenant and PLATFORM_GLOBAL isolation
Foreign-Tenant and PLATFORM_GLOBAL contexts cannot bypass UsageMeter FORCE-RLS or the private application reader boundary.

### USAGEMETER-PG-005 — Empty/raw/special numeric/non-positive version evidence remains unstrengthened
Schema-valid empty meter/period text, exact high-precision finite numerics, PostgreSQL `NaN` / `Infinity`, and zero/negative bigint version remain raw persisted evidence. No entitlement/current-period/authoritative-period/available-capacity/usage-impact semantics are invented.

### USAGEMETER-PG-006 — Missing/malformed/route mismatch fail closed
A missing well-formed UsageMeter UUID returns `null`; malformed ids and Data Home route/context mismatch fail closed.

### USAGEMETER-PG-007 — Read-only privilege and port boundary
Ordinary application and dedicated Commercial compiler roles retain SELECT but no INSERT/UPDATE/DELETE on UsageMeter. The DD-143 port exposes no create/update/delete/list/selectCurrent/selectPeriod/aggregate/reserve/release/resolveEntitlement/evaluateImpact method.

## DD-144 AuditEvent Raw Persistence Reader Acceptance

### AUDITEVENT-PG-001 — Exact Tenant-Core event preserves raw immutable evidence
Exact AuditEvent-id lookup in the owning Tenant-Core context returns persisted ownership, scope, actor/action/resource/outcome/reason/permission/decision/module/correlation/causation/request/routing/sensitivity/evidence/schema-version fields without strengthening raw nullable or empty text.

### AUDITEVENT-PG-002 — Tenant-Core evidence remains visible from same-Tenant Industry context
Final AuditEvent RLS exposes a same-Tenant TENANT_CORE row from both TENANT_CORE and same-Tenant TENANT_INDUSTRY contexts.

### AUDITEVENT-PG-003 — Tenant-Industry evidence requires exact Industry Context
A TENANT_INDUSTRY AuditEvent is hidden from Tenant-Core, sibling Industry and foreign-Tenant contexts and is visible only from its exact same-Tenant Industry Context.

### AUDITEVENT-PG-004 — Explicit cross-context evidence is endpoint-private
An EXPLICIT_CROSS_CONTEXT AuditEvent is visible from its exact same-Tenant source and target Industry Contexts only; Tenant-Core and unrelated sibling Industry contexts cannot see it. No EXPLICIT_CROSS_CONTEXT RequestScopedSql bypass is introduced.

### AUDITEVENT-PG-005 — PLATFORM_GLOBAL isolation and raw nullable/JSON evidence
A PLATFORM_GLOBAL AuditEvent is visible only from a trusted PLATFORM_GLOBAL context. Tenant contexts cannot see it, platform context cannot see Tenant rows, and schema-valid raw nullable/empty text plus immutable JSON evidence are preserved.

### AUDITEVENT-PG-006 — Missing/malformed/route mismatch fail closed
A missing well-formed AuditEvent UUID returns `null`; malformed ids and Data Home route/context mismatch fail closed.

### AUDITEVENT-PG-007 — Append/read schema ownership does not become DD-144 mutation/search authority
The ordinary application role retains SELECT+INSERT and no UPDATE/DELETE on AuditEvent, while the DD-144 store exposes only exact read. It adds no append/create/update/delete/list/search/export/retention/purge/authorization method.


## DD-145 API Credential Metadata-Only Persistence Reader Acceptance

### APICRED-META-PG-001 — Exact Tenant-Core credential preserves physical ownership and raw metadata
Exact API Credential-id lookup through the fixed Identity-service boundary returns persisted Tenant/principal ownership, raw key-prefix/status/permission-profile/expiry/last-used/CIDR/allowed-Industry/version/timestamp evidence without becoming credential authentication or authorization authority.

### APICRED-META-PG-002 — Tenant-Industry credential preserves exact Industry and allowed-Industry evidence
An Industry-scoped credential returns its exact persisted Industry Context plus immutable allowed-Industry evidence. The metadata reader does not widen, intersect, resolve or authorize from that array.

### APICRED-META-PG-003 — PLATFORM_GLOBAL metadata remains Identity-service-only
A PLATFORM_GLOBAL service credential is readable through the dedicated pre-context `sbg_identity_service_rw` boundary while direct ordinary application-role SELECT remains revoked.

### APICRED-META-PG-004 — Secret verifier is excluded and raw nullable metadata stays unstrengthened
`secret_hash` is absent from the reader SELECT and returned contract. Schema-valid empty key-prefix text, nullable permission/expiry/last-used/revocation evidence and raw CIDR/status metadata remain persistence facts only.

### APICRED-META-PG-005 — Signed bigint credential version remains lossless evidence
The exact PostgreSQL bigint credential-version value is returned as signed decimal text, including schema-valid zero/negative values and values outside JavaScript safe-integer range; no positive/current concurrency invariant is invented.

### APICRED-META-PG-006 — Missing/malformed exact-id behavior fails closed
A missing well-formed API Credential UUID returns `null`; malformed ids fail closed before SQL.

### APICRED-META-PG-007 — Identity-service schema ownership does not become DD-145 verifier/mutation authority
The fixed Identity service retains schema-owned SELECT/INSERT/UPDATE privileges and no DELETE, while the DD-145 port exposes exact read only. It exposes no verify/authenticate/create/rotate/revoke/update/delete/list/search method.


## DD-146 OperatorElevation Control Plane Metadata Reader Acceptance

### OPELEV-META-PG-001 — Exact Tenant-Core elevation preserves raw ownership/purpose/profile/time evidence
Exact OperatorElevation-id lookup through the fixed Control Plane boundary returns persisted operator/Tenant ownership, raw purpose/ticket/approval/profile/status and timestamp evidence without becoming an elevation allow decision.

### OPELEV-META-PG-002 — Tenant-Industry target remains exact metadata
An Industry-targeted elevation returns its exact persisted Industry Context. The metadata reader does not create sibling/cross-context authority, allowed-Industry expansion or RequestContext scope.

### OPELEV-META-PG-003 — Future PENDING, EXPIRED and REVOKED rows remain evidence
Control Plane exact-id reads may return future PENDING, historical EXPIRED or REVOKED rows. DD-146 does not filter on wall-clock time/status or label them current/usable/authorized.

### OPELEV-META-PG-004 — Nullable/empty metadata remains unstrengthened
Nullable approver/ticket/revocation fields remain absent when null, and schema-valid empty purpose text remains raw persistence evidence.

### OPELEV-META-PG-005 — Fixed Control Plane role is distinct from ordinary application visibility
The dedicated NOBYPASSRLS `sbg_control_plane_rw` boundary can read exact metadata under its control policy. Ordinary `sbg_app_rw` retains schema-owned SELECT but sees no row without the separately verified transaction-local elevation/principal/Tenant context.

### OPELEV-META-PG-006 — Missing/malformed exact-id behavior fails closed
A missing well-formed OperatorElevation UUID returns `null`; malformed ids fail closed before SQL.

### OPELEV-META-PG-007 — Control Plane DML ownership does not become DD-146 mutation/approval/authorization authority
Schema-owned Control Plane SELECT/INSERT/UPDATE/DELETE remains unchanged, while the DD-146 port exposes exact read only. It exposes no create/approve/activate/revoke/expire/update/delete/list/search/authorize/permission-profile-resolution method.


## DD-147 API Credential Verification-Material Source Acceptance

### APICRED-VERIFY-PG-001 — Exact unique prefix returns opaque verifier material and Tenant-Core scope evidence
An exact persisted API Credential key-prefix lookup through the fixed Identity-service boundary returns one unique candidate with opaque one-way verifier hash and physical Tenant-Core ownership/version evidence. The reader itself does not authenticate the presented credential.

### APICRED-VERIFY-PG-002 — Tenant-Industry candidate preserves exact Industry evidence
An Industry-scoped candidate preserves its exact persisted Industry Context and immutable allowed-Industry evidence without widening to sibling/cross-context authority.

### APICRED-VERIFY-PG-003 — PLATFORM_GLOBAL service material remains Identity-service-only
A PLATFORM_GLOBAL service credential candidate is readable through the dedicated pre-context `sbg_identity_service_rw` boundary while ordinary application direct SELECT remains revoked.

### APICRED-VERIFY-PG-004 — Non-active/expired candidates remain raw verification material
SUSPENDED, REVOKED and EXPIRED candidates remain readable as source material. The reader does not decide current usability, authentication success or authorization.

### APICRED-VERIFY-PG-005 — Nullable CIDR and signed bigint version evidence remain lossless
Schema-valid NULL CIDR evidence remains absent, non-null CIDR arrays remain immutable, and the exact signed PostgreSQL bigint credential version remains decimal text without safe-integer coercion.

### APICRED-VERIFY-PG-006 — Unknown prefix is null and source uniqueness remains authoritative
An unknown exact prefix returns `null`; migration-owned `api_credential_key_prefix_uq` remains the authority preventing ambiguous matches.

### APICRED-VERIFY-PG-007 — Sensitive source remains internal and does not become the machine verifier
The server-internal port exposes exact prefix lookup only. It exposes no verify/authenticate/hash-compare/CIDR-enforcement/last-used mutation/create/rotate/revoke/update/delete/list/search method and is not exported through the Core index.


## DD-148 OperatorElevation Current Time/Status Floor Acceptance

### OPELEV-WIN-001 — ACTIVE strictly inside the persisted window matches
Given already-loaded OperatorElevation metadata and a server-owned evaluation instant strictly after `startsAt` and strictly before `expiresAt`, persisted `ACTIVE` status satisfies the migration-owned current time/status floor.

### OPELEV-WIN-002 — Exact start boundary is inclusive
An `ACTIVE` elevation evaluated exactly at `startsAt` satisfies the floor.

### OPELEV-WIN-003 — Exact expiry boundary is exclusive
An `ACTIVE` elevation evaluated exactly at `expiresAt` does not satisfy the floor.

### OPELEV-WIN-004 — Non-ACTIVE lifecycle status never matches
`PENDING`, `REVOKED` and `EXPIRED` do not satisfy the floor even when their persisted timestamps surround the evaluation instant.

### OPELEV-WIN-005 — Before-start and after-expiry instants fail closed
An evaluation instant before `startsAt` or after `expiresAt` does not satisfy the floor.

### OPELEV-WIN-006 — Malformed or internally invalid time evidence fails closed
Malformed, calendar-invalid or timezone-ambiguous evaluation/start/expiry timestamps—including values a permissive runtime parser would normalize—plus an invalid persisted interval with `expiresAt <= startsAt` do not satisfy the floor.

### OPELEV-WIN-007 — Unrelated elevation metadata remains uninterpreted and immutable
The helper does not use operator principal, Tenant, Industry, purpose, ticket, approver or permission-profile fields and does not mutate input metadata; therefore a positive result is not an authorization decision.


## DD-149 OperatorElevation Subject/Target Binding Floor Acceptance

### OPELEV-BIND-001 — Exact operator and Tenant match Tenant-wide elevation
Given valid server-owned identifiers, exact persisted operator-principal and Tenant equality satisfies the subject/Tenant portion of migration 0029's current-read predicate for an elevation with no Industry target.

### OPELEV-BIND-002 — Tenant-wide elevation also matches same-Tenant Industry input
A persisted NULL/absent Industry target does not require an Industry id and remains target-compatible with a same-Tenant Industry input, exactly mirroring migration 0029's `industry_context_id IS NULL OR ...` predicate.

### OPELEV-BIND-003 — Industry-targeted elevation requires exact Industry
When persisted `industryContextId` exists, the binding floor matches only the exact same Industry Context.

### OPELEV-BIND-004 — Sibling or missing Industry fails
An Industry-targeted elevation does not match a sibling Industry Context or an input with no Industry Context.

### OPELEV-BIND-005 — Operator or Tenant mismatch fails
Any operator-principal mismatch or Tenant mismatch fails closed even if other target evidence happens to match.

### OPELEV-BIND-006 — Malformed UUID evidence fails closed
Malformed persisted or input operator/Tenant/Industry identifiers return false rather than being compared as trusted binding evidence.

### OPELEV-BIND-007 — Lifecycle/policy evidence is not interpreted
Status, time window, purpose, ticket, approver and permission-profile fields do not affect this helper, and neither metadata nor input is mutated.


## DD-150 OperatorElevation Verified PLATFORM_OPERATOR Identity Floor Acceptance

### OPELEV-ID-001 — Exact verified PLATFORM_OPERATOR principal matches
IdentityPort-produced verified human evidence with `principalType='PLATFORM_OPERATOR'` and exact persisted `operatorPrincipalId` satisfies this necessary identity floor.

### OPELEV-ID-002 — HUMAN with the same principal id fails
A verified HUMAN principal does not satisfy the operator-elevation identity floor even when its principal id is identical.

### OPELEV-ID-003 — API_CLIENT/SERVICE principal types fail
API_CLIENT and SERVICE principal types never satisfy this interactive operator identity floor. Machine credentials cannot substitute for Platform Operator elevation identity.

### OPELEV-ID-004 — Different PLATFORM_OPERATOR principal fails
A verified PLATFORM_OPERATOR principal whose id differs from the persisted elevation operator principal fails closed.

### OPELEV-ID-005 — Malformed UUID evidence fails closed
Malformed persisted or verified principal UUIDs return false rather than being treated as identity-binding evidence.

### OPELEV-ID-006 — Auth/session/provider metadata is not elevated into policy
Auth strength, session version, device id, auth epoch and provider metadata do not strengthen or weaken this identity floor; MFA/step-up remains separately governed.

### OPELEV-ID-007 — Unrelated elevation fields are not interpreted
Tenant/Industry, status/time, purpose/ticket/approver and permission-profile fields do not affect this helper, and neither metadata nor verified evidence is mutated.


## DD-151 OperatorElevation Selected-ID Floor Acceptance

### OPELEV-SEL-001 — Exact selected UUID matches persisted elevation id
A valid server-owned selected elevation UUID satisfies this necessary floor only when it exactly equals the persisted `OperatorElevationMetadata.id`.

### OPELEV-SEL-002 — Different valid elevation UUID fails
A different valid UUID fails closed even when all other elevation metadata could otherwise match.

### OPELEV-SEL-003 — Empty selected id fails closed
An empty selected elevation id does not satisfy the migration-owned exact-id predicate.

### OPELEV-SEL-004 — Malformed selected id fails closed
Malformed selected-id input returns false rather than being treated as trusted selection evidence.

### OPELEV-SEL-005 — Malformed persisted id fails closed
Malformed persisted elevation id evidence also returns false.

### OPELEV-SEL-006 — Unrelated elevation fields are not interpreted
Operator/Tenant/Industry, status/time, purpose/ticket/approval and permission-profile fields do not affect this helper.

### OPELEV-SEL-007 — Equality floor has no selection or authorization behavior
The helper mutates neither metadata nor selected-id input and exposes only exact selected-id equality; it does not choose, trust, load or authorize an elevation.


## DD-152 OperatorElevation Core Necessary-Floor Composition Acceptance

### OPELEV-CORE-001 — All four necessary floors true
Exact selected id, verified PLATFORM_OPERATOR identity, subject/target binding and current ACTIVE/time-window floors all matching returns true.

### OPELEV-CORE-002 — Selected-id failure fails the composition
A DD-151 selected-id mismatch returns false even when all other floors match.

### OPELEV-CORE-003 — Verified operator identity failure fails the composition
A DD-150 identity-floor failure returns false even when selected id, target and time/status match.

### OPELEV-CORE-004 — Subject/target failure fails the composition
A DD-149 binding-floor failure returns false even when the other floors match.

### OPELEV-CORE-005 — Status/time failure fails the composition
A DD-148 current-time/status failure returns false even when selected id, identity and target match.

### OPELEV-CORE-006 — Multiple malformed/failed floors have no fallback
Malformed or failed inputs across multiple floors remain false; no fallback or partial success exists.

### OPELEV-CORE-007 — Policy/session extras remain uninterpreted
Permission-profile, approval/purpose/ticket, step-up/session extras and unrelated fields do not gain authorization semantics, and inputs are not mutated.


## DD-153 OperatorElevation Physical RLS Current-Read Parity Acceptance

### OPELEV-RLS-PG-001 — Exact Tenant-Core current-read predicate is visible
On a real migrated PostgreSQL database under `sbg_app_rw`, exact selected elevation id, principal, Tenant, ACTIVE status and current bounded time window make the targeted Tenant-Core elevation row visible.

### OPELEV-RLS-PG-002 — Industry-targeted row requires exact Industry
An Industry-targeted elevation is visible only when the transaction-local Industry Context exactly matches the persisted target.

### OPELEV-RLS-PG-003 — Wrong selected elevation id denies visibility
A different valid transaction-local `app.operator_elevation_id` yields zero rows for the queried elevation.

### OPELEV-RLS-PG-004 — Wrong principal or Tenant denies visibility
Principal or Tenant mismatch yields zero rows even when selected id and time/status otherwise match.

### OPELEV-RLS-PG-005 — Industry mismatch semantics match migration 0029
Missing or wrong Industry denies an Industry-targeted row, while a NULL-Industry Tenant-Core elevation remains compatible with a same-Tenant Industry setting exactly as the physical RLS predicate specifies.

### OPELEV-RLS-PG-006 — Non-current lifecycle rows stay invisible
PENDING, REVOKED and expired-by-time elevations remain invisible even when selected id, principal and target settings match.

### OPELEV-RLS-PG-007 — Empty elevation scope is closed and app role cannot mutate
Empty transaction-local elevation scope yields zero ordinary-app visibility and `sbg_app_rw` retains no INSERT/UPDATE/DELETE authority on `core_authz.operator_elevation`.


## DD-154 OperatorElevation Persisted Relationship Integrity Acceptance

### OPELEV-REL-PG-001 — ACTIVE operator + distinct active PLATFORM_OPERATOR approver is accepted
A persisted ACTIVE elevation is accepted when its operator principal is an ACTIVE PLATFORM_OPERATOR and `approved_by` references a different ACTIVE PLATFORM_OPERATOR.

### OPELEV-REL-PG-002 — ACTIVE operator + distinct active SERVICE approver is accepted
A distinct ACTIVE SERVICE principal satisfying the existing PlatformPrincipal SERVICE contract is accepted as persisted approver evidence.

### OPELEV-REL-PG-003 — ACTIVE elevation without approver is rejected
An ACTIVE elevation with NULL `approved_by` is rejected by migration 0031's relationship-integrity trigger.

### OPELEV-REL-PG-004 — Self-approval is rejected
An ACTIVE elevation cannot use its own operator principal as `approved_by`.

### OPELEV-REL-PG-005 — Inactive approver is rejected
An ACTIVE elevation whose approver principal is not ACTIVE is rejected.

### OPELEV-REL-PG-006 — Operator must be an ACTIVE PLATFORM_OPERATOR
A HUMAN principal or a non-ACTIVE PLATFORM_OPERATOR cannot be persisted as the elevation operator principal, including while the elevation is PENDING.

### OPELEV-REL-PG-007 — PENDING may be unapproved but ACTIVE promotion revalidates approver integrity
A PENDING elevation may persist without an approver; updating it to ACTIVE without a valid independent active approver is rejected.


## DD-155 OperatorElevation SQL Scope Hygiene Acceptance

### OPELEV-SQL-001 — Application database startup clears elevation scope
Before application transaction work executes, `PostgresDatabase` explicitly sets transaction-local `app.operator_elevation_id` to the empty string.

### OPELEV-SQL-002 — Application cleanup resets elevation scope before reusable release
Application database cleanup explicitly issues `RESET app.operator_elevation_id` before a reusable pooled connection is released.

### OPELEV-SQL-003 — Application elevation-reset failure destroys the connection
If cleanup fails while resetting elevation scope, the pooled connection is destroyed rather than returned for another request.

### OPELEV-SQL-004 — Bootstrap database startup clears elevation scope
Before bootstrap transaction work executes, `PostgresContextBootstrapDatabase` explicitly starts with empty `app.operator_elevation_id`.

### OPELEV-SQL-005 — Bootstrap cleanup resets elevation scope before reusable release
Bootstrap cleanup explicitly includes `RESET app.operator_elevation_id` before reusable release.

### OPELEV-SQL-006 — Bootstrap elevation-reset failure destroys the connection
If bootstrap cleanup fails on the elevation reset, the pooled connection is destroyed.

### OPELEV-SQL-007 — Smuggled RequestContext-like elevation id is ignored
An extra runtime object property named `operatorElevationId` that is not part of the governed RequestContext contract is ignored by `RequestScopedSql`; the fifth transaction-local setting remains empty.


## DD-156 OperatorElevation Persisted Lifecycle/Time/Scope Integrity Acceptance

### OPELEV-LIFE-PG-001 — Valid ordered PENDING elevation persists
A PENDING elevation with `expires_at > starts_at`, coherent creation time and valid persisted relationships is accepted.

### OPELEV-LIFE-PG-002 — Equal or reversed time window is rejected
Equal start/expiry and reversed start/expiry violate the migration-owned `expires_at > starts_at` constraint.

### OPELEV-LIFE-PG-003 — Revocation timestamp cannot predate creation
A non-null `revoked_at` earlier than `created_at` is rejected.

### OPELEV-LIFE-PG-004 — REVOKED requires revocation evidence
A row with `status='REVOKED'` and NULL `revoked_at` is rejected.

### OPELEV-LIFE-PG-005 — Coherent REVOKED row persists
A REVOKED row with `revoked_at >= created_at` and otherwise valid relationships is accepted.

### OPELEV-LIFE-PG-006 — Tenant ownership is immutable
An UPDATE attempting to change persisted `tenant_id` is rejected by the canonical immutable ownership/scope trigger.

### OPELEV-LIFE-PG-007 — Industry ownership is immutable
An UPDATE attempting to change persisted `industry_context_id` is rejected by the canonical immutable ownership/scope trigger.


## DD-157 OperatorElevation Fixed Control Plane SQL Boundary Acceptance

### OPELEV-CP-SQL-001 — Fixed Control Plane role and RLS are pinned before work
A Control Plane transaction sets `sbg_control_plane_rw` and enables row security before delegated SQL executes.

### OPELEV-CP-SQL-002 — Startup scope is cleared before delegated work
Tenant, Industry, scope class, principal and OperatorElevation settings are cleared transaction-locally before any delegated SQL.

### OPELEV-CP-SQL-003 — Unsafe role verification fails closed
If the runtime/login role safety check does not prove a non-superuser, non-BYPASSRLS Control Plane context, the adapter stops before delegated work with a safe database error.

### OPELEV-CP-SQL-004 — Cleanup RESET occurs before reusable pool release
Cleanup explicitly RESETs the OperatorElevation setting and the other scope settings before a reusable connection is released.

### OPELEV-CP-SQL-005 — Elevation cleanup failure destroys the connection
If RESET of OperatorElevation scope fails after a committed result, the connection is destroyed rather than returned to the pool.

### OPELEV-CP-SQL-006 — Leaked transaction handles are closed
A delegated transaction handle cannot issue SQL after the transaction completes and the connection is ready for pool release.

### OPELEV-CP-SQL-007 — Database failures expose safe errors only
Connect, setup and delegated query failures surface only governed database error codes; private SQL/provider/credential diagnostics do not cross the adapter boundary.


## DD-158 API Credential Current Lifecycle Floor Acceptance

### APICRED-LIFE-001 — ACTIVE credential without expiry matches
Persisted `status='ACTIVE'` with no expiry satisfies this necessary lifecycle floor for a valid explicit evaluation instant.

### APICRED-LIFE-002 — ACTIVE credential before future expiry matches
An ACTIVE credential whose `expiresAt` is strictly after the explicit evaluation instant satisfies the floor.

### APICRED-LIFE-003 — Exact expiry boundary fails
When `expiresAt === evaluatedAt`, the credential is no longer current and the floor fails.

### APICRED-LIFE-004 — After expiry fails
An ACTIVE credential whose persisted expiry is before the evaluation instant fails.

### APICRED-LIFE-005 — Non-ACTIVE statuses fail
SUSPENDED, REVOKED and EXPIRED credentials fail regardless of a future or absent expiry.

### APICRED-LIFE-006 — Malformed time evidence fails closed
Malformed, calendar-invalid or timezone-ambiguous evaluation or persisted expiry timestamps—including values a permissive runtime parser would normalize—return false.

### APICRED-LIFE-007 — Non-lifecycle verification material is not interpreted
Verifier hash, CIDR, permission-profile, scope, version and usage metadata do not affect this helper, and the material is not mutated.


## DD-159 API Credential Machine-Principal Metadata Reader Acceptance

### MACHPRINC-PG-001 — Exact ACTIVE API_CLIENT raw principal metadata is readable
The fixed Identity-service database boundary can read the exact principal id, type, raw status and auth epoch for an ACTIVE API_CLIENT without projecting display name, email or mobile PII.

### MACHPRINC-PG-002 — ACTIVE SERVICE preserves service metadata and allowed scopes
An ACTIVE SERVICE principal preserves service code, owning module and immutable persisted allowed-scope evidence.

### MACHPRINC-PG-003 — HUMAN and PLATFORM_OPERATOR remain raw evidence
HUMAN and PLATFORM_OPERATOR rows may be returned by the exact metadata reader but are not reinterpreted as accepted machine principals.

### MACHPRINC-PG-004 — Non-active statuses remain raw evidence
PENDING, SUSPENDED and REVOKED principal statuses are returned as persisted metadata without a current-principal decision.

### MACHPRINC-PG-005 — Nullable scopes and signed bigint auth epoch remain lossless
Nullable allowed scope evidence and the full signed bigint auth-epoch domain are preserved without numeric truncation; returned arrays are immutable.

### MACHPRINC-PG-006 — Missing/malformed exact id fails closed
A missing exact principal id returns null; malformed UUID input fails before SQL execution.

### MACHPRINC-PG-007 — Reader remains Identity-service-only and exact-read-only
The fixed Identity-service role can read the directory, while the DD-159 surface exposes no create/update/delete/list/search/authenticate behavior and no PII projection.


## DD-160 API Credential Current Machine-Principal Floor Acceptance

### MACHPRINC-CUR-001 — ACTIVE API_CLIENT matches
Raw DD-159 principal metadata with `principalType='API_CLIENT'` and `status='ACTIVE'` satisfies this necessary current machine-principal floor.

### MACHPRINC-CUR-002 — ACTIVE SERVICE with required service metadata matches
An ACTIVE SERVICE principal satisfies the floor only when persisted service code and owning module are present and non-blank.

### MACHPRINC-CUR-003 — HUMAN and PLATFORM_OPERATOR fail
HUMAN and PLATFORM_OPERATOR principal types do not satisfy runtime machine-evidence principal acceptance even when ACTIVE.

### MACHPRINC-CUR-004 — Non-active statuses fail
PENDING, SUSPENDED and REVOKED fail regardless of API_CLIENT/SERVICE type.

### MACHPRINC-CUR-005 — Malformed SERVICE structural evidence fails closed
SERVICE metadata missing or blank service code or owning module fails closed.

### MACHPRINC-CUR-006 — Scope/auth-epoch metadata does not create acceptance
Allowed scope classes and auth epoch remain raw evidence and do not independently create machine acceptance or requested-scope authorization.

### MACHPRINC-CUR-007 — Helper is deterministic and non-mutating
Repeated evaluation is stable and metadata remains unchanged.


## DD-161 API Credential Requested-Scope Floor Acceptance

### APICRED-SCOPE-001 — Platform SERVICE scope
An allowlisted SERVICE principal plus platform credential matches PLATFORM_GLOBAL only when requested and persisted Tenant/Industry evidence is absent.

### APICRED-SCOPE-002 — Exact Tenant-Core scope
Tenant-Core API_CLIENT/SERVICE credentials require exact Tenant equality; SERVICE also requires requested-scope allowlist entry TENANT_CORE.

### APICRED-SCOPE-003 — Exact Tenant-Industry credential
An exact Industry credential matches only its exact Tenant/Industry target; SERVICE also requires TENANT_INDUSTRY in its requested-scope allowlist.

### APICRED-SCOPE-004 — Tenant-Core credential Industry allowlist
A Tenant-Core credential may reach only an explicitly allowed exact Industry; SERVICE still requires TENANT_INDUSTRY in its requested-scope allowlist.

### APICRED-SCOPE-005 — Principal/Tenant/Industry mismatch fails
Credential/principal id mismatch, wrong Tenant, sibling/non-allowlisted Industry, or invalid platform shape fails closed.

### APICRED-SCOPE-006 — Cross-context and malformed target fail
EXPLICIT_CROSS_CONTEXT always fails; malformed UUIDs or missing required target components fail closed.

### APICRED-SCOPE-008 — Malformed allowed-Industry evidence fails closed
The persisted allowed-Industry list must be an array whose materialized entries are valid UUIDs. Sparse holes, explicit undefined/non-string entries or a non-array value fail closed even on TENANT_CORE where the list is otherwise not consumed.

### APICRED-SCOPE-010 — Duplicate allowed-Industry evidence fails closed
Migration 0030 requires `allowed_industry_context_ids` to be unique. A raw allowed-Industry array containing the same valid Industry Context id more than once therefore fails the requested-scope necessary floor, including on TENANT_CORE where the list is otherwise not consumed.

### APICRED-SCOPE-011 — Exact Industry credential cannot carry sibling allowlist evidence
Migration 0030 requires an Industry-scoped credential's allowed-Industry list, when non-empty, to contain only its exact persisted Industry Context. Raw evidence that keeps the exact credential Industry but also carries a sibling/different Industry id fails closed before requested-scope acceptance.

### APICRED-SCOPE-009 — Malformed SERVICE allowed-scope evidence fails closed
When a SERVICE principal is evaluated for PLATFORM_GLOBAL, TENANT_CORE or TENANT_INDUSTRY, `allowedScopeClasses` must be an actual array whose materialized entries are all members of the migration-owned scope allowlist. Sparse holes, explicit undefined/non-string values or unknown scope codes fail closed even when the requested scope is also present. Duplicate valid scope codes remain raw persisted evidence and are not given a new duplicate-free invariant here.

### APICRED-SCOPE-007 — Other authentication evidence remains separate
Lifecycle, hash, CIDR, permission profile, version, usage and principal-currentness evidence is not interpreted and inputs remain unchanged.


## DD-162 API Credential Core Necessary-Floor Composition Acceptance

### APICRED-CORE-001 — All three machine-credential floors true
Current credential lifecycle, current machine principal and requested-scope compatibility all matching returns true.

### APICRED-CORE-002 — Lifecycle failure fails the composition
A DD-158 lifecycle failure returns false even when principal and requested scope match.

### APICRED-CORE-003 — Current principal failure fails the composition
A DD-160 current machine-principal failure returns false even when lifecycle and requested scope match.

### APICRED-CORE-004 — Requested-scope failure fails the composition
A DD-161 requested-scope failure returns false even when lifecycle and current principal match.

### APICRED-CORE-005 — Multiple malformed/failed floors have no fallback
Malformed or failed evidence across multiple floors remains false; no partial-success fallback exists.

### APICRED-CORE-006 — Platform and Tenant-Industry success paths preserve DD-161 rules
When lifecycle and principal are current, PLATFORM_GLOBAL SERVICE and Tenant-Industry success still require the exact DD-161 scope rules.

### APICRED-CORE-007 — Verifier/CIDR/profile/use evidence remains uninterpreted
Secret hash, CIDR, permission-profile, version and last-use evidence do not gain authentication semantics, and inputs are not mutated.

## DD-163 Webhook Delivery Necessary-Floor Acceptance

### WH-FLOOR-001 — ACTIVE verified same-Tenant Tenant-Core event may satisfy the bounded floor
An ACTIVE WebhookSubscription with valid verification evidence plus a same-Tenant TENANT_CORE OutboxEvent and exact webhook-eligible EventCatalog tuple returns true.

### WH-FLOOR-002 — Subscription verification/current-state prerequisite fails closed
PENDING_VERIFICATION, PAUSED or REVOKED subscription state, absent verification evidence, or malformed/calendar-invalid/timezone-ambiguous verification time—including values a permissive runtime parser would normalize—returns false.

### WH-FLOOR-003 — Foreign-Tenant and Platform-Global events fail
The event Tenant must exactly equal the subscription Tenant. PLATFORM_GLOBAL is not deliverable through a Tenant-owned subscription in this bounded helper.

### WH-FLOOR-004 — Tenant-Industry delivery requires exact allowlisted Industry Context
TENANT_INDUSTRY succeeds only when the event carries one valid exact Industry Context and that exact id occurs in the subscription's validated allowlist.

### WH-FLOOR-005 — Exact catalog identity and webhook eligibility are mandatory
Event type, version and scope must exactly match the supplied EventCatalog entry and `webhookEligible` must be true; any mismatch fails closed.

### WH-FLOOR-006 — Explicit cross-context remains outside this helper
EXPLICIT_CROSS_CONTEXT returns false because authoritative source/target endpoint validation remains owned by DD-081 plus a separately governed composition.

### WH-FLOOR-007 — Unowned delivery semantics remain uninterpreted
Endpoint URL, event filter, permission profile, secret version, Outbox readiness/status/attempt evidence, catalog ACTIVE/RETIRED lifecycle and retry evidence do not affect this helper, and inputs are not mutated.

### WH-FLOOR-008 — Malformed Industry allowlist fails closed
A sparse allowlist, a hole/undefined entry, malformed Industry Context UUID or duplicate Industry Context id returns false even for a TENANT_CORE event where the allowlist is otherwise not consumed. Structural evidence validation is total and fail-closed.

### WH-FLOOR-009 — Unknown/malformed event scope cannot fall through as Tenant-Industry
Only exact `TENANT_CORE` and `TENANT_INDUSTRY` event scope values are admissible to this ordinary single-context helper. Any unknown, empty, undefined/null, case-variant or other malformed scope fails closed even when the supplied EventCatalog repeats the same malformed value and the Industry id is allowlisted.

## DD-164 SyncCursor Current-Binding Necessary-Floor Acceptance

### SYNC-BIND-001 — Exact active Tenant-Industry binding matches
An exact SyncCursor→TenantIntegration id, exact active capability under the same IntegrationDefinition, enabled capability membership and exact Tenant-Industry Context may satisfy the bounded floor.

### SYNC-BIND-002 — Exact active Tenant-Core null-Industry binding matches
TENANT_CORE satisfies the bounded floor only when both parent and cursor carry no Industry Context.

### SYNC-BIND-003 — Non-active TenantIntegration fails
PENDING, PAUSED, ERROR and REVOKED TenantIntegration state fail regardless of other matching evidence.

### SYNC-BIND-004 — Capability/definition/current enablement mismatch fails
A different IntegrationDefinition, different capability code, capability absent from the enabled set, or non-ACTIVE capability fails closed.

### SYNC-BIND-005 — Industry shape mismatch fails
Sibling, missing or unexpected Industry Context evidence fails; Tenant-Core and Tenant-Industry shapes cannot substitute for each other.

### SYNC-BIND-006 — Malformed identity or duplicate enabled-capability evidence fails closed
Malformed required UUIDs, blank capability identity or duplicate enabled-capability evidence cannot satisfy the floor.

### SYNC-BIND-008 — Sparse enabled-capability evidence fails closed
A sparse enabled-capability array, including a hole after an otherwise valid enabled capability, is malformed structural evidence and cannot satisfy the floor.

### SYNC-BIND-007 — Cursor/provider runtime semantics remain uninterpreted
Cursor payload, watermark/source version/update time, TenantIntegration health/config/profile and capability direction/event/rate/idempotency/data-class evidence do not create acceptance, and inputs remain unchanged.

## DD-165 TenantIntegration CredentialReference Current-Binding Necessary-Floor Acceptance

### INT-CRED-CUR-001 — Exact active non-expiring Tenant-Core credential binding matches
A TENANT_CORE integration with no Industry Context and an exact same-Tenant ACTIVE non-expiring credential id satisfies the bounded floor.

### INT-CRED-CUR-002 — Tenant-wide active credential may bind exact Tenant-Industry integration
A same-Tenant credential with no Industry Context may satisfy a TENANT_INDUSTRY integration binding when identity/currentness predicates match.

### INT-CRED-CUR-003 — Industry credential binds only exact Tenant-Industry target
An Industry-scoped credential may satisfy only the exact same Industry integration; sibling Industry or Industry credential→Tenant-Core fails closed.

### INT-CRED-CUR-004 — Credential identity or Tenant mismatch fails
Wrong CredentialReference id or foreign Tenant ownership fails regardless of other evidence.

### INT-CRED-CUR-005 — Non-ACTIVE CredentialReference fails
Any raw credential status other than exact ACTIVE fails this floor.

### INT-CRED-CUR-006 — Strict expiry currentness and malformed time fail closed
Future expiry may match; expiry exactly at or before evaluation fails; malformed, calendar-invalid or timezone-ambiguous evaluation/expiry timestamps—including values a permissive runtime parser would normalize—fail closed.

### INT-CRED-CUR-007 — Unowned integration/credential semantics remain uninterpreted
TenantIntegration lifecycle/definition/capabilities/config/health/profile and CredentialReference provider/type/key-version/rotation metadata do not create acceptance, and inputs remain unchanged.

## DD-166 TenantIntegration Definition/Capability Current-Set Necessary-Floor Acceptance

### INT-SET-CUR-001 — Exact active Definition/object config/enabled active capability matches
Exact integration→Definition identity, ACTIVE Definition, object config, enabled Definition membership and one exact ACTIVE capability row satisfy the bounded floor.

### INT-SET-CUR-002 — Empty enabled-capability set may match
An ACTIVE exact Definition plus object config may satisfy the floor with an empty enabled-capability set and no capability rows.

### INT-SET-CUR-003 — Wrong or non-ACTIVE Definition fails
Definition identity mismatch or raw status other than exact ACTIVE fails closed.

### INT-SET-CUR-004 — Non-object config fails
Null, array and primitive config values fail this migration-owned object-shape predicate.

### INT-SET-CUR-005 — Duplicate enabled codes or missing Definition membership fails
Duplicate enabled codes or an enabled code absent from the Definition capability list fail closed.

### INT-SET-CUR-006 — Missing/inactive/wrong/ambiguous enabled capability evidence fails
For every enabled code, missing evidence, non-ACTIVE evidence, wrong Definition/code tuple or duplicate matching evidence fails closed.

### INT-SET-CUR-008 — Sparse capability arrays fail closed
A sparse TenantIntegration enabled-capability array or sparse IntegrationDefinition capability-code array is malformed structural evidence and cannot satisfy the floor even when all materialized non-hole values otherwise match.

### INT-SET-CUR-007 — Unowned runtime semantics remain uninterpreted
TenantIntegration lifecycle/credential/scope/health/profile and capability direction/OperationContract/event/data/rate/idempotency metadata do not create acceptance; extra non-enabled capability evidence is ignored and inputs remain unchanged.

## DD-167 TenantIntegration Current-Integrity Composition Acceptance

### INT-INTEGRITY-001 — Both DD-165 and DD-166 floors true
Exact credential current-binding plus Definition/config/enabled-capability current-set evidence returns true.

### INT-INTEGRITY-002 — Credential floor failure fails composition
DD-165 false returns false even when DD-166 matches.

### INT-INTEGRITY-003 — Definition/capability floor failure fails composition
DD-166 false returns false even when DD-165 matches.

### INT-INTEGRITY-004 — Multiple failed floors have no fallback
When both underlying floors fail, composition remains false; no partial-success fallback exists.

### INT-INTEGRITY-005 — Tenant-Core and Tenant-Industry success preserve underlying scope rules
Positive paths preserve the exact DD-165 scope semantics and DD-166 current-set semantics without adding new scope behavior.

### INT-INTEGRITY-006 — Credential expiry cannot be overridden
Definition/capability evidence cannot convert an expired credential binding into a current integrity match.

### INT-INTEGRITY-007 — Lifecycle/provider/runtime evidence remains uninterpreted
TenantIntegration lifecycle/health/profile plus provider/secret/OperationContract/event/network evidence does not create acceptance, and inputs remain unchanged.

## DD-168 NotificationDelivery TenantIntegration Current-Binding Acceptance

### NOTIF-INT-CUR-001 — Unbound delivery requires no integration evidence
A valid delivery without `tenantIntegrationId` matches only when no integration evidence is supplied.

### NOTIF-INT-CUR-002 — Tenant-wide ACTIVE integration may bind same-Tenant Core or Industry delivery
A same-Tenant ACTIVE integration without Industry Context may satisfy either valid delivery scope.

### NOTIF-INT-CUR-003 — Industry integration binds only exact Industry delivery
An Industry-scoped integration may satisfy only a delivery carrying the exact same Industry Context; sibling or Tenant-Core delivery fails.

### NOTIF-INT-CUR-004 — Integration identity or Tenant mismatch fails
Wrong integration id or foreign Tenant ownership fails closed.

### NOTIF-INT-CUR-005 — Non-ACTIVE integration fails
PENDING, PAUSED, ERROR and REVOKED integration states fail the binding floor.

### NOTIF-INT-CUR-006 — Malformed ownership or unexpected evidence fails closed
Malformed delivery/integration identity or delivery scope shape fails; extra integration evidence for an unbound delivery fails.

### NOTIF-INT-CUR-007 — Delivery/provider/runtime semantics remain uninterpreted
Template/recipient/channel/delivery status/timestamps/error and integration Definition/credential/config/capability/health/profile evidence do not create acceptance, and inputs remain unchanged.

## DD-169 NotificationDelivery OutboxEvent Current-Binding Acceptance

### NOTIF-EVT-CUR-001 — Unbound delivery requires no event evidence
A valid delivery without `sourceEventId` matches only when no OutboxEvent evidence is supplied.

### NOTIF-EVT-CUR-002 — Exact Tenant-Core source event matches
A same-Tenant TENANT_CORE event with absent Industry Context and exact id satisfies the relationship.

### NOTIF-EVT-CUR-003 — Exact Tenant-Industry source event matches
A same-Tenant TENANT_INDUSTRY event with exact Industry Context satisfies the relationship; sibling Industry fails.

### NOTIF-EVT-CUR-004 — Event identity, Tenant or scope mismatch fails
Wrong event id, foreign Tenant or mismatched scope class fails closed.

### NOTIF-EVT-CUR-005 — Platform/cross-context events cannot satisfy notification binding
PLATFORM_GLOBAL and EXPLICIT_CROSS_CONTEXT event evidence cannot satisfy a TENANT_CORE/TENANT_INDUSTRY NotificationDelivery relationship.

### NOTIF-EVT-CUR-006 — Malformed ownership or unexpected evidence fails closed
Malformed delivery/event identity/scope shape fails; extra event evidence for an unbound delivery fails.

### NOTIF-EVT-CUR-007 — Dispatcher/payload and delivery semantics remain uninterpreted
Event type/version/aggregate/envelope/status/attempt/availability/lock/error and delivery channel/template/recipient/status/timestamps do not create acceptance, and inputs remain unchanged.

## DD-170 Definition-Scope Fail-Closed Acceptance

### DEF-SCOPE-FC-001 — PLATFORM applicability is preserved
A well-formed PLATFORM definition applies to Tenant-Core and Tenant-Industry targets.

### DEF-SCOPE-FC-002 — TENANT applicability is preserved
A well-formed TENANT definition applies to same-Tenant Core/Industry targets and fails for a foreign Tenant.

### DEF-SCOPE-FC-003 — INDUSTRY applicability is exact
A well-formed INDUSTRY definition applies only to the exact same-Tenant Industry Context and fails for a sibling Industry.

### DEF-SCOPE-FC-004 — INDUSTRY to Tenant-Core is false, never NULL
A narrower Industry definition evaluated against a Tenant-Core target returns exact false.

### DEF-SCOPE-FC-005 — Definition containment is fail-closed
An INDUSTRY parent does not contain a broader TENANT child and returns exact false rather than NULL.

### DEF-SCOPE-FC-006 — Malformed/null inputs fail closed
Unsupported/null owner scope or missing required Tenant/Industry ownership evidence returns exact false.

### DEF-SCOPE-FC-007 — Trigger-style rejection works
`NOT definition_applies_to_scope(INDUSTRY → Tenant-Core)` evaluates true; helper functions remain IMMUTABLE and non-PUBLIC-executable.

## DD-171 NotificationDelivery NotificationTemplate Current-Binding Acceptance

### NOTIF-TPL-CUR-001 — Unbound delivery requires no template version/evidence
A valid delivery without template id matches only when template version and template evidence are also absent.

### NOTIF-TPL-CUR-002 — PLATFORM template applies across Tenant scopes
An exact ACTIVE PLATFORM template with matching version/channel applies to Tenant-Core and Tenant-Industry deliveries.

### NOTIF-TPL-CUR-003 — TENANT template applies only inside the same Tenant
A valid same-Tenant TENANT template applies to Tenant-Core and Tenant-Industry; a foreign Tenant template fails.

### NOTIF-TPL-CUR-004 — INDUSTRY template applies only to exact Industry
A valid INDUSTRY template applies only to the exact same-Tenant Industry delivery; sibling Industry and Tenant-Core fail.

### NOTIF-TPL-CUR-005 — Identity/version/status/channel mismatches fail
Wrong template id, missing/invalid/mismatched version, non-ACTIVE status or channel mismatch fails closed.

### NOTIF-TPL-CUR-006 — Malformed ownership or unexpected evidence fails closed
Malformed delivery/template ownership shape fails; extra template evidence for an unbound delivery fails.

### NOTIF-TPL-CUR-007 — Rendering/approval/runtime semantics remain uninterpreted
Template code/locale/content/schema/creator/approver/timestamps and delivery recipient/status/integration/source-event/timestamps do not create acceptance, and inputs remain unchanged.

## DD-172 Known NotificationDelivery Relationship Floors Acceptance

### NOTIF-REL-CUR-001 — All known relationship floors true
DD-168, DD-169 and DD-171 all true produces true.

### NOTIF-REL-CUR-002 — Integration floor failure fails composition
A DD-168 failure produces false even when the other two floors match.

### NOTIF-REL-CUR-003 — Source-event floor failure fails composition
A DD-169 failure produces false even when the other two floors match.

### NOTIF-REL-CUR-004 — Template floor failure fails composition
A DD-171 failure produces false even when the other two floors match.

### NOTIF-REL-CUR-005 — Multiple failures have no fallback
Partial success does not produce acceptance.

### NOTIF-REL-CUR-006 — Independently unbound optional relationships remain valid
A delivery with all three relationship ids absent matches when corresponding evidence is absent, preserving the underlying helpers' optionality rules.

### NOTIF-REL-CUR-007 — Recipient/lifecycle/render/runtime semantics remain uninterpreted
Recipient principal/reference, delivery lifecycle, render/provider/retry/runtime evidence does not create acceptance, and inputs remain unchanged.

## DD-173 WorkflowInstance WorkflowDefinition Current-Binding Acceptance

### WFI-DEF-CUR-001 — PLATFORM definition applicability is preserved
Exact ACTIVE PLATFORM definition/version applies to valid Tenant-Core and Tenant-Industry instances.

### WFI-DEF-CUR-002 — TENANT definition applicability is same-Tenant only
Exact ACTIVE TENANT definition/version applies to same-Tenant Core/Industry instances and fails for a foreign Tenant.

### WFI-DEF-CUR-003 — INDUSTRY definition applicability is exact
Exact ACTIVE INDUSTRY definition/version applies only to the exact same-Tenant Industry instance; sibling Industry and Tenant-Core fail.

### WFI-DEF-CUR-004 — Definition identity/version mismatch fails
Wrong definition id, missing/mismatched/non-positive persisted definition version fails closed.

### WFI-DEF-CUR-005 — Non-ACTIVE definition fails
DRAFT, REVIEW, PUBLISHED and RETIRED definitions fail the relationship floor.

### WFI-DEF-CUR-006 — Malformed ownership fails closed
Malformed instance/definition identity or invalid instance/definition owner scope shape fails.

### WFI-DEF-CUR-007 — Workflow execution semantics remain uninterpreted
Resource/currentState/lifecycle/rowVersion/timestamps/creator and definition code/schema/stateMachine/approval/rules/effective/creator/approver evidence do not create acceptance, and inputs remain unchanged.

## DD-174 Workflow Child WorkflowInstance Current-Binding Acceptance

### WFCH-PARENT-CUR-001 — Tenant-Core task exact parent matches
A valid Tenant-Core task matches an exact same-Tenant WorkflowInstance with absent Industry Context.

### WFCH-PARENT-CUR-002 — Tenant-Industry task exact parent matches
A valid Tenant-Industry task matches an exact same-Tenant WorkflowInstance with the exact Industry Context.

### WFCH-PARENT-CUR-003 — Tenant-Core transition exact parent matches
A valid Tenant-Core transition matches an exact same-Tenant WorkflowInstance with absent Industry Context.

### WFCH-PARENT-CUR-004 — Tenant-Industry transition exact parent matches
A valid Tenant-Industry transition matches an exact same-Tenant WorkflowInstance with the exact Industry Context.

### WFCH-PARENT-CUR-005 — Parent identity or scope mismatch fails
Wrong parent id, foreign Tenant, sibling Industry or Core/Industry mismatch fails closed.

### WFCH-PARENT-CUR-006 — Malformed ownership fails closed
Malformed child/parent UUIDs or inconsistent parent scope shape fail closed.

### WFCH-PARENT-CUR-007 — Task/transition execution semantics remain uninterpreted
Task assignment/state/due/claim/completion and transition from/action/to/actor/version/reason/time evidence do not create acceptance, and inputs remain unchanged.

## DD-175 AutomationRun AutomationDefinition Current-Binding Acceptance

### WFA-RUN-DEF-CUR-001 — ACTIVE PLATFORM definition applies to Core and Industry runs
An exact ACTIVE PLATFORM definition with no Tenant/Industry owner applies to both Tenant-Core and Tenant-Industry runs.

### WFA-RUN-DEF-CUR-002 — same-Tenant TENANT definition applies within Tenant
An exact ACTIVE TENANT definition applies to same-Tenant Core/Industry runs; foreign Tenant fails closed.

### WFA-RUN-DEF-CUR-003 — INDUSTRY definition requires exact Industry
An exact ACTIVE INDUSTRY definition applies only to the exact same-Tenant Industry run; sibling Industry or Tenant-Core fails closed.

### WFA-RUN-DEF-CUR-004 — definition identity mismatch fails
Wrong AutomationDefinition id fails closed.

### WFA-RUN-DEF-CUR-005 — non-ACTIVE definition fails
DRAFT, REVIEW, PUBLISHED and RETIRED definitions fail closed.

### WFA-RUN-DEF-CUR-006 — malformed ownership fails closed
Malformed run/definition UUIDs or invalid definition owner shape fail closed.

### WFA-RUN-DEF-CUR-007 — version/effective/trigger/run semantics remain uninterpreted
Definition version/schemaVersion/effective dates/trigger/config/condition/operation/workflow refs and run trigger/idempotency/status/time/error evidence do not affect this floor, and inputs remain unchanged.

## DD-176 AutomationDefinition WorkflowDefinition Containment Acceptance

### WFA-DEF-WF-CUR-001 — unbound reference requires no Workflow evidence
An AutomationDefinition without `workflowDefinitionId` matches only when no WorkflowDefinition evidence is supplied.

### WFA-DEF-WF-CUR-002 — PLATFORM child requires PLATFORM parent
PLATFORM AutomationDefinition accepts an exact PLATFORM WorkflowDefinition only.

### WFA-DEF-WF-CUR-003 — TENANT child accepts broader/equal parent
TENANT AutomationDefinition accepts PLATFORM or same-Tenant TENANT WorkflowDefinition; foreign Tenant or INDUSTRY parent fails closed.

### WFA-DEF-WF-CUR-004 — INDUSTRY child accepts broader/equal parent
INDUSTRY AutomationDefinition accepts PLATFORM, same-Tenant TENANT or exact same-Tenant INDUSTRY WorkflowDefinition; sibling/foreign Industry fails closed.

### WFA-DEF-WF-CUR-005 — bound identity mismatch fails
Missing, wrong or malformed WorkflowDefinition identity evidence fails closed.

### WFA-DEF-WF-CUR-006 — malformed owner shape fails closed
Invalid AutomationDefinition or WorkflowDefinition owner shape fails closed.

### WFA-DEF-WF-CUR-007 — currentness/execution evidence remains uninterpreted
Status/version/effective dates/code/schema/stateMachine/approval/rules/trigger/config/condition/operation evidence do not affect this containment floor, and inputs remain unchanged.

## DD-177 AI PromptSetMember Current-Binding Acceptance

### AIPROMPTMEM-CUR-001 — PLATFORM set requires ACTIVE PLATFORM template
An exact ACTIVE PLATFORM PromptSet with exact ACTIVE PLATFORM PromptTemplate matches.

### AIPROMPTMEM-CUR-002 — TENANT set accepts broader/equal ACTIVE template
An ACTIVE TENANT PromptSet accepts ACTIVE PLATFORM or same-Tenant TENANT PromptTemplate; foreign Tenant or narrower INDUSTRY template fails closed.

### AIPROMPTMEM-CUR-003 — INDUSTRY set accepts broader/equal ACTIVE template
An ACTIVE INDUSTRY PromptSet accepts ACTIVE PLATFORM, same-Tenant TENANT or exact same-Tenant INDUSTRY PromptTemplate; sibling/foreign Industry fails closed.

### AIPROMPTMEM-CUR-004 — member reference mismatch fails
Wrong PromptSet or PromptTemplate identity fails closed.

### AIPROMPTMEM-CUR-005 — non-ACTIVE referenced definition fails
Any non-ACTIVE PromptSet or PromptTemplate fails closed.

### AIPROMPTMEM-CUR-006 — malformed identity/ownership fails
Malformed member/reference UUIDs or invalid owner shape fail closed.

### AIPROMPTMEM-CUR-007 — effective/rendering evidence remains uninterpreted
Priority/enabled/createdAt and PromptSet/PromptTemplate content/version/schema/grounding/override/creator/approver evidence do not affect this relationship floor, and inputs remain unchanged.

## DD-178 AIToolSetMember AIToolDefinition Current-Binding Acceptance

### AITOOLMEM-DEF-CUR-001 — Exact referenced ACTIVE ToolDefinition matches
A valid member and exact referenced ToolDefinition with raw ACTIVE status return true.

### AITOOLMEM-DEF-CUR-002 — Wrong ToolDefinition identity fails
A different ToolDefinition id fails closed.

### AITOOLMEM-DEF-CUR-003 — Malformed member id fails
Malformed ToolSetMember identity fails closed.

### AITOOLMEM-DEF-CUR-004 — Malformed member relationship ids fail
Malformed ToolSet id or ToolDefinition id on the member fails closed.

### AITOOLMEM-DEF-CUR-005 — Malformed ToolDefinition id fails
Malformed referenced ToolDefinition identity fails closed.

### AITOOLMEM-DEF-CUR-006 — Non-ACTIVE status fails
Any raw status other than exact ACTIVE fails closed.

### AITOOLMEM-DEF-CUR-007 — Tool execution semantics remain uninterpreted
Member enabled/constraint/createdAt and ToolDefinition capability/operation/scope/permission/entitlement/schema/side-effect/approval/idempotency/audit/version/timestamps do not affect this relationship floor, and inputs remain unchanged.

## DD-179 AIAssistantDefinition Referenced-Definition Current-Binding Acceptance

### AIASSIST-REL-CUR-001 — PLATFORM PromptTemplate contains valid child scopes
An exact ACTIVE PLATFORM PromptTemplate may contain valid PLATFORM, TENANT or INDUSTRY AssistantDefinitions.

### AIASSIST-REL-CUR-002 — TENANT PromptTemplate contains only same-Tenant narrower/equal definitions
An exact ACTIVE TENANT PromptTemplate contains same-Tenant TENANT and INDUSTRY AssistantDefinitions; foreign-Tenant and PLATFORM children fail.

### AIASSIST-REL-CUR-003 — INDUSTRY PromptTemplate requires exact Industry child
An exact ACTIVE INDUSTRY PromptTemplate contains only the exact same-Tenant Industry AssistantDefinition.

### AIASSIST-REL-CUR-004 — Optional ToolSet exact ACTIVE containment
When `toolSetId` is present, ToolSet id/status/containment must match; when absent, extra ToolSet evidence fails closed.

### AIASSIST-REL-CUR-005 — Prompt/ToolSet identity or lifecycle mismatch fails
Wrong PromptTemplate id or non-ACTIVE PromptTemplate/ToolSet fails closed.

### AIASSIST-REL-CUR-006 — Malformed owner evidence fails closed
Malformed AssistantDefinition, PromptTemplate or ToolSet UUID/owner shapes fail closed.

### AIASSIST-REL-CUR-007 — Capability/content/runtime semantics remain uninterpreted
Assistant capability/RAG/model/retention/version/status/time, prompt content/schema/approval and ToolSet code/version evidence do not affect the relationship result, and inputs remain unchanged.

## DD-180 AgentDefinition ToolSet Current-Binding Acceptance

### AIAGENT-TOOLSET-CUR-001 — ACTIVE PLATFORM ToolSet contains valid Agent definitions
A valid ACTIVE PLATFORM ToolSet contains valid PLATFORM, TENANT and INDUSTRY AgentDefinitions under the canonical hierarchy.

### AIAGENT-TOOLSET-CUR-002 — TENANT ToolSet contains only same-Tenant narrower/equal Agent definitions
A valid ACTIVE TENANT ToolSet contains same-Tenant TENANT and INDUSTRY AgentDefinitions; foreign-Tenant or PLATFORM AgentDefinitions fail closed.

### AIAGENT-TOOLSET-CUR-003 — INDUSTRY ToolSet requires exact Industry child
A valid ACTIVE INDUSTRY ToolSet contains only the exact same-Tenant Industry AgentDefinition; sibling Industry, TENANT or PLATFORM AgentDefinitions fail closed.

### AIAGENT-TOOLSET-CUR-004 — ToolSet identity mismatch fails
Wrong ToolSet id fails closed.

### AIAGENT-TOOLSET-CUR-005 — Non-ACTIVE ToolSet fails
DRAFT, REVIEW, PUBLISHED and RETIRED ToolSets fail closed.

### AIAGENT-TOOLSET-CUR-006 — Malformed identities or owner shapes fail closed
Malformed AgentDefinition/ToolSet UUIDs or invalid PLATFORM/TENANT/INDUSTRY owner shapes fail closed.

### AIAGENT-TOOLSET-CUR-007 — Agent policy/runtime evidence remains uninterpreted
Agent objective/risk/approval/budget/version/status/timestamps and ToolSet code/version/timestamps do not affect this floor, and inputs remain unchanged.

## DD-181 AgentRun AgentDefinition Current-Binding Acceptance

### AIARUN-DEF-CUR-001 — ACTIVE PLATFORM definition applies to Core and Industry runs
An exact ACTIVE PLATFORM AgentDefinition applies to Tenant-Core and Tenant-Industry AgentRuns.

### AIARUN-DEF-CUR-002 — same-Tenant TENANT definition applies within Tenant
An exact ACTIVE TENANT AgentDefinition applies to same-Tenant Core/Industry runs; foreign Tenant fails closed.

### AIARUN-DEF-CUR-003 — INDUSTRY definition requires exact Industry
An exact ACTIVE INDUSTRY AgentDefinition applies only to the exact same-Tenant Industry run; sibling Industry or Tenant-Core fails closed.

### AIARUN-DEF-CUR-004 — definition identity mismatch fails
Wrong AgentDefinition id fails closed.

### AIARUN-DEF-CUR-005 — non-ACTIVE definition fails
Any definition status other than exact ACTIVE fails closed.

### AIARUN-DEF-CUR-006 — malformed identities or owner shapes fail closed
Malformed run/definition UUIDs or invalid PLATFORM/TENANT/INDUSTRY owner shapes fail closed.

### AIARUN-DEF-CUR-007 — principal/snapshot/run policy evidence remains uninterpreted
Acting-principal/membership, permission/entitlement snapshots, requested resource scope, run status/budgets/timestamps/correlation and AgentDefinition policy/ToolSet/version evidence do not affect this floor, and inputs remain unchanged.

## DD-182 AgentStep Tool-Binding Current-Floor Acceptance

### AISTEP-TOOL-CUR-001 — Exact TOOL chain matches
A TOOL step with exact run/definition parents, exact enabled ToolSetMember, exact ACTIVE ToolDefinition and member ToolSet equal to the persisted AgentDefinition allowed ToolSet returns true.

### AISTEP-TOOL-CUR-002 — Parent id mismatch fails
Wrong AgentRun id or AgentDefinition parent id fails closed.

### AISTEP-TOOL-CUR-003 — Member/tool identity mismatch fails
Missing/wrong ToolSetMember or wrong ToolDefinition id fails closed.

### AISTEP-TOOL-CUR-004 — Disabled/inactive/outside ToolSet fails
Disabled member, non-ACTIVE ToolDefinition or member outside the AgentDefinition allowed ToolSet fails closed.

### AISTEP-TOOL-CUR-005 — Non-TOOL steps require no binding
PLAN/RAG/APPROVAL/INFERENCE with absent persisted binding and no member/tool evidence return true; any persisted/extra binding evidence fails closed.

### AISTEP-TOOL-CUR-006 — Malformed/unsupported evidence fails
Malformed identifiers, malformed allowed ToolSet id or unsupported step type fail closed.

### AISTEP-TOOL-CUR-007 — Approval/policy/runtime semantics remain uninterpreted
Step approval/status/timestamps/audit, run principal/membership/snapshot/resource/lifecycle/budgets, definition policy/status/version, member constraint and tool permission/entitlement/approval/OperationContract metadata do not affect this floor, and inputs remain unchanged.

## DD-183 AgentStep AgentApproval Backlink Acceptance

### AISTEP-APP-CUR-001 — Unbound step requires no approval evidence
A valid AgentStep without `approvalId` matches only when no AgentApproval evidence is supplied.

### AISTEP-APP-CUR-002 — Exact approval id/run/step backlink matches
An AgentApproval with exact id, same run id and same step id satisfies the persisted backlink floor.

### AISTEP-APP-CUR-003 — Wrong approval id fails
A mismatched AgentApproval id fails closed.

### AISTEP-APP-CUR-004 — Wrong run or step backlink fails
Same approval id with a different run or different step fails closed.

### AISTEP-APP-CUR-005 — Unexpected evidence for unbound step fails
Supplying AgentApproval evidence when the AgentStep has no `approvalId` fails closed.

### AISTEP-APP-CUR-006 — Malformed identifiers fail closed
Malformed step/run/approval identifiers fail closed.

### AISTEP-APP-CUR-007 — Approval and runtime semantics remain uninterpreted
Step type/tool/status/timestamps/audit and approval Tenant/Industry/requestedBy/type/permission/approver/status/summary/time/reason/correlation evidence do not create acceptance, and inputs remain unchanged.

## DD-184 AgentApproval Parent/Scope Current-Binding Acceptance

### AIAPP-PARENT-CUR-001 — Exact Tenant-Core parent chain matches
A valid Tenant-Core AgentApproval with exact AgentRun and AgentStep parent ids and absent Industry Context matches.

### AIAPP-PARENT-CUR-002 — Exact Tenant-Industry parent chain matches
A valid Tenant-Industry AgentApproval with exact run/step chain and exact Industry Context matches.

### AIAPP-PARENT-CUR-003 — Wrong run or step identity fails
A mismatched AgentRun id or AgentStep id fails closed.

### AIAPP-PARENT-CUR-004 — Step-to-run backlink mismatch fails
An AgentStep that belongs to a different AgentRun fails closed.

### AIAPP-PARENT-CUR-005 — Tenant or Industry mismatch fails
Foreign Tenant, sibling Industry or Core/Industry mismatch fails closed.

### AIAPP-PARENT-CUR-006 — Malformed identifiers fail closed
Malformed approval/run/step ids or malformed Industry ids fail closed.

### AIAPP-PARENT-CUR-007 — Approval/run/step execution semantics remain uninterpreted
Approval status/type/permission/approver/time/reason/correlation, run principal/membership/versions/resource/status/budgets and step type/tool/approval/status/timestamps/audit evidence do not create acceptance, and inputs remain unchanged.

## DD-185 AIConversation AssistantDefinition Current-Binding Acceptance

### AICONV-AST-CUR-001 — Unbound conversation requires no assistant evidence
A valid AIConversation without `assistantDefinitionId` matches only when no AssistantDefinition evidence is supplied.

### AICONV-AST-CUR-002 — ACTIVE PLATFORM Assistant applies to Core and Industry conversations
An exact ACTIVE PLATFORM AssistantDefinition with no Tenant/Industry owner applies to either valid conversation scope.

### AICONV-AST-CUR-003 — same-Tenant TENANT Assistant applies within Tenant
An exact ACTIVE TENANT AssistantDefinition applies to same-Tenant Core/Industry conversations; foreign Tenant fails closed.

### AICONV-AST-CUR-004 — INDUSTRY Assistant requires exact Industry
An exact ACTIVE INDUSTRY AssistantDefinition applies only to the exact same-Tenant Industry conversation; sibling Industry or Tenant-Core fails closed.

### AICONV-AST-CUR-005 — assistant identity/status mismatch fails
Wrong AssistantDefinition id or any non-ACTIVE status fails closed.

### AICONV-AST-CUR-006 — malformed scope/owner or unexpected evidence fails closed
Malformed conversation identity/scope, malformed Assistant owner shape, or Assistant evidence for an unbound conversation fails closed.

### AICONV-AST-CUR-007 — owner/nested Assistant/runtime semantics remain uninterpreted
Conversation owner principal, sensitivity/retention/status/timestamps and Assistant capability/RAG/prompt/tool/model/retention/version/timestamps do not create acceptance; DD-179 is not auto-composed and inputs remain unchanged.

## DD-186 AIMemoryRecord AssistantDefinition Current-Binding Acceptance

### AIMEM-AST-CUR-001 — Unbound memory requires no AssistantDefinition evidence
A valid AIMemoryRecord without `assistantDefinitionId` matches only when no AssistantDefinition evidence is supplied.

### AIMEM-AST-CUR-002 — ACTIVE PLATFORM AssistantDefinition applies to Core and Industry memory
An exact ACTIVE PLATFORM AssistantDefinition with no Tenant/Industry owner applies to Tenant-Core or Tenant-Industry memory.

### AIMEM-AST-CUR-003 — same-Tenant TENANT AssistantDefinition applies within Tenant
An exact ACTIVE TENANT AssistantDefinition applies to same-Tenant Core/Industry memory; foreign Tenant fails closed.

### AIMEM-AST-CUR-004 — INDUSTRY AssistantDefinition requires exact Industry
An exact ACTIVE INDUSTRY AssistantDefinition applies only to the exact same-Tenant Industry memory; sibling Industry or Tenant-Core fails closed.

### AIMEM-AST-CUR-005 — Assistant identity/status mismatch fails
Wrong AssistantDefinition id or non-ACTIVE status fails closed.

### AIMEM-AST-CUR-006 — Malformed ownership or unexpected evidence fails closed
Malformed memory/assistant UUID/owner shape or extra AssistantDefinition evidence for an unbound memory fails closed.

### AIMEM-AST-CUR-007 — Memory lifecycle/policy and nested Assistant semantics remain uninterpreted
Principal, memory class/content/source/sensitivity/retention/ACL/status/timestamps/expiry/supersession and Assistant capability/RAG/prompt/tool/model/retention/version/timestamps do not create acceptance; DD-179 is not auto-composed; inputs remain unchanged.
## DD-187 AIMemoryRecord Supersession-Continuity Acceptance

### AIMEM-SUP-CUR-001 — Unbound memory requires no superseded-parent evidence
A valid AIMemoryRecord without `supersedesId` matches only when no superseded-parent evidence is supplied.

### AIMEM-SUP-CUR-002 — Exact direct parent preserves owner/scope/class continuity
A referenced parent at the exact `supersedesId` matches when child and parent have the same Tenant, null-safe Industry Context, null-safe principal and memory class.

### AIMEM-SUP-CUR-003 — Self-reference, missing parent or wrong parent fails closed
Direct self-reference, absent required parent evidence or a parent id different from `supersedesId` fails closed.

### AIMEM-SUP-CUR-004 — Tenant or null-safe Industry mismatch fails closed
Foreign Tenant, sibling Industry, or null-vs-present Industry Context mismatch fails closed.

### AIMEM-SUP-CUR-005 — Principal continuity is null-safe exact
Different principals or null-vs-present principal mismatch fails closed; both absent principals preserve continuity.

### AIMEM-SUP-CUR-006 — Class mismatch or malformed continuity evidence fails closed
Memory-class mismatch or malformed relevant child/parent identity, owner, scope, principal or class evidence fails closed.

### AIMEM-SUP-CUR-007 — Lifecycle/policy/deeper-chain semantics remain uninterpreted
Status, content/source, sensitivity, retention, ACL, AssistantDefinition, timestamps, expiry and deeper supersession-chain evidence do not create or remove acceptance; inputs remain unchanged.

## DD-188 AIMediaRequest PromptTemplate Binding Acceptance

### AIMEDIA-PROMPT-CUR-001 — Unbound request
No prompt id requires no version and no evidence.

### AIMEDIA-PROMPT-CUR-002 — PLATFORM owner
Exact ACTIVE PLATFORM id/version applies to Tenant Core and Industry requests.

### AIMEDIA-PROMPT-CUR-003 — TENANT owner
Exact ACTIVE TENANT id/version applies only within its Tenant.

### AIMEDIA-PROMPT-CUR-004 — INDUSTRY owner
Exact ACTIVE INDUSTRY id/version requires same Tenant and exact present Industry Context.

### AIMEDIA-PROMPT-CUR-005 — Binding mismatch
Wrong id/version/status or missing bound evidence fails closed.

### AIMEDIA-PROMPT-CUR-006 — Malformed ownership
Invalid relevant UUIDs/owner/version shape, orphan version and unexpected evidence fail closed.

### AIMEDIA-PROMPT-CUR-007 — Bounded semantics
Principal/document/brand/localization/sensitivity/residency/moderation/status/completion/prompt-content semantics stay uninterpreted; inputs are unchanged.


## DD-189 AIMediaRequest Input-Document Binding Acceptance

### AIMEDIA-DOC-CUR-001 — Empty reference/evidence sets
A valid request with an empty input-document reference set matches only an empty document-evidence set; unexpected evidence fails closed.

### AIMEDIA-DOC-CUR-002 — Complete exact-scope sets
Complete same-Tenant document sets match for Tenant-Core and Tenant-Industry requests independent of evidence order.

### AIMEDIA-DOC-CUR-003 — Tenant/Industry isolation
Foreign Tenant, sibling Industry, and null-versus-present Industry Context mismatches fail closed for every referenced document.

### AIMEDIA-DOC-CUR-004 — ACTIVE/CLEAN current state
Every referenced document must be raw ACTIVE and CLEAN; any other lifecycle or scan state fails closed.

### AIMEDIA-DOC-CUR-005 — Sensitivity ceiling
All known sensitivity classes obey PUBLIC < INTERNAL < CONFIDENTIAL < SENSITIVE_PERSONAL < REGULATED; each document must be at or below the request ceiling and unknown classes fail closed.

### AIMEDIA-DOC-CUR-006 — Exact residency
Every document residency value must exactly equal the request residency requirement; no trimming, case-folding, normalization or fallback is authorized.

### AIMEDIA-DOC-CUR-007 — Exact evidence-set hygiene
Malformed request/document identity or scope, invalid/duplicate references, and missing/extra/duplicate evidence fail closed.

### AIMEDIA-DOC-CUR-008 — Bounded semantics
Principal, prompt, ACL, StorageObject/signed-URL, brand, moderation, capability, request lifecycle and execution semantics remain uninterpreted; inputs are unchanged.


## DD-190 Document AI-Generated Provenance Raw-Reader Acceptance

### DOCAIPROV-PG-001 — Exact generated-document evidence
An exact RLS-visible AI-generated Industry Document preserves Document id/Tenant/Industry, sensitivity/residency, MediaRequest/Provider/Model ids and immutable provenance/moderation/licensing objects.

### DOCAIPROV-PG-002 — Non-AI rows stay unbound
An exact non-AI Document preserves `aiGenerated=false` and has no optional AI provenance evidence.

### DOCAIPROV-PG-003 — Existing Document RLS remains authoritative
Sibling Industry and foreign Tenant rows remain hidden while same-Tenant Tenant-Core visibility follows the existing DocumentMeta FORCE-RLS policy.

### DOCAIPROV-PG-004 — Persisted shape and JSON fail closed
Malformed persisted UUID/ownership/provenance shape fails closed; normalized JSON evidence is immutable and no business meaning is invented.

### DOCAIPROV-PG-005 — Input/context/routing validation
Malformed RequestContext, invalid Document id and Data Home route mismatch fail before provenance disclosure.

### DOCAIPROV-PG-006 — Exact-read surface only
The port exposes no create/update/delete/generate/moderate/publish/execute operation.

### DOCAIPROV-PG-007 — Raw evidence is not runtime authority
Raw provenance does not prove MediaRequest completion/currentness, Provider/Model currentness, moderation/licensing approval, publication, Document ACL/storage access or AI execution authority.


## DD-191 Generated Document AIMediaRequest Provenance Acceptance

### DOCAI-MEDIA-CUR-001 — Non-AI rows stay unbound
A non-AI Document with no MediaRequest binding/evidence matches; unexpected request binding or evidence fails closed.

### DOCAI-MEDIA-CUR-002 — Exact completed same-scope binding
An AI-generated Document matches an exact completed MediaRequest in the same Tenant and null-safe Industry scope, including Tenant-Core.

### DOCAI-MEDIA-CUR-003 — Required completed request evidence
Missing request evidence, wrong request id, or absent/invalid completion evidence fails closed. Calendar-invalid or timezone-ambiguous completion timestamps—including values a permissive runtime parser would normalize—are invalid; valid explicit UTC/numeric-offset instants remain acceptable.

### DOCAI-MEDIA-CUR-004 — Tenant/Industry isolation
Foreign Tenant, sibling Industry, and null-versus-present Industry mismatch fail closed.

### DOCAI-MEDIA-CUR-005 — Exact residency
Generated Document residency and MediaRequest residency requirement must be exactly equal; no normalization/fallback is authorized.

### DOCAI-MEDIA-CUR-006 — Sensitivity containment
Known sensitivity classes obey PUBLIC < INTERNAL < CONFIDENTIAL < SENSITIVE_PERSONAL < REGULATED and generated Document rank must be at least the request rank.

### DOCAI-MEDIA-CUR-007 — Malformed relevant shape
Malformed Document/request identity, scope, generated flag, request binding or sensitivity shape fails closed.

### DOCAI-MEDIA-CUR-008 — Bounded semantics
Provider/Model ids, provenance/moderation/licensing JSON and unrelated request principal/capability/media/prompt/brand/localization/moderation-policy/status/createdAt evidence remain uninterpreted; inputs remain unchanged.


## DD-192 Generated Document AIModel/AIProvider Pair Acceptance

### DOCAI-MODEL-CUR-001 — Non-AI rows stay unbound
A non-AI Document passes only when AI Model/Provider ids and model evidence are absent.

### DOCAI-MODEL-CUR-002 — Exact composite pair
An AI-generated Document passes when the supplied AIModel id exactly equals `aiModelId` and the model's `providerId` exactly equals `aiProviderId`.

### DOCAI-MODEL-CUR-003 — Missing/wrong model
Missing model evidence or a mismatched AIModel id fails closed.

### DOCAI-MODEL-CUR-004 — Provider-pair mismatch
A model whose `providerId` differs from the Document `aiProviderId` fails closed.

### DOCAI-MODEL-CUR-005 — Relevant shape validation
Malformed Document id/Tenant/optional Industry/generated/model/provider UUID shape or malformed model id/provider pair fails closed.

### DOCAI-MODEL-CUR-006 — Runtime/catalog semantics stay uninterpreted
Model status/version/capabilities/modalities/residency/sensitivity/cost/latency/metadata are not evaluated and no separate Provider row is required.

### DOCAI-MODEL-CUR-007 — Unrelated provenance stays uninterpreted
Document MediaRequest/provenance/moderation/licensing evidence does not affect the pair predicate; inputs remain unchanged.


## DD-193 RAGSource Document Binding Acceptance

### RAGSRC-DOC-CUR-001 — Unbound source stays unbound
A RAGSource without `documentId` passes only when `documentVersion` and supplied Document evidence are absent.

### RAGSRC-DOC-CUR-002 — Exact Tenant-Core / Tenant-Industry bindings
Bound sources pass only with exact Document id/version/Tenant/null-safe Industry/scope equality.

### RAGSRC-DOC-CUR-003 — Missing or wrong Document evidence fails closed
Missing Document evidence, wrong Document id or wrong version fails.

### RAGSRC-DOC-CUR-004 — Ownership/scope mismatch fails closed
Tenant, null-safe Industry Context or scope-class mismatch fails.

### RAGSRC-DOC-CUR-005 — Referenced Document must remain ACTIVE/CLEAN
Any raw Document status other than ACTIVE or virus-scan status other than CLEAN fails.

### RAGSRC-DOC-CUR-006 — Residency is exact
Residency must match byte-for-byte; trimming, case-folding or fallback is not authorized.

### RAGSRC-DOC-CUR-007 — Sensitivity cannot be downgraded
For all known classes, RAGSource sensitivity rank must be greater than or equal to referenced Document sensitivity rank; unknown classes fail closed.

### RAGSRC-DOC-CUR-008 — Relevant shapes fail closed; unrelated semantics stay raw
Malformed relevant identity/version/scope evidence fails; unrelated RAGSource/Document fields remain uninterpreted and inputs are not mutated.


## DD-194 RAGChunk Parent RAGSource Binding Acceptance

### RAGCHUNK-SRC-CUR-001 — Exact parent bindings
Exact Tenant-Industry and Tenant-Core chunk/source parent relationships pass.

### RAGCHUNK-SRC-CUR-002 — Missing/wrong parent fails closed
Missing source evidence or a mismatched parent source id fails closed.

### RAGCHUNK-SRC-CUR-003 — Ownership/scope mismatch fails closed
Tenant, null-safe Industry Context or scope-class mismatch fails.

### RAGCHUNK-SRC-CUR-004 — Residency is exact
Residency equality is byte-for-byte; trimming, case-folding or fallback is not authorized.

### RAGCHUNK-SRC-CUR-005 — Retention is exact
Retention-class equality is byte-for-byte; normalization/fallback is not authorized.

### RAGCHUNK-SRC-CUR-006 — Sensitivity cannot be downgraded
For all known classes, RAGChunk sensitivity rank must be greater than or equal to parent RAGSource sensitivity rank; unknown classes fail closed.

### RAGCHUNK-SRC-CUR-007 — Relevant shape validation
Malformed chunk/source identity, ownership, scope, residency, retention or sensitivity shape fails closed.

### RAGCHUNK-SRC-CUR-008 — Unrelated semantics stay uninterpreted
Chunk ordinal/text/hash/token/ACL/embedding/version/metadata and source status/document/resource/ACL/version/chunking evidence do not affect this predicate; inputs remain unchanged.


## DD-195 RAGChunk Embedding Model Eligibility Acceptance

### RAGCHUNK-MODEL-CUR-001 — Exact ACTIVE model with sufficient ceiling
An exact embedding-model id whose raw status is ACTIVE and whose sensitivity ceiling rank is at least the chunk sensitivity rank passes.

### RAGCHUNK-MODEL-CUR-002 — Missing/wrong model fails closed
Missing model evidence or a mismatched model id fails closed.

### RAGCHUNK-MODEL-CUR-003 — ACTIVE is exact
Model status must equal `ACTIVE` exactly; inactive, retired, case variants and whitespace variants fail.

### RAGCHUNK-MODEL-CUR-004 — Sensitivity ceiling containment
For all known classes, model ceiling rank must be greater than or equal to chunk sensitivity rank.

### RAGCHUNK-MODEL-CUR-005 — Unknown sensitivity fails closed
Unknown chunk sensitivity or model sensitivity ceiling fails closed.

### RAGCHUNK-MODEL-CUR-006 — Relevant shape validation
Malformed chunk id, embedding-model id, model id or raw model-status shape fails closed.

### RAGCHUNK-MODEL-CUR-007 — Unrelated model semantics stay uninterpreted
Provider id, capabilities, modalities, residency, cost, latency, version and model metadata are not inputs to this persisted predicate.

### RAGCHUNK-MODEL-CUR-008 — Unrelated chunk semantics stay uninterpreted
Source/scope/residency/retention/ACL/embedding-version and other unrelated chunk fields do not affect this predicate; inputs remain unchanged.


## DD-196 TokenUsage AIModel/Provider Pair Acceptance

### AIUSAGE-MODEL-CUR-001 — Exact composite pair
An exact TokenUsage model/provider pair matching AIModel `id/providerId` passes.

### AIUSAGE-MODEL-CUR-002 — Missing/wrong model fails closed
Missing model evidence or a mismatched AIModel id fails closed.

### AIUSAGE-MODEL-CUR-003 — Provider pair must match exactly
AIModel `providerId` must exactly equal TokenUsage `providerId`.

### AIUSAGE-MODEL-CUR-004 — Relevant shape validation
Malformed TokenUsage id/Tenant/optional Industry/model/provider UUID shape or malformed model id/provider pair fails closed.

### AIUSAGE-MODEL-CUR-005 — Runtime/catalog semantics stay uninterpreted
Model status/version/capabilities/modalities/residency/sensitivity/cost/latency/metadata are not evaluated and no separate Provider row is required.

### AIUSAGE-MODEL-CUR-006 — Usage observability evidence stays uninterpreted
TokenUsage principal/capability/unit/time/correlation evidence does not affect this composite-pair predicate.

### AIUSAGE-MODEL-CUR-007 — Bounded pure predicate
Inputs remain unchanged; a true result grants no routing, authorization, billing or AI execution authority.


## DD-197 TokenUsage Capability Binding Acceptance

### AIUSAGE-CAP-CUR-001 — Exact capability code continuity
Exact TokenUsage `capabilityCode` and AICapability `code` pass.

### AIUSAGE-CAP-CUR-002 — Missing/wrong capability evidence fails closed
Missing capability evidence or a mismatched code fails.

### AIUSAGE-CAP-CUR-003 — Code equality is exact
Capability code comparison is byte-for-byte; case-folding, trimming, aliasing or fallback is not authorized.

### AIUSAGE-CAP-CUR-004 — Relevant TokenUsage shape fails closed
Malformed TokenUsage id/Tenant/optional Industry identity or non-string capability code fails closed.

### AIUSAGE-CAP-CUR-005 — Capability evidence shape fails closed
Malformed capability id or non-string code fails closed.

### AIUSAGE-CAP-CUR-006 — Capability runtime/policy semantics stay uninterpreted
Capability status, category, required entitlement, default policy class and schema version do not affect this foreign-key predicate.

### AIUSAGE-CAP-CUR-007 — Unrelated usage semantics stay uninterpreted
Principal/model/provider/usage-unit/time/correlation evidence is not evaluated; inputs remain unchanged and a true result grants no authorization, billing or execution authority.


## DD-198 AICost TokenUsage Binding Acceptance

### AICOST-USAGE-CUR-001 — Exact usage parent
A cost row passes when its `usageId` exactly equals the supplied TokenUsage `id`.

### AICOST-USAGE-CUR-002 — Missing/wrong parent fails closed
Missing TokenUsage evidence or a mismatched TokenUsage id fails closed.

### AICOST-USAGE-CUR-003 — Relevant ids must be valid
Malformed AICost `usageId` or TokenUsage `id` fails closed.

### AICOST-USAGE-CUR-004 — Cost semantics stay uninterpreted
Currency, estimated minor units, provider-rate version, billable class and finalized timestamp do not affect this relationship predicate.

### AICOST-USAGE-CUR-005 — Usage semantics stay uninterpreted
TokenUsage Tenant/Industry/principal/capability/model/provider/units/time/correlation evidence does not affect this relationship predicate.

### AICOST-USAGE-CUR-006 — Bounded/no mutation
Inputs remain unchanged; a true result grants no pricing, billing, finalization, authorization or AI execution authority.


## DD-199 AIMessage Conversation Binding Acceptance

### AIMSG-CONV-CUR-001 — Exact parent continuity
An AIMessage passes when its `conversationId` exactly equals the supplied AIConversation `id`.

### AIMSG-CONV-CUR-002 — Missing/wrong parent fails closed
Missing AIConversation evidence or a mismatched parent id fails closed.

### AIMSG-CONV-CUR-003 — Relevant ids must be valid
Malformed AIMessage id/conversation id or AIConversation id fails closed.

### AIMSG-CONV-CUR-004 — Message semantics stay uninterpreted
Message role/content/source refs/model route/timestamps do not affect this foreign-key predicate.

### AIMSG-CONV-CUR-005 — Conversation semantics stay uninterpreted
Conversation Tenant/Industry/scope/principal/assistant/sensitivity/retention/status/timestamps do not affect this foreign-key predicate.

### AIMSG-CONV-CUR-006 — Bounded/no mutation
Inputs remain unchanged; a true result grants no conversation authorization, model-route authority, content/source access or AI execution authority.


## DD-200 AIModel Provider Binding Acceptance

### AIMODEL-PROV-CUR-001 — Exact provider binding
An AIModel passes when supplied AIProvider id exactly equals the model `providerId`.

### AIMODEL-PROV-CUR-002 — Missing/wrong Provider fails closed
Missing Provider evidence or a mismatched Provider id fails closed.

### AIMODEL-PROV-CUR-003 — Relevant identity shape fails closed
Malformed Model id, Model providerId or Provider id fails closed.

### AIMODEL-PROV-CUR-004 — Provider runtime semantics stay uninterpreted
Provider code/status/adapter/regions/capabilities/security/residency/health/version/timestamps are not evaluated.

### AIMODEL-PROV-CUR-005 — Model runtime semantics stay uninterpreted
Model lifecycle/capability/modality/residency/sensitivity/cost/latency/version/metadata are not evaluated.

### AIMODEL-PROV-CUR-006 — No authority is created
Inputs remain unchanged and a true result grants no current/eligible/routable/credential/execution authority.


## DD-201 TokenUsage Provider Binding Acceptance

### AIUSAGE-PROV-CUR-001 — Exact Provider binding
TokenUsage passes only when supplied AIProvider evidence has an id exactly equal to `providerId`.

### AIUSAGE-PROV-CUR-002 — Missing/wrong Provider fails closed
Missing Provider evidence or a mismatched Provider id fails closed.

### AIUSAGE-PROV-CUR-003 — Relevant identity shape
Malformed TokenUsage id/Tenant/optional Industry/providerId or malformed Provider id fails closed.

### AIUSAGE-PROV-CUR-004 — Provider runtime semantics stay uninterpreted
Provider code/status/adapter/regions/capabilities/security/residency/health/version/timestamps do not affect this direct FK predicate.

### AIUSAGE-PROV-CUR-005 — Non-provider TokenUsage evidence stays uninterpreted
TokenUsage model/capability/principal/units/time/correlation evidence does not affect this direct FK predicate.

### AIUSAGE-PROV-CUR-006 — Pure predicate only
Inputs remain unchanged and a true result grants no Provider currentness, health, credential, routing, billing or AI execution authority.


## DD-202 AIMediaRequest Capability Binding Acceptance

### AIMEDIA-CAP-CUR-001 — Exact capability binding
An AIMediaRequest passes when supplied AICapability evidence has a code exactly equal to `capabilityCode`.

### AIMEDIA-CAP-CUR-002 — Missing/wrong capability fails closed
Missing capability evidence or a mismatched capability code fails closed.

### AIMEDIA-CAP-CUR-003 — Code equality is exact
Capability-code equality is byte-for-byte with no trimming/case normalization/fallback; empty-to-empty raw equality is preserved.

### AIMEDIA-CAP-CUR-004 — Relevant request shape fails closed
Malformed AIMediaRequest id, Tenant, optional Industry Context or capability-code shape fails closed.

### AIMEDIA-CAP-CUR-005 — Relevant capability shape fails closed
Malformed AICapability id or code evidence fails closed.

### AIMEDIA-CAP-CUR-006 — Capability catalog semantics stay uninterpreted
Capability lifecycle/category/entitlement/default-policy/schema-version evidence does not affect this direct FK predicate.

### AIMEDIA-CAP-CUR-007 — Unrelated request semantics stay uninterpreted
Principal/media/prompt/brand/localization/document/sensitivity/residency/moderation/status/time evidence does not affect this direct FK predicate; inputs remain unchanged.


## DD-203 AIToolDefinition Capability Binding Acceptance

### AITOOL-CAP-CUR-001 — Exact capability binding
An AIToolDefinition passes when supplied AICapability evidence has a code exactly equal to `capabilityCode`.

### AITOOL-CAP-CUR-002 — Missing/wrong capability fails closed
Missing capability evidence or a mismatched capability code fails closed.

### AITOOL-CAP-CUR-003 — Code equality is exact
Capability-code equality is byte-for-byte with no trimming/case normalization/fallback; equal empty raw strings remain valid persisted evidence.

### AITOOL-CAP-CUR-004 — Relevant ToolDefinition shape fails closed
Malformed AIToolDefinition id or non-string capability code fails closed.

### AITOOL-CAP-CUR-005 — Relevant capability shape fails closed
Malformed AICapability id or non-string code evidence fails closed.

### AITOOL-CAP-CUR-006 — Capability catalog semantics stay uninterpreted
Capability lifecycle/category/entitlement/default-policy/schema-version evidence does not affect this direct FK predicate.

### AITOOL-CAP-CUR-007 — Unrelated ToolDefinition semantics stay uninterpreted
Tool id, OperationContract, scope, permission, entitlement, schemas, side effects, approval, idempotency, audit, lifecycle/version/timestamps do not affect this direct FK predicate; inputs remain unchanged.


## DD-204 AIToolSetMember Parent ToolSet Binding Acceptance

### AITOOLMEM-SET-CUR-001 — Exact parent ToolSet
Exact parent ToolSet id continuity passes.

### AITOOLMEM-SET-CUR-002 — Missing parent evidence
Missing ToolSet evidence fails closed.

### AITOOLMEM-SET-CUR-003 — Wrong parent identity
A ToolSet whose id differs from `member.toolSetId` fails closed.

### AITOOLMEM-SET-CUR-004 — Member identity shape
Malformed member id or ToolSet id fails closed.

### AITOOLMEM-SET-CUR-005 — Parent identity shape
Malformed ToolSet id evidence fails closed.

### AITOOLMEM-SET-CUR-006 — Parent catalog semantics stay uninterpreted
ToolSet owner/scope/code/version/status/timestamp evidence does not affect the direct foreign-key predicate.

### AITOOLMEM-SET-CUR-007 — Unrelated member semantics stay uninterpreted
Member ToolDefinition/enabled/constraint/timestamp evidence does not affect the predicate; inputs remain unchanged.


## DD-205 IndustryAIConfig Domain PromptSet Binding Acceptance

### AIINDCFG-PROMPT-CUR-001 — Unbound config stays unbound
A config without `domainPromptSetId` passes only when no PromptSet evidence is supplied.

### AIINDCFG-PROMPT-CUR-002 — PLATFORM PromptSet applicability
An exact referenced raw ACTIVE PLATFORM PromptSet applies to the Industry config.

### AIINDCFG-PROMPT-CUR-003 — TENANT PromptSet applicability
An exact referenced raw ACTIVE TENANT PromptSet applies only for the same Tenant.

### AIINDCFG-PROMPT-CUR-004 — INDUSTRY PromptSet applicability
An exact referenced raw ACTIVE INDUSTRY PromptSet applies only for the same Tenant and exact Industry Context.

### AIINDCFG-PROMPT-CUR-005 — Exact id and raw ACTIVE state
Missing evidence, wrong PromptSet id or any non-ACTIVE/raw status variant fails closed.

### AIINDCFG-PROMPT-CUR-006 — Relevant shape validation
Malformed config id/Tenant/Industry/domain PromptSet id or malformed PromptSet id/owner shape fails closed.

### AIINDCFG-PROMPT-CUR-007 — Unrelated configuration stays uninterpreted
Industry allowlists/country packs/localization/version/update fields and PromptSet code/version/timestamps do not affect this predicate; inputs remain unchanged.


## DD-206 TenantAIConfig Capability Allowlist Binding Acceptance

### AITENCFG-CAP-CUR-001 — Empty allowlist
An empty capability allowlist passes only with empty capability evidence.

### AITENCFG-CAP-CUR-002 — Complete exact ACTIVE set
A duplicate-free allowlist passes with exactly one raw-ACTIVE capability row per exact code, independent of evidence order.

### AITENCFG-CAP-CUR-003 — Exact evidence-set hygiene
Missing, extra, duplicate or wrong-code capability evidence fails closed.

### AITENCFG-CAP-CUR-004 — Raw ACTIVE state
Every referenced capability status must equal `ACTIVE` exactly; case/whitespace variants and non-ACTIVE states fail.

### AITENCFG-CAP-CUR-005 — Allowlist set shape
Duplicate or non-string TenantAIConfig capability entries fail closed; empty remains valid.

### AITENCFG-CAP-CUR-006 — Relevant identity/code shape
Malformed config id/Tenant id or malformed capability id/code evidence fails closed.

### AITENCFG-CAP-CUR-007 — Unrelated semantics stay uninterpreted
Provider/Model allowlists, enablement, policy refs, sensitivity/version/timestamps and Capability category/entitlement/policy/schema semantics do not affect this predicate; inputs remain unchanged.


## DD-207 TenantAIConfig Provider Allowlist Binding Acceptance

### AITENCFG-PROV-CUR-001 — Empty allowlist
An empty Provider allowlist passes only with empty Provider evidence.

### AITENCFG-PROV-CUR-002 — Complete exact ACTIVE set
A duplicate-free Provider allowlist passes with exactly one raw-ACTIVE Provider row per exact id, independent of evidence order.

### AITENCFG-PROV-CUR-003 — Exact evidence-set hygiene
Missing, extra, duplicate or wrong-id Provider evidence fails closed.

### AITENCFG-PROV-CUR-004 — Raw ACTIVE state
Every referenced Provider status must equal `ACTIVE` exactly; case/whitespace variants and non-ACTIVE states fail.

### AITENCFG-PROV-CUR-005 — Allowlist set shape
Duplicate, malformed or non-array TenantAIConfig Provider-id evidence fails closed; empty remains valid.

### AITENCFG-PROV-CUR-006 — Relevant identity/status shape
Malformed config id/Tenant id or malformed Provider id/status evidence fails closed.

### AITENCFG-PROV-CUR-007 — Unrelated semantics stay uninterpreted
Capability/Model allowlists, enablement, policies/sensitivity/version/timestamps and Provider code/adapter/regions/capabilities/security/residency/health/version/timestamps do not affect this predicate; inputs remain unchanged.


## DD-208 TenantAIConfig Model Allowlist Binding Acceptance

### AITENCFG-MODEL-CUR-001 — Empty allowlist
An empty Model allowlist passes only with empty Model evidence.

### AITENCFG-MODEL-CUR-002 — Complete exact ACTIVE set
A duplicate-free Model allowlist passes with exactly one raw-ACTIVE Model row per exact id, independent of evidence order, when every Model provider id is present in the same config Provider allowlist.

### AITENCFG-MODEL-CUR-003 — Exact evidence-set hygiene
Missing, extra, duplicate or wrong-id Model evidence fails closed.

### AITENCFG-MODEL-CUR-004 — Raw ACTIVE state
Every referenced Model status must equal `ACTIVE` exactly; case/whitespace variants and non-ACTIVE states fail.

### AITENCFG-MODEL-CUR-005 — Model provider membership
Every referenced Model `providerId` must be an exact member of the same config `allowedProviderIds[]`; no separate Provider row is required by this predicate.

### AITENCFG-MODEL-CUR-006 — Allowlist set shape
Duplicate, malformed or non-array Model-id or Provider-id allowlist evidence fails closed; empty Model allowlists remain valid.

### AITENCFG-MODEL-CUR-007 — Relevant identity/status shape
Malformed config id/Tenant id or malformed Model id/provider-id/status evidence fails closed.

### AITENCFG-MODEL-CUR-008 — Unrelated semantics stay uninterpreted
Capability allowlist, enablement, policies/sensitivity/version/timestamps and Model code/capabilities/modalities/residency/sensitivity/cost/latency/version/metadata do not affect this predicate; inputs remain unchanged.


## DD-209 IndustryAIConfig TenantAIConfig Non-Widening Acceptance

### AIINDCFG-TENANT-CUR-001 — Same-Tenant subset
A valid enabled IndustryAIConfig passes against a supplied enabled same-Tenant TenantAIConfig when its capability, Provider-id and Model-id allowlists are exact subsets.

### AIINDCFG-TENANT-CUR-002 — Enablement non-widening
An enabled IndustryAIConfig fails against a disabled supplied TenantAIConfig. A disabled IndustryAIConfig does not widen Tenant enablement whether the supplied TenantAIConfig is enabled or disabled.

### AIINDCFG-TENANT-CUR-003 — Relevant identity and boolean shape
Foreign-Tenant evidence or malformed Industry/Tenant config identity or enabled-boolean evidence fails closed.

### AIINDCFG-TENANT-CUR-004 — Capability subset
Every Industry capability must be an exact raw-string member of the supplied Tenant capability set. No trimming, case-folding or invented non-empty rule is allowed.

### AIINDCFG-TENANT-CUR-005 — Provider and Model subsets
Every Industry Provider id and Model id must be an exact member of the corresponding supplied Tenant allowlist.

### AIINDCFG-TENANT-CUR-006 — Allowlist set shape
Duplicate, malformed or sparse capability/Provider/Model allowlist evidence on either side fails closed. Capability entries remain raw strings; Provider and Model entries require UUID shape.

### AIINDCFG-TENANT-CUR-007 — Narrower/empty Industry sets
Empty Industry allowlists and other narrower Industry subsets are valid against valid Tenant sets; extra Tenant entries do not fail this predicate.

### AIINDCFG-TENANT-CUR-008 — Unrelated semantics and temporal boundary
Unrelated fields remain uninterpreted and inputs remain unchanged. A true result does not select current/latest configuration, identify the historical write-time TenantAIConfig, compose effective configuration, provision, route or authorize AI execution.


## DD-210 IndustryAIConfig CountryPack Activation Acceptance

### AIINDCFG-PACK-CUR-001 — Empty reference set
An empty CountryPack reference set passes only with empty activation evidence.

### AIINDCFG-PACK-CUR-002 — Complete exact ACTIVE set
A duplicate-free CountryPack reference set passes with exactly one same-Tenant raw-ACTIVE TenantCountryPackActivation per exact CountryPack id, independent of evidence order.

### AIINDCFG-PACK-CUR-003 — Exact evidence-set hygiene
Missing, extra, duplicate, duplicate-pack or wrong-pack activation evidence fails closed.

### AIINDCFG-PACK-CUR-004 — Raw ACTIVE status
Every referenced activation status must equal `ACTIVE` exactly; PENDING, DISABLED, case/whitespace variants and malformed status fail.

### AIINDCFG-PACK-CUR-005 — Same-Tenant ownership
Every supplied activation must belong to the IndustryAIConfig Tenant exactly.

### AIINDCFG-PACK-CUR-006 — Relevant identity/set shape
Malformed Industry config identity, duplicate/malformed/sparse CountryPack refs, malformed activation identities or non-array activation evidence fail closed.

### AIINDCFG-PACK-CUR-007 — Order independence
Reference/evidence order does not matter, but every referenced CountryPack still requires exactly one matching activation.

### AIINDCFG-PACK-CUR-008 — Unrelated semantics stay uninterpreted
Industry enabled/other allowlists/domain PromptSet/localization/version/timestamps and activation override/timestamps/rowVersion do not affect this predicate; inputs remain unchanged.


## DD-211 AIProvisioningSnapshot TenantAIConfig Binding Acceptance

### AIPROVSNAP-TENCFG-CUR-001 — Exact referenced config
Exact same-Tenant referenced TenantAIConfig version, enabled state and snapshot Provider subset pass.

### AIPROVSNAP-TENCFG-CUR-002 — Exact version
TenantAIConfig version mismatch or malformed/non-canonical snapshot TenantAIConfig version text fails closed.

### AIPROVSNAP-TENCFG-CUR-003 — Same-Tenant identities
Foreign-Tenant or malformed snapshot/config identity evidence fails closed.

### AIPROVSNAP-TENCFG-CUR-004 — Enabled config
The referenced TenantAIConfig must be strictly enabled; disabled or malformed boolean evidence fails closed.

### AIPROVSNAP-TENCFG-CUR-005 — Provider subset
Every snapshot Provider id must be an exact member of the referenced TenantAIConfig Provider set. Empty/narrower snapshot sets and wider Tenant sets are valid.

### AIPROVSNAP-TENCFG-CUR-006 — Provider set shape
Duplicate, malformed, sparse or non-array Provider evidence on either side fails closed.

### AIPROVSNAP-TENCFG-CUR-007 — Order independence
Provider order does not matter and extra Tenant Provider ids do not fail the subset relationship.

### AIPROVSNAP-TENCFG-CUR-008 — Unrelated semantics
Snapshot capability/API/model/commercial/Industry/packs/budget/status/validity and Tenant capability/model/policy/sensitivity fields remain uninterpreted; inputs remain unchanged.


## DD-212 AIProvisioningSnapshot Capability Binding Acceptance

### AIPROVSNAP-CAP-CUR-001 — Exact capability evidence
Exact same-Tenant/version Tenant config plus complete ACTIVE capability-id evidence whose exact codes are allowed passes.

### AIPROVSNAP-CAP-CUR-002 — Referenced config binding
Foreign Tenant, version mismatch, malformed/non-canonical snapshot version or invalid Tenant config version fails closed.

### AIPROVSNAP-CAP-CUR-003 — Exact evidence set
Missing, extra, duplicate-id or wrong-id capability evidence fails closed.

### AIPROVSNAP-CAP-CUR-004 — Raw ACTIVE status
Every supplied capability must have raw status exactly `ACTIVE`; other or normalized variants fail.

### AIPROVSNAP-CAP-CUR-005 — Exact code membership
Capability code must be an exact raw-string member of the referenced Tenant config `allowedCapabilities`; no trim/case normalization.

### AIPROVSNAP-CAP-CUR-006 — Relevant shape validation
Malformed/sparse/duplicate snapshot capability ids, malformed Tenant capability allowlist, malformed capability id/code/status evidence or non-array evidence fail closed.

### AIPROVSNAP-CAP-CUR-007 — Empty/order semantics
Empty snapshot capability set passes only with empty evidence; evidence order is irrelevant.

### AIPROVSNAP-CAP-CUR-008 — Unrelated semantics
Unrelated snapshot/Tenant/capability fields remain uninterpreted and inputs remain unchanged.


## DD-213 AIProvisioningSnapshot Tenant-Core Industry-Version Acceptance

### AIPROVSNAP-TCORE-CUR-001 — Tenant-Core absence
Tenant-Core snapshot with no Industry activation version passes.

### AIPROVSNAP-TCORE-CUR-002 — Canonical version forbidden
Tenant-Core snapshot carrying a canonical activation version fails.

### AIPROVSNAP-TCORE-CUR-003 — Any present version forbidden
Any non-undefined Tenant-Core Industry activation-version runtime value fails.

### AIPROVSNAP-TCORE-CUR-004 — Industry scope not overclaimed
Valid IndustryContext id passes this specific floor without proving activation-version equality.

### AIPROVSNAP-TCORE-CUR-005 — IndustryContext identity shape
Malformed present IndustryContext id fails closed.

### AIPROVSNAP-TCORE-CUR-006 — Snapshot/Tenant identity shape
Malformed snapshot or Tenant id fails closed.

### AIPROVSNAP-TCORE-CUR-007 — Unrelated semantics
Unrelated ProvisioningSnapshot fields remain uninterpreted.

### AIPROVSNAP-TCORE-CUR-008 — Immutability/non-selection
Input remains unchanged and this predicate selects no Industry state.


## DD-214 IndustryContext Activation Raw Reader Acceptance

### INDCTX-ACT-PG-001 — Exact tuple evidence
Exact owning Tenant+Industry tuple returns frozen id/Tenant/status/exact bigint activationVersion evidence.

### INDCTX-ACT-PG-002 — Tenant tuple isolation
Same IndustryContext id with a foreign Tenant tuple returns null.

### INDCTX-ACT-PG-003 — Raw lifecycle/version preservation
ACTIVE/PENDING/SUSPENDED/DISABLED statuses and max/zero/negative bigint activation versions remain raw where physically persisted.

### INDCTX-ACT-PG-004 — Missing/malformed handling
Missing well-formed tuple returns null; malformed Tenant or Industry id fails closed before SQL.

### INDCTX-ACT-PG-005 — Fixed bootstrap privilege boundary
Reader executes through `sbg_context_bootstrap_ro`, which remains NOBYPASSRLS and SELECT-only for IndustryContext.

### INDCTX-ACT-PG-006 — No selection/mutation authority
Port exposes no list/current/primary/state-transition or mutation method.


## DD-215 AIProvisioningSnapshot Industry Activation-Version Acceptance

### AIPROVSNAP-INDVER-CUR-001 — Exact ACTIVE version match
Exact same-Tenant/same-Industry ACTIVE activation evidence with equal canonical bigint version passes.

### AIPROVSNAP-INDVER-CUR-002 — Industry scope required
Missing IndustryContext id or missing Industry activation version fails this Industry-scoped predicate.

### AIPROVSNAP-INDVER-CUR-003 — Exact ownership
Foreign-Tenant or wrong-IndustryContext evidence fails closed.

### AIPROVSNAP-INDVER-CUR-004 — Raw ACTIVE status
Only raw status exactly `ACTIVE` passes; PENDING/SUSPENDED/DISABLED and malformed/normalized variants fail.

### AIPROVSNAP-INDVER-CUR-005 — Exact version equality
Stale lower or higher activation versions fail.

### AIPROVSNAP-INDVER-CUR-006 — Relevant shape
Malformed identities or non-canonical bigint text on either side fail closed.

### AIPROVSNAP-INDVER-CUR-007 — Exact bigint text
Zero, negative and bigint-boundary canonical strings compare exactly without JavaScript-number conversion.

### AIPROVSNAP-INDVER-CUR-008 — Unrelated semantics
Unrelated snapshot/evidence fields remain uninterpreted and inputs remain unchanged.


## DD-216 Commercial Provisioning Version Evidence Reader Acceptance

### COMPROVVER-PG-001 — Tenant-Core exact evidence
A resolved Tenant-Core context returns frozen Tenant-owned current Subscription id/version and raw-CURRENT EntitlementSnapshot id/version evidence.

### COMPROVVER-PG-002 — Tenant-Industry same-Tenant evidence
A resolved same-Tenant Industry context returns the same Tenant-owned commercial version evidence without adding Industry semantics.

### COMPROVVER-PG-003 — Raw CURRENT snapshot only
Non-CURRENT EntitlementSnapshots are ignored; absence of a raw CURRENT snapshot is preserved as absent evidence.

### COMPROVVER-PG-004 — Current Subscription pointer absence
A missing or unmatched Tenant current-Subscription pointer is preserved without inventing Subscription version evidence.

### COMPROVVER-PG-005 — Exact bigint text
PostgreSQL Subscription and EntitlementSnapshot bigint versions are preserved as canonical decimal text, including max bigint.

### COMPROVVER-PG-006 — Context/Tenant isolation
Malformed or unsupported contexts fail closed and RequestScopedSql/RLS prevents cross-Tenant evidence leakage.

### COMPROVVER-PG-007 — Read-only bounded authority
The port exposes no list/latest/mutation/compile/authorize authority and returned evidence is immutable.


## DD-217 AIProvisioningSnapshot Commercial-Version Equality Acceptance

### AIPROVSNAP-COMVER-CUR-001 — Exact commercial versions
Exact same-Tenant complete current-Subscription and raw-CURRENT EntitlementSnapshot version evidence matching the snapshot passes.

### AIPROVSNAP-COMVER-CUR-002 — Identity isolation
Foreign-Tenant or malformed snapshot/evidence identities fail closed.

### AIPROVSNAP-COMVER-CUR-003 — Current Subscription evidence completeness
Missing or incomplete current-Subscription id/version evidence fails closed.

### AIPROVSNAP-COMVER-CUR-004 — CURRENT entitlement evidence completeness
Missing or incomplete raw-CURRENT EntitlementSnapshot id/version evidence fails closed.

### AIPROVSNAP-COMVER-CUR-005 — Subscription version equality
Subscription version mismatch or malformed/non-canonical/out-of-range PostgreSQL bigint text fails closed; signed and zero values remain representable where schema-owned.

### AIPROVSNAP-COMVER-CUR-006 — EntitlementSnapshot version equality
EntitlementSnapshot version mismatch or non-positive/malformed/non-canonical/out-of-range PostgreSQL bigint text fails closed.

### AIPROVSNAP-COMVER-CUR-007 — Bigint fidelity
Exact maximum PostgreSQL bigint values pass when evidence matches; no numeric coercion is used.

### AIPROVSNAP-COMVER-CUR-008 — Unrelated semantics
Unrelated snapshot/commercial evidence fields remain uninterpreted and inputs remain unchanged.


## DD-218 AIProvisioningSnapshot Governed-Shape Acceptance

### AIPROVSNAP-SHAPE-CUR-001 — Valid governed shape
Valid non-null JSON-object pack maps plus exact duplicate-free API-class and raw Model-class string sets pass.

### AIPROVSNAP-SHAPE-CUR-002 — Pack maps are JSON objects
Null, array or scalar pack-version values fail; arbitrary nested object content remains uninterpreted.

### AIPROVSNAP-SHAPE-CUR-003 — API-class set shape
API classes must be an actual dense duplicate-free raw-string array.

### AIPROVSNAP-SHAPE-CUR-004 — Exact API-class vocabulary
API classes must exactly match INTERNAL_FIRST_PARTY, TENANT_API, PARTNER_API or PUBLIC_DEVELOPER_API; case/whitespace variants fail.

### AIPROVSNAP-SHAPE-CUR-005 — Model-class set shape
Model classes must be an actual dense duplicate-free raw-string array; no vocabulary or non-empty rule is invented.

### AIPROVSNAP-SHAPE-CUR-006 — Empty governed sets
Empty API-class and Model-class sets are valid with valid object maps.

### AIPROVSNAP-SHAPE-CUR-007 — Separate Capability/Provider ownership
Capability-id/Provider-id arrays and unrelated snapshot fields remain uninterpreted by DD-218.

### AIPROVSNAP-SHAPE-CUR-008 — Immutability/no normalization
Inputs remain unchanged and no trimming, case-folding or default insertion occurs.

## DD-219 AIProvisioningSnapshot Lifecycle/Validity Acceptance

### AIPROVSNAP-LIFE-CUR-001 — Valid persisted lifecycle and ordering
Positive canonical version, exact allowed status, valid compiledAt and absent/strictly-later validUntil pass.

### AIPROVSNAP-LIFE-CUR-002 — Canonical positive version
Zero, negative, signed, decimal, leading-zero, whitespace and non-string version evidence fails closed.

### AIPROVSNAP-LIFE-CUR-003 — Exact status vocabulary
Only exact ACTIVE, SUPERSEDED and REVOKED values pass; normalized, unknown or non-string values fail.

### AIPROVSNAP-LIFE-CUR-004 — Compiled instant
Malformed or non-string compiledAt evidence fails closed.

### AIPROVSNAP-LIFE-CUR-005 — Valid-until ordering
Present validUntil must be a finite instant strictly later than compiledAt; malformed, equal or earlier evidence fails.

### AIPROVSNAP-LIFE-CUR-006 — No wall-clock currentness invention
Historically expired evidence may satisfy persisted ordering; this predicate does not decide present validity.

### AIPROVSNAP-LIFE-CUR-007 — Identity and unrelated fields
Malformed snapshot/Tenant identities fail closed while unrelated fields remain uninterpreted.

### AIPROVSNAP-LIFE-CUR-008 — Immutability and bounded semantics
Input remains unchanged and a true result grants no current/effective/authorized semantics.


## DD-220 AIProvisioningSnapshot Current-Lifecycle Admission Acceptance

### AIPROVSNAP-ADM-CUR-001 — Active inside window
An ACTIVE snapshot evaluated at or after compile and before expiry passes.

### AIPROVSNAP-ADM-CUR-002 — Open-ended validity
Absent validUntil remains lifecycle-admissible after compile.

### AIPROVSNAP-ADM-CUR-003 — Inactive/future compile
SUPERSEDED, REVOKED or future-compiled evidence fails closed.

### AIPROVSNAP-ADM-CUR-004 — Expiry is exclusive
Evaluation at or after validUntil fails.

### AIPROVSNAP-ADM-CUR-005 — Malformed time/lifecycle evidence
Malformed evaluation or invalid lifecycle evidence fails closed.


## DD-221 AIProvisioningSnapshot API-Class Admission Acceptance

### AIPROVSNAP-ADM-API-001 — Exact governed membership
An exact governed API class present in the snapshot passes.

### AIPROVSNAP-ADM-API-002 — No normalization or invention
Absent, case/whitespace-normalized, unknown or non-string candidate classes fail.

### AIPROVSNAP-ADM-API-003 — Persisted set integrity
Malformed, duplicate or out-of-vocabulary persisted API-class sets fail closed.


## DD-222 AIProvisioningSnapshot Capability Admission Acceptance

### AIPROVSNAP-ADM-CAP-001 — Exact ACTIVE capability membership
Exact allowed capability id with non-empty code and raw ACTIVE status passes.

### AIPROVSNAP-ADM-CAP-002 — Absent/foreign/inactive capability
Absent, foreign or inactive capability evidence fails.

### AIPROVSNAP-ADM-CAP-003 — Capability evidence integrity
Malformed/duplicate allowed ids, malformed capability id or empty capability code fails closed.


## DD-223 AIProvisioningSnapshot Provider Admission Acceptance

### AIPROVSNAP-ADM-PROV-001 — Exact ACTIVE provider membership
Exact allowed Provider id with raw ACTIVE status passes.

### AIPROVSNAP-ADM-PROV-002 — Absent/foreign/inactive provider
Absent, foreign or inactive Provider evidence fails.

### AIPROVSNAP-ADM-PROV-003 — Provider evidence integrity
Malformed/duplicate allowed ids or malformed Provider id fails closed.


## DD-224 AIProvisioningSnapshot Model-Class Admission Acceptance

### AIPROVSNAP-ADM-MODEL-001 — Exact model-class membership
An exact non-empty persisted model-class member passes.

### AIPROVSNAP-ADM-MODEL-002 — No normalization or type coercion
Absent, case/whitespace-normalized, empty or non-string candidates fail.

### AIPROVSNAP-ADM-MODEL-003 — Persisted set integrity
Malformed or duplicate persisted model-class sets fail closed.

### AIPROVSNAP-ADM-IMM-001 — Batch immutability
DD-220…DD-224 helpers do not mutate supplied snapshot, capability or Provider evidence.

## DD-225 AI OperationContract Declaration Shape Acceptance

### AIOP-SHAPE-001 — Valid canonical Core + AI declaration shape
A valid canonical Core OperationContract plus the five AI-only DD-09 declaration fields passes.

### AIOP-SHAPE-002 — Malformed or unknown declaration evidence
Unknown API class, malformed Core enum/schema/array shape, or non-string AI-only metadata fails closed.


## DD-226 Deterministic AI OperationContract Projection Acceptance

### AIOP-PROJ-001 — Canonical projection ownership
Projection derives DD-09 permission, entitlement, scope, request/response schema, rate and audit fields only from the canonical Core OperationContract while preserving AI-only fields exactly.

### AIOP-PROJ-002 — Immutable/no parallel authority
Projection is immutable; invalid declarations return null and no parallel Tenant/Industry/permission authority is created.


## DD-227 AI Operation RequestContext Scope Acceptance

### AIOP-SCOPE-001 — Exact declared/request scope
Exact declared/request scope matches; mismatched or malformed RequestContext scope fails closed.


## DD-228 AI Operation Snapshot Admission Acceptance

### AIOP-SNAP-001 — Current lifecycle + exact API class
A snapshot satisfying DD-220 current lifecycle and DD-221 exact declared API-class membership passes.

### AIOP-SNAP-002 — Lifecycle/API-class denial
Inactive, not-yet-valid, expired lifecycle or absent/invalid API-class membership fails closed.


## DD-229 AI Operation Capability Admission Acceptance

### AIOP-CAP-001 — Exact declared ACTIVE capability
Exact declaration capability code plus exact DD-222 allowed ACTIVE capability-id membership passes.

### AIOP-CAP-002 — Capability mismatch/inactive/absence
Wrong capability code, inactive/malformed capability or absent capability id fails closed.


## DD-230 Combined AI Pre-Provider Prerequisite Acceptance

### AIOP-PRE-001 — All known prerequisites
Valid declaration shape, exact RequestContext scope, current snapshot/API class and exact ACTIVE capability binding pass together.

### AIOP-PRE-002 — Any prerequisite failure denies
Failure of any composed DD-225/DD-227/DD-228/DD-229 prerequisite fails the combined floor.

### AIOP-PRE-003 — Immutable and non-authorizing
Inputs remain unchanged and a true result grants no Provider/Model, policy/quota, credential, routing or execution authority.

## DD-231 AI Provider Capability Candidate Acceptance

### AIROUTE-PROV-CAP-001 — Exact allowed ACTIVE Provider capability
An exact snapshot-allowed raw-ACTIVE Provider whose supported-capabilities evidence contains the declaration capability code passes.

### AIROUTE-PROV-CAP-002 — Provider capability denial
Absent capability, malformed support-array evidence, disallowed Provider id or non-ACTIVE Provider fails closed.


## DD-232 AI Provider Authorized-Region Candidate Acceptance

### AIROUTE-PROV-REG-001 — Exact pre-authorized Provider region
A non-empty already-authorized region exactly present in Provider supported-regions evidence passes.

### AIROUTE-PROV-REG-002 — Provider region denial
Empty/unknown/non-string region or malformed Provider region evidence fails closed.


## DD-233 AI Model Provider/ACTIVE Candidate Acceptance

### AIROUTE-MODEL-PROV-001 — Exact Provider binding + ACTIVE Model
Exact AIModel→AIProvider id continuity with raw Model status ACTIVE passes.

### AIROUTE-MODEL-PROV-002 — Model/Provider denial
Wrong Provider, malformed Model/Provider identity or non-ACTIVE Model fails closed.


## DD-234 AI Model Capability Candidate Acceptance

### AIROUTE-MODEL-CAP-001 — Exact Model capability
Exact declaration capability-code membership in Model capability evidence passes.

### AIROUTE-MODEL-CAP-002 — Model capability denial
Absent capability or malformed Model capability evidence fails closed.


## DD-235 AI Model Sensitivity-Ceiling Candidate Acceptance

### AIROUTE-MODEL-SENS-001 — Sensitivity ceiling ordering
For every known sensitivity pair, Model ceiling >= request sensitivity passes and lower ceiling fails.

### AIROUTE-MODEL-SENS-002 — Unknown sensitivity denial
Unknown, malformed or non-string request/Model sensitivity evidence fails closed.


## DD-236 AI Model Authorized-Region Candidate Acceptance

### AIROUTE-MODEL-REG-001 — Exact pre-authorized Model region
A non-empty already-authorized region exactly present in Model residency-region evidence passes.

### AIROUTE-MODEL-REG-002 — Model region denial
Unknown/empty/non-string region or malformed Model residency-region evidence fails closed.


## DD-237 Combined Provider/Model Catalog-Candidate Acceptance

### AIROUTE-CAND-001 — All known catalog prerequisites
All DD-231…DD-236 Provider/Model catalog-candidate prerequisites pass together.

### AIROUTE-CAND-002 — Any candidate prerequisite failure denies
Failure of any DD-231…DD-236 prerequisite fails the combined candidate floor.

### AIROUTE-CAND-003 — Immutable and non-routing
Inputs remain unchanged and a true result grants no model-class mapping, live policy/quota, health/scoring/fallback, credential or execution authority.

## DD-238 AI Provider/Model Evidence-Set Shape Acceptance

### AIROUTE-SET-SHAPE-001 — Valid finite unique evidence set
Dense finite Provider/Model arrays with unique valid ids and every Model resolving to exactly one supplied Provider pass.

### AIROUTE-SET-SHAPE-002 — Malformed/duplicate/orphan evidence denial
Sparse arrays, duplicate ids, malformed ids or orphan Model provider references fail closed.


## DD-239 AI Provider/Model Exact Pair Projection Acceptance

### AIROUTE-PAIR-001 — Exact immutable pair
Exact DD-200 Model→Provider binding projects immutable Provider/Model ids.

### AIROUTE-PAIR-002 — Invalid pair denial
Wrong or malformed pair returns null and exposes no route metadata.


## DD-240 AI Catalog Pre-Candidate Filtering Acceptance

### AIROUTE-SET-FILTER-001 — DD-237 pair filtering
All supplied pairs passing DD-237 are included and failing pairs are excluded.

### AIROUTE-SET-FILTER-002 — Input-order independence
Equivalent Provider/Model evidence produces the same candidate set regardless of input array order.


## DD-241 Deterministic Non-Ranking Candidate-Set Acceptance

### AIROUTE-SET-CANON-001 — Canonical immutable output
Output is immutable, duplicate-free and canonically ordered by Provider id then Model id.

### AIROUTE-SET-CANON-002 — Canonical order is not routing preference
Output exposes no score, preference, health or fallback metadata.


## DD-242 Empty/Partial Candidate-Set Semantics Acceptance

### AIROUTE-SET-EMPTY-001 — Valid zero-match set
Valid evidence with no passing pair returns an immutable empty array.

### AIROUTE-SET-EMPTY-002 — Malformed evidence distinction
Malformed evidence returns null instead of an empty successful set.

### AIROUTE-SET-BOUND-001 — Immutability
Input evidence remains unchanged.

### AIROUTE-SET-BOUND-002 — Non-routing boundary
Output exposes only Provider/Model ids and no model-class mapping, route decision, policy/quota, health, score, fallback, credentials or execution authority.

## DD-243 AIRequest Shape Acceptance

### AIREQ-SHAPE-001 — Exact DD-09 field set
A valid request carrying exactly the required DD-09 fields plus only the allowed optional fields passes.

### AIREQ-SHAPE-002 — Missing or unknown top-level field
A missing required field or unknown top-level field fails closed.

### AIREQ-SHAPE-003 — Malformed required evidence
Malformed required strings, non-positive/non-safe schema version, non-JSON input or unknown sensitivity class fails closed.

### AIREQ-SHAPE-004 — Malformed optional evidence
Malformed optional strings, requested-output JSON or allowed-source-scope evidence fails closed.


## DD-244 Immutable AIRequest Projection Acceptance

### AIREQ-PROJ-001 — Exact deeply immutable projection
A valid request projects only the DD-09 fields with deeply immutable JSON/list evidence.

### AIREQ-PROJ-002 — Invalid/no parallel authority
Invalid requests return null and projection exposes no Tenant/Industry/permission/route authority.


## DD-245 AIRequest Capability Binding Acceptance

### AIREQ-CAP-001 — Exact capability binding
Exact request/declaration capability-code equality passes.

### AIREQ-CAP-002 — Capability mismatch
Mismatched or malformed capability binding fails closed.


## DD-246 AIRequest Input-Schema Binding Acceptance

### AIREQ-SCHEMA-001 — Exact input-schema version
Exact request/declaration input-schema-version equality passes.

### AIREQ-SCHEMA-002 — Schema mismatch
Mismatched or malformed schema binding fails closed.


## DD-247 Combined AIRequest Pre-Routing Acceptance

### AIREQ-PRE-001 — All request prerequisites
DD-243 shape plus DD-245 capability and DD-246 schema bindings pass together.

### AIREQ-PRE-002 — Any prerequisite failure denies
Failure of any composed request prerequisite fails the combined floor.

### AIREQ-PRE-003 — Immutable and non-routing
Inputs remain unchanged and a true result grants no context resolution, policy, route, credential or execution authority.

## DD-248 AIRequest TenantAIConfig Capability Acceptance

### AITENREQ-CAP-001 — Exact request capability membership
A valid DD-243 request whose exact capability code is present in a dense duplicate-free supplied TenantAIConfig capability allowlist passes.

### AITENREQ-CAP-002 — Missing/duplicate/malformed capability evidence denial
Absent capability membership, duplicate capability evidence or malformed TenantAIConfig capability evidence fails closed.

## DD-249 AIRequest TenantAIConfig Sensitivity Acceptance

### AITENREQ-SENS-001 — Exact sensitivity ceiling ordering
For every known sensitivity pair, request sensitivity <= supplied TenantAIConfig max sensitivity passes and a request above the ceiling fails.

### AITENREQ-SENS-002 — Unknown/malformed sensitivity denial
Unknown request/config sensitivity or malformed TenantAIConfig identity evidence fails closed.

## DD-250 Bound AIRequest/TenantAIConfig Prerequisite Acceptance

### AITENREQ-BIND-001 — Exact snapshot-bound Tenant config prerequisites
DD-247 request/declaration integrity plus exact DD-211 snapshot→TenantAIConfig binding, capability membership and sensitivity ceiling pass together.

### AITENREQ-BIND-002 — Any binding/config prerequisite failure denies
Tenant/config version mismatch, Tenant mismatch, disabled config, capability denial or sensitivity denial fails closed.

## DD-251 TenantAIConfig Provider/Model Pre-Candidate Allowlist Acceptance

### AITENROUTE-ALLOW-001 — Exact Provider and Model allowlist subset
Exact Provider+Model allowlist candidates return immutable canonical Provider/Model refs.

### AITENROUTE-ALLOW-002 — Valid partial subset
Valid evidence returns only exact candidates whose Provider and Model ids are both allowlisted.

### AITENROUTE-ALLOW-003 — Malformed/duplicate evidence denial
Malformed, duplicate or sparse candidate/config allowlist evidence returns null.

### AITENROUTE-ALLOW-004 — Valid empty/zero-match distinction
Valid empty or zero-match evidence returns an immutable empty array.

## DD-252 TenantAIConfig-Constrained Pre-Routing Set Acceptance

### AITENROUTE-PRE-001 — Combined prerequisite and allowlist filtering
The DD-250 request/config prerequisite plus DD-251 candidate filter returns the expected immutable set.

### AITENROUTE-PRE-002 — Prerequisite failure is not empty success
A request/config prerequisite failure returns null rather than an empty successful set.

### AITENROUTE-PRE-003 — Immutable non-routing boundary
Inputs remain unchanged and output exposes no policy decision, score, fallback, credential, route decision or execution authority.

## DD-253 IndustryAIConfig Snapshot Scope Acceptance

### AIINDREQ-SCOPE-001 — Exact same-Tenant/same-Industry enabled Industry config
A valid Industry-scoped ProvisioningSnapshot and supplied enabled IndustryAIConfig with exact Tenant and Industry Context equality pass.

### AIINDREQ-SCOPE-002 — Tenant-Core/foreign/sibling/disabled denial
A Tenant-Core snapshot, foreign Tenant, sibling Industry Context or disabled supplied IndustryAIConfig fails closed.

### AIINDREQ-SCOPE-003 — Malformed identity/enablement denial
Malformed snapshot/config identity or non-boolean Industry config enablement evidence fails closed.

### AIINDREQ-SCOPE-004 — Unrelated fields remain uninterpreted
Version/status/CountryPack/PromptSet/localization and other unrelated fields do not affect this floor; inputs remain unchanged.

## DD-254 AIRequest IndustryAIConfig Capability Acceptance

### AIINDREQ-CAP-001 — Exact Industry capability membership
A valid DD-243 request whose exact capability code is present in a dense duplicate-free supplied IndustryAIConfig capability allowlist passes.

### AIINDREQ-CAP-002 — Missing/duplicate/malformed Industry capability denial
Absent capability membership, duplicate capability evidence or malformed Industry config/capability evidence fails closed.

## DD-255 IndustryAIConfig Provider/Model Pre-Candidate Allowlist Acceptance

### AIINDROUTE-ALLOW-001 — Exact Industry Provider and Model allowlist subset
Exact Provider+Model allowlist candidates return immutable canonical Provider/Model refs.

### AIINDROUTE-ALLOW-002 — Valid partial Industry subset
Valid evidence returns only exact candidates whose Provider and Model ids are both Industry allowlisted.

### AIINDROUTE-ALLOW-003 — Malformed/duplicate evidence denial
Malformed, duplicate or sparse candidate/Industry allowlist evidence returns null.

### AIINDROUTE-ALLOW-004 — Valid empty/zero-match distinction
Valid empty or zero-match evidence returns an immutable empty array.

## DD-256 Bound AIRequest/IndustryAIConfig Prerequisite Acceptance

### AIINDREQ-BIND-001 — Tenant plus Industry request/config prerequisites
DD-250 Tenant request/config prerequisites, DD-209 Industry→Tenant non-widening, DD-253 exact Industry scope/enablement and DD-254 Industry capability membership pass together.

### AIINDREQ-BIND-002 — Any Tenant/Industry prerequisite failure denies
Tenant/config/scope/enablement/non-widening/capability failure fails closed.

## DD-257 IndustryAIConfig-Constrained Pre-Routing Set Acceptance

### AIINDROUTE-PRE-001 — Combined Tenant plus Industry constrained candidate set
DD-252 Tenant-constrained pre-routing evidence plus DD-256 Industry prerequisites and DD-255 Industry filtering returns the expected immutable set.

### AIINDROUTE-PRE-002 — Prerequisite failure is not empty success
A request/config prerequisite failure returns null rather than an empty successful set.

### AIINDROUTE-PRE-003 — Immutable non-routing/non-effective-config boundary
Inputs remain unchanged and output exposes no effective-config claim, policy decision, score, fallback, credential, route decision or execution authority.

## DD-258 IndustryAIConfig Tenant + PromptSet Relationship Composition Acceptance

### AIINDREL-PROMPT-001 — Valid supplied relationships
Valid DD-209 Tenant non-widening plus valid DD-205 optional domain PromptSet binding passes.

### AIINDREL-PROMPT-002 — Either child relationship failure denies
Tenant non-widening failure or PromptSet relationship failure returns false.


## DD-259 Relationship-Complete IndustryAIConfig Acceptance

### AIINDREL-PACK-001 — PromptSet + CountryPack relationships pass together
Valid DD-258 plus exact DD-210 CountryPack activation evidence passes.

### AIINDREL-PACK-002 — Invalid CountryPack evidence denies
Missing, extra, foreign-Tenant or non-ACTIVE CountryPack activation evidence fails closed.

### AIINDREL-PACK-003 — Fully unbound relationship case
An Industry config with no domain PromptSet and empty CountryPack refs passes only with no PromptSet evidence and empty activation evidence.


## DD-260 Snapshot-Scoped Relationship-Complete Industry Config Acceptance

### AIINDREL-SCOPE-001 — Exact Industry snapshot scope plus complete relationships
DD-253 exact scope/enabled floor plus DD-259 relationship-complete supplied config passes.

### AIINDREL-SCOPE-002 — Scope/config/relationship failure denies
Wrong scope, disabled Industry config or any DD-259 relationship failure returns false.


## DD-261 Request + Relationship-Complete Industry Config Acceptance

### AIINDREL-REQ-001 — Request prerequisites plus complete Industry relationships
DD-256 request/Tenant/Industry prerequisites plus DD-259 relationship-complete supplied config passes.

### AIINDREL-REQ-002 — Request or relationship prerequisite failure denies
Any request/Tenant/Industry or relationship failure returns false.


## DD-262 Relationship-Complete Industry-Constrained Pre-Routing Set Acceptance

### AIINDREL-PRE-001 — Expected immutable candidate set
Valid DD-257 candidates plus DD-261 relationships return the same immutable non-ranking candidate refs.

### AIINDREL-PRE-002 — Relationship failure is not empty success
A relationship prerequisite failure returns null rather than an empty successful set.

### AIINDREL-PRE-003 — Valid empty candidate set remains valid empty
When all relationships pass, a valid DD-257 empty candidate set remains immutable empty success.

### AIINDREL-PRE-004 — No new authority or mutation
Inputs remain unchanged and output exposes no effective-config, prompt, localization, policy, score, fallback, credential, route or execution authority.

## DD-263 RequestContext ↔ Industry Snapshot Scope Acceptance

### AIINDGW-CTX-001 — Exact TENANT_INDUSTRY scope match
A supplied TENANT_INDUSTRY RequestContext whose Tenant + Industry Context exactly equals the supplied Industry-scoped ProvisioningSnapshot passes.

### AIINDGW-CTX-002 — Wrong/missing scope evidence denies
TENANT_CORE/other scope, missing ids, foreign Tenant or sibling Industry fails closed.

### AIINDGW-CTX-003 — Malformed identity denial; unrelated fields uninterpreted
Malformed RequestContext/snapshot identities fail closed while unrelated supplied context/snapshot fields remain uninterpreted and inputs unchanged.


## DD-264 Industry Operation Gateway Admission Acceptance

### AIINDGW-ADM-001 — Exact context plus DD-230 admission
DD-263 exact supplied Industry context/snapshot scope plus DD-230 operation admission passes.

### AIINDGW-ADM-002 — Any admission prerequisite failure denies
Context/snapshot scope, snapshot lifecycle, API class or capability admission failure returns false.


## DD-265 AIRequest + Industry Gateway Admission Acceptance

### AIINDGW-REQ-001 — Request integrity plus gateway admission
DD-247 request integrity plus DD-264 Industry gateway admission passes without inferring requestContextRef identity binding.

### AIINDGW-REQ-002 — Request or gateway admission failure denies
Request capability/schema integrity or gateway admission failure returns false.


## DD-266 Relationship-Complete Industry Gateway Prerequisite Acceptance

### AIINDGW-REL-001 — Admission plus relationship-complete Industry prerequisites
DD-265 plus DD-261 relationship-complete supplied Industry prerequisites passes.

### AIINDGW-REL-002 — Any prerequisite failure denies
Context/admission/request/config/PromptSet/CountryPack prerequisite failure returns false.


## DD-267 Industry Gateway Relationship-Complete Pre-Routing Set Acceptance

### AIINDGW-PRE-001 — Expected immutable candidate set
The full relationship-complete Industry Gateway path returns the expected immutable DD-262 candidate refs.

### AIINDGW-PRE-002 — Failure is not empty success
Any gateway/relationship prerequisite failure returns null rather than an empty successful set.

### AIINDGW-PRE-003 — Valid empty remains valid empty
A valid empty DD-262 candidate set remains immutable empty success when all gateway prerequisites pass.

### AIINDGW-PRE-004 — No new authority or mutation
Inputs remain unchanged and output exposes no authentication/authorization/entitlement/effective-config/policy/score/fallback/credential/route/execution authority.

## DD-268 AI Industry Gateway Live Authorization Port Acceptance

### AIINDGUARD-PORT-001 — Exact RequestContext + operation bridge
The GuardPipeline-compatible port receives the exact supplied RequestContext and exact declaration.operation once.

### AIINDGUARD-PORT-002 — Optional resource reference preservation
resourceReference is omitted when absent and passed unchanged when supplied.


## DD-269 Exact Live Authorization Bridge Acceptance

### AIINDGUARD-AUTH-001 — Exact GuardResult preservation
The exact resolved GuardResult object is returned unchanged.

### AIINDGUARD-AUTH-002 — Denial/dependency errors propagate
Authorization denial or dependency failure rejects unchanged and is never normalized to null or empty success.


## DD-270 Authorization-Before-Pre-Routing Acceptance

### AIINDGUARD-ORDER-001 — Live authorization precedes DD-267 evidence construction
The live authorization call completes before DD-267 candidate evidence is accepted or evaluated as successful.

### AIINDGUARD-ORDER-002 — Post-authorization DD-267 evidence failure remains null
After successful authorization, malformed/invalid DD-267 evidence returns null rather than an authorization failure or empty success.


## DD-271 Guard Evidence Preservation Acceptance

### AIINDGUARD-EVID-001 — Guard evidence identity is preserved
The envelope preserves the exact GuardResult, including decisionId, resourceDescriptor and restrictionSet.

### AIINDGUARD-EVID-002 — Immutable envelope and candidates
The envelope and candidate collection are immutable; supplied inputs remain unchanged.


## DD-272 Valid-Empty / No-New-Authority Acceptance

### AIINDGUARD-EMPTY-001 — Authorized valid-empty succeeds
Successful live authorization plus a valid empty DD-267 candidate set returns an immutable envelope with immutable [] candidates.

### AIINDGUARD-BOUNDARY-001 — No new AI authority
The envelope exposes no new authorization decision, effective config, AI policy, budget, residency route, score, fallback, credential, route or execution authority beyond the preserved GuardResult.

## DD-273 Authorized Raw-Catalog Gateway Input Acceptance

### AIINDCAT-AUTH-001 — Authorization precedes request/catalog candidate evidence
Live authorization completes before AIRequest/raw Provider/Model evidence is read for candidate construction.

### AIINDCAT-AUTH-002 — Guard denial/dependency failure propagates
GuardPipeline denial or dependency error propagates unchanged and no catalog success is returned.


## DD-274 Authorized Request Evidence Acceptance

### AIINDCAT-REQ-001 — Malformed AIRequest after authorization denies
After successful live authorization, malformed DD-243 AIRequest evidence returns null.


## DD-275 Post-Authorization Raw Catalog Construction Acceptance

### AIINDCAT-CAT-001 — Valid raw catalog builds expected DD-242 then DD-267 subset
Valid raw Provider/Model evidence is filtered by DD-242 and then narrowed by DD-267 to the expected immutable set.

### AIINDCAT-CAT-002 — Malformed catalog evidence denies
Duplicate Provider identity, orphan Model binding or malformed catalog identity returns null after successful authorization.

### AIINDCAT-CAT-003 — Valid zero-match remains immutable empty success
Valid raw catalog evidence with no DD-242 survivor returns immutable [] when downstream prerequisites pass.

### AIINDCAT-REG-001 — Exact already-authorized residency region is applied
The exact supplied already-authorized residency region is passed into DD-242; unsupported region yields valid empty evidence and no derived region.


## DD-276 DD-242 → DD-267 Narrowing Acceptance

### AIINDCAT-NARROW-001 — Tenant/Industry allowlists only narrow
DD-267 receives only DD-242 candidate refs; Tenant/Industry allowlists cannot add a Provider/Model pair.


## DD-277 Authorized Raw-Catalog Envelope Acceptance

### AIINDCAT-EVID-001 — Exact GuardResult and immutable candidates preserved
Successful output preserves exact GuardResult identity and immutable candidate refs; inputs remain unchanged.

### AIINDCAT-BOUNDARY-001 — No new routing/policy authority
Output exposes no residency authorization, effective config, AI policy, budget, health score, cost/latency preference, fallback, credential, route or execution authority.

## DD-278 AIPolicy Identity / Owner-Shape Acceptance

### AIRESPOL-SHAPE-001 — Valid owner shapes
Valid PLATFORM, TENANT and INDUSTRY AIPolicy identity/owner shapes pass.

### AIRESPOL-SHAPE-002 — Malformed owner-shape evidence denial
Malformed UUID, owner shape, effect, version, priority or empty status evidence fails closed.

## DD-279 AIPolicy RequestContext Applicability Acceptance

### AIRESPOL-SCOPE-001 — Migration-0048 applicability semantics
PLATFORM applies to valid Tenant targets, TENANT only to exact same-Tenant targets, and INDUSTRY only to exact same-Tenant + same-Industry targets.

### AIRESPOL-SCOPE-002 — Non-Tenant / foreign / sibling scope denial
Platform-global/public/cross-context targets, foreign Tenant or sibling Industry fail this Tenant residency-policy evidence floor.

## DD-280 TenantAIConfig Residency-Policy Binding Acceptance

### AIRESPOL-BIND-001 — Exact config-to-policy id binding
Exact TenantAIConfig.residencyPolicyId ↔ supplied AIPolicy.id binding passes.

### AIRESPOL-BIND-002 — Malformed/mismatched identity denial
Malformed TenantAIConfig/policy identity or id mismatch fails closed.

## DD-281 Residency-Policy Context Relationship Acceptance

### AIRESPOL-CTX-001 — Exact Tenant context + applicable policy + config binding
Exact RequestContext Tenant, applicable supplied policy and exact TenantAIConfig binding pass.

### AIRESPOL-CTX-002 — Foreign/inapplicable/mismatched evidence denial
Foreign Tenant, inapplicable owner scope or policy-id mismatch fails closed.

## DD-282 Contextual Residency-Policy Evidence Load Acceptance

### AIRESPOL-LOAD-001 — Exact contextual read and identity preservation
The contextual loader receives the exact supplied RequestContext and policy id exactly once and returns the exact loaded policy identity when DD-281 passes.

### AIRESPOL-LOAD-002 — Missing/mismatched/error and uninterpreted semantics
Missing or mismatched evidence returns null, dependency errors propagate unchanged, and conditionAst/constraint/status semantics remain uninterpreted.

## DD-283 Post-Authorization Raw-Catalog Pre-Routing Acceptance

### AIRESGW-POST-001 — Existing candidate construction/narrowing preserved
The extracted post-authorization helper returns the same immutable DD-242 → DD-267 candidate subset for valid supplied evidence.

### AIRESGW-POST-002 — Malformed-versus-empty semantics preserved
Malformed/ineligible evidence returns null; valid zero-match evidence returns immutable empty success.


## DD-284 Existing Authorized Catalog Envelope Preservation Acceptance

### AIRESGW-AUTH-001 — Exact one-time authorization
The existing DD-277 envelope authorizes exactly once before DD-283 and preserves exact GuardResult object identity.

### AIRESGW-AUTH-002 — Guard failure remains authoritative
GuardPipeline denial/dependency error propagates unchanged and raw Provider/Model catalog evidence is not read.


## DD-285 Residency-Policy Evidence Ordering Acceptance

### AIRESGW-POL-001 — Required order
Execution order is live authorization → exact DD-282 residency-policy evidence load → raw Provider/Model catalog access.

### AIRESGW-POL-002 — Missing/mismatched policy stops before catalog
Missing or DD-281-incoherent policy evidence returns null before raw Provider/Model catalog evidence is read.

### AIRESGW-POL-003 — Policy-read dependency failure remains authoritative
AIPolicy read dependency error propagates unchanged and raw catalog evidence is not read.


## DD-286 Evidence-Preserving Envelope Acceptance

### AIRESGW-EVID-001 — Exact identities + immutable candidates
Success preserves exact GuardResult identity, exact loaded PersistedAIPolicy identity, immutable candidate refs and unchanged inputs.


## DD-287 Empty / Boundary Acceptance

### AIRESGW-EMPTY-001 — Valid empty remains successful empty
Valid empty DD-283 candidates plus valid policy evidence return an immutable empty successful envelope.

### AIRESGW-BOUNDARY-001 — No new authority
Output exposes no policy decision, residency authorization/derived region, effective configuration, budget approval/reservation, score, route/fallback, credential or execution authority.

## DD-288 NotificationDeliveryAttempt Parent Binding Acceptance

### NOTIF-ATT-PARENT-001 — Exact parent identity and positive attempt number
A UUID-shaped attempt whose deliveryId exactly equals the supplied Delivery id and whose attemptNo is a positive safe integer passes.

### NOTIF-ATT-PARENT-002 — Wrong/malformed parent or attempt number denies
Malformed ids, cross-Delivery evidence, zero/negative/non-integer attempt numbers fail closed.


## DD-289 NotificationDeliveryAttempt History Evidence-Set Acceptance

### NOTIF-ATT-SET-001 — Unique same-Delivery evidence passes
A dense finite same-Delivery array with unique attempt ids and unique positive attempt numbers passes.

### NOTIF-ATT-SET-002 — Duplicate identity/number denial
Duplicate attempt id or duplicate attemptNo fails closed.

### NOTIF-ATT-SET-003 — Cross-Delivery/sparse/malformed denial
Cross-Delivery, sparse or malformed attempt evidence fails closed.

### NOTIF-ATT-SET-004 — Empty history is valid
A valid Delivery with an empty supplied attempt array passes.


## DD-290 Canonical Raw Attempt History Projection Acceptance

### NOTIF-ATT-HIST-001 — Immutable canonical ordering
Unsorted valid evidence projects immutable cloned attempts ordered by attemptNo then id.

### NOTIF-ATT-HIST-002 — Raw evidence preservation
Provider message reference, normalized status/error and timestamps are preserved exactly without semantic interpretation.


## DD-291 Latest Raw Attempt Evidence Acceptance

### NOTIF-ATT-LATEST-001 — Highest supplied attempt number
Non-empty valid history returns the immutable highest-attempt-number evidence item.

### NOTIF-ATT-LATEST-002 — Empty versus malformed distinction
Valid empty history returns undefined; malformed history remains distinguishable as null.


## DD-292 Combined Delivery Attempt-History Evidence Acceptance

### NOTIF-ATT-ENV-001 — Exact Delivery plus immutable history/latest
The envelope preserves the exact supplied Delivery identity and immutable canonical history/latest evidence.

### NOTIF-ATT-BOUND-001 — No runtime decision authority
Inputs remain unchanged and the envelope exposes no retry, finality, backoff, provider-selection, credential, dispatch or scheduling authority.

## DD-293 NotificationDelivery Parent-First Reader Acceptance

### NOTIF-ATTHIST-READ-001 — Exact Delivery reader forwarding before attempt access
The Delivery reader receives the exact supplied RequestContext and NotificationDelivery id before the attempt reader is accessed.


## DD-294 Parent Absence/Error Acceptance

### NOTIF-ATTHIST-READ-002 — Hidden/absent parent short-circuit
A null Delivery result returns null and the attempt reader is not called.

### NOTIF-ATTHIST-READ-003 — Delivery dependency error propagation
A Delivery-reader error propagates unchanged and the attempt reader is not called.


## DD-295 NotificationDeliveryAttempt Reader Forwarding Acceptance

### NOTIF-ATTHIST-ATT-001 — Exact same RequestContext/id forwarding
After a visible parent, the attempt reader receives the exact same supplied RequestContext and NotificationDelivery id.

### NOTIF-ATTHIST-ATT-002 — Attempt dependency error propagation
An attempt-reader error propagates unchanged.


## DD-296 DD-292 Evidence Composition Acceptance

### NOTIF-ATTHIST-EVID-001 — Canonical non-empty history/latest evidence
Valid raw attempt rows compose to the expected DD-292 canonical immutable history and latest raw attempt evidence.

### NOTIF-ATTHIST-EVID-002 — Valid empty evidence distinction
Valid empty attempt evidence returns a non-null immutable empty-history envelope with no latest member.

### NOTIF-ATTHIST-EVID-003 — Malformed/cross-parent evidence denial
Malformed, duplicate or cross-parent attempt evidence returned by a supplied reader fails closed as null.


## DD-297 RequestContext-Scoped Attempt-History Reader Boundary Acceptance

### NOTIF-ATTHIST-BOUND-001 — No mutation or runtime decision authority
Inputs remain unchanged and output exposes no retry, finality, backoff, provider-selection, credential, dispatch, worker or scheduling authority.

## DD-298 Conditional TenantIntegration Relationship Read Acceptance

### NOTIF-RELREAD-INT-001 — Exact bound Integration read
When tenantIntegrationId is bound, the exact supplied RequestContext and exact bound id are forwarded and the returned reference is preserved.

### NOTIF-RELREAD-INT-002 — Unbound skip / bound null fail-closed
An unbound Integration skips the reader and projects no Integration evidence; a bound reader returning null causes the composed evidence load to fail closed.


## DD-299 Conditional Source OutboxEvent Relationship Read Acceptance

### NOTIF-RELREAD-EVT-001 — Exact bound source Event read
When sourceEventId is bound, the exact supplied RequestContext and exact bound id are forwarded and the returned reference is preserved.

### NOTIF-RELREAD-EVT-002 — Unbound skip / bound null fail-closed
An unbound source Event skips the reader and projects no Event evidence; a bound reader returning null causes the composed evidence load to fail closed.


## DD-300 Conditional NotificationTemplate Relationship Read Acceptance

### NOTIF-RELREAD-TPL-001 — Exact bound Template read
When templateId is bound, the exact supplied RequestContext and exact bound id are forwarded and the returned reference is preserved.

### NOTIF-RELREAD-TPL-002 — Unbound skip / bound null fail-closed
An unbound Template skips the reader and projects no Template evidence; a bound reader returning null causes the composed evidence load to fail closed.


## DD-301 DD-172 Relationship Validation Acceptance

### NOTIF-RELREAD-REL-001 — Exact loaded relationship evidence passes DD-172
Valid exact loaded Integration/Event/Template relationships return the expected immutable evidence envelope.

### NOTIF-RELREAD-REL-002 — Any DD-172 mismatch denies without fallback
Any known-relationship mismatch returns null and does not search or substitute another relationship.


## DD-302 Immutable Known-Relationship Evidence Loader Acceptance

### NOTIF-RELREAD-ERR-001 — Reader error propagation
A dependency/persistence error from any invoked relationship reader propagates unchanged.

### NOTIF-RELREAD-BOUND-001 — No mutation or send/runtime authority
Inputs remain unchanged and output exposes no recipient-validity, lifecycle, rendering, provider-selection, credential, retry, dispatch, scheduling or send authority.

## DD-303 Parent-First Visible NotificationDelivery Acceptance

### NOTIF-VRELREAD-PARENT-001 — Exact parent read forwarding
The Delivery reader receives the exact supplied RequestContext object and exact NotificationDelivery id before any relationship reader is accessed.


## DD-304 Parent Absence / Error Acceptance

### NOTIF-VRELREAD-PARENT-002 — Hidden/absent parent stops relationship access
A null/RLS-hidden Delivery returns null and no Integration/Event/Template reader is called.

### NOTIF-VRELREAD-PARENT-003 — Parent dependency error propagates unchanged
A Delivery-reader dependency/persistence error is propagated by identity and no relationship reader is called.


## DD-305 Visible Parent → DD-302 Delegation Acceptance

### NOTIF-VRELREAD-DELEG-001 — Exact visible parent/context delegation
The exact RequestContext and exact Delivery object returned by DD-098 are delegated to DD-302.

### NOTIF-VRELREAD-DELEG-002 — No parent re-read/fallback relationship access
The parent is read once; unbound relationships remain skipped through DD-302 and no fallback lookup is introduced.


## DD-306 DD-302 Result / Error Preservation Acceptance

### NOTIF-VRELREAD-EVID-001 — Exact-reference immutable evidence
Valid relationships return immutable evidence preserving the exact Delivery/Integration/Event/Template references loaded by the existing readers.

### NOTIF-VRELREAD-EVID-002 — DD-302 null remains null
Missing bound relationship evidence or DD-172 mismatch remains null without fallback selection.

### NOTIF-VRELREAD-ERR-001 — Relationship dependency error propagates unchanged
An invoked DD-302 relationship-reader dependency error propagates unchanged.


## DD-307 Bounded Visible-Parent Known-Relationship Read Acceptance

### NOTIF-VRELREAD-BOUND-001 — No new runtime authority
Inputs remain unchanged and output exposes no recipient-currentness, complete-Delivery-validity, lifecycle, rendering, provider, credential, retry, dispatch, scheduling, send or mutation authority.

## DD-308 Visible Relationship Parent Before Attempt Access Acceptance

### NOTIF-COMPEVID-REL-001 — DD-307 path precedes attempt access
DD-307 executes first with the exact supplied RequestContext and NotificationDelivery id before any attempt read.

### NOTIF-COMPEVID-REL-002 — Hidden/absent/mismatched relationship evidence stops composition
A null DD-307 result returns null and the attempt reader is not called.

### NOTIF-COMPEVID-REL-003 — Relationship dependency failure propagates
A DD-307 dependency/persistence error propagates unchanged and the attempt reader is not called.


## DD-309 Exact Attempt Reader Forwarding Acceptance

### NOTIF-COMPEVID-ATT-001 — Exact RequestContext/id forwarding
After DD-307 succeeds, the attempt reader receives the exact same RequestContext object and NotificationDelivery id.

### NOTIF-COMPEVID-ATT-002 — Attempt reader failure propagates
Attempt-reader dependency/persistence errors propagate unchanged.


## DD-310 DD-292 Attempt History Composition Acceptance

### NOTIF-COMPEVID-HIST-001 — Valid raw attempts compose canonically
The exact DD-307 Delivery plus exact raw attempt evidence yields the expected canonical DD-292 history/latest evidence.

### NOTIF-COMPEVID-HIST-002 — Valid empty attempt history remains success
Valid empty raw attempts produce an immutable empty history envelope with no latest member.

### NOTIF-COMPEVID-HIST-003 — Invalid attempt evidence remains null
Malformed, cross-parent or duplicate attempt evidence returns null.


## DD-311 Immutable Combined Evidence Envelope Acceptance

### NOTIF-COMPEVID-BOUND-001 — Preserve child evidence without new authority
The combined envelope is immutable, preserves exact child evidence references, leaves inputs unchanged and exposes no runtime/send/retry/mutation authority.


## DD-312 Bounded Composed Evidence Reader Acceptance

DD-312 exports only the RequestContext-scoped composed NotificationDelivery evidence reader defined by the acceptance contracts above. No recipient-currentness, lifecycle/finality, retryability, rendering, provider/credential, dispatch, scheduling, send or mutation semantics are added.

## DD-313 DD-312 Parent Evidence Before Integration Currentness Acceptance

### NOTIF-INTCUR-BASE-001 — Parent composed evidence precedes current-integrity access
DD-312 executes first with the exact supplied RequestContext/id and supplied Delivery/relationship/attempt readers before any current-integrity reader is accessed.

### NOTIF-INTCUR-BASE-002 — Parent null short-circuits deeper reads
DD-312 null returns null and no CredentialReference, IntegrationDefinition or IntegrationCapability read occurs.

### NOTIF-INTCUR-BASE-003 — Parent dependency error propagates
A DD-312 dependency/persistence error propagates unchanged and no current-integrity read occurs.


## DD-314 Conditional Integration-Bound Evidence Acceptance

### NOTIF-INTCUR-UNBOUND-001 — Unbound Delivery skips Integration currentness
An unbound Delivery succeeds with exact DD-312 evidence, no integrationCurrentIntegrity member and no Integration-currentness reads.


## DD-315 Exact Integration Current-Integrity Dependency Read Acceptance

### NOTIF-INTCUR-CRED-001 — Exact CredentialReference metadata forwarding
The exact RequestContext object and exact preserved integration.credentialReferenceId are forwarded.

### NOTIF-INTCUR-DEF-001 — Exact IntegrationDefinition forwarding
The exact preserved integration.integrationDefinitionId is forwarded.

### NOTIF-INTCUR-CAP-001 — Exact persisted capability reads
Exactly one capability read occurs per persisted enabledCapabilities entry in persisted order; an empty set performs no capability read.

### NOTIF-INTCUR-DEP-001 — Required null dependency evidence fails closed
Null CredentialReference metadata, Definition or required Capability evidence returns null.

### NOTIF-INTCUR-DEP-002 — Dependency errors propagate unchanged
Credential/Definition/Capability reader errors propagate unchanged.


## DD-316 DD-167 Current Integrity Delegation Acceptance

### NOTIF-INTCUR-FLOOR-001 — DD-167 true preserves exact evidence
A true DD-167 result returns immutable evidence preserving exact Integration/Credential/Definition/Capability references and supplied evaluatedAt.

### NOTIF-INTCUR-FLOOR-002 — DD-167 false fails closed
A false DD-167 result returns null without fallback or alternate evidence lookup.


## DD-317 Bounded Immutable Integration-Currentness Envelope Acceptance

### NOTIF-INTCUR-BOUND-001 — Evidence only, no send/runtime authority
Inputs remain unchanged and output exposes no sendable/executable/health/fallback/provider/secret/retry/dispatch/scheduling/mutation authority.

## DD-318 NotificationDelivery Parent-First EventCatalog Acceptance

### NOTIF-EVTCAT-BASE-001 — DD-317 parent evidence first
DD-317 executes with the exact supplied RequestContext, Delivery id and evaluatedAt before any EventCatalog access.

### NOTIF-EVTCAT-BASE-002 — Parent null short-circuits
DD-317 null returns null and EventCatalog is not read.

### NOTIF-EVTCAT-BASE-003 — Parent error propagates
DD-317 dependency/persistence error propagates unchanged and EventCatalog is not read.


## DD-319 Conditional Source-Event Branch Acceptance

### NOTIF-EVTCAT-UNBOUND-001 — Unbound Delivery does not read EventCatalog
A DD-317 success with no preserved source event returns immutable parent evidence only, with no EventCatalog access/evidence.


## DD-320 Exact EventCatalog Tuple Read Acceptance

### NOTIF-EVTCAT-READ-001 — Exact tuple forwarded once
A bound source event forwards its exact eventType, eventVersion and scopeClass to EventCatalogReadPort.loadExact exactly once.

### NOTIF-EVTCAT-READ-002 — Null/error semantics
Null catalog evidence returns null and EventCatalog reader errors propagate unchanged.


## DD-321 OutboxEvent ↔ EventCatalog Tuple Acceptance

### NOTIF-EVTCAT-TUPLE-001 — Exact tuple only
Exact type/version/scope equality passes regardless of ACTIVE or RETIRED catalog lifecycle.

### NOTIF-EVTCAT-TUPLE-002 — Mismatch/malformed tuple denial
Type/version/scope mismatch or malformed source-event tuple fails closed.


## DD-322 Immutable Delivery + Source-Event Catalog Evidence Acceptance

### NOTIF-EVTCAT-EVID-001 — Exact identity preservation
Success preserves the exact DD-317, OutboxEvent and EventCatalog object identities in immutable evidence.

### NOTIF-EVTCAT-BOUND-001 — Evidence-only boundary
Inputs remain unchanged and output exposes no catalog-lifecycle/readiness/payload/webhook/dispatch/retry/provider/secret/send/mutation authority.

### NOTIF-EVTCAT-BOUND-002 — No alternate lookup
Null or tuple mismatch performs no fallback/alternate EventCatalog lookup.

## DD-323 Outbox Envelope Row-Identity Acceptance

### NOTIF-EVTENV-ID-001 — Exact persisted identity and mandatory envelope evidence
Exact event id/type/version/scope plus valid correlation/timestamp, non-empty mandatory fields and payload member passes.

### NOTIF-EVTENV-ID-002 — Identity mismatch denial
Envelope event id/type/version/scope mismatch fails closed.

### NOTIF-EVTENV-ID-003 — Mandatory evidence denial
Invalid correlation/timestamp or missing/blank actorType/sourceResourceType/sourceResourceId/payloadSchema/payload evidence fails closed.


## DD-324 Outbox Envelope EventCatalog Metadata Acceptance

### NOTIF-EVTENV-CAT-001 — Exact producer/sensitivity metadata
Exact producerModule + sensitivityClass plus DD-321 tuple passes regardless of ACTIVE/RETIRED catalog status.

### NOTIF-EVTENV-CAT-002 — Metadata/tuple mismatch denial
Producer, sensitivity or exact tuple mismatch fails closed.


## DD-325 Local Envelope Scope-Shape Acceptance

### NOTIF-EVTENV-SCOPE-001 — Local PLATFORM/TENANT scope shape
Valid PLATFORM_GLOBAL, TENANT_CORE and TENANT_INDUSTRY locally re-evaluable ownership shapes pass.

### NOTIF-EVTENV-SCOPE-002 — Local ownership/selectors mismatch denial
Tenant/Industry mismatch or forbidden local selectors fail closed.

### NOTIF-EVTENV-SCOPE-003 — Explicit cross-context local shape only
EXPLICIT_CROSS_CONTEXT requires exact Tenant plus distinct UUID source/target selectors; this does not prove same-Tenant endpoint ownership.


## DD-326 Source-Event Persisted-Envelope Composition Acceptance

### NOTIF-EVTENV-COMP-001 — Exact composed evidence
DD-321 exact tuple + DD-324 metadata + DD-325 local scope evidence passes together.


## DD-327 Immutable DD-322 + Envelope Evidence Acceptance

### NOTIF-EVTENV-UNBOUND-001 — Unbound DD-322 evidence
DD-322 without source event remains valid without synthesized source-envelope evidence.

### NOTIF-EVTENV-EVID-001 — Bound identity preservation
Bound success preserves exact DD-322/Event/Catalog/envelope identities in immutable nested evidence.

### NOTIF-EVTENV-BOUND-001 — No new authority or mutation
Inputs remain unchanged and output exposes no residency/currentness/payload-schema/catalog-lifecycle/webhook/dispatch/retry/provider/secret/send/mutation authority.

## DD-328 Notification Tenant Residency Read Port Acceptance

### NOTIF-EVTRES-FLOOR-001 — Exact current Tenant residency equality
Exact TENANT_CORE/TENANT_INDUSTRY source-event Tenant plus current authoritative Tenant residency and persisted envelope residency equality passes.

### NOTIF-EVTRES-FLOOR-002 — Invalid residency evidence denies
Wrong Tenant, wrong/blank region, invalid scope or invalid DD-326 source-event envelope evidence fails closed.


## DD-329 PostgreSQL Current Tenant Residency Reader Acceptance

### NOTIF-EVTRES-PG-001 — Exact Industry-scoped read
Exact Industry-scoped same-Tenant current residency read preserves immutable Tenant residency evidence.

### NOTIF-EVTRES-PG-002 — Tenant-Core and sibling-Industry same-Tenant read
Tenant-Core and sibling-Industry RequestContexts for the same Tenant read the same current Tenant residency.

### NOTIF-EVTRES-PG-003 — Foreign-Tenant read denied
A foreign-Tenant input/context cannot read another Tenant residency through the Notification-worker RLS boundary.

### NOTIF-EVTRES-PG-004 — Malformed/mismatched context or route denied
Malformed/mismatched context/id or database-route mismatch fails closed.


## DD-330 Source-Event Current Residency Floor Acceptance

### NOTIF-EVTRES-BASE-001 — Parent evidence before residency read
DD-327 parent envelope evidence is established before any residency read.

### NOTIF-EVTRES-BASE-002 — Parent null/error short-circuits
Parent null returns null and parent error propagates unchanged; residency is not read.


## DD-331 Parent-First Current Residency Reader Acceptance

### NOTIF-EVTRES-UNBOUND-001 — Unbound source-event success
An unbound source event succeeds with exact DD-327 evidence and performs no residency read or synthesized residency evidence.

### NOTIF-EVTRES-READ-001 — Exact bound residency read
A bound source event forwards the exact supplied RequestContext and preserved event Tenant id exactly once.

### NOTIF-EVTRES-READ-002 — Residency null/error semantics
Null residency returns null; residency-reader errors propagate unchanged.


## DD-332 Immutable DD-327 + Current Residency Evidence Acceptance

### NOTIF-EVTRES-EVID-001 — Exact immutable evidence preservation
Success preserves exact DD-327/current-residency evidence identities, immutable output, unchanged inputs and no historical-residency/payload/catalog/readiness/provider/render/send/mutation authority.


## DD-333 Optional Actor-Principal Structural Floor Acceptance

### NOTIF-EVTMETA-FLOOR-001 — Valid optional metadata shape
Valid actor/causation UUIDs pass and absent optional actorPrincipalId, causationId and aggregateVersion remain allowed.

### NOTIF-EVTMETA-FLOOR-002 — Malformed actorPrincipalId denies
A present malformed actorPrincipalId fails closed without principal lookup or attribution semantics.


## DD-334 Optional Causation Structural Floor Acceptance

### NOTIF-EVTMETA-FLOOR-003 — Malformed causationId denies
A present malformed causationId fails closed without causation-graph traversal.


## DD-335 Optional Aggregate-Version Structural Floor Acceptance

### NOTIF-EVTMETA-FLOOR-004 — Exact DD-081 integer structure
Absent/null aggregateVersion passes; a safe-integer number or signed decimal integer string passes; fractional, precision-unsafe, non-decimal or non-scalar values fail closed.


## DD-336 Parent-First Consumer-Metadata Floor Acceptance

### NOTIF-EVTMETA-BASE-001 — Prior envelope/residency evidence remains mandatory
Invalid DD-326 envelope/catalog/local-scope evidence, invalid DD-330 current-residency equality, or a substituted envelope reference fails closed.


## DD-337 Immutable DD-332 + Consumer-Metadata Evidence Acceptance

### NOTIF-EVTMETA-UNBOUND-001 — Unbound evidence stays exact
Unbound DD-332 evidence preserves the exact parent reference and synthesizes no source-event metadata.

### NOTIF-EVTMETA-EVID-001 — Bound evidence is exact, immutable and fail-closed
Bound success preserves exact DD-332/source-envelope identities in immutable evidence; incomplete or malformed bound evidence returns null.

### NOTIF-EVTMETA-BOUNDARY-001 — No payload/lifecycle/delivery authority
Catalog lifecycle, consumer classes, webhook eligibility, payload-schema JSON/payload contents, Outbox readiness/retry and Notification delivery/provider authority remain uninterpreted; inputs remain unchanged.


## DD-338 Strict Source-Event OccurredAt Acceptance

### NOTIF-EVTPRE-DATE-001 — Strict valid occurrence timestamp
A valid parseable occurrence timestamp with a real calendar date passes.

### NOTIF-EVTPRE-DATE-002 — Calendar-invalid normalization denied
A calendar-invalid YYYY-MM-DD prefix that a permissive runtime parser can normalize fails closed.


## DD-339 Source-Event Payload JSON-Structure Acceptance

### NOTIF-EVTPRE-PAYLOAD-001 — Nested JSON-safe payload
Nested JSON-compatible payload evidence passes unchanged.

### NOTIF-EVTPRE-PAYLOAD-002 — Non-JSON payload denied
Undefined, non-finite numbers or custom-prototype nested payload evidence fails closed.


## DD-340 Catalog Payload-Schema JSON-Structure Acceptance

### NOTIF-EVTPRE-SCHEMA-001 — Structural JSON only
JSON-safe catalog payload-schema evidence passes and malformed JSON structure fails without schema interpretation.


## DD-341 Parent-First Pre-Payload Structure Acceptance

### NOTIF-EVTPRE-BASE-001 — DD-336 and exact source-event identity remain mandatory
Invalid consumer-metadata/current-residency parent evidence or a substituted source-event reference fails closed.


## DD-342 Immutable DD-337 + Pre-Payload Structure Evidence Acceptance

### NOTIF-EVTPRE-UNBOUND-001 — Unbound evidence stays exact
Unbound DD-337 evidence preserves the exact parent reference and synthesizes no source-event member.

### NOTIF-EVTPRE-EVID-001 — Bound evidence is exact, immutable and non-authoritative
Bound success preserves exact DD-337/source-event identities in immutable evidence; malformed evidence returns null and no payload-schema, catalog-lifecycle, readiness, provider, send or mutation authority is added.


## DD-343 Exact DD-342 Parent Evidence Acceptance

### NOTIF-EVTPAY-UNBOUND-001 — Unbound DD-342 evidence bypasses payload validation
Unbound DD-342 evidence succeeds without invoking the payload port, preserves the exact parent reference and synthesizes no source-event member.

### NOTIF-EVTPAY-BASE-001 — Malformed/substituted DD-342 evidence denies before port use
Malformed parent evidence or a substituted source-event reference returns null before payload-validator invocation.


## DD-344 Exact DD-081 Persistence-Binding Projection Acceptance

### NOTIF-EVTPAY-BIND-001 — Exact bound event/current-residency facts only
Bound validation projects exact event identity, event type/version, scope, Tenant, Industry Context when applicable and current Tenant residency region with no fallback tuple.


## DD-345 Existing DD-081 Payload-Port Delegation Acceptance

### NOTIF-EVTPAY-PORT-001 — Existing validator owns ordering and normalized inputs
The injected DD-081 payload port runs exactly once only after parent/envelope/catalog checks and receives the expected event type/version/schema id plus normalized catalog schema and payload.


## DD-346 DD-081 Payload-Failure Semantics Acceptance

### NOTIF-EVTPAY-FAIL-001 — Ordinary provider error is normalized
A non-governed payload-validator error becomes the safe DD-081 EventEnvelopeValidationError message.

### NOTIF-EVTPAY-FAIL-002 — Existing governed validation error is preserved
An existing EventEnvelopeValidationError is rethrown unchanged.


## DD-347 Immutable Payload-Validated Evidence Acceptance

### NOTIF-EVTPAY-EVID-001 — Exact immutable success evidence
Successful validation preserves exact DD-342/source-event references in immutable evidence and leaves input unchanged.

### NOTIF-EVTPAY-BOUNDARY-001 — Payload validation grants no lifecycle/delivery authority
RETIRED catalog and DEAD Outbox evidence may remain raw; no catalog-active, consumer-selected, webhook-authorized, readiness/retry/provider/render/send/mutation authority is synthesized.


## DD-348 Parent-First Payload-Validated Reader Acceptance

### NOTIF-EVTPAYREAD-BASE-001 — DD-332 reader precedes payload validation
The exact supplied RequestContext, Delivery id, evaluatedAt and reader ports flow first through the DD-332 current-residency reader before the payload port can run.

### NOTIF-EVTPAYREAD-BASE-002 — Parent null/error stops composition
A null parent returns null and a parent dependency error propagates unchanged; payload validation is not invoked.


## DD-349 Consumer-Metadata Composition Acceptance

### NOTIF-EVTPAYREAD-UNBOUND-001 — Unbound source-event path stays read-minimal
A source-event-unbound Delivery succeeds with exact nested evidence and performs no EventCatalog, Tenant-residency or payload-port invocation.


## DD-350 Pre-Payload Composition Acceptance

### NOTIF-EVTPAYREAD-PRE-001 — Calendar-invalid occurrence stops before payload port
A runtime-parseable but calendar-invalid occurredAt is rejected by DD-342 before payload validation.

### NOTIF-EVTPAYREAD-PRE-002 — Non-JSON payload stops before payload port
Structurally non-JSON payload evidence is rejected by DD-342 before payload validation.


## DD-351 DD-347 Delegation Acceptance

### NOTIF-EVTPAYREAD-PAY-001 — Exact DD-347 payload validation
Valid bound evidence invokes the supplied DD-081 payload port exactly once and returns exact DD-347 evidence.

### NOTIF-EVTPAYREAD-FAIL-001 — Payload failure semantics propagate unchanged
DD-347/DD-081 payload validation errors retain their governed normalization and identity semantics.


## DD-352 Exact Reader Evidence Acceptance

### NOTIF-EVTPAYREAD-EVID-001 — Exact nested identities with no execution authority
Success preserves exact nested source identities and immutable evidence while synthesizing no lifecycle, idempotency, readiness, provider, render, send or mutation authority.


## DD-353 WorkflowInstance Parent-First Read Acceptance

### WFI-DEFREAD-BASE-001 — Exact RequestContext/id reaches WorkflowInstance first
The exact supplied RequestContext object and WorkflowInstance id reach the WorkflowInstance reader first; definition access occurs only after a visible parent.

### WFI-DEFREAD-BASE-002 — Parent null/error short-circuits
A null parent returns null without definition access; a parent dependency error propagates unchanged.


## DD-354 Exact Visible WorkflowDefinition Read Acceptance

### WFI-DEFREAD-DEF-001 — Exact same context and persisted definition id
The visible parent forwards the exact same RequestContext object and its exact persisted WorkflowDefinition id once.

### WFI-DEFREAD-DEF-002 — Definition null/error semantics
A null definition returns null; a definition dependency error propagates unchanged.


## DD-355 DD-173 Current-Binding Floor Acceptance

### WFI-DEFREAD-FLOOR-001 — Exact ACTIVE/version/applicability floor
The exact visible ACTIVE/version/applicable definition passes DD-173; status, version, Tenant or Industry mismatch fails closed.


## DD-356 Immutable Exact-Reference Evidence Acceptance

### WFI-DEFREAD-EVID-001 — Exact identities preserved
Success preserves the exact WorkflowInstance and WorkflowDefinition object references in a frozen evidence envelope.


## DD-357 Bounded Visibility and No-Execution Acceptance

### WFI-DEFREAD-NOFALLBACK-001 — No PLATFORM_GLOBAL fallback
A referenced definition hidden under the supplied RequestContext remains null; the reader never switches to PLATFORM_GLOBAL or another scope.

### WFI-DEFREAD-BOUND-001 — Raw workflow semantics remain uninterpreted
currentState, lifecycle state, creator, effective dates, stateMachine, approvalPolicy and ruleRefs remain raw; no transition/task/execution/mutation/event authority is synthesized.


## DD-358 WorkflowTask Parent-First Read Acceptance

### WFT-INSTREAD-BASE-001 — Exact RequestContext/id reaches WorkflowTask first
The exact supplied RequestContext object and WorkflowTask id reach the WorkflowTask reader first; WorkflowInstance access occurs only after a visible task.

### WFT-INSTREAD-BASE-002 — Task null/error short-circuits
A null task returns null without WorkflowInstance access; a task dependency error propagates unchanged.


## DD-359 Exact Visible WorkflowInstance Read Acceptance

### WFT-INSTREAD-INST-001 — Exact same context and persisted instance id
The visible task forwards the exact same RequestContext object and its exact persisted WorkflowInstance id once.

### WFT-INSTREAD-INST-002 — WorkflowInstance null/error semantics
A null WorkflowInstance returns null; a dependency error propagates unchanged.


## DD-360 DD-174 Current-Binding Floor Acceptance

### WFT-INSTREAD-FLOOR-001 — Exact parent id/Tenant/nullable-Industry floor
Exact Tenant-Core/Tenant-Industry parent binding passes DD-174; wrong parent id, Tenant, sibling Industry or Core/Industry mismatch fails closed.


## DD-361 Immutable Exact-Reference Evidence Acceptance

### WFT-INSTREAD-EVID-001 — Exact identities preserved
Success preserves the exact WorkflowTask and WorkflowInstance references in a frozen evidence envelope.


## DD-362 Raw Task Evidence and No-Action Authority Acceptance

### WFT-INSTREAD-RAW-001 — Task and parent evidence remain raw
Assignment/state/due/claim/completion/version plus parent currentState/lifecycle evidence remain unchanged and uninterpreted.

### WFT-INSTREAD-BOUND-001 — No assignee/task-action/transition/execution authority
No assignee/claimant/completer currentness, due/expired result, task-action authorization, WorkflowTransition authorization, execution, mutation or event authority is synthesized.

## DD-363…DD-367 WorkflowTransition Visible-Parent Evidence Acceptance

### WTR-INSTREAD-BASE-001 — Exact transition first
**Owner:** DD-363. The exact RequestContext object and transition id reach the transition reader once before parent access.

### WTR-INSTREAD-BASE-002 — Transition short-circuit
**Owner:** DD-363. Null returns null and transition errors propagate unchanged; neither path accesses the parent.

### WTR-INSTREAD-INST-001 — Same context and persisted parent
**Owner:** DD-364. Read the exact persisted WorkflowInstance id once under the identical RequestContext, for both Core and Industry contexts.

### WTR-INSTREAD-INST-002 — Parent absence and errors
**Owner:** DD-364. Missing or hidden parent returns null; parent dependency errors preserve identity.

### WTR-INSTREAD-FLOOR-001 — DD-174 exact parent ownership
**Owner:** DD-365. Exact Core/Industry binding passes; wrong parent id, Tenant, sibling Industry, Core/Industry mismatch or malformed ownership fails closed.

### WTR-INSTREAD-EVID-001 — Immutable exact references
**Owner:** DD-366. Success is a frozen two-field envelope retaining exact transition/instance identities without input mutation.

### WTR-INSTREAD-HISTORY-001 — Historical state and large versions
**Owner:** DD-367. Preserve actor/from/action/to/reason/occurredAt/correlation and large decimal version strings; a parent with later state/version does not invalidate historical transition evidence.

### WTR-INSTREAD-BOUND-001 — No actor or execution authority
**Owner:** DD-367. Expose no actor-current/actor-at-occurrence validation, state-machine/replay/transition/task authorization, mutation, event or execution authority.

## DD-368 AutomationRun First Visible Read Acceptance

### WFA-RUN-DEFREAD-BASE-001 — Exact run read first
**Owner:** DD-368. The exact supplied RequestContext object and exact AutomationRun id reach the AutomationRun reader once before any AutomationDefinition access.

### WFA-RUN-DEFREAD-BASE-002 — Run absence and errors
**Owner:** DD-368. Null/RLS-hidden AutomationRun returns null without definition access; run-reader dependency errors propagate unchanged.

## DD-369 Same-RequestContext AutomationDefinition Read Acceptance

### WFA-RUN-DEFREAD-DEF-001 — Exact persisted definition read
**Owner:** DD-369. A visible run forwards the identical RequestContext object and exact persisted automationDefinitionId to the AutomationDefinition reader once for Tenant-Core and Tenant-Industry inputs.

### WFA-RUN-DEFREAD-DEF-002 — Definition absence and errors
**Owner:** DD-369. Null/RLS-hidden AutomationDefinition returns null; definition-reader dependency errors propagate unchanged.

## DD-370 DD-175 Current-Binding Floor Acceptance

### WFA-RUN-DEFREAD-FLOOR-001 — Exact ACTIVE applicable definition
**Owner:** DD-370. DD-175 exact id + ACTIVE + PLATFORM/TENANT/INDUSTRY applicability passes; wrong id, non-ACTIVE status, foreign Tenant, sibling Industry or malformed ownership fails closed.

### WFA-RUN-DEFREAD-NOFALLBACK-001 — No PLATFORM_GLOBAL fallback
**Owner:** DD-370. A PLATFORM AutomationDefinition hidden from the supplied Tenant RequestContext remains null after exactly one same-context read; no context elevation, synthetic principal or alternate reader path is used.

## DD-371 Immutable AutomationRun/Definition Evidence Acceptance

### WFA-RUN-DEFREAD-EVID-001 — Immutable exact references
**Owner:** DD-371. Success returns a frozen two-field envelope retaining the exact AutomationRun and AutomationDefinition object references without input mutation.

## DD-372 Raw Automation Evidence Boundary Acceptance

### WFA-RUN-DEFREAD-BOUND-001 — No trigger, retry, dispatch or execution authority
**Owner:** DD-372. Run trigger/idempotency/status/time/error and definition version/schema/trigger/config/condition/operation/workflow/effective evidence remain uninterpreted; output exposes no definition-selection, trigger-match, condition, retry/finality, next-state, dispatch, mutation, event or execution authority.

## DD-373 AutomationDefinition First Visible Read Acceptance

### WFA-DEF-WFREAD-BASE-001 — Exact AutomationDefinition read first
**Owner:** DD-373. The exact supplied RequestContext object and exact AutomationDefinition id reach the AutomationDefinition reader once before any WorkflowDefinition access.

### WFA-DEF-WFREAD-BASE-002 — AutomationDefinition absence and errors
**Owner:** DD-373. Null/RLS-hidden AutomationDefinition returns null without WorkflowDefinition access; dependency errors propagate unchanged.

## DD-374 Optional Same-RequestContext WorkflowDefinition Read Acceptance

### WFA-DEF-WFREAD-WF-001 — Unbound skip / bound exact reference
**Owner:** DD-374. An unbound AutomationDefinition performs no WorkflowDefinition read and may return automation-only evidence; a bound definition forwards the identical RequestContext and exact persisted WorkflowDefinition id once.

### WFA-DEF-WFREAD-WF-002 — Bound parent absence and errors
**Owner:** DD-374. Bound hidden/missing WorkflowDefinition returns null; WorkflowDefinition-reader dependency errors propagate unchanged.

## DD-375 DD-176 Containment / No-Fallback Acceptance

### WFA-DEF-WFREAD-FLOOR-001 — Exact optional-reference containment
**Owner:** DD-375. DD-176 valid unbound and visible broader/equal parent containment passes; wrong id, narrower/foreign/sibling parent or malformed ownership fails closed.

### WFA-DEF-WFREAD-NOFALLBACK-001 — No PLATFORM_GLOBAL parent fallback
**Owner:** DD-375. A bound PLATFORM WorkflowDefinition hidden from the Tenant RequestContext remains null after exactly one same-context read; no context elevation, synthetic principal or alternate reader path is used.

## DD-376 Immutable Definition Containment Evidence Acceptance

### WFA-DEF-WFREAD-EVID-001 — Immutable exact references
**Owner:** DD-376. Unbound success returns frozen automation-only evidence; bound success returns a frozen envelope preserving exact AutomationDefinition and WorkflowDefinition references without input mutation.

## DD-377 Raw Automation / Workflow Definition Boundary Acceptance

### WFA-DEF-WFREAD-BOUND-001 — No selection, dispatch or execution authority
**Owner:** DD-377. Automation/Workflow status, version, effective, stateMachine, approval, rule, trigger, config, condition and operation evidence remains uninterpreted; output exposes no active-version selection, trigger/condition decision, dispatch, retry/state-transition, mutation, event or Automation/Workflow execution authority.

## DD-378 DD-372 Parent Evidence First Acceptance

### WFA-RUN-WFREAD-BASE-001 — Exact DD-372 chain first
**Owner:** DD-378. The exact supplied RequestContext and AutomationRun id enter the existing DD-372 parent chain before any WorkflowDefinition access.

### WFA-RUN-WFREAD-BASE-002 — Parent absence and errors
**Owner:** DD-378. DD-372 null/error short-circuits all WorkflowDefinition access and preserves dependency error identity.

## DD-379 Optional WorkflowDefinition Extension Acceptance

### WFA-RUN-WFREAD-WF-001 — Unbound skip / bound exact parent id without re-read
**Owner:** DD-379. Unbound preserved AutomationDefinition skips WorkflowDefinition access; bound evidence forwards the identical RequestContext and exact persisted WorkflowDefinition id once, with no AutomationDefinition re-read beyond DD-372.

### WFA-RUN-WFREAD-WF-002 — Bound parent absence and errors
**Owner:** DD-379. Bound hidden/missing WorkflowDefinition returns null; WorkflowDefinition-reader errors propagate unchanged.

## DD-380 DD-176 Containment / No-Fallback Acceptance

### WFA-RUN-WFREAD-FLOOR-001 — Exact optional containment
**Owner:** DD-380. DD-176 valid optional/reference containment passes and wrong-id/narrower/foreign/sibling/malformed evidence fails closed.

### WFA-RUN-WFREAD-NOFALLBACK-001 — No PLATFORM_GLOBAL fallback
**Owner:** DD-380. A bound PLATFORM WorkflowDefinition hidden under Tenant context remains null after one same-context read; no context elevation or alternate reader path occurs.

## DD-381 Immutable Layered Evidence Acceptance

### WFA-RUN-WFREAD-EVID-001 — Preserve exact nested identities
**Owner:** DD-381. Success preserves the exact frozen DD-372 parent envelope and optional exact WorkflowDefinition reference inside a frozen outer envelope without input mutation.

## DD-382 Combined Raw-Evidence Boundary Acceptance

### WFA-RUN-WFREAD-BOUND-001 — No selection, transition, dispatch or execution authority
**Owner:** DD-382. Combined run/definition/workflow evidence remains raw and exposes no active/effective selection, trigger/condition/state-machine decision, retry/finality, transition authorization, dispatch, mutation, event or execution authority.

## DD-383 DD-382 Parent Evidence First Acceptance

### WFA-RUN-OPREAD-BASE-001 — Exact DD-382 chain before registry access
**Owner:** DD-383. The exact supplied RequestContext and AutomationRun id enter the existing DD-382 parent chain before any OperationRegistry access.

### WFA-RUN-OPREAD-BASE-002 — Parent absence and errors
**Owner:** DD-383. DD-382 null/error short-circuits registry access and preserves dependency error identity.

## DD-384 Optional Exact OperationContract Registry Acceptance

### WFA-RUN-OPREAD-OP-001 — Absent skip / exact one lookup
**Owner:** DD-384. Missing operationContractId performs zero registry access; a present persisted id performs exactly one canonical registry lookup using that exact string.

### WFA-RUN-OPREAD-OP-002 — Unknown/error propagation
**Owner:** DD-384. OperationRegistry lookup errors propagate unchanged and no fallback or derived operation lookup occurs.

## DD-385 Registry Identity / Raw Metadata Acceptance

### WFA-RUN-OPREAD-COEXIST-001 — Workflow and Operation evidence coexist
**Owner:** DD-385. Optional WorkflowDefinition and OperationContract evidence may coexist without mutual-exclusion or precedence policy.

### WFA-RUN-OPREAD-RAW-001 — Operation metadata remains raw
**Owner:** DD-385. scopeClass, permission, entitlement, schema versions, idempotency, rate, audit, domainService, emittedEvents and errors remain raw registry evidence and are not evaluated against RequestContext/run/definition.

## DD-386 Immutable Layered Operation Evidence Acceptance

### WFA-RUN-OPREAD-EVID-001 — Exact nested and registry identities
**Owner:** DD-386. Success preserves the exact DD-382 parent envelope and exact registry-returned OperationContract reference inside a frozen outer envelope without input mutation.

## DD-387 No Admission / Dispatch / Execution Authority Acceptance

### WFA-RUN-OPREAD-BOUND-001 — Evidence only
**Owner:** DD-387. Combined run/definition/workflow/operation evidence exposes no compatibility, permission/entitlement, GuardPipeline, idempotency/rate/commercial/authz, selection, transition/retry, dispatch, mutation, event or execution authority.

## DD-388 AgentRun First Visible Read Acceptance

### AIARUN-DEFREAD-BASE-001 — Exact run read first
**Owner:** DD-388. The exact supplied RequestContext object and exact AgentRun id reach the AgentRun reader once before any AgentDefinition access.

### AIARUN-DEFREAD-BASE-002 — Run absence and errors
**Owner:** DD-388. Null/RLS-hidden AgentRun returns null without definition access; run-reader dependency errors propagate unchanged.

## DD-389 Same-RequestContext AgentDefinition Read Acceptance

### AIARUN-DEFREAD-DEF-001 — Exact persisted definition read
**Owner:** DD-389. A visible run forwards the identical RequestContext object and exact persisted agentDefinitionId to the AgentDefinition reader once for Tenant-Core and Tenant-Industry visibility cases.

### AIARUN-DEFREAD-DEF-002 — Definition absence and errors
**Owner:** DD-389. Null/RLS-hidden AgentDefinition returns null; definition-reader dependency errors propagate unchanged.

## DD-390 DD-181 Current-Binding / No-Fallback Acceptance

### AIARUN-DEFREAD-FLOOR-001 — Exact ACTIVE applicable definition
**Owner:** DD-390. DD-181 exact id + ACTIVE + PLATFORM/TENANT/INDUSTRY applicability passes; wrong id, non-ACTIVE, foreign Tenant, sibling Industry or malformed ownership fails closed.

### AIARUN-DEFREAD-NOFALLBACK-001 — No PLATFORM_GLOBAL fallback
**Owner:** DD-390. A PLATFORM AgentDefinition hidden from the supplied Tenant RequestContext remains null after exactly one same-context definition read; no context elevation, synthetic platform principal or alternate reader path is used.

## DD-391 Immutable AgentRun/Definition Evidence Acceptance

### AIARUN-DEFREAD-EVID-001 — Immutable exact references
**Owner:** DD-391. Success returns a frozen two-field envelope retaining the exact AgentRun and AgentDefinition object references without input mutation.

## DD-392 Raw Agent Evidence Boundary Acceptance

### AIARUN-DEFREAD-BOUND-001 — No principal, resume, tool or execution authority
**Owner:** DD-392. Acting-principal/membership, startup entitlement/permission snapshots, requested resource scope, run status/budgets and definition ToolSet/risk/approval/budget/version evidence remain uninterpreted; output exposes no principal/membership-currentness, resume, step, tool, approval, OperationContract, provider/model, mutation, event or execution authority.

## DD-393 DD-392 Parent Evidence First Acceptance

### AIARUN-TOOLSETREAD-BASE-001 — Exact DD-392 chain first
**Owner:** DD-393. The exact supplied RequestContext and AgentRun id enter the existing DD-392 parent chain before any ToolSet access.

### AIARUN-TOOLSETREAD-BASE-002 — Parent absence and errors
**Owner:** DD-393. DD-392 null/error short-circuits all ToolSet access and preserves dependency error identity.

## DD-394 Same-Context Exact ToolSet Read Acceptance

### AIARUN-TOOLSETREAD-TOOLSET-001 — Exact persisted ToolSet reference
**Owner:** DD-394. Successful parent evidence forwards the identical RequestContext and exact persisted allowedToolSetId to the ToolSet reader exactly once, with no AgentDefinition re-read beyond DD-392.

### AIARUN-TOOLSETREAD-TOOLSET-002 — ToolSet absence and errors
**Owner:** DD-394. Hidden/missing ToolSet returns null; ToolSet-reader dependency errors propagate unchanged.

## DD-395 DD-180 Binding / No-Fallback Acceptance

### AIARUN-TOOLSETREAD-FLOOR-001 — Exact ACTIVE broader-or-equal binding
**Owner:** DD-395. DD-180 exact id + ACTIVE + broader-or-equal PLATFORM/TENANT/INDUSTRY containment passes; wrong id, non-ACTIVE, narrower/foreign/sibling or malformed evidence fails closed.

### AIARUN-TOOLSETREAD-NOFALLBACK-001 — No PLATFORM_GLOBAL fallback
**Owner:** DD-395. A broader PLATFORM ToolSet hidden under Tenant context remains null after one same-context read; no context elevation, synthetic principal or alternate reader path occurs.

## DD-396 Immutable Layered Agent/ToolSet Evidence Acceptance

### AIARUN-TOOLSETREAD-EVID-001 — Preserve exact nested identities
**Owner:** DD-396. Success preserves the exact frozen DD-392 parent envelope and exact ToolSet object reference inside a frozen outer envelope without input mutation.

## DD-397 Raw Agent/ToolSet Boundary Acceptance

### AIARUN-TOOLSETREAD-BOUND-001 — No member/tool/permission/execution authority
**Owner:** DD-397. Combined AgentRun/AgentDefinition/ToolSet evidence remains raw and exposes no ToolSet-member resolution, tool eligibility, permission/entitlement/approval, AgentStep planning, OperationContract dispatch, provider/model routing, mutation, event or AI execution authority.

## DD-398 AgentStep First Visible Read Acceptance

### AISTEP-EVID-BASE-001 — Exact AgentStep read first
**Owner:** DD-398. The exact supplied RequestContext object and exact AgentStep id reach the AgentStep reader once before DD-397 parent/tool access.

### AISTEP-EVID-BASE-002 — AgentStep absence and errors
**Owner:** DD-398. Null/RLS-hidden AgentStep returns null without parent/member/catalog access; dependency errors propagate unchanged.

## DD-399 Exact DD-397 Parent Acceptance

### AISTEP-EVID-PARENT-001 — Persisted runId enters DD-397 exactly
**Owner:** DD-399. Visible AgentStep forwards the identical RequestContext and exact persisted runId into DD-397; AgentRun, AgentDefinition and ToolSet are not independently re-read outside that chain.

## DD-400 Persisted Step-Type / Tool-Binding Acceptance

### AISTEP-EVID-BRANCH-001 — Non-TOOL skip / TOOL exact binding
**Owner:** DD-400. PLAN/RAG/APPROVAL/INFERENCE perform zero member/catalog reads and apply DD-182 without tool evidence; TOOL reads exactly the persisted ToolSetMember in the same RequestContext and then exactly member.toolDefinitionId through the global ToolDefinition reader.

### AISTEP-EVID-ERROR-001 — TOOL binding absence and errors
**Owner:** DD-400. Hidden/missing ToolSetMember or ToolDefinition returns null; member/catalog dependency errors propagate unchanged.

### AISTEP-EVID-FLOOR-001 — DD-182 fail-closed tool-binding floor
**Owner:** DD-400. Wrong run/definition/member/tool ids, disabled member, non-ACTIVE ToolDefinition, member outside allowedToolSetId, malformed evidence or non-TOOL persisted binding fails closed.

## DD-401 Immutable Layered AgentStep Evidence Acceptance

### AISTEP-EVID-EVID-001 — Exact nested identities
**Owner:** DD-401. Non-TOOL success returns frozen step+parent evidence; TOOL success additionally preserves exact ToolSetMember and ToolDefinition references in the frozen envelope without input mutation.

## DD-402 Raw Tool / AI Boundary Acceptance

### AISTEP-EVID-BOUND-001 — No admission, planning, dispatch or execution authority
**Owner:** DD-402. Member constraints and ToolDefinition permission/entitlement/scope/schema/side-effect/approval/idempotency/audit/OperationContract metadata remain raw; output exposes no permission/entitlement/approval admission, schema validation, GuardPipeline, next-step/retry/resume, dispatch, provider/model routing, mutation, event or tool/AI execution authority.

