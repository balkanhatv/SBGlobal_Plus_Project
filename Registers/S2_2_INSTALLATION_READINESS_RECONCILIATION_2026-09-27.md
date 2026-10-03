# S2.2 §10A INSTALLATION-READINESS RECONCILIATION — 2026-09-27

**Source scope:** S2.2-U051/U052/U058/U062/U072 in `RawSourceCorpus/Disorganized Data 2.md`.

## Source obligation preserved

S2.2 §10A requires the delivered platform to include production-quality content, enterprise master data and realistic demonstration data, and states that after installation the enabled product surfaces/modules should be usable/populated without manual creation of essential baseline business data.

The stable 2,962 child-requirement inventory captures the nested content/master/demo/media lists, but this umbrella installation-readiness prose is a zero-row parent semantic. It therefore requires explicit source-owner reconciliation rather than being inferred from the child count.

## Canonical normalization

The canonical model now distinguishes two package classes:

1. **Required production baseline package** — versioned seed/reference rows, applicable master defaults, required configuration/templates and production content/assets needed by the enabled scope. It is materialized idempotently before installation/activation is READY/PUBLISHED. Failure leaves the scope non-ready and resumable.
2. **Governed demo package** — realistic synthetic operational examples, always Tenant/Industry-scoped and `DEMO`-flagged. It is optional/explicitly enabled, resettable/rebuildable, never real PII, and excluded from production KPIs by default. Production activation does not manufacture fake transactions merely to make dashboards non-empty.

This preserves §10A without violating environment/data-truth separation.

## Trace chain

`S2.2 §10A / U051` → `F-04 BR-DATA-03` → `A-05 §2A` + `A-09 §4` → `DD-17 DATA-BOOT-001…005` → `DD-19` traceability.

The parent semantics U052/U058/U062/U072 are also owner-reconciled to their production-content, demo, master-data and media owners. Child requirement rows and the stable 2,962 ID/count remain unchanged.

This correction is documentation/design/acceptance only. It does not claim runtime implementation or production readiness. DD-208 remains the latest governed development checkpoint.
