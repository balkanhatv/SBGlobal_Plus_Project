# DD-17 — AUTHORITATIVE TEST & ACCEPTANCE CONTRACT OWNER
**Wave:** 1–3 · **Status:** PHASE 3 REVALIDATED — authoritative acceptance index
**Traces:** MI §26B · F-03/F-14 · A-02/A-03/A-04/A-05/A-06/A-11 · DD-01…DD-08/DD-15

These are implementation acceptance contracts, not executable test code.

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
