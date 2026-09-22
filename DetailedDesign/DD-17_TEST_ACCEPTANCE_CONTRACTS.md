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
