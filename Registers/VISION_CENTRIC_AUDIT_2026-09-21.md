# Vision-Centric Deep Audit — fresh remote baseline, 2026-09-21

**Repository:** `yadavjalsingh192/SBGlobal_Plus_Project`
**Branch:** `docs/architecture-branch-2`
**Baseline HEAD/tree:** `3dabe35c71e07ff0750095669f025fe9a413e48f` / `a3bc9ea322a8fa43aaa5e3dc31ee93ffb3e75938`
**Last independently verified checkpoint:** `DEV-COMMERCIAL-ASSESSMENT-PERSISTENCE-001` (DD-079).

## Remote evidence and method

The current branch, recent ten commits, recursive tree, Actions runs, check-runs,
main and PR #2 were read afresh. Shell Git transport timed out; all **399 blobs**
were fetched through the authorized GitHub connector instead. Every blob hash,
the complete tree and the reconstructed unsigned commit matched the remote Git
objects. No cached checkout or earlier PASS label supplied the baseline.

Baseline inventory: **156 Markdown, 82 source files, 59 test files, 47 contiguous
migrations (0001–0047), 41 SQL verification files**. Coverage for every baseline
file is recorded in `VISION_CENTRIC_FILE_COVERAGE_2026-09-21.md`.

| Exact baseline push CI | Run | Job | Independently read result |
|---|---:|---:|---|
| Core Service Verify / Core | 35580432341 | 106271805076 | 271 tests/pass; 0 fail/skip |
| Core Service Verify / PostgreSQL | 35580432341 | 106271804909 | 65 tests/pass; 0 fail/skip; full bootstrap |
| Database Verify | 35580432342 | 106271804958 | All 47 migrations and 41 verification files PASS |
| Web Boundary Verify | 35580432380 | 106271805132 | Next.js 15.5.25 build and lock/generated-state checks PASS |

Each downloaded log asserts this exact HEAD and tree. Matching PR checks also
passed. This establishes baseline execution, not absence of semantic defects.

## Findings and targeted corrections

| ID | Severity | Observed defect | Existing authority | Correction / regression |
|---|---|---|---|---|
| VC-01 | P1 | RequestContext accepted TENANT_CORE for machine evidence allowlisted only for TENANT_INDUSTRY; the reverse could also pass the scope floor | F-03; A-03; DD-03 API/service credentials; DD-043; verified machine evidence contract | Enforce requested scope before Tenant lookup; test API_CLIENT/SERVICE denials and allowed scopes in `request-context-boundaries.test.mjs` |
| VC-02 | P2 | Human Tenant context copied provider sessionVersion, ignoring the version returned by Core session validation; PLATFORM_GLOBAL already used the validated version | DD-02 sessionVersion; DD-03; DD-044 / ID-016 | Use validated Core version with the existing evidence fallback; regression expects current Core version |
| VC-03 | P2 | DD-075 accepted BOOLEAN string, negative INTEGER, NaN DECIMAL, object TEXT and non-string SET values | DD-071 typed values; DD-075 final preview boundary | Revalidate declared value type before composition, preserving valid values/order; `commercial-target-preview-values.test.mjs` |
| VC-04 | P2 | Database guide's current range ended at 0034; manifest paired 47-migration counts with a pre-0047 CI head | MI checkpoint/evidence truth; current tree and exact baseline logs | Mark old runs historical, point guide to current checkpoint, repair current DB CI identity |

VC-01–03 were reproduced locally against baseline source. The first-party web
composition explicitly rejects machine credentials; these reproductions establish
internal boundary defects, not a demonstrated public exploit. No new lifecycle,
commercial policy, database grant, RLS bypass or industry-specific exception is
introduced. No migration is needed for these corrections.

Local regression execution uses Node's TypeScript transformation because locked
npm artifacts are unavailable in this restricted environment. It is not a substitute
for TypeScript checking or the locked dependency suite. Promotion requires full
exact-commit GitHub CI after the correction commit.

## Vision and implemented scope

| Dimension | Current source / implementation evidence | Actual boundary |
|---|---|---|
| One reusable multi-tenant, multi-industry Core | Governing MI/MP; F-01; A-01/02/09; DD-01/02/13 | Preserved; no per-tenant or per-industry backend introduced |
| API-first | DD-06; OperationExecutor; GuardPipeline; first-party tRPC/Next.js composition | Three bounded shared queries wired; public changePlan, broad REST/OpenAPI and Industry operations unfinished |
| AI-ready / AI-powered direction | F-05; A-07/ADR-010; DD-09; migrations 0011–0014/0031 | AI persistence, ownership, provenance and RLS exist; live AI Gateway/provider/RAG/agent execution is not implemented or certified by these tests |
| Tenant + Industry Context | RequestContext, RequestScopedSql, pooled role adapters; migrations 0029–0041; isolation tests | Exact scope and DataHome checks; ordinary null-Industry scope is not sibling-Industry authority; VC-01 correction closes machine scope floor |
| Auth/authz | Clerk signature/authorized-party SDK boundary, live session lookup, Core identity/security records, RBAC + complementary ABAC, durable guard audit | No role/entitlement authority from Clerk custom claims; machine verifier/public machine transport unfinished |
| Commercial | DD-04; DD-060–079; no-bypass producer/compiler adapters; migrations 0042–0047 | Tested internal components; concrete evaluators, source selection and Billing/Workflow producers still block public changePlan |
| Security/RLS | FORCE RLS/ownership registries, explicit runtime roles, privileged helper search paths, transaction-local scope/cleanup, append-only evidence | Exact PostgreSQL suite passes current persistence scope; not penetration, production-upgrade, load or recovery certification |
| Technology | F-01 UD-TECH-01; A-01/A-08/A-10; package/lock and CI | Next.js 15/React 19/TS/Node 22+/PostgreSQL/tRPC/Clerk current subset; Payload/Expo/Tauri and other approved stack components are planned, not installed merely by mentioning them |
| Experiences | F-06; A-08; DD-10/11/12/26 | Two canonical Tenant mobile app classes; no finished mobile/desktop/product UI claim |

Active deployment direction is Vercel where suitable and Coolify + Dockerized VPS
for self-hosted/regional workloads. Historical PM2/Laravel/Flutter wording is not
authority to change the active stack. No deployment occurred.

## Equal Industry treatment and traceability

| Industry | Canonical MS | Registered Industry tables |
|---|---:|---:|
| Healthcare | 5 | 37 |
| Education | 5 | 20 |
| Retail | 5 | 20 |
| Hospitality | 4 | 16 |
| Manufacturing | 5 | 20 |
| Professional Services | 5 | 20 |
| Government | 4 | 16 |
| NGO / Temple / Trust | 4 | 16 |
| Security / Facility | 4 | 16 |
| Total | 41 | 181 |

All 41 canonical IDs occur in their nine DD owners, DD-19 traceability, DD-21
acceptance, DD-22 workflow matrices and SQL 0099. SQL 0099 verifies physical
ownership columns, forced RLS and canonical same-industry owner prefixes. Equal
first-class treatment does not require equal table counts. These checks do not
claim 41 finished application workflows.

All **2,962 source requirement IDs and requirement text** match between the source
requirement inventory and current owner-routing register. ADR-001–020 and
DD-001–079 are contiguous with no duplicate definitions. Relative Markdown file
links resolve; tests contain no `.skip`, `.only` or `.todo` markers. Privileged SQL
function declarations were swept for fixed search_path, and runtime privilege,
scope/reference and producer/serialization assertions were checked against the
existing database verification suite. A reference match or source-ID count is not
substantive certification of every deferred requirement.

## Continuation and verdict boundary

The audit covers the entire file inventory mechanically and substantively reviews
the current identity/API/authorization/Commercial/database boundaries and their
governing owners. It does **not** certify every historical document sentence,
every future Industry workflow or production readiness. The four demonstrated
defects must be corrected and their exact-commit checks verified before promotion.

After that gate, continue the checkpoint's concrete DD-076 evaluator source audit.
Implement only already governed components. Blocker vocabulary, immutable impact/
diff evidence, complete source fingerprint and route-selection semantics must be
traced to actual owners; unresolved policy is not filled in from assumptions.

RawSource blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b` and
`91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main observed at
`3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 is open draft and unmerged.
Final checkpoint owns post-correction/post-continuation CI and current remote
confirmation. Historical all-stages audit reports retain their original evaluated
heads and are not silently rewritten as current proof.

## Correction execution gate

Correction commit `380ae7b984624ae3842e0293b2c075ac250c08a6`, tree
`e2c20a33e70908064476e6ca848e7ab80c0abbb9`, passed all exact-head checks.
Core run 35583432591/job 106281224626: **277/277, zero fail/skip**.
PostgreSQL run 35583432591/job 106281224253: **65/65, zero fail/skip**,
plus the full **47/41** clean-database bootstrap. Database run 35583432581/job
106281224080 and Web run 35583432592/job 106281224214: **PASS**.
Downloaded logs confirm the exact commit/tree. RawSource hashes and 9/41/181
remain unchanged. VC-01–04 are corrected; this verdict is bounded to the
documented audit and implemented/tested scope.
