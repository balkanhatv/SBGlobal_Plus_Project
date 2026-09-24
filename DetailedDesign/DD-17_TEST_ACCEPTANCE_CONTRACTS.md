# DD-17 — AUTHORITATIVE TEST & ACCEPTANCE CONTRACT OWNER
**Wave:** 1–3 · **Status:** PHASE 3 REVALIDATED — authoritative acceptance index
**Traces:** MI §26B · F-03/F-14 · A-02/A-03/A-04/A-05/A-06/A-11 · DD-01…DD-08/DD-15

These are implementation acceptance contracts, not executable test code.

## Repository verification invariants — current Development overlay

The existing Core CI suite executes `tests/core/repository-invariants.test.mjs`.
REPO-001 preserves accepted RawSource hashes; REPO-002 preserves all 2,962 source
IDs/text; REPO-003 checks nine/41 canonical MS owner and acceptance references;
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
| ID-009 | ordinary HUMAN/API_CLIENT requests protected PLATFORM_GLOBAL scope | deny before tenant/resource lookup; no DB transaction |
| ID-010 | interactive PLATFORM_OPERATOR or unbound allowlisted SERVICE requests PLATFORM_GLOBAL | identity/scope floor passes; downstream platform PDP still required |
| ID-011 | Clerk token verifies but live provider session is revoked/inactive or session user != signed subject | SESSION_INVALID; no internal principal authority returned |
| ID-012 | live provider session was created before exact internal SessionVersion.changed_at | SESSION_INVALID on next protected request |
| ID-013 | selected device registration is missing/foreign/PENDING/REVOKED or RISK_HOLD | DEVICE_UNTRUSTED for missing/untrusted; STEP_UP_REQUIRED for RISK_HOLD |
| ID-014 | Clerk Backend API or internal identity/session-security store is unavailable | DEPENDENCY_UNAVAILABLE; no weaker provider/claim fallback |
| ID-015 | Clerk fva shows second-factor verification vs first-factor-only | MFA when second-factor age >=0; otherwise baseline PASSWORD; never infer SSO/PHISHING_RESISTANT from fva alone |
| ID-016 | Clerk custom claim attempts to supply SBGlobal role/permission/entitlement/sessionVersion truth | ignored as authority; current server-owned Core records govern |
| ID-017 | verified machine evidence omits the requested Tenant scope from allowedScopeClasses | CREDENTIAL_INVALID before Tenant/Industry/directory lookup; no generic cross-context widening |
| ID-018 | validated Core SessionVersion differs from provider evidence metadata | Tenant RequestContext carries validated Core sessionVersion, consistent with PLATFORM_GLOBAL |

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
| AI-013 | AI API class absent from AIProvisioningSnapshot | deny before provider call |
| AI-014 | Country Pack changes AI language/reference behavior | allowed only within already-entitled capability set; no permission widening |
| AI-015 | retired PromptTemplate version invoked | deny; current ACTIVE version required |
| AI-016 | generated media lacks DD-08 provenance/DocumentMeta registration | result not publishable as governed product asset |
| AI-017 | sibling-Industry AIMemoryRecord requested | excluded/deny by context + ACL |
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
| AUTH-012 | tenant RequestContext permissionVersion/role set differs from exact CURRENT compiled snapshot | stale authorization context; dependency unavailable/deny |
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


### Authorization source compiler continuation — DD-048 / DEV-AUTHZ-SOURCE-COMPILER-001

| ID | Scenario | Expected |
|---|---|---|
| AUTH-020 | same permission ALLOW and DENY arrive from multiple active exact-scope roles | compiled permission is DENY |
| AUTH-021 | ALLOW RolePermission has non-empty constraints_json but Permission Set v1 cannot encode it | compiled permission is DENY; constraint is never dropped into an unconstrained allow |
| AUTH-022 | Tenant Industry compilation sees tenant-null or sibling-Industry assignment | neither participates; no implicit null→all-industries inheritance |
| AUTH-023 | RolePermission version differs from active RoleTemplate version or permission scope differs from target | compilation fails closed and current compiled snapshot is invalidated where possible |
| AUTH-024 | identical canonical source is compiled repeatedly | deterministic sorted role/permission payload and deterministic SHA-256 source fingerprint |
| AUTH-025 | compiler runtime attempts source mutation | database privilege denial; compiler may SELECT source and mutate only governed compiled publication tables |


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


### API rate-limit runtime — DD-050 / DEV-API-RATE-LIMIT-001

| ID | Scenario | Expected |
|---|---|---|
| API-RATE-001 | SecurityRatePolicy v1 is loaded | DD-022 numeric windows/bursts/concurrency are exact; unknown class denies |
| API-RATE-002 | authenticated request has principal + credential + IP + Tenant | all applicable primary/API_CREDENTIAL/TENANT_AGGREGATE buckets participate; tightest wins |
| API-RATE-003 | tenant/plan/risk override is stricter / attempts relaxation | stricter accepted; any v1 relaxation is POLICY_DENIED |
| API-RATE-004 | two concurrent requests compete for the last token | atomic backend admits exactly one; no partial multi-bucket token consumption |
| API-RATE-005 | AI tenant already has 8 live leases | RATE_LIMITED with retry metadata; releasing/expiry reopens capacity |
| API-RATE-006 | limiter database inspected by ordinary app/integration role | permission denied; persisted bucket identity is SHA-256 only |


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
| WEB-EDGE-003 | host/origin is unknown or browser Sec-Fetch-Site is cross-site | canonical transport policy denial before domain execution |
| WEB-EDGE-004 | Content-Length exceeds configured ceiling | 413 before Authorization resolver/body parsing |
| WEB-EDGE-005 | Content-Length absent but streamed body exceeds ceiling | authentication succeeds first, then 413 before tRPC/schema parsing |
| WEB-EDGE-006 | same-origin bounded GET/POST | request proceeds through existing tRPC Fetch handler and canonical executor |


### Context bootstrap — DD-057 / DEV-CONTEXT-BOOTSTRAP-001

| ID | Scenario | Expected |
|---|---|---|
| CTX-BOOT-001 | human principal has two active Tenant memberships and no selector | ambiguous resolution returns no Tenant; no implicit choice |
| CTX-BOOT-002 | selector names Tenant without current membership / machine selects outside bound Tenant | no Tenant resolves |
| CTX-BOOT-003 | Industry selector belongs to sibling Tenant | no Industry Context resolves |
| CTX-BOOT-004 | membership default/explicit OrgUnit | exact Tenant unit resolves with server-derived root→leaf UUID path |
| CTX-BOOT-005 | Tenant DataHome | ACTIVE directory route returns exact id/region/routingVersion |
| CTX-BOOT-006 | bootstrap DB role attempts write or sensitive identity read | permission denied; role remains NOLOGIN/NOBYPASSRLS |


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
| WS-BOOT-002 | active Tenant Core context resolves workspace with no Industry selector | sanitized Tenant display projection only; internal Tenant/principal/membership IDs are absent |
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
| COMM-PUB-001 | HUMAN / Industry-scoped / missing-current-snapshot caller | rejected before store; SERVICE + TENANT_CORE + current snapshot required |
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
| COMM-PCE-001 | HUMAN, Industry-scoped or unresolved caller records evidence | rejected before persistence |
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
| COMM-ADJ-SRC-001 | HUMAN / Industry-scoped caller | rejected; SERVICE + TENANT_CORE required |
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
| COMM-CSR-001 | HUMAN / Industry-scoped / unresolved caller | rejected before resolver; SERVICE + TENANT_CORE required |
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
| COMM-USAGE-001 | HUMAN / Industry-scoped caller | rejected before usage source; SERVICE + TENANT_CORE required |
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
| COMM-ASSESS-009 | HUMAN / TENANT_INDUSTRY / unresolved Tenant context | fail closed before evaluator |
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
| COMM-ASSESS-PERSIST-005 | HUMAN / Industry-scoped / unresolved Tenant caller | fail before recorder |
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


### Event envelope / catalog validation — DD-081

| ID | Scenario | Expected |
|---|---|---|
| EVT-CAT-001 | valid catalog-bound Tenant Core envelope | metadata/catalog/scope validates, then payload-schema port executes |
| EVT-CAT-002 | event id/type/version/scope or catalog producer/sensitivity mismatch | fail before payload interpretation |
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
| DOC-PRE-005 | missing metadata or unresolved Tenant/Industry/principal context | RESOURCE_NOT_FOUND before any signer surface |
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


### Linked physical Document StorageObject binding — DD-086

| ID | Scenario | Expected |
|---|---|---|
| DOC-STO-PG-001 | exact ACTIVE/CLEAN RLS-visible DocumentMeta + linked ACTIVE object | immutable private physical binding |
| DOC-STO-PG-002 | caller supplies known but unlinked StorageObject id | no binding; object id cannot bypass DocumentMeta |
| DOC-STO-PG-003 | sibling Industry document/object requested from current Industry | no binding; exact sibling context may resolve its own |
| DOC-STO-PG-004 | Tenant Core document/object requested from same-Tenant Industry and Tenant Core contexts | same linked physical binding visible in both |
| DOC-STO-PG-005 | Document or StorageObject is unsafe/non-active | no physical binding; cannot progress toward signing |
| DOC-STO-PG-006 | resolved RequestContext Data Home mismatches database route/object | fail closed before locator disclosure |


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
| WH-SUB-PG-005 | malformed id or database route/context mismatch | fail closed before subscription disclosure |


### Raw PostgreSQL Webhook Delivery reader — DD-089

| ID | Scenario | Expected |
|---|---|---|
| WH-DEL-PG-001 | exact Tenant Industry delivery attempt | immutable raw attempt evidence including persisted status/HTTP/error/nextAttempt; no retry/delivery decision |
| WH-DEL-PG-002 | sibling Industry queries delivery whose parent event is Industry-scoped | parent RLS returns no row; exact Industry context may read it |
| WH-DEL-PG-003 | Tenant-Core event delivery read from same-Tenant Tenant Core and Industry contexts | same delivery evidence visible in both |
| WH-DEL-PG-004 | foreign-Tenant delivery id queried | parent subscription/event RLS returns no row; owning Tenant/context may read it |
| WH-DEL-PG-005 | malformed id or database route/context mismatch | fail closed before delivery evidence disclosure |


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
| INT-TENANT-PG-005 | malformed id or database route/context mismatch | fail closed before TenantIntegration disclosure |


### Tenant-scoped CredentialReference metadata reader — DD-096

| ID | Scenario | Expected |
|---|---|---|
| INT-CRED-META-PG-001 | exact Tenant Industry credential reference | immutable provider/type/key/status metadata; no secret locator/material field |
| INT-CRED-META-PG-002 | sibling Industry credential id requested from current Industry | FORCE-RLS returns no row; exact sibling context may read its metadata |
| INT-CRED-META-PG-003 | Tenant Core credential requested from same-Tenant Industry and Tenant Core contexts | same metadata visible; rotation/expiry evidence preserved without usability decision |
| INT-CRED-META-PG-004 | foreign-Tenant credential id queried | FORCE-RLS returns no row; owning Tenant sees metadata only |
| INT-CRED-META-PG-005 | malformed id or database route/context mismatch | fail closed before credential metadata disclosure |


### Raw PostgreSQL SyncCursor reader — DD-097

| ID | Scenario | Expected |
|---|---|---|
| INT-CURSOR-PG-001 | exact Tenant Industry integration/capability/context tuple | immutable raw opaque cursor/watermark/source-version evidence; no execution decision |
| INT-CURSOR-PG-002 | sibling Industry cursor tuple requested from current Industry | parent FORCE-RLS returns no row; exact sibling context may read its raw cursor |
| INT-CURSOR-PG-003 | Tenant Core cursor read from same-Tenant Industry and Tenant Core contexts after parent later PAUSED | same raw cursor visible; parent status is not converted into resume authority |
| INT-CURSOR-PG-004 | foreign Tenant or mismatched capability/context tuple | null; no fallback to another cursor |
| INT-CURSOR-PG-005 | malformed tuple or database route/context mismatch | fail closed before cursor disclosure |


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
Malformed evaluation/start/expiry timestamps and an invalid persisted interval with `expiresAt <= startsAt` do not satisfy the floor.

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
Malformed evaluation or persisted expiry timestamps return false.

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
PENDING_VERIFICATION, PAUSED or REVOKED subscription state, absent verification evidence or malformed verification time returns false.

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
Future expiry may match; expiry exactly at or before evaluation fails; malformed evaluation or expiry timestamps fail closed.

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

