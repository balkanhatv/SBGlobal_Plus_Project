# Concrete DD-076 evaluator prerequisite ownership audit

**Date:** 2026-09-21
**Verified correction baseline:** `380ae7b984624ae3842e0293b2c075ac250c08a6`
**Scope:** Actual DD-079 checkpoint continuation; source evidence before implementation.

## Findings

F-14 §6–7, A-04, DD-04 §3/§13, DD-061–079, the existing Commercial source
audits, migration 0045, and the current Commercial source/persistence adapters
were reconciled. The upstream owners define the required evidence and authority
boundaries but do not define a complete production evaluator. A versioned opaque
reference in a test fixture is not a production evidence producer.

| Dependency | Existing owner and executable work | Remaining exact definition / implementation |
|---|---|---|
| Typed target entitlement/limit preview | DD-067–075; schema, baseline, adjustment, usage, restriction and lifecycle components | Production composition must bind authoritative inputs; the pure intermediate previews are not themselves persisted source identity |
| Add-on eligibility | F-14; DD-070; active same-Tenant source reader and resolver port | Concrete eligibility document grammar and production rule evaluator |
| Compliance/security reduction | F-03/F-14; A-03/A-04; DD-072 | Actual policy fact source and resolver; do not reinterpret ABAC/session tables as commercial entitlement reduction |
| Usage periods/reservations | F-01 BR-SUB-04; DD-04 usage_meter; DD-073 | Authoritative period selector and reservation treatment; no arbitrary latest-period choice or used+reserved formula |
| Blocking impact codes | DD-04 §13.2; DD-076 validates sorted unique bounded codes | Domain-owned vocabulary and mapping from usage/removal impacts; error-code names are not automatically business impact codes |
| Impact and entitlement-diff evidence | F-14 §6; DD-04 §13.2; DD-076/079 transport opaque references | Immutable evidence schema, source binding and producer; a reference string alone is insufficient |
| Complete Commercial fingerprint | DD-04 §3 lists source dimensions; DD-066/077 enforce opaque equality | Canonical complete serialization, source-version identities and algorithm; DD-048 Authorization SHA-256 implementation is not a Commercial source contract |
| Route selection | F-14 §7; DD-04 route policy; DD-066/077 persisted route/version checks | market_scope_json interpretation and deterministic chooser for dual-route plans; even a single enabled route does not establish unresolved market applicability |
| Route/remediation producer runtime | DD-062/066/077/078 | Billing owns SELF_SERVE payment/proration evidence; Workflow owns SALES_ASSISTED approval; Commercial owns reassessment/remediation; table existence does not complete producers |
| Final publication | DD-065/078 and migration 0047 | Snapshot fact source IDs/effective windows/marker materialization plus complete upstream inputs; apply must retain current-state and serialized evidence checks |

## Decision and safe continuation

The concrete evaluator remains **blocked on the named dependent definitions**.
No fake evaluator, always-eligible resolver, default route, fabricated fingerprint,
impact code or payment/approval outcome is introduced. Historical Phase-3 COMPLETE
does not certify the later DD-076 production seams. This is a specific dependency
block, not a reopening of every completed design or a request for general approval.

One independent, fully governed continuation is available: make the already
required repository invariants executable in the existing Core CI suite. MI §25,
§26B and §33A require source preservation and evidence-backed checkpoints; DD-26
owns canonical identifiers; DD-19/21/22 own MS traceability and acceptance;
SOURCE_REGISTRY owns accepted RawSource hashes. The fresh audit demonstrated stale
database projection evidence, so regression checks have a concrete purpose.

`tests/core/repository-invariants.test.mjs` therefore checks immutable source hashes,
2,962 unchanged requirement IDs/text, all nine/41 canonical owner/acceptance/workflow
references, contiguous ADR/DD and migration sequences, current database inventory
counts, and local Markdown file references. Existing `test:core` discovers it without
a new workflow or dependency. These are structural guards; they do not certify the
semantic completeness of all requirements or replace PostgreSQL isolation tests.

## Next dependency boundary

Continue concrete evaluator work only after the missing policy/evidence contracts
have governing definitions, or select another independent source-complete item.
Any future choice must begin with current remote HEAD/checkpoint verification and
its own source audit. No new DD identifier is required for implementing these
existing verification requirements. RawSource and main remain untouched.
