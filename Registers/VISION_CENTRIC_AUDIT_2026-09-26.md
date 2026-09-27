# Vision-centric all-stages audit — 2026-09-26

**Status: IN PROGRESS — FULL AUDIT GATE NOT PASSED. Forward development is on hold.**

Repository: `balkanhatv/SBGlobal_Plus_Project`; branch: `docs/architecture-branch-2`.
Execution Start HEAD: `94da4953236d1788c2fef0b4df1ceec6d9f7dee2`.
Execution Start tree: `eb2db46721610d6f3dc78afe8bbefc2aabd103d8`.
Frozen all-stages audit prompt blob: `5a44cc555c52c49632e0788ba5d4995559830a3e`.
True starting checkpoint: DD-208 / `DEV-AI-TENANT-CONFIG-MODEL-ALLOWLIST-FLOORS-001`.
The current user instruction controls repository identity and forbids RawSource changes, main merge, force-push, weaker tests and invented requirements.

## Scope and coverage truth

The complete starting Git tree contains **984 files / 10,497,791 bytes**. Every blob was read for identity, UTF-8 and static inventory. The frozen per-file ledger is [VISION_CENTRIC_FILE_COVERAGE_2026-09-26.json](VISION_CENTRIC_FILE_COVERAGE_2026-09-26.json). It explicitly does **not** claim full semantic coverage. No file is certified FULLY_AUDITED merely because a script read its bytes. In particular, this is not the 100% semantic audit required by the governing all-stages prompt §§9/42. That gate remains open.

| Stratum | Files | Current evidence and limits |
|---|---:|---|
| RawSourceCorpus | 2 | Accepted immutable blob identity verified; fresh complete source-to-owner semantic reconciliation remains pending |
| Governing | 5 | Current authority, phase gates, correction scope and no-invented-evidence rules inspected; historical control detail not fully re-audited |
| Foundation | 16 | Vision, Core neutrality, AI isolation and two logical Tenant app classes inspected; complete 41-MS semantic audit pending |
| Architecture / ADR | 14 | Context/data-home/AI Gateway boundaries inspected; complete ADR and all-owner reconciliation pending |
| DetailedDesign | 55 | DD-057 and DD-208 owners compared with implementation; 208 unique contiguous decisions and MS namespace invariants checked |
| Development | 152 | DD-208 source audit and actual checkpoint verified; complete historical and current prerequisite audit pending |
| Database | 92 | 48 migrations, 42 SQL verifications, README/harness; exact-HEAD full hosted bootstrap verified; complete SQL semantic audit pending |
| Source | 275 | Context/guard/SQL role/first-party composition and selected AI predicates reviewed; complete 36,309-line source audit pending |
| Tests | 179 | Existing hosted suites verified, two regression cases investigated; complete 45,214-line test-quality review pending |
| CI | 3 | Exact submitted commit checkout/assertion, locked dependencies, full SQL execution and Web build inspected |
| Registers / State | 182 | Live DD-208 projections and requirement/owner invariants checked; older append-only evidence is not new certification |
| Root configuration | 9 | Dependency/build/backup inventory inspected; no production readiness claimed |

## Vision and traceability checks completed

Both immutable RawSource blobs match accepted identities: S1 `a9f63a64448a347edd0f2b0c74094284ee953c1b`; S2 `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`; RawSource tree `ffe73ad4fcbbae2b9a4d908397a18082a5c35745`.

REPO-001–008 pass locally. The two requirement ledgers contain the same **2,962 unique child IDs and text**; this proves preservation between the ledgers, not an independent fresh proof that every source sentence was promoted correctly. The canonical registry supplies **41 qualified MS IDs across 9 equal Industry owners**. Independently counting SQL CREATE TABLE statements gives:

| Industry schema | Canonical MS | Industry tables |
|---|---:|---:|
| ind_hlt | 5 | 37 |
| ind_edu | 5 | 20 |
| ind_rtl | 5 | 20 |
| ind_hsp | 4 | 16 |
| ind_mfg | 5 | 20 |
| ind_psv | 5 | 20 |
| ind_gov | 4 | 16 |
| ind_ngo | 4 | 16 |
| ind_sfm | 4 | 16 |
| Total | 41 | 181 |

F-06 and DD-26 retain exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant app classes, with roles inside those classes. A platform channel is not a third Tenant app. Mobile binaries and the full Industry applications remain future implementation, not current runtime evidence.

F-05 → A-07 → DD-09 require one AI Gateway and Tenant/Industry/ACL/entitlement/security/residency enforcement. Current catalog readers and bounded predicates do not implement inference, RAG retrieval, agents, tools or provider execution. The first-party composition still exposes three queries and explicitly denies machine credentials and unregistered resources. No provider runtime, complete product or production readiness is certified here.

## Exact starting HEAD verification

All four downloaded job logs assert the starting HEAD/tree above. Push-event evidence:

| Gate | Run | Job | Observed result |
|---|---:|---:|---|
| Core/server | 36256378763 | 108443834358 | 700 tests; 700 pass; 0 fail/skip |
| PostgreSQL | 36256378763 | 108443834282 | 504 tests; 504 pass; 0 fail/skip; full bootstrap PASS |
| Database | 36256378950 | 108443834792 | All 48 migrations and 42 verification SQL files; bootstrap PASS |
| Web | 36256378801 | 108443834413 | Locked install, deterministic lock, TypeScript, Next.js and clean generated state PASS |

These results establish the prior checkpoint's tests, not absence of untested defects. PR #2 was observed open/draft/unmerged, with base `main` at `3911590ff2020993ce51b32d7b091efd6f5f466f`. Its body still describes a September 13 checkpoint and is stale as a current handoff.

## Confirmed findings and corrections

### VC26-01 — P1: cyclic OrgUnit ancestry can prevent context resolution

Owner: A-02 §1/3 → DD-02 §10 → DD-057 → CTX-BOOT-004. `PostgresTenantContextAdapter.resolveOrgUnit` used UNION ALL recursive ancestry with increasing depth and no visited-node termination. Migration 0001's same-Tenant foreign key permits self-parent and multi-node cycles. Such a graph has no root-to-leaf path; the old aggregate waits for recursion that does not terminate. A selected/default cyclic unit can occupy a pooled query and block the context resolution used by the first-party Web composition. No cross-Tenant disclosure is claimed.

A bounded PGlite probe confirmed FK-valid cyclic rows and repeated ancestry expansion; it is supplemental PostgreSQL-engine evidence, not the hosted PostgreSQL 16/RLS gate. The exact corrected adapter SQL also passed valid-path, self-cycle, two-node cycle, membership-default and repaired-path checks in that probe.

Smallest correction: retain same-Tenant traversal, track visited UUIDs, stop expansion at a repeat, and reject the entire selection if any cycle is found. No partial path, arbitrary depth ceiling, new database write rule, migration, role or grant is introduced. DD-02/DD-057 and CTX-BOOT-007 record this corrective interpretation of the existing ancestry contract. A real PostgreSQL regression covers both cycle forms, default/explicit selection, foreign-Tenant denial, recovery and pool reuse. A test-only statement timeout bounds a regression; a timeout error fails the test.

Blast radius: Tenant context bootstrap → RequestContext resolution → DD-058 Web composition. Existing Core, PostgreSQL, database and Web gates must all be rerun on the correction HEAD.

### VC26-02 — P2: DD-208 accepts a sparse provider allowlist

Owner: migration 0031 `uuid_array_is_set` and `validate_ai_configuration` → DD-208 contract item 1 → AITENCFG-MODEL-CUR-006. Array.prototype.every skips absent array slots. A one-hole provider allowlist with an empty model set returned true; a populated provider array with an intervening hole could also pass. This contradicts the existing all-entries-are-UUID contract. It is a bounded helper validation defect; the helper is not runtime authorization and PostgreSQL readers produce dense arrays.

The added regression failed against the baseline (**7/8 pass, 1 fail**) and passed after correction (**8/8**). Array.from materializes holes before the existing UUID predicate runs. Valid dense arrays and existing exact-id/status semantics are unchanged. No new product requirement or AI eligibility policy is introduced.

### VC26-03 — P2: stale PR handoff

PR #2's title/body still present the older database-only audit as current and direct continuation from identity/context services already implemented. Repository state correctly identifies DD-208. Correction is a current review summary retaining the draft/unmerged restriction and distinguishing incomplete audit coverage from verified tests.

## Invalidation and continuation gate

The earlier PASS records remain historical evidence for their exact commits. Discovery of VC26-01/02 makes current absence-of-defect claims provisional. Local corrected Core/server suite: **700/700**, 0 failed/skipped, using test concurrency 2; targeted repository/AI checks also pass. Local PostgreSQL server installation was unavailable; PGlite is not a substitute for the required hosted role/RLS verification.

Correction-HEAD Core/PostgreSQL/Database/Web verification is pending at this report's initial commit. Full semantic file coverage and cross-layer/adversarial reconciliation also remain pending. The requested global clean gate has **not** been established. Do not open DD-209 or another forward implementation slice merely because these corrections pass CI.

Next corrective action: verify the correction HEAD, synchronize concrete evidence, then continue the remaining complete-project semantic audit from this ledger. Only after full coverage and resolution of all real findings may the next independent source-owned prerequisite be selected.

## Verified corrective gate and current handoff

Final substantive correction HEAD: `0da6d173679c31e202d4a0bf59ef3b8889a81404`; tree `b39bb846b35d8a3d1a2b8a1310a4abcae29688b5`. All four downloaded logs independently assert this exact commit/tree.

| Gate | Push run | Job | Result |
|---|---:|---:|---|
| Core/server | 36258226516 | 108448956137 | 700/700, zero failed/skipped |
| PostgreSQL | 36258226516 | 108448956272 | 505/505, zero failed/skipped; CTX-BOOT-007 PASS; full bootstrap PASS |
| Database | 36258226522 | 108448955972 | 48 migrations + 42 verification files actually executed; PASS |
| Web | 36258226545 | 108448956179 | Locked dependencies, deterministic lock, TypeScript, Next.js and clean generated state PASS |

VC26-01 and VC26-02 are corrected and exact-HEAD verified. VC26-03 is corrected: PR #2 now names DD-208, the fixes and the incomplete audit gate; it remains draft/open/unmerged. The confirmed finding count is P0 0, P1 1, P2 2; all three confirmed findings are corrected. This is not a zero-defect claim for the unaudited remainder.

Additional static source/test sweep found no focused/skipped/todo tests or eval/new Function. Core's only external import is the existing zod DTO boundary; these pattern checks are not proof of full architectural/security correctness.

The metadata/evidence commit containing this section leaves implementation, tests, SQL and workflows equal to the substantive correction tree and requires its own exact-HEAD gate. Current projections point to the already verified substantive parent to avoid a self-referential commit hash.

**Complete-project verdict: IN PROGRESS / NOT PASSED.** Full semantic per-file coverage remains incomplete; no global clean gate and no next development prerequisite is authorized by this audit. Continue the audit from the frozen coverage ledger, preserving these verified fixes. The earlier pending-CI text above records the initial audit commit and is superseded only by this observed verification section.

## 2026-09-27 source-fidelity continuation

Fresh branch/PR verification reconfirmed `0258d787c17ccdfb5c3c7782702907400b96a57d` with successful exact-HEAD workflows and PR #2 draft/unmerged. Complete source reading identified repeated-heading extraction contamination and overbroad supersession. [Current reconciliation](SOURCE_FIDELITY_RECONCILIATION_2026-09-27.md) records the targeted corrections, exact source locators and remaining gate. The earlier 2,962 cross-ledger equality result was true but did not prove source fidelity; strengthened REPO-002 now checks the immutable source parent itself. No global clean verdict or forward-development authorization is issued.


## 2026-09-27 DD acceptance-contract continuation

Architecture/state synchronization HEAD `5e27fa41cb1fc2099d6033157589a3cf5ebeaeee`, tree `1be4c73ebdc31f2c29615186cd7fa17618a42338`, passed exact-HEAD Core 700/700, PostgreSQL 505/505, Database 48 migrations / 42 verification files, and Web. The remaining Detailed Design semantic sweep then found one downstream acceptance-contract drift.

### VC27-06 — P2: suspended-mode acceptance wording was broader than the governed operation boundary

`DD-17 AUTH-007` said “suspended restricted mode read permitted/write denied”. That wording could be read as a generic suspended-read allowance, while F-14 §2/§5, A-08 §6 and DD-04 §11 require generic protected operations to remain fail-closed and permit suspended read-only/billing/renewal/export behavior only through explicit dedicated restricted-operation contracts. No runtime widening was found; the inconsistency was in the acceptance contract itself.

Smallest forward-only correction: AUTH-007 now permits only an explicit dedicated restricted-operation read and explicitly denies generic reads and writes. No product requirement, operation ID, schema, SQL, RLS, role, grant, runtime path or RawSource content changed.

Correction HEAD `f709f0227ae416f88ccb7c7fdf8e3e5293209409`, tree `4aada69ebe504e01092f143173559366bd69fcc0`, passed the required exact-HEAD gate:

| Gate | Run | Job | Result |
|---|---:|---:|---|
| Core/server | 36290340375 | 108539080145 | 700/700; zero failed/skipped |
| PostgreSQL | 36290340375 | 108539079982 | 505/505; zero failed/skipped; bootstrap PASS |
| Database | 36290331102 | 108539053967 | 48 migrations / 42 verification files; PASS |
| Web | 36290340382 | 108539079807 | PASS |

The complete-project audit remains **IN PROGRESS / NOT PASSED**. DD-208 remains the latest governed development checkpoint; DD-209 is not authorized. Continue semantic source-to-owner and downstream cross-layer review before any forward feature slice.


## 2026-09-27 S2.1 governance source-owner continuation

Fresh reading of immutable S2.1 (Master Development Instruction v3.0, source lines 16–606) was reconciled against current MASTER_INSTRUCTION v2.5, D-DECISIONS, Foundation and Architecture owners. The 2,962 stable product-requirement IDs do not by themselves certify these governance units; unit-level semantic ownership is therefore recorded separately in SOURCE_SPAN_COVERAGE.

### VC27-07 — P2: S2.1 mixed governance/technology units were overbroadly marked VERIFIED

The existing unit traceability correctly recognized UD-TECH-01 for several source stack sections, but its disposition text was still too coarse, and four mixed units were materially under-classified: S2.1-U027 Admin Panel, U028 Authentication, U033 Development Phase Roadmap and U038 Final Delivery Package. In addition, U017/U023–U031 used blanket “source tech history → active override” wording that could be read as repealing non-stack obligations that the current canonical model explicitly preserves.

Correction is evidence-only and forward-only:
- U017 distinguishes surviving deployment simplicity/portability concerns from historical cPanel/shared-hosting/no-Docker/no-Vercel defaults.
- U024–U027 identify the exact backend/frontend/database/admin implementation assumptions superseded by UD-TECH-01.
- U028 preserves OTP/RBAC/SSO/OAuth/OIDC/SAML/LDAP/Passkeys/MFA/biometric/PKI/eSign/DigiLocker/federation capabilities while marking Laravel/direct-JWT implementation assumptions historical under the provider-isolated Core Identity boundary.
- U030/U031 preserve mobile/desktop capability obligations while applying React Native + Expo, Tauri and Core Identity as the active implementation authority.
- U033 now cites CR-04/LG-13 and preserves 01–21B only as source sequence/reference; active phase governance is dependency-driven.
- U038 preserves final-delivery obligations while normalizing Flutter/Super-Admin-app/Windows-only labels to the active Platform Application, exactly two Tenant mobile apps, optional Tauri desktop and UD-TECH-01.

No RawSource byte, stable requirement ID/count, product behavior, runtime code, SQL, RLS, role, grant or test is changed. This closes **S2.1 unit-level source-owner reconciliation only**; it is not runtime, production-readiness, full source-corpus or complete-project certification. The containing commit requires the normal exact-HEAD Core/PostgreSQL/Database/Web gate before this finding is recorded as verified.


## 2026-09-27 S2.2 zero-row source-owner continuation

Fresh source reading targeted the S2.2 parent units that carry meaningful prose but zero located stable requirement rows. Six units can be reconciled directly from existing canonical evidence; the production-content/demo/master/media parent cluster remains open for deeper semantic review and is not marked reconciled by this slice.

### VC27-08 — P2: S2.2 zero-row legacy/status units lacked explicit canonical conflict ownership

S2.2-U044 states that Healthcare is the flagship, fully built-out vertical and that the other named suites do not yet have equal operational depth. The unit traceability row previously marked the unit generically VERIFIED without linking the already-governing CR-05/LG-03/LG-04 resolution. That is unsafe source-fidelity wording because the source detail must be preserved while its flagship/template/permanent-shallow posture remains legacy. S2.2-U039 similarly carries a source-document `Status: Production Ready` label that cannot certify current project status under §9A/§27/§33A/LG-14.

The same corrective slice sharpens U090 Sample Lifecycle to its exact F-07 §1.4 owner, U112 deployment-simplicity mixed disposition to UD-TECH-01/A-10, U124 database/isolation cross-reference ownership, and U129 performance/scalability ownership. No source bytes, requirement IDs/counts, product behavior, runtime code, database object, RLS rule or tests change.

The containing commit requires exact-HEAD Core/PostgreSQL/Database/Web verification. Full S2.2 semantic reconciliation remains **IN PROGRESS**, especially U051/U052/U058/U062/U072 production-content/demo/master/media parent semantics. Forward development remains held at DD-208.


## 2026-09-27 S2.2 production-content/data-bootstrap continuation

Fresh reconciliation of S2.2-U051/U052/U058/U062/U072 found one real cross-layer omission: the child lists for content, demo data, masters and media were traced, but §10A's zero-row umbrella requirement — successful installation/activation should deliver a populated production baseline without requiring manual creation of essential baseline records — was not explicit in the canonical data/activation contracts.

### VC27-09 — P1: S2.2 §10A installation-readiness umbrella was not explicit in canonical data/activation contracts

The omission matters because a requirement-count PASS could otherwise coexist with an activation path that reports success before required seed/reference/master/config/content materialization is complete. The source also mentions realistic demo data, but current canonical safety requires demo records to remain synthetic, DEMO-flagged, resettable and separate from production truth; therefore the correction preserves both obligations rather than auto-inserting fake transactional data into production tenants.

Smallest forward-only correction:
- F-04 adds source-derived BR-DATA-03: successful install/activation materializes required seed/reference data, applicable master defaults, configuration/templates and production content/assets for the enabled scope; failure remains non-ready rather than partially successful.
- A-05 defines a versioned, idempotent baseline-package manifest and separate optional demo package class.
- A-09 makes baseline materialization part of Industry activation before READY/PUBLISHED.
- DD-17 adds DATA-BOOT-001…005 acceptance covering first-run readiness, idempotency, fail-closed partial activation and demo/production separation.
- DD-19 and the source registers record the exact Source → Foundation → Architecture → DD/Acceptance chain.

No RawSource byte, stable 2,962 requirement ID/count, runtime code, database schema/object, RLS policy, role/grant or existing executable test was changed. The correction commit must pass the normal exact-HEAD Core/PostgreSQL/Database/Web gate before VC27-09 is considered verified. DD-208 remains the latest governed development checkpoint; DD-209 remains held while the complete semantic audit continues.


## 2026-09-27 verification closure — VC27-07 through VC27-09

The earlier “requires exact-HEAD gate” sentences in VC27-07/08/09 record their pre-verification state. Those gates are now closed:

| Finding | Exact HEAD / tree | Core | PostgreSQL | Database | Web |
|---|---|---:|---:|---|---|
| VC27-07 | `64ab9654dd027052b3c24d21ada11ef54cc4a9c8` / `73fa928b20ed8c1ec1da6f7c538c13ba28f493ce` | 700/700, 0 fail/skip | 505/505, 0 fail/skip | 48 migrations / 42 verification files PASS | PASS |
| VC27-08 | `d43793cd5664a5e87e889add881e75c1fd97b7b1` / `77cc0ff2b5990958331c4822f2249b60327adf37` | 700/700, 0 fail/skip | 505/505, 0 fail/skip | 48 / 42 PASS | PASS |
| VC27-09 | `4802a722aa350df33dd7f927a8fcd1fbe8ab254c` / `e98f216573e1bc4edd7ad38767c808049bba40c1` | 700/700, 0 fail/skip | 505/505, 0 fail/skip | 48 / 42 PASS | PASS |

S2.1 parent-unit owner reconciliation is complete, and every S2.2 zero-row parent unit now has an explicit semantic reconciliation. This is **not** a complete-project PASS: remaining source families (S1, S2.3–S2.9), downstream canonical layers, implementation/SQL semantics and historical state/register evidence still require fresh review. Forward development remains stopped at DD-208; DD-209 is not authorized.


## 2026-09-27 S2.3 Engineering Standards source-owner continuation

Fresh reading of S2.3 (Engineering Standards, source lines 2809–3073) confirms that its generic NFR, security and testing obligations remain part of the active knowledge base, but several implementation/tooling statements are stack-specific to the historical Laravel/PHP baseline. The existing unit matrix marked all S2.3 units simply VERIFIED, which did not make that distinction and could also be read as granting Production Readiness from a source checklist.

### VC27-10 — P2: S2.3 Engineering Standards mixed active obligations with historical Laravel/PHP tooling and unearned Production Readiness wording

Correction is source-evidence only:
- U142 preserves SOLID, clean architecture, service/repository/action patterns where appropriate, dependency injection, interface-based design, reuse/modularity, DRY/KISS, naming, exception handling and documentation; Laravel Best Practices / PSR-12 are historical stack-specific requirements under UD-TECH-01.
- U143 preserves static analysis, dead/duplicate-code detection and technical-debt monitoring; PHPStan and Laravel Pint are historical tools. Current TypeScript compilation is real evidence for the checks it performs, not a substitute for the complete future code-quality gate.
- U144 preserves approved-package, license-compatibility, vulnerability-scanning, update and lock-determinism obligations; Composer-lock wording is historical. Current Web CI verifies deterministic npm lock state, while dependency vulnerability scanning is **not** claimed complete because current workflows intentionally install with `--no-audit`.
- U146 preserves all application-security controls but normalizes source JWT wording to any signed-token security behind the single Core Identity boundary; it does not reintroduce an app-owned JWT/refresh-session authority.
- U157 remains a future Production Readiness gate under MI §27/§33A/LG-14. Its static-analysis, dependency-scan, code-style and release-tag items remain required before Production Ready; their absence from the current bounded Development gate is not treated as a current Production Ready failure because no such status is claimed.
- All other S2.3 NFR/security/testing parent units are mapped to their existing Foundation/Architecture/DD owners without changing behavior.

No RawSource, runtime code, workflow file, dependency, schema, SQL, RLS, role/grant, test or stable requirement ID/count changes in this correction. The containing commit requires exact-HEAD Core/PostgreSQL/Database/Web verification. DD-208 remains the latest governed development checkpoint; forward development stays held.


## 2026-09-27 S2.4 Database Architecture Standards continuation

Fresh reading of S2.4 (Database Architecture Standards, U158–U173) found two concrete source-to-canonical gaps. The database engine conflict was already safely resolved by UD-TECH-01/A-05 (PostgreSQL), but the source naming standard and backup cadence needed explicit reconciliation rather than a generic VERIFIED parent row.

### VC27-11 — P1: S2.4 database naming conflict was unrecorded and source backup cadence was not explicit in Detailed Design

1. **Physical naming conflict.** S2.4 requires `snake_case` and **Plural Table Names**. The current PostgreSQL Detailed Design and all verified migrations consistently use schema-qualified **singular** tables such as `core_tenancy.tenant`, `industry_context`, `org_unit` and `metadata_definition`. No prior D-DECISIONS/ADR/REVIEW_REQUIRED entry recorded that divergence. AC-19 now records the choice to preserve snake_case but retain singular physical table names. Renaming the established 48-migration schema would create high-risk migration/query/test churn with no business, isolation or security gain; plural compatibility aliases would create permanent dual naming. No physical object is renamed by this correction.

2. **Backup cadence omission.** S2.4 explicitly requires Daily, Weekly and Monthly backups plus restore validation/DR. A-10/DD-14 already define stronger continuous WAL/PITR, snapshots, RPO/RTO and restore exercises, but DD-14 did not explicitly preserve the three source cadence classes. DD-14 §14 now requires daily/weekly/monthly scheduled base/snapshot recovery-point classes in addition to WAL/PITR; DD-17 RCV-007 makes their presence an acceptance condition. Exact clock times/retention counts remain versioned policy concerns and may be tightened without deleting those baseline classes.

The same S2.4 reconciliation records: MySQL/MariaDB source-engine wording is historical under UD-TECH-01; Branch/Department identifiers are canonically represented by typed OrgUnits; FHIR/HL7 belong to Healthcare interoperability rather than the physical database layer; and all remaining performance/security/residency/governance/change-policy obligations retain their existing owners.

No RawSource, runtime code, SQL migration, existing table, RLS policy, role/grant, executable test or stable requirement ID/count is changed. The containing commit requires exact-HEAD Core/PostgreSQL/Database/Web verification. DD-208 remains the latest governed development checkpoint and DD-209 remains held.


## 2026-09-27 S2.5 Mobile Architecture Standards continuation

Fresh reading of S2.5 (U174–U206) found that the canonical mobile architecture itself is already aligned to the Vision, but the source-unit ledger used one blanket technology-override disposition for nearly every unit. That obscured the distinction between framework replacement, preserved mobile capabilities, Healthcare-only source modules, the separate Platform Mobile channel and security-sensitive offline behavior.

### VC27-12 — P2: S2.5 mobile parent routing over-applied technology supersession and obscured app/domain scope

The correction is source-owner/traceability only:
- exactly two logical Tenant mobile app classes remain `TENANT_STAFF_APP` + `TENANT_USER_APP`; source “Super Admin App” maps to the separate Platform Application/conditional Platform Mobile channel and never becomes a third Tenant app;
- Flutter/Dart and Riverpod/Bloc/Cubit are source-era framework choices superseded by UD-TECH-01; no unsupported React Native state library is invented;
- local storage/cache/network/background/device capabilities survive, but source Hive/SharedPreferences/direct-JWT/direct-FCM implementation assumptions do not override DD-11/Core Identity/PushPort;
- source “Automatic Conflict Resolution” is preserved only through DD-11's declared conflict classes; controlled and financial/stock/regulated data never use naive last-write-wins;
- the Tenant User/Staff module inventories and Patient/Report/Sample QR examples are Healthcare source content inside the two reusable app classes, not platform-wide semantics and not templates for other industries;
- source Healthcare “flagship” wording is legacy under CR-05/LG-03/LG-04;
- source Super Admin mobile module inventory is Platform Application capability input subject to DD-10 PlatformChannelEligibilityPolicy and does not itself authorize tenant-data access;
- AI, accessibility, distribution, versioning, testing and CI/CD obligations are routed to their actual canonical owners; Codemagic/Fastlane are not silently installed as current dependencies.

No RawSource, application code, mobile binary, dependency, workflow, SQL/RLS, role/grant, executable test or stable requirement ID/count changes. The containing commit requires exact-HEAD Core/PostgreSQL/Database/Web verification. DD-208 remains the latest governed development checkpoint; DD-209 remains held.


## 2026-09-27 S2.6 AI Architecture Standards continuation

Fresh reading of S2.6 (U207–U238) confirmed the 13-provider abstraction, capability matrix, RAG/memory/security/routing/governance, Enterprise AI Platform expansion, provisioning, prompt, media and observability requirements. It also exposed a real current-model conflict plus two ownership/safety ambiguities hidden by generic VERIFIED routing.

### VC27-13 — P1: S2.6 combined Industry assistant identity and AI-approval semantics conflicted with current isolation/equality rules

**Industry assistant identity.** The source expansion names eight assistant labels because it combines “Government & NGO AI Assistant.” F-05 had copied that combined label even though SBGlobal Plus has nine equal Current Supported Industries and F-09 owns Government & Public Sector and NGO / Temple / Trust as independent suites with independent Industry Contexts. The correction makes the current assistant catalog nine independent suite-owned families and records the source combined label as historical provenance. A separately governed Platform/Tenant shared assistant may span authorized contexts, but it cannot replace either suite-owned assistant or collapse their context ownership.

**AI approval semantics.** S2.6 lists both Human Approval and AI Approval in the AI Workflow Engine. Existing A-07/DD-09 already require human confirmation for governed high-risk tool actions, so “AI Approval” cannot safely mean that a model grants itself authorization. F-05/A-07/DD-09 now state that AI-generated approval/recommendation is advisory or a policy-defined low-risk automation signal only; it cannot satisfy a principal-required approval, permission, entitlement or high-risk tool gate. DD-17 AI-019 makes that boundary deterministic.

**Owner normalization.** U222 Enterprise Pack and U223 Subscription/Billing are commercial concerns consumed by AI, so their canonical owners are F-14/A-04/DD-04 plus AI usage evidence, not F-05/A-07 alone. U232 AI API Platform routes through A-06/DD-06 and the AI Gateway; source GraphQL is preserved as source history but is not active interface authority under UD-TECH-01's tRPC-first-party + REST/OpenAPI-external baseline. U233 Marketplace licensing likewise routes through platform Marketplace + F-14/A-04 entitlements.

DD-17 AI-018 requires nine independent Current Supported Industry assistant families (HLT/EDU/RTL/HSP/MFG/PSV/GOV/NGO/SFM); a combined GOV+NGO definition cannot satisfy both entries.

No RawSource, provider dependency, AI execution code, SQL/RLS, role/grant, workflow definition, executable test or stable requirement ID/count is changed by this correction. The containing commit requires exact-HEAD Core/PostgreSQL/Database/Web verification. DD-208 remains the latest governed development checkpoint; effective AI execution remains locked and DD-209 is not authorized.


## 2026-09-27 S2.7 Enterprise Default Standards continuation

Fresh reading of S2.7 (U239–U271) found no new runtime/design defect because the canonical brand, Country Pack and Industry Experience models already contain the necessary safeguards. The source-unit ledger, however, flattened many domain-specific defaults into Platform-wide ownership even though the source's own Vertical Suite Note explicitly scopes Tenant Web Portal, LIS, Invoice and Report defaults to Healthcare.

### VC27-14 — P2: S2.7 Healthcare-specific defaults were over-classified as platform-wide

The evidence correction makes the following boundaries explicit:
- S2.7's tagline is preserved as a historical/alternative source tagline; F-06 §6.1 + CR-02 own the active primary tagline “One Intelligent Platform. Every Industry. Infinite Possibilities.”
- source company/address/contact values are Platform company-profile defaults managed through governed CMS/configuration, not immutable code constants.
- brand colors/typography/layout remain Platform defaults with tenant branding overrides subject to accessibility/security floors.
- source Tenant Web Portal, Healthcare dashboard/KPIs, Patient/Doctor modules, LIS, Invoice and Report defaults are Healthcare experience/presentation defaults. They do not define the canonical Tenant Management Application and do not leak Healthcare semantics into other Industries.
- Master Dropdowns and Setting Modules are MIXED: general reference/config entries are Core; doctor/patient/sample/test/specimen/machine/LIS and similar entries are Healthcare-scoped. BR-DATA-03 materializes only the applicable baseline for an enabled scope.
- the source Master Data standard-column list is a baseline; Industry-owned rows additionally require Industry Context ownership/equivalent immutable relation under A-05/DD-05.
- Default User Role Seeds are MIXED: shared Platform/Tenant roles plus Healthcare-specific roles. The source “other suites … as they are built out” wording is legacy under CR-05/LG-03/LG-04 because all nine current Industries are first-class and receive applicable role/config seed packs.
- India defaults (Asia/Kolkata, dd-MM-yyyy, INR, English/Hindi) remain the default baseline, but Country Packs/Tenant configuration may override allowed locale/currency/time settings. “AI enabled”, “API first” and “soft delete enabled” defaults do not bypass entitlement/security/data-class exceptions.

No RawSource, runtime code, configuration data, schema, RLS, role/grant, executable test or stable requirement ID/count changes. This correction is traceability/ownership only. The containing commit must pass exact-HEAD Core/PostgreSQL/Database/Web verification. DD-208 remains the latest governed development checkpoint; DD-209 remains held.


## 2026-09-27 S2.8 Enterprise UI Design System continuation

Fresh reading of S2.8 (U272–U319) confirms that the grid, spacing, radius, controls, tables, statuses, modals/drawers, navigation, search, charts, forms, themes, accessibility and breakpoints are legitimate shared design-system primitives. The source ledger nonetheless treated every child as Platform-wide even where the source itself or current security/localization rules make the example domain- or jurisdiction-specific.

### VC27-15 — P2: S2.8 domain/jurisdiction examples were over-classified as universal UI semantics

The correction records:
- File Components remain reusable UI, but upload/camera paths execute through DD-08/DD-16 secure upload, MIME/signature/malware, ACL and residency controls.
- Table Actions (View/Edit/Delete/Duplicate/Archive/Restore…) are presentation affordances only; the actual operation is server-authorized by the owning OperationContract, resource state and data-lifecycle policy.
- Default Status Colors remain visual tokens; status text/semantics remain exposed and canonical accessibility prohibits color-only meaning.
- Filters are MIXED: generic date/branch/department/status/custom filters are reusable, while Doctor/Report are Healthcare examples and Payment/domain filters exist only where the owning domain exposes them.
- Validation is MIXED: required/unique/email/phone/UUID/slug/age/password-strength are reusable; GST/PAN/Aadhaar are India/jurisdiction/identity-provider-specific and must be activated through Country Pack/trust-service policy rather than global hard-coding.
- Timeline is MIXED: Audit/Activity/Workflow are reusable; Patient/Sample timelines remain Healthcare-specific.
- The source Vertical Suite Note is honored: Report Colors and H/L/HH/LL/Critical Report Flags are Healthcare laboratory semantics, not global UI status semantics.
- Dashboard Widgets are MIXED: Revenue/Notifications/Calendar/Tasks/Quick Links are reusable building blocks; Patients/Doctors/Today's Collection/Pending Reports/Sample Status/Top Tests are Healthcare defaults owned by that suite.
- Source accessibility requirements are preserved and may be strengthened by the canonical WCAG 2.1 AA/reduced-motion/responsive accessibility floor.

No RawSource, component implementation, design-token payload, runtime code, schema, RLS, role/grant, executable test or stable requirement ID/count changes. This is ownership/traceability correction only. The containing commit requires exact-HEAD Core/PostgreSQL/Database/Web verification. DD-208 remains current and DD-209 remains held.


## 2026-09-27 S2.9 Enterprise Development Roadmap continuation

Fresh reading of S2.9 (U320–U335) confirms that the document is Tier 5: thematic construction milestones plus volume targets, never current phase-order or completion authority. CR-04 already resolves the Phase 01–14 versus corpus phase-numbering conflict; current MI v2.5 further makes phase count dependency-driven. The unit ledger still needed scope/status normalization because the roadmap checklists contain many Healthcare-centric and historical technology/surface labels.

### VC27-16 — P2: S2.9 Roadmap checklist/targets were too coarsely treated as platform-wide verified state

The correction records:
- 500+ tables, 250+ masters, 1000+ dropdown values, 100+ settings pages, 200+ LIS settings and 1000+ permissions are **roadmap volume targets**, not current counts and not evidence that those scopes are complete.
- Phase 03/04/05 lists are MIXED: generic master/dropdown/settings families are shared while Patient/Doctor/Laboratory/LIS/Machine/Healthcare Standards and similar items are Healthcare-owned.
- Phase 06 Complete LIS Configuration is Healthcare-only. Its 200+ settings target cannot be treated as a Platform-wide phase requirement.
- Phase 07's role list is an example subset; the authoritative user/role catalogs remain elsewhere. Only the 1000+ permissions figure is a roadmap volume target.
- Phase 08/10/12/13 workflow/template/audit/analytics lists mix reusable platform capabilities with domain examples; Healthcare examples remain suite-owned.
- Phase 09 Browser/Slack/Teams/Telegram mentions remain roadmap checklist history and do not silently create active provider/channel integrations absent separate source-complete ownership.
- Phase 11 API checklist is normalized to UD-TECH-01/A-06: tRPC first-party plus REST/OpenAPI external. Source JWT/Swagger wording is not active stack authority.
- Phase 14 Quality Standards remains a future acceptance-gate checklist. It cannot grant TESTED, SECURITY VALIDATED or PRODUCTION READY status.
- Final Target is aspirational. Super Admin Portal/Tenant Web Portal are normalized to the current Application Surface Model; Windows Desktop is historical under cross-platform Tauri; LIS/Billing/Inventory remain suite/domain capabilities; the checklist's “Production Ready” item is a target, not the current project status.
- The source roadmap preface itself references an older 01–21A authority wording; current MI v2.5 preserves corpus sequence knowledge but governs by dependency-driven §26 and records S2.1 as 01–21B history. RawSource remains unchanged.

No RawSource, runtime code, schema, RLS, role/grant, workflow, executable test or stable requirement ID/count changes. This is roadmap ownership/status reconciliation only. The containing commit requires exact-HEAD Core/PostgreSQL/Database/Web verification. DD-208 remains current and DD-209 remains held.


## 2026-09-27 S1 Consolidated Architecture/PRD source continuation

Fresh reading of all S1 units (U001–U037) confirms that the consolidated source remains valuable for the target vision, nine-industry catalog, 2–8 foundational-MS governance, identity/security capabilities, public website and brand direction. Its unit ledger was nevertheless too coarse: historical Windows/JWT/REST implementation language, incomplete marketing industry lists, source-status/certification wording and website-only roadmap labels were all simply marked VERIFIED.

### VC27-17 — P2: S1 legacy technology/surface/status and marketing-evidence wording remained coarsely VERIFIED

The correction is source-owner/status normalization:
- Target Vision and Expected Outcome preserve cross-platform/offline/security/configuration intent, while source Windows-only `.exe/.msi` emphasis is historical under UD-TECH-01/AC-15; current desktop target is Tauri across Windows/macOS/Linux.
- Platform Scope & Access Flow preserves server-authoritative authentication/tenant/subscription/license/device/permission enforcement but normalizes source REST/JWT/refresh-token implementation wording to the single Core Identity boundary, tRPC first-party interface and REST/OpenAPI external interoperability.
- Identity/authentication method lists remain supported capability classes behind the provider-isolated Core Identity; they do not create separate auth engines.
- Security/compliance recommendations preserve GDPR/DPDP/HIPAA-readiness/SOC 2/ISO 27001 alignment objectives, but neither source prose nor marketing badges grant certification. Trust/status/compliance badges must be backed by current evidence.
- the nine Supported Core Industries are preserved as equal. Website sitemap/homepage excerpts naming only Healthcare/Education/Retail/Manufacturing/Hospitality/Government are non-exhaustive marketing examples; the canonical public Industries experience exposes all nine without priority.
- the 2–8 foundational Management Systems policy remains active. Exceptional count changes require explicit user approval under current MI §32 rather than an undefined Enterprise Architecture Governance body.
- Tenant Philosophy configuration of database connections/deployment policies remains bounded by Data Home, entitlement, security and deployment architecture; it does not authorize per-tenant backends or isolation bypass.
- website loader/visual effects are presentation direction subject to performance, accessibility and reduced-motion requirements. Future announcement personalization/geo/A-B/CRM items remain future ideas until separately governed.
- S1's “Guided by Trust. Built for Tomorrow.” primary-tagline statement is historical/alternative under CR-02; the active primary tagline remains “One Intelligent Platform. Every Industry. Infinite Possibilities.”
- Company Information remains governed company-profile configuration rather than immutable application constants.
- S1 Website Roadmap phases 1–3 are a website/content roadmap only (CR-08), not project phase-order authority.
- the source footer “Final v1.0 / Enterprise QA review complete / 31-file breakdown” is historical source metadata under CR-07 and does not certify the current repository or impose a fixed file count.

No RawSource, runtime, schema/RLS, role/grant, workflow, executable test or stable requirement ID/count changes. The containing commit requires exact-HEAD Core/PostgreSQL/Database/Web verification. During reconciliation, the source-span ledger also exposed **82 S2.2 units still carrying NOT_CERTIFIED semantic status**; therefore parent-source reconciliation remains open after S1 and forward development remains held at DD-208.


## 2026-09-27 post-S1 canonical consistency correction

### VC27-18 — P1: post-S1 closure found stale F-03 SQL/organization wording and public compliance-claim ambiguity

The S1 parent-ledger reconciliation at `3a00ff84b53fd5e7ebfb8cd1b2b8150a990c0260` correctly classifies all 37 source units, but a direct canonical-owner reread exposed two residual implementation-facing inconsistencies:

- **F-03 §8** still repeated source-era S2.4 wording: separate Branch/Department identifiers and `snake_case, plural tables`. This conflicts with the already-recorded current architecture: Branch/Department are typed OrgUnits, and AC-19/A-05/DD-05 define schema-qualified singular snake_case PostgreSQL physical table names. F-03 now stops owning SQL naming and points to those owners. This changes no physical object.
- **F-06 §2** lists Trust Center / Compliance Badges as required public capabilities. S1's recommendation text names SOC 2/ISO/GDPR badges, while MI §9A/§33A prohibits status/certification by label. F-06 now requires exact current governed evidence for every public certification, security status, uptime or SLA claim and requires readiness/alignment wording to remain explicit.

These are smallest forward-only documentation corrections. No RawSource, runtime, SQL migration, RLS, role/grant, executable test, provider, application surface, Industry/MS catalog or stable requirement ID/count changes. S2.2 owner reconciliation remains the blocking source-audit work; DD-208 remains current and DD-209 remains held.


## 2026-09-27 S2.2 Product Specification continuation — slice 1 (U040–U081)

Fresh direct-source review of the first unreconciled Product Specification block found mostly ownership/scope drift plus two canonical-document defects already surfaced by the S1 residual audit.

### VC27-19 — P1/P2: S2.2 vision/content/surface scope drift plus public-claim evidence gap

**Vision/catalog/status.** S2.2 Product Vision still calls Healthcare the flagship and calls the platform Production Ready. Those are source-era statements only: Healthcare is one of nine equal Current Supported Industries and current project status is evidence-gated. Business Scope also omits Security & Facility Management from the current list and uses shorter Government/NGO labels; CR-03/CR-05 and the current catalog govern. The source “complete platform-wide User Types” list is Healthcare-heavy and cannot be the complete role/persona catalog for nine equal suites.

**Surface ownership.** Source Super Admin Portal maps to the Platform Application/Control Plane. Source Tenant Web Portal sections containing Patients/Doctors/LIS/medical history/appointments/payments are a Healthcare Industry Experience Web surface, not the canonical Tenant Management Application. Tenant Management remains administration/configuration/commercial/security only. Mobile source content maps into exactly two Tenant app classes (Staff/User) plus a separate Platform Application channel.

**Data/content scope.** Healthcare/Laboratory/Medical demo data and Laboratory masters remain Healthcare-owned; demo policy itself applies to every current Industry. General reference masters remain Core/Country-Pack governed. Identity reference values such as religion/category are not universal required identity or authorization facts. Organization masters normalize Branch/Department to typed OrgUnit ownership. Inventory/Billing/Workflow source lists are mixed and are split between reusable Core capabilities, Healthcare defaults and Country-Pack jurisdiction data such as GST.

**Public claim integrity.** S2.2 requires realistic AI-generated production content, testimonials, customer profiles, compliance badges and laboratory certifications. A production-content requirement cannot be read as permission to fabricate a real endorsement, accreditation, uptime/SLA record or measured outcome. F-06 now expands its claim rule; DD-10 adds a governed claim/evidence contract; DD-17 adds PUBLIC-CLAIM-001…003 so missing/expired/revoked evidence makes real-world claims non-publishable while clearly illustrative synthetic/demo content remains allowed.

**Residual S1 owner correction revalidated.** F-03 now defers physical SQL naming to AC-19/A-05/DD-05 singular schema-qualified table naming and uses canonical typed OrgUnit ownership rather than stale plural-table/independent Branch-Department wording.

No RawSource, runtime implementation, executable test, SQL migration/RLS, role/grant or stable requirement ID/count is modified. This slice changes Foundation/DD contracts and traceability only. Exact-HEAD Core/PostgreSQL/Database/Web verification is required. After this slice, 46 S2.2 parent units remain semantically unreconciled; DD-208 remains current and DD-209 remains held.


## 2026-09-27 S2.2 Product Specification continuation — slice 2 (U082–U111)

Direct review of the operational/commercial/API/mobile/AI/operations block found no requirement to change RawSource, but several current-owner and safety boundaries were too coarse in the parent ledger.

### VC27-20 — P1/P2: S2.2 Healthcare/Core ownership, clinical-AI authority and legacy platform-stack wording required normalization

**Healthcare operations vs Core primitives.** Branch, Department and Staff sections combine reusable OrgUnit/HR capabilities with laboratory-specific equipment/worklists/KPIs and Healthcare role types. Patient, Doctor, Appointment, LIS and Test Catalogue are Healthcare domain requirements. Healthcare Billing and Inventory consume shared Finance/Commercial/Inventory primitives but retain suite-specific workflows, while GST/TDS remain jurisdiction-governed rather than global semantics. Communication is a Core engine; provider names in the source are configurable integration options, not automatically enabled commercial/provider relationships.

**Clinical AI authority.** S2.2 Reports permits AI Summary, Risk Score, Health Score, Diet Suggestions and Lifestyle Suggestions. F-07 now states explicitly that these are assistive only: they cannot mutate verified laboratory values/reference ranges/flags, cannot satisfy pathologist/clinician approval, and cannot autonomously publish diagnosis, prescription or treatment decisions. DD-17 HLT-AI-001/002 makes those boundaries deterministic.

**Commercial lifecycle.** S2.2's tier set remains Free/Starter/Pro/Premium/Enterprise. Current F-14 owns operational lifecycle: Renewed is an Active re-entry event, not a resting state; Free/Starter are self-serve, Enterprise sales-assisted, Pro/Premium governed dual-route; expiry/suspension never delete tenant data.

**Integration/API/Mobile.** Healthcare organization integrations and HL7/FHIR/HIS/EMR/EHR/LIS/RIS/PACS details remain Healthcare interoperability. Core Integration owns credentials, mappings, retries, queues, webhooks and policy. Current API authority is tRPC first-party plus REST/OpenAPI external; source JWT wording does not reintroduce a competing human-session/token core. Mobile remains exactly two logical Tenant app classes plus a separate Platform Application channel; API endpoints are governed environment/profile references, not arbitrary tenant-controlled bypass URLs.

**AI/Analytics/Security/Operations/Deployment.** Health/report/risk AI and Patient/Test/Doctor analytics are Healthcare-scoped; platform AI/analytics frameworks remain reusable. AI Development Center is governed review assistance and cannot autonomously modify production code. Security framework mentions are readiness/alignment obligations, not certifications. Monitoring, backup, provider/environment configuration and typography remain shared platform capabilities. S2.2 Deployment Requirements are target-state wording: source cPanel/Docker-optional assumptions and Production Ready labels do not override UD-TECH-01 or current evidence-gated status.

No runtime implementation, executable tests, SQL/RLS, role/grant, workflow engine or stable requirement ID/count changes. This slice changes Foundation/DD acceptance language and traceability only. Exact-HEAD verification is required before the final 17 S2.2 parent units are closed. DD-208 remains current; DD-209 remains held.


## 2026-09-27 S2.2 Product Specification continuation — slice 3 (U113–U131)

The final unreconciled Product Specification block is now directly reconciled.

### VC27-21 — P2: S2.2 final QA/NFR/lifecycle/product-goal block needed evidence/status and scope normalization

- **Machine Integration Roadmap** is Healthcare analyzer interoperability (ASTM/HL7, driver/mapping/result import/QC/connectivity) over Core Integration/device boundaries. “Roadmap” is target capability, not proof that every analyzer/driver is operational.
- **Reporting & BI** is a reusable Core composition capability; domain data/KPI meaning remains with the owning Industry.
- **DR / QA / CI-CD / Support** preserve enterprise requirements but are evidence-gated. RPO/RTO, SLA/LTS/EOL, zero-downtime and blue-green values/behaviors depend on governed policy/topology and are not certified merely by source wording.
- **Audit & Versioning / Data Lifecycle** do not authorize blanket mutation or deletion. Soft delete/restore applies only where the owning data class permits; legal hold/retention/data-class rules govern hard-delete/purge; immutable financial/audit records follow correction/reversal rules; subscription expiry never deletes tenant data.
- **Search & Productivity** bulk update/delete/assignment remains a server-authorized operation subject to Tenant + Industry Context, permission, workflow state, retention/legal hold and data-class rules. Bulk selection in UI is never authority.
- **Document Management** is Core; Patient documents remain Healthcare-owned and every document class remains under secure-upload, ACL, sensitivity and residency policy.
- **Localization** remains Country-Pack/tenant driven.
- **NFR 99.9%** is a target baseline, not achieved availability or a customer SLA claim absent contract/evidence.
- **Acceptance Criteria** is necessary source input but current completion/PRODUCTION READY certification remains MI §27/§33A evidence-driven. “AI providers operational” means required/provisioned provider paths for the released capability, not all 13 provider registry entries simultaneously enabled.
- **Product Goal** remains target state; Healthcare Patients/Doctors/medical workflows stay Healthcare-scoped and source REST-only wording is normalized to current Core API architecture.

After this slice the source-span ledger has **0 parent units with NOT_CERTIFIED semantic reconciliation** across S1 + S2.1…S2.9. This closes the parent-source semantic-reconciliation gate only; it does not by itself certify the full repository or authorize DD-209. Exact-HEAD Core/PostgreSQL/Database/Web verification and downstream canonical/state consistency checks are still required.

No RawSource, runtime implementation, executable test, SQL/RLS, role/grant or stable requirement ID/count changes.


## 2026-09-27 post-parent-source canonical closure correction

### VC27-22 — P1: parent-source closure still left stale F-01 actor/organization authority and F-04 jurisdiction/scope semantics

The S1+S2 parent ledger at `e1be03f490e153ca3def028e7085dbb6fafe7095` reaches 372/372 owner-reconciled units, but direct canonical-owner comparison still found two stale Foundation statements that would have made the ledger point at incorrect active semantics:

- F-01 §2 still called S2.2 §5's Healthcare-heavy list the full authoritative platform user-type list. The current nine-Industry platform instead uses Core actor classes plus each suite's own personas/roles; the source list remains provenance only.
- F-01 §4 still repeated separate Branch/Department identifiers rather than the typed OrgUnit + active Industry Context model already governed by A-02/DD-02 and the S2.4 reconciliation.
- F-04 §1 lacked an explicit jurisdiction boundary for India-default source values such as social/category classifications, GST/TDS and national identity/reference schemes. Those now resolve through Country/Localization Packs and lawful/configured purpose.
- F-04's source-derived standard-column list is now explicitly a baseline whose ownership columns follow actual PLATFORM/TENANT/INDUSTRY/OrgUnit scope, preventing fake Tenant/Industry ownership on global reference rows.

The audit finding sequence is also normalized to unique IDs: S1 residual VC27-18; S2.2 slices VC27-19, VC27-20 and VC27-21; this residual correction VC27-22.

No RawSource, runtime, migration/RLS, role/grant, executable test, workflow definition, requirement ID/count or product-surface change. Exact-HEAD verification remains required before the adversarial closure sweep. DD-208 remains current and DD-209 remains held.


## 2026-09-27 verified parent-source closure → current-state synchronization

Parent-source reconciliation `e1be03f490e153ca3def028e7085dbb6fafe7095` / tree `4eb24c5ddab00fcc17b251df27f9dd2586e19ed0` passed exact-HEAD **700/700 Core**, **505/505 PostgreSQL**, **48 migrations / 42 verification files**, Database/Web, with **372/372 source parent units owner-reconciled and 0 NOT_CERTIFIED**. Residual canonical-owner correction `59db060476157d86df9fd0ed71b5ba46927617be` / tree `3be8e6d229afaa6cb34de0d39ed6d7e17f11e842` passed the same gate.

### VC27-23 — P2: current State/Registers projection remained stale after verified parent-source closure

The source-parent/canonical closure was verified, but README/state/index/checkpoint/review projections still described the audit as being at the earlier S2.1/S2.2 partial stage and still instructed the next run to verify an already-verified DD-208 state-closure. That stale projection could cause either duplicate work or premature selection of the next AI-development seam without acknowledging the new downstream-audit gate.

The correction synchronizes README_FOUNDATION, PROJECT_STATE, PHASE_SUMMARY, HANDOFF_NOTE, D-CHECKPOINT, D-INDEX, REVIEW_REQUIRED and PROJECT_MANIFEST to the bounded current truth:

- DD-208 remains the latest governed development checkpoint.
- Parent-source semantic reconciliation is complete at 372/372 parents, 0 NOT_CERTIFIED.
- The parent closure and VC27-22 residual canonical correction are exact-HEAD CI verified.
- This is **not** a complete-project clean verdict. Downstream canonical/state/Development/Database/CI consistency and adversarial review remains IN PROGRESS.
- DD-209, effective Tenant+Industry AI configuration and AI execution remain locked until that downstream gate is clean.
- Production readiness remains NOT CLAIMED.
- RawSource remains immutable; `main` remains unmerged; PR #2 remains draft/review-only.

No RawSource, runtime, test, workflow, SQL/RLS, role/grant, requirement ID/count or governed development checkpoint changes.


## 2026-09-27 downstream Development/Database state consistency

Current state synchronization `0075a7c81de8b76de7c48c7bc4a79b8f9975196b` / tree `7f3b9ff390a8bd23cb843b48b645d713c85aab67` passed exact-HEAD **700/700 Core**, **505/505 PostgreSQL**, **48 migrations / 42 verification files**, Database/Web.

### VC27-24 — P2: current Development checkpoint and database matrix still projected stale pre-closure evidence

Direct comparison of the current Development truth files against the verified state found:
- `Development/CORE_SERVICE_CHECKPOINT.md`, `DEVELOPMENT_STATE.md` and `DB_CHECKPOINT.md` still instructed the next run to verify an already-verified DD-208 state closure and still described semantic coverage as being at the old partial source-audit stage.
- `Development/DB_IMPLEMENTATION_MATRIX.md` labelled the persistence checkpoint current but presented only the historical all-stages PostgreSQL evidence from 32 migrations / 26 verification files. That evidence remains valid for its historical checkpoint, but it is not the current 48/42 repository inventory.

The correction updates only current projection/evidence wording:
- DD-208 remains the latest governed development checkpoint.
- current repository exact-HEAD evidence is 700/700 Core, 505/505 PostgreSQL, 48 migrations / 42 verification files and Web PASS.
- the 32/26 evidence remains explicitly historical.
- downstream canonical/Development/Database/CI/adversarial audit remains IN PROGRESS; DD-209/effective AI execution remain locked.

Historical DD-208 verification records retain their original 504/504 PostgreSQL counts because those are correct for the original DD-208 promotion commit and must not be rewritten to later counts.

No runtime, test, workflow, SQL/RLS, role/grant, RawSource, stable requirement ID/count or governed checkpoint change.


## 2026-09-27 downstream bounded runtime / current-checkpoint adversarial verification

Current Development/Database state projection `d32f6f824fd5bade4dd247deec5881e73e4d8396` / tree `7c7332fd5b69dbdd0f98694fe44e142bb2a0a2ab` passed exact-head **700/700 Core**, **505/505 PostgreSQL**, **48 migrations / 42 verification files**, and Web. A direct downstream adversarial read then covered the latest governed DD-206/DD-207/DD-208 AI TenantAIConfig floors, the BLOCKED AIMemory principal-currentness seam, the physically mounted first-party Next.js/tRPC web plane, RequestContext/Commercial/Guard/identity/Tenant bootstrap, database role/scope adapters, and migration 0048 definition-scope hardening.

### Result — bounded CLEAN through the current checkpoint; no DD-209 authorization

**DD-206/207/208 TenantAIConfig floors.**
- capability evidence proves only duplicate-free exact capability ids + raw ACTIVE capability rows;
- provider evidence proves only exact provider ids + raw ACTIVE provider rows;
- model evidence proves only exact ACTIVE model ids whose provider id is also present in the same config allowedProviderIds;
- malformed/sparse/duplicate evidence remains fail-closed;
- none of these helpers proves latest/effective Tenant+Industry configuration, provider health/credentials/suitability, routing, entitlement, or AI execution.

**AIMemory blocked provenance seam.** The existing principal-currentness audit remains correctly BLOCKED because later pure re-evaluation lacks all historical request-local provenance. No current DD-208 runtime path converts that missing provenance into authority. The MemoryRecord reader remains exact/raw/read-only; assistant-binding and supersession-continuity helpers remain narrow relationship floors; cross-Tenant/cross-Industry/principal PostgreSQL tests remain fail-closed. No invented currentness rule is authorized.

**Mounted first-party web runtime.** The only physical App Router boundary is `/api/trpc`; the external REST Fetch adapter remains an unmounted floor. The web composition registers only three TENANT_CORE queries: `core.identity.roles.listEffective`, `core.tenancy.workspace.resolve`, and `core.commercial.entitlements.getCurrent`.
- exact server host binding supplies only a Tenant selector; generic Tenant/Industry authority headers are ignored;
- HTTPS/host/origin/method/body-size/content-type controls run before procedure execution; streamed body length is bounded even without Content-Length;
- Clerk Bearer authentication is verified and Core Identity/session truth is revalidated again during RequestContext resolution;
- Tenant lookup requires active current membership, multi-membership ambiguity requires an explicit trusted selector, Industry selection is same-Tenant/ACTIVE, OrgUnit path is server-derived and cyclic ancestry fails closed;
- OperationContract fixes scopeClass; transport/client input cannot widen it;
- Commercial snapshot/version is re-read and exact; generic protected operations remain denied for PENDING/SUSPENDED/EXPIRED/CANCELLED. No implicit suspended-mode bypass exists;
- Authorization guard remains server-side after rate admission and before any domain call; successful/denied access is mandatory-audited;
- `roles.listEffective` optional principal/membership reference is explicitly part of DD-06 and protected by `core.identity.role.view`; it is not a self-view-only contract and does not grant the target principal authority;
- workspace and Commercial projections omit internal Tenant/principal/membership/DataHome/license/snapshot identifiers beyond their explicitly safe projection fields.

**Database execution boundary.**
- application/request transactions force `SET LOCAL ROLE sbg_app_rw`, `row_security=on`, reject superuser/BYPASSRLS login/runtime roles, set exact scoped GUCs and destroy/reject dirty connections on failed cleanup;
- pre-context Tenant bootstrap, Identity, rate limiter, control-plane/authorization compiler and other privileged responsibilities use separate explicit roles where implemented;
- migration 0029 removed blanket future default DML grants and later migrations add explicit role boundaries/revokes;
- table-level application DML capability on some Tenant/application definition tables is not equivalent to Platform-definition mutation authority: migration 0032 restrictive RLS denies PLATFORM definition/child mutation by `sbg_app_rw` and verification executes the denial; current definition stores are raw read-only ports;
- migration 0048 makes definition scope/containment predicates total and fail-closed on null/malformed scope input, with no PUBLIC EXECUTE and executable verification.

**Boundary of this CLEAN result.** This is not a repository-wide PASS and does not imply production readiness. It verifies only the current checkpoint's AI allowlist relationship floors, currently mounted first-party web query surface, associated context/guard/database execution chain, and latest definition-scope hardening. Unmounted external REST route catalogs, machine credential policy, Commercial mutation path, integration/provider execution, webhook runtime, workflow/automation/notification execution, AI provider/tool execution, retention/ACL and other REVIEW_REQUIRED/source-owned seams remain locked and require their own downstream review. DD-208 remains current; DD-209 and effective AI execution remain unauthorized.


## 2026-09-27 downstream locked Integration/Webhook seam

### VC27-25 — P2: DD-163 Webhook allowlist validation accepted sparse arrays on the Tenant-Core necessary-floor path

Direct adversarial review of the intentionally unmounted DD-163 Webhook necessary-floor found a deterministic fail-closed defect in `hasValidIndustryAllowlist()`. JavaScript `Array.prototype.every` skips sparse holes; `new Set(sparseArray)` materializes a hole as `undefined` and can still have the same size as the sparse array length. Therefore a one-hole `allowedIndustryContextIds` array could be treated as structurally valid. On the TENANT_CORE branch the allowlist is not otherwise consumed, so an ACTIVE/verified same-Tenant event with a matching webhook-eligible catalog could incorrectly return `true` from the necessary-floor helper despite malformed allowlist evidence.

This does **not** expose a live webhook network path: DD-163 remains only a pure necessary floor and the Webhook dispatcher/filter/endpoint-SSRF/signing/retry/DLQ/network boundary is still BLOCKED by `WEBHOOK_DELIVERY_REMAINING_BOUNDARY_AUDIT.md`. The defect nevertheless violates the helper's fail-closed evidence contract.

Smallest forward-only correction:
- materialize the allowlist with `Array.from()` before UUID/duplicate validation so sparse holes become `undefined` and fail;
- add WH-FLOOR-008 regression coverage for sparse, explicit `undefined`, malformed UUID and duplicate allowlists on the TENANT_CORE path;
- add the matching DD-17 acceptance contract.

No route, dispatcher, provider call, secret/signing behavior, SQL/RLS, role/grant, product behavior or DD-209 feature slice is added. Exact-head Core/PostgreSQL/Database/Web verification is required. DD-208 remains the latest governed development checkpoint.


## 2026-09-27 downstream Integration necessary-floor adversarial continuation

Exact-head verification of the prior Webhook correction at `c0597607b06c27a76dabce7ae5fb3e43773bbd37` / tree `5e800eaf549225dd8f144e7d9fc043fe7f898929` passed **701/701 Core**, **505/505 PostgreSQL**, **48 migrations / 42 verification files**, and Web. The next direct read covered the adjacent DD-164 SyncCursor and DD-166 TenantIntegration Definition/Capability necessary floors.

### VC27-26 — P2: sparse Integration capability arrays bypassed total structural validation

Both helpers intended to reject malformed enabled-capability evidence, but used JavaScript `Array.prototype.every` directly on the input arrays. `every` skips sparse holes. Therefore:
- a SyncCursor parent Integration with `["orders.sync", <hole>]` could pass the enabled-capability structural predicate because the real code is present and the hole is skipped;
- a TenantIntegration enabled-capability array and the IntegrationDefinition `capabilityCodes[]` structural check could likewise treat sparse arrays as all-non-empty even though the evidence shape is malformed.

This is the same JavaScript sparse-array fail-open class corrected for DD-163 Webhook allowlists, but it occurs in independently governed DD-164/DD-166 floors. It does not create Integration execution, provider, secret, network, sync or webhook authority; however, it violates the existing necessary-floor requirement that capability entries be real non-empty strings and structural evidence fail closed.

Smallest forward-only correction:
- materialize capability arrays with `Array.from()` before non-empty-string validation so holes become `undefined` and fail;
- apply the dense check to Definition `capabilityCodes[]` without inventing a new duplicate policy;
- add `SYNC-BIND-008` and `INT-SET-CUR-008` regression/acceptance coverage.

No SQL/RLS/role/grant, route, provider selection, credential use, network execution, product feature or DD-209 slice is added. Exact-head Core/PostgreSQL/Database/Web verification is required. DD-208 remains current.


## 2026-09-27 downstream machine-credential necessary-floor continuation

The synchronized downstream state at `1735f76339750b10289595b9c5f7c27f0ad32acf` retains DD-208 and all machine-auth execution locks. Adversarial review of the DD-161 requested-scope helper then found another instance of JavaScript sparse-array hole skipping.

### VC27-27 — P2: sparse API Credential allowed-Industry evidence bypassed DD-161 structural validation

`allValidUuids(material.allowedIndustryContextIds)` called `Array.prototype.every` directly. Because `every` skips sparse holes:
- a TENANT_CORE credential with a sparse allowed-Industry array could satisfy the scope floor even though the malformed list is not otherwise consumed on that path;
- a Tenant-Core credential targeting TENANT_INDUSTRY could contain the requested valid Industry id plus a sparse hole and still satisfy exact membership.

DD-161 already owns validation of present credential scope ids and requires malformed requested-scope evidence to fail closed. This correction therefore adds no new authorization semantics.

Smallest forward-only correction:
- require `allowedIndustryContextIds` to be an actual array;
- materialize it with `Array.from()` before validating every entry as a UUID so holes become `undefined` and fail;
- add `APICRED-SCOPE-008` regression/acceptance for sparse and non-array evidence.

Presented-token grammar, verifier/hash execution, CIDR enforcement, permission-profile mapping, successful-use mutation/audit and final `VerifiedMachineEvidence` remain source-incomplete and **BLOCKED** exactly as before. No route, IdentityPort verifier, SQL/RLS, role/grant, product behavior or DD-209 slice is added. Exact-head Core/PostgreSQL/Database/Web verification is required.


## 2026-09-27 downstream machine SERVICE scope-evidence continuation

Exact-head verification of the prior API-Credential allowed-Industry correction at `45e1d5643d686a4dfdc62d852e241f77e886ba6f` / tree `38868a91e64e5d7e8c71cfb201b4752cce83ddb9` passed **704/704 Core**, **505/505 PostgreSQL**, **48 migrations / 42 verification files**, and Web.

### VC27-28 — P2: malformed SERVICE allowed-scope evidence could satisfy DD-161 requested-scope floor

DD-161 requires SERVICE machine principals to carry the requested scope in persisted `allowedScopeClasses`. Migration 0029 also constrains that array so NULL entries are forbidden and every entry is one of `PLATFORM_GLOBAL`, `TENANT_CORE`, `TENANT_INDUSTRY`, or `EXPLICIT_CROSS_CONTEXT`. The runtime helper, however, only checked `Array.isArray(...)` plus `.includes(requestedScope)`. Therefore malformed raw evidence such as `["TENANT_CORE","BOGUS"]` or a sparse array containing `TENANT_CORE` plus a hole could satisfy the necessary requested-scope floor.

This does not create a live machine-auth route: token grammar/hash verification, CIDR policy, permission-profile mapping, successful-use mutation/audit and final VerifiedMachineEvidence remain locked. It nevertheless violates parity with the migration-owned SERVICE scope evidence contract.

Smallest forward-only correction:
- materialize SERVICE `allowedScopeClasses` with `Array.from()`;
- require every materialized entry to be a known migration-owned scope code before testing requested-scope membership;
- add APICRED-SCOPE-009 regression/acceptance for sparse, explicit undefined and unknown scope entries;
- do **not** invent a duplicate-free invariant because migration 0029 does not own one.

No route, verifier/hash comparison, CIDR enforcement, permission-profile evaluation, usage mutation/audit, SQL/RLS/role/grant, product feature or DD-209 slice is added. Exact-head Core/PostgreSQL/Database/Web verification is required. DD-208 remains current.


## 2026-09-27 downstream API-Credential allowed-Industry uniqueness continuation

### VC27-29 — P2: duplicate allowed-Industry evidence could satisfy DD-161 despite migration 0030 uniqueness

Migration 0030 explicitly compares the count of `allowed_industry_context_ids` with the count of distinct ids and rejects duplicates; DD-03 likewise states that every allowed Industry Context is unique. DD-161's runtime helper materialized and UUID-validated the array but did not re-evaluate this uniqueness predicate. Consequently `[industryA, industryA]` could satisfy the requested-scope necessary floor, including the TENANT_CORE path where the list is structurally validated but otherwise not consumed.

Smallest forward-only correction:
- after dense UUID validation, require `new Set(dense).size === dense.length`;
- add APICRED-SCOPE-010 regression/acceptance for duplicate valid Industry ids on Tenant-Core and Tenant-Industry targets.

This mirrors migration-owned evidence only. It does not implement verifier/hash comparison, CIDR, permission-profile mapping, successful-use mutation/audit, final VerifiedMachineEvidence, routes, SQL/RLS/role/grant changes, product behavior or DD-209. Exact-head Core/PostgreSQL/Database/Web verification is required; DD-208 remains current.


## 2026-09-27 machine-scope bounded verification / state projection

The combined downstream machine-scope correction head `285c0d2a34334a6aad58ae20c4e8e42f042e5017` / tree `0f056e8c28aa3cc2f2c186afa63764e960522013` passed exact-head **706/706 Core**, **505/505 PostgreSQL**, **48 migrations / 42 verification files**, Database/Web. This verifies VC27-27 sparse allowed-Industry evidence, VC27-28 malformed SERVICE allowed-scope evidence and VC27-29 duplicate allowed-Industry evidence together on one exact executable tree.

The result remains bounded. No presented-token grammar/hash comparison, CIDR enforcement, permission-profile evaluation, successful-use mutation/audit, final `VerifiedMachineEvidence`, external REST catalog, webhook execution, Integration/provider/sync execution, Workflow/Automation/Notification execution, retention/ACL or AI provider/tool execution is authorized by these floors. DD-208 remains the latest governed development checkpoint; DD-209 remains held. Current State/Development projections are synchronized to this verified executable basis, while the containing documentation-only state-sync commit still requires its own exact-head CI.


## 2026-09-27 downstream external REST adapter continuation

### VC27-30 — P2: DD-080 REST authenticated-context port could substitute transport/network authority

DD-080 states that the adapter supplies the transport `Idempotency-Key` and any already-verified rate subject, while network/IP or webhook endpoint identity must originate only through the trusted network port. The REST Fetch handler passed those facts into `contexts.authenticate()`, then discarded the originals and used optional `idempotencyKey` / `verifiedRateSubject` fields returned by that context implementation when calling `OperationExecutor`. A buggy context port could therefore substitute transport retry identity or a network-derived endpoint rate subject.

The first-party tRPC path already preserves the intended trust direction by passing transport idempotency and trusted network subject directly into protected context/execution.

Smallest forward-only correction:
- `ProtectedRestContext` returns only the protected execution context;
- retain the validated transport idempotency key and trusted network facts in the Fetch handler;
- pass those original facts directly to `OperationExecutor`;
- add REST-009 proving context-returned substitute metadata is ignored.

No route catalog, machine/API-key syntax, OpenAPI publication, provider/network execution, SQL/RLS/role/grant or product operation is added. The REST adapter remains unmounted. DD-208 remains current and DD-209 remains held.


## 2026-09-27 downstream REST route-contract continuation

### VC27-31 — P2: DD-080 accepted malformed REST success status until after domain execution

`RestRouteResolution.successStatus` is statically typed as `200 | 201`, but DD-080 is an injected server-owned runtime boundary and `normalizeRoute()` did not validate that field. A malformed resolver could return another truthy status such as 204. The handler would authenticate, parse input and execute the canonical domain operation before attempting to construct the response with that malformed route status. For a future command route this creates unnecessary post-side-effect response failure/retry ambiguity.

Smallest forward-only correction:
- validate optional route success status in `normalizeRoute()` and accept only 200 or 201;
- fail as `TRANSPORT_CONTEXT_INVALID` before authorization/body/input/executor;
- add REST-010 acceptance/regression.

No concrete REST route, API-key scheme, OpenAPI publication, operation, SQL/RLS/role/grant or product behavior is added. The external REST plane remains unmounted; DD-208 remains current and DD-209 remains held.


## 2026-09-27 downstream REST protected-context authority continuation

Exact-head verification of VC27-31 at `292ba8012ea489dc7fe1b2342478fc033e1e27e1` / tree `5120303f4d1beedb7ea90292f47f7afb98095a8c` passed **708/708 Core**, **505/505 PostgreSQL**, **48 migrations / 42 verification files**, and Web.

### VC27-32 — P2: DD-080 authenticated-context port could rewrite auth/selector/network authority

DD-080 gives distinct server-owned sources to Authorization-derived authentication, route-derived Tenant/Industry/OrgUnit selector facts and trusted network/IP identity. The REST handler nevertheless accepted an entire `executionContext` from `contexts.authenticate()` and previously checked only request/correlation ids. A buggy context implementation could therefore substitute the credential/authentication input, Tenant/Industry/OrgUnit selector or network identity/context before `OperationExecutor` performed authoritative DD-02 resolution.

The first-party tRPC implementation does not have this authority inversion: its protected context is constructed from the original authentication/selector/network facts after verification.

Smallest forward-only correction:
- exact-match returned protected-context authentication, route selectors, request/correlation ids and network facts against their authoritative inputs;
- fail `TRANSPORT_CONTEXT_INVALID` before body/input/executor on any drift;
- reconstruct/freeze the executor context from the original authoritative values rather than forwarding the context-port object;
- add REST-011 regression/acceptance and synchronize DD-080 acceptance range.

No live REST endpoint, route catalog, API-key syntax, OpenAPI publication, SQL/RLS/role/grant, provider/network execution or product operation is added. REST remains unmounted; DD-208 remains current and DD-209 remains held.


## 2026-09-27 downstream Webhook scope-enum continuation

Exact-head verification of VC27-32 at `faad03ed6206a27f3244da9046460d2dc26caa87` / tree `a0f4dd963d8a4f1c657c922c5999c01f9127fa47` passed **709/709 Core**, **505/505 PostgreSQL**, **48 migrations / 42 verification files**, and Web.

### VC27-33 — P2: DD-163 malformed webhook scope could fall through as Tenant-Industry

DD-163 is intentionally limited to ordinary single-context webhook evidence and therefore owns only `TENANT_CORE` and `TENANT_INDUSTRY`. The runtime helper explicitly rejected `PLATFORM_GLOBAL` and `EXPLICIT_CROSS_CONTEXT`, special-cased `TENANT_CORE`, then treated every remaining value as the Industry branch. In JavaScript runtime evidence, a malformed event/catalog pair such as `scopeClass="UNKNOWN_SCOPE"` plus a valid allowlisted Industry id could therefore return true even though the scope is not part of the canonical EventScopeClass vocabulary.

This does not expose a live dispatcher or network path, but it violates the helper's stated fail-closed ordinary-scope contract and could incorrectly bless malformed persisted/injected evidence as satisfying a delivery necessary floor.

Smallest forward-only correction:
- admit only exact `TENANT_CORE` or `TENANT_INDUSTRY` before catalog/Industry evaluation;
- unknown, empty, undefined/null and case-variant scope values fail closed;
- add `WH-FLOOR-009` regression/acceptance.

Endpoint/filter interpretation, permission profile, secret/signing, SSRF/DNS/redirect control, dispatcher claim/lease/readiness, retry/DLQ/replay, EXPLICIT_CROSS_CONTEXT composition and network delivery remain **BLOCKED**. No route, network call, SQL/RLS/role/grant, product feature or DD-209 slice is added. Exact-head Core/PostgreSQL/Database/Web verification is required; DD-208 remains current.


## 2026-09-27 downstream Document ACL subject-context continuation

Exact-head verification of VC27-33 at `8138637f101e7966d34da93ff6b41f46ba998da2` / tree `c7c3dbc130b271dbe4d0483f9094b52d3c080c57` passed **710/710 Core**, **505/505 PostgreSQL**, **48 migrations / 42 verification files**, and Web.

### VC27-34 — P2: DD-085 sparse role/OrgUnit identity arrays bypassed total RequestContext validation

DD-085 deliberately matches ACL ROLE and ORG_UNIT subjects only against server-resolved `RequestContext.roleIds` and `orgUnitPath`, and its acceptance requires malformed context to fail closed. The matcher validated both arrays with JavaScript `Array.prototype.every` directly. Because `every` skips sparse holes, malformed evidence such as `[authorizedRoleId, <hole>]` or `[ancestorOrgUnitId, <hole>]` could pass the structural check; the later `.includes(...)` subject match could then return matching ACL evidence from the valid element.

The matcher still does not make the final authorization decision, but returning matching subject evidence from a malformed server identity context violates DD-085's trust boundary and can become unsafe when later ACL reduction is introduced.

Smallest forward-only correction:
- require real arrays and materialize `roleIds` / `orgUnitPath` with `Array.from()` before validating every position as a UUID;
- sparse holes become `undefined` and fail as `ACL_MATCH_CONTEXT_INVALID`;
- add `DOC-ACL-MATCH-007` regression/acceptance for a valid matching subject plus a sparse hole.

ACL `effect`, `validUntil`, operation→ACL permission mapping, source-resource inheritance/fallback and final ALLOW/DENY authorization remain deliberately **UNINTERPRETED/BLOCKED**. No route, signer, storage access, SQL/RLS/role/grant, product behavior or DD-209 slice is added. Exact-head Core/PostgreSQL/Database/Web verification is required; DD-208 remains current.


## 2026-09-27 downstream Document ACL selected-OrgUnit continuation

Exact-head verification of VC27-34 at `091accfe60b88c2f65cae1d4968c935a179e3e4d` / tree `b9b1860fb5e94260671971ee22105615bed11535` passed **711/711 Core**, **505/505 PostgreSQL**, **48 migrations / 42 verification files**, and Web.

### VC27-35 — P2: DD-085 accepted inconsistent selected-OrgUnit ancestry evidence

DD-02 owns `orgUnitId` as the validated selected organization unit and `orgUnitPath` as its server-resolved root→leaf tenancy-tree ancestry. DD-057 further requires the ancestry to contain no repeated OrgUnit. DD-085 uses that path as ORG_UNIT ACL subject evidence, but its runtime matcher only UUID-validated the path entries. A malformed injected RequestContext could therefore carry a valid-looking path whose leaf did not equal `orgUnitId`, a non-empty path with no selected `orgUnitId`, or repeated ancestry UUIDs and still return matching ACL subject evidence.

Smallest forward-only correction:
- require a present `orgUnitId` to be a UUID and equal the final `orgUnitPath` entry;
- require a non-empty path to have a selected OrgUnit;
- require ancestry UUIDs to be duplicate-free, mirroring DD-057;
- add `DOC-ACL-MATCH-008` regression/acceptance.

This remains subject-match evidence only. ACL effect/expiry interpretation, operation→permission mapping, source-resource inheritance/fallback, final ALLOW/DENY authorization, signer/storage access and routes remain **BLOCKED**. No SQL/RLS/role/grant, product behavior or DD-209 slice is added. Exact-head Core/PostgreSQL/Database/Web verification is required.


## 2026-09-27 downstream Document physical-binding continuation

Exact-head verification of VC27-35 plus its corrected no-match fixture at `bc1e26c7421a47dea15033cb79dfad9b199bb14c` / tree `659dc13c431c012d0000d49ccaf08feb32740399` passed **712/712 Core**, **505/505 PostgreSQL**, **48 migrations / 42 verification files**, and Web.

### VC27-36 — P2: DD-086 did not re-evaluate current StorageObject size/checksum parity

DD-08 and migration 0031 require an ACTIVE DocumentMeta row's `size_bytes` and
`checksum_sha256` to exactly match its linked StorageObject. Migration 0031 checks
that relationship on DocumentMeta INSERT/UPDATE, but the dedicated Document service
role is allowed to UPDATE `storage_object` rows independently. DD-086's current
binding query rechecked exact linkage, Data Home, Document ACTIVE/CLEAN and
StorageObject ACTIVE but did not compare current size/checksum values. A later
StorageObject mutation could therefore leave an ACTIVE DocumentMeta row pointing at
physical metadata whose current integrity facts no longer match while the binding
reader still returned the private locator.

Smallest forward-only correction:
- require `object.size_bytes=document.size_bytes`;
- require `object.checksum_sha256=document.checksum_sha256`;
- add `DOC-STO-PG-007` proving either drift yields no binding and restored exact
  parity becomes readable again.

This does not authorize storage access. Provider decryption/selection, signed URL or
token generation, TTL, ACL/permission/entitlement/step-up policy, retention,
residency exceptions and routes remain **BLOCKED**. No migration, role, grant, RLS
policy, product behavior or DD-209 slice is added. Exact-head
Core/PostgreSQL/Database/Web verification is required.

## 2026-09-27 downstream exact-Industry API-Credential allowlist continuation

### VC27-37 — P2: exact Industry credential could accept sibling allowed-Industry evidence at runtime

Migration 0030 requires an Industry-scoped API credential's `allowed_industry_context_ids`,
when non-empty, to contain only its exact persisted `industry_context_id`. DD-161 already
treats migration-owned scope evidence as a fail-closed necessary floor. The runtime helper
validated the allowed list as dense, UUID-shaped and duplicate-free, but for an exact
Tenant-Industry credential it accepted solely on `material.industryContextId === target.industryContextId`.
Malformed/injected raw evidence could therefore preserve the exact Industry id while also
carrying a sibling/different allowed Industry and still satisfy the requested-scope floor.

Smallest forward-only correction:
- when `material.industryContextId` is present, require every allowed-Industry entry to
  equal that exact persisted Industry Context;
- preserve migration behavior that the list may be empty or contain only the exact Industry;
- add `APICRED-SCOPE-011` regression/acceptance for sibling and mixed exact+sibling evidence.

This mirrors an existing migration-owned invariant only. It does not implement presented-token
grammar/hash verification, CIDR enforcement, permission-profile mapping, successful-use
mutation/audit, final `VerifiedMachineEvidence`, routes, SQL/RLS/role/grant changes, product
behavior or DD-209. Exact-head Core/PostgreSQL/Database/Web verification is required.

## 2026-09-27 downstream strict-instant fail-closed continuation

### VC27-38 — P2: permissive JavaScript timestamp parsing could normalize malformed currentness evidence

DD-148, DD-158, DD-163 and DD-165 explicitly require malformed persisted/server-owned
time evidence to fail closed. Their runtime helpers used `Date.parse()`, which accepts and
normalizes some impossible or ambiguous inputs (for example February 30, `24:00`, or
zone-less date-time strings) instead of rejecting them. Depending on the surrounding window
or expiry values, malformed injected evidence could therefore satisfy a necessary currentness
or verification floor.

Smallest forward-only correction:
- add one internal strict instant parser requiring explicit date, time and UTC designator or
  numeric offset;
- validate calendar/time components before applying the offset so normalized impossible
  values fail closed;
- preserve valid explicit-offset instants;
- use the parser only in DD-148 OperatorElevation window, DD-158 API Credential lifecycle,
  DD-163 Webhook verification evidence and DD-165 TenantIntegration CredentialReference
  expiry/currentness floors;
- extend the existing OPELEV-WIN-006, APICRED-LIFE-006, WH-FLOOR-002 and
  INT-CRED-CUR-006 acceptance coverage.

This is timestamp-validation hardening only. It does not add authentication, permission-profile,
CIDR, provider, webhook execution, Integration execution, Workflow/Notification execution,
network, SQL/RLS/role/grant, product behavior or DD-209 authority. Exact-head
Core/PostgreSQL/Database/Web verification is required.

## 2026-09-27 downstream generated-Document MediaRequest timestamp continuation

### VC27-39 — P2: DD-191 completed MediaRequest evidence still used permissive timestamp normalization

The VC27-38 strict-instant sweep corrected four currentness/verification helpers, but the
DD-191 generated Document → AIMediaRequest provenance helper independently used
`Date.parse()` for the migration-0031 requirement that the referenced MediaRequest carry
non-null valid persisted `completedAt`. DD-191's fixed acceptance already requires absent
or invalid completion evidence to fail closed.

A calendar-invalid or timezone-ambiguous completion string that JavaScript normalizes could
therefore be treated as valid relationship evidence in direct/injected runtime use.

Smallest forward-only correction:
- reuse the already-introduced strict instant parser for DD-191 `completedAt`;
- reject calendar-invalid and zone-less completion strings;
- preserve valid explicit UTC/numeric-offset completion instants;
- extend `DOCAI-MEDIA-CUR-003` without changing any other provenance predicate.

This is relationship-evidence validation only. It does not add Model/Provider currentness,
moderation/licensing semantics, Document ACL/storage/signed-URL authority, MediaRequest
principal currentness, generation/publication, AI routing/execution, SQL/RLS/role/grant,
product behavior or DD-209 authority. Exact-head Core/PostgreSQL/Database/Web verification
is required.

## 2026-09-27 downstream Document access context-shape continuation

### VC27-40 — P2: DD-082 Core candidate boundary did not reject TENANT_CORE carrying Industry Context before dependency use

DD-082 requires the pre-sign Document access candidate service itself to accept only a
resolved Tenant RequestContext and to validate Tenant/Industry ownership before loading
DocumentMeta. The concrete PostgreSQL metadata reader already rejects
`TENANT_CORE` contexts that carry an `industryContextId`, but the Core
`validateResolvedTenantContext()` check omitted that inverse scope-shape predicate.

A malformed/injected `TENANT_CORE + industryContextId` context could therefore reach an
alternate/injected metadata port instead of failing at the Core trust boundary. With the
current PostgreSQL port this normalized to a dependency failure, so no demonstrated physical
cross-Industry read occurred; however the Core prerequisite contract was weaker than its
source-owned resolved-context requirement and incorrectly relied on a lower-layer adapter.

Smallest forward-only correction:
- reject `TENANT_CORE` whenever `industryContextId` is present;
- preserve `TENANT_INDUSTRY` requirement for a valid Industry Context;
- extend DOC-PRE-005 to prove malformed scope shape returns non-disclosing
  `RESOURCE_NOT_FOUND` before metadata dependency use.

This does not add ACL evaluation, signer/TTL/provider behavior, storage authority, new
permission mapping, SQL/RLS/role/grant changes, product behavior or DD-209 authority.
Exact-head Core/PostgreSQL/Database/Web verification is required.

## 2026-09-27 downstream generic cross-context resolution continuation

### VC27-41 — P1: generic RequestContextService could construct EXPLICIT_CROSS_CONTEXT without the dedicated transfer contract

DD-02 defines `EXPLICIT_CROSS_CONTEXT` as a governed transfer path requiring an active
source context, explicit target context, transfer contract and dedicated permission/policy.
The generic `ContextResolutionInput` exposes only one `industrySelector` and contains no
source/target pair, transfer purpose/resource/projection evidence or dedicated policy result.

Despite that, the generic RequestContextService treated EXPLICIT_CROSS_CONTEXT as a
Tenant+Industry scope. A HUMAN session could therefore resolve one Industry and receive a
frozen RequestContext labeled EXPLICIT_CROSS_CONTEXT without the DD-02 transfer contract.
Valid `VerifiedMachineEvidence` already excludes EXPLICIT_CROSS_CONTEXT at the type
boundary, but forged/out-of-contract evidence carrying that string could also pass the
generic allowlist check.

Smallest forward-only correction:
- preserve the existing machine requested-scope allowlist check first;
- then unconditionally deny EXPLICIT_CROSS_CONTEXT in the generic resolver with
  non-disclosing `RESOURCE_SCOPE_DENY`;
- prove HUMAN and forged machine requests stop before Tenant lookup;
- leave future dedicated cross-context source/target resolution to its separately governed
  contract rather than inventing it here.

This does not implement a cross-context workflow, permission, projection, SQL bypass,
RLS change, audit writer, product behavior or DD-209 authority. Exact-head
Core/PostgreSQL/Database/Web verification is required.

## 2026-09-27 downstream generic WorkerContext cross-context continuation

### VC27-42 — P1: generic WorkerContext could label one Industry id as EXPLICIT_CROSS_CONTEXT without the DD-02 transfer contract

DD-02 §6 requires every legitimate cross-industry/core transfer to declare source context,
target context (or TENANT_CORE target), transfer purpose, resource identity, allowed field
projection, explicit permission, legal/consent basis where sensitive, audit correlation and
idempotency key. DD-02 §7 separately requires background workers to build WorkerContext
from persisted job/event scope rather than ambient process state.

The generic `WorkerContextInput` contains only one optional `industryContextId` and none
of the DD-02 source/target transfer evidence. Nevertheless `createWorkerContext()`
previously accepted `EXPLICIT_CROSS_CONTEXT` whenever that single Industry id was present.

Smallest forward-only correction:
- generic WorkerContext now rejects EXPLICIT_CROSS_CONTEXT with RESOURCE_SCOPE_DENY;
- TENANT_INDUSTRY retains its existing persisted Industry Context requirement;
- TCTX-007 now proves one Industry id cannot substitute for the dedicated transfer contract.

This does not implement a cross-context worker/transfer DTO, projection, permission, legal
basis, idempotency/audit writer, SQL bypass, RLS change, queue behavior, product behavior or
DD-209 authority. Exact-head Core/PostgreSQL/Database/Web verification is required.

## 2026-09-27 downstream event occurrence-time parity continuation

### VC27-43 — P2: DD-081 event occurredAt validation could normalize a calendar-invalid timestamp that migration 0030 rejects

DD-07 defines `occurredAt` as required `timestamptz` event-envelope metadata and DD-081
owns mandatory time-metadata validation before payload interpretation. Migration 0030 casts
the persisted envelope value to PostgreSQL `timestamptz` and fails on datetime overflow.

The Core validator used only `Date.parse()`. JavaScript can normalize an impossible
ISO-like calendar date such as `2026-02-30T15:00:00.000Z` into a different valid instant,
allowing malformed envelope evidence to pass the reusable pre-payload validator even though
the database integrity trigger rejects the same date.

Smallest forward-only correction:
- preserve the existing accepted date-time vocabulary;
- when an ISO-like YYYY-MM-DD prefix is present, validate the calendar date components before
  the existing `Date.parse()` check;
- extend EVT-CAT-002 to prove impossible date normalization fails before payload validation.

This does not choose a new timestamp serialization standard, schema engine, dispatcher,
retry/DLQ policy, webhook transport, event catalog entry, SQL/RLS/role/grant, product
behavior or DD-209 authority. Exact-head Core/PostgreSQL/Database/Web verification is
required.

## 2026-09-27 downstream WorkerContext Tenant-Core scope-shape continuation

### VC27-44 — P2: generic WorkerContext accepted TENANT_CORE with hidden Industry Context

DD-02 §2 fixes the single-context ownership shapes: TENANT_CORE requires Tenant ownership
with `industryContextId` null by design, while TENANT_INDUSTRY requires both Tenant and
Industry Context. DD-02 §7 requires worker execution to construct WorkerContext from
persisted job/event scope rather than ambient process state.

After VC27-42 blocked generic EXPLICIT_CROSS_CONTEXT, `createWorkerContext()` still
accepted a `TENANT_CORE` input carrying an `industryContextId`. That malformed scope
shape could therefore propagate into downstream worker code even though the canonical
Tenant-Core contract forbids hidden Industry ownership.

Smallest forward-only correction:
- reject TENANT_CORE whenever `industryContextId` is present;
- preserve the existing TENANT_INDUSTRY persisted-Industry requirement;
- preserve VC27-42 generic EXPLICIT_CROSS_CONTEXT denial;
- extend TCTX-007 to prove the inverse Tenant-Core shape fails closed.

This does not add queue/dead-letter mechanics, worker dispatch, Industry selection,
cross-context transfer authority, SQL/RLS/role/grant changes, product behavior or DD-209
authority. Exact-head Core/PostgreSQL/Database/Web verification is required.

## 2026-09-27 downstream WorkerContext runtime scope-enum continuation

### VC27-45 — P2: generic WorkerContext trusted the TypeScript scope union without runtime rejection of unsupported/unknown values

DD-02 defines the protected scope classes and the current `WorkerContextInput` deliberately
excludes PUBLIC and PLATFORM_GLOBAL. VC27-42 separately blocks generic
EXPLICIT_CROSS_CONTEXT. The constructor is also the runtime boundary that validates persisted
worker/job scope before freezing it.

Despite that, runtime JavaScript or untyped persistence evidence could supply PUBLIC,
PLATFORM_GLOBAL or an unknown string. Because `createWorkerContext()` only handled the
TENANT_INDUSTRY and EXPLICIT_CROSS_CONTEXT special cases, those unsupported values fell
through and produced a frozen WorkerContext.

Smallest forward-only correction:
- require runtime scope to be one of TENANT_CORE, TENANT_INDUSTRY or
  EXPLICIT_CROSS_CONTEXT before any context is emitted;
- preserve VC27-42's unconditional generic EXPLICIT_CROSS_CONTEXT denial, leaving only
  TENANT_CORE/TENANT_INDUSTRY usable by this generic constructor;
- preserve VC27-44's exact Tenant-Core no-Industry shape;
- extend TCTX-007 for PUBLIC, PLATFORM_GLOBAL and unknown runtime scope evidence.

This does not authorize platform/public workers, add queue/dead-letter mechanics, introduce
a cross-context worker DTO, change SQL/RLS/roles/grants, alter product behavior or authorize
DD-209. Exact-head Core/PostgreSQL/Database/Web verification is required.

## 2026-09-27 downstream Authorization ABAC timestamp grammar continuation

### VC27-46 — P1: ABAC v1 timestamp literal grammar could normalize an impossible calendar date

DEV-AUTHZ-POLICY-GRAMMAR-001 requires before/after literals to be valid UTC ISO-8601
timestamps ending in Z. The v1 parser enforced the shape regex and then used Date.parse().
JavaScript can normalize an impossible calendar date such as 2026-02-30T00:00:00Z into a
different valid instant.

Because persisted ACTIVE ABAC policy state is parsed through this grammar before the PDP
evaluates DENY/RESTRICT conditions, accepting a normalized invalid literal can turn malformed
authorization state into a boolean policy result instead of the required fail-closed invalid-
policy/dependency path. Depending on time/operator, that can skip a narrowing policy that
should never have been considered valid.

Smallest forward-only correction:
- keep the existing exact UTC-Z grammar and millisecond precision vocabulary;
- replace permissive Date.parse validity with the already-verified strict instant parser;
- add an impossible-calendar literal to the existing grammar rejection acceptance;
- leave PDP comparison, policy effect, attribute registry, persistence and compiler behavior unchanged.

This does not add policy operators, ABAC grants, restriction-reducer semantics, compiler
publication, SQL/RLS/role/grant changes, transport behavior or DD-209 authority. Exact-head
Core/PostgreSQL/Database/Web verification is required.

