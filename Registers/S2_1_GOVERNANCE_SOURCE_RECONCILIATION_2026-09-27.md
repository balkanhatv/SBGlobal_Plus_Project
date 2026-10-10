# S2.1 GOVERNANCE SOURCE RECONCILIATION — 2026-09-27

**Scope:** RawSourceCorpus/Disorganized Data 2.md → S2.1 Master Development Instruction v3.0 (source units U001–U038, lines 16–606)

**Source blob:** 91c461de5e0d171f71d0bb89cd039953a1f1ecfd

**Purpose:** semantic source-to-owner reconciliation for governance units that are not proved by the 2,962 stable product-requirement row count. This report does not modify RawSource and does not certify runtime or project completion.

## Authority applied

Current authority is Primary Vision → current user instruction → Governing MASTER_INSTRUCTION v2.5 / MASTER_PROMPT v2.5 → immutable Raw Source Corpus. UD-TECH-01 is the active implementation technology decision. CR-04/LG-13 make phase governance dependency-driven while preserving the source 01–21B sequence as history/reference. The Application Surface Model preserves Platform Application separately from exactly two logical Tenant mobile apps.

## Fresh unit dispositions

| Units | Source topic | Fresh disposition | Active owner / decision |
|---|---|---|---|
| U001–U016 | purpose, priority, principles, implementation/gap/autonomous/silent rules, source of truth, continuity, continuation, backup/no-regression | ACTIVE governance semantics preserved; later v2.5 refinements govern where wording evolved | Governing MI Parts I–IV, especially §§1–6, 23–25, 31–33 |
| U017 | deployment simplicity | MIXED: portability/simplicity and complete deployment concerns survive; cPanel/shared-hosting/no-Docker/no-Vercel defaults are historical | MI §22/§27 · F-01 §8 · A-10 · UD-TECH-01 |
| U018–U022 | code quality, testing, docs, completion, blocking | ACTIVE governance semantics preserved; v2.5 evidence/status/approval gates refine them | Governing MI §§27, 31–33A |
| U023–U027 | technology umbrella, backend, frontend, database, admin panel | STACK-SPECIFIC source assumptions reconciled to active baseline; Tailwind remains compatible, while Laravel/PHP, Blade/Alpine, MySQL-primary and Filament are not current authorities | MI §22 · F-01 §8 · A-00/A-05/A-08 · UD-TECH-01 |
| U028 | authentication | MIXED: enterprise identity capabilities survive; Laravel-auth/direct-JWT implementation assumptions do not define the current first-party identity boundary | F-03 · A-03 · MI §13/§22 · UD-TECH-01 |
| U029 | deployment constraints | STACK-SPECIFIC source constraints historical | MI §22/§27 · A-10 · UD-TECH-01 |
| U030 | mobile stack | MIXED: Android/iOS, offline, API and push obligations survive; Flutter/direct-JWT/FCM implementation baseline superseded | F-06 §4 · A-08 §8 · F-03 · UD-TECH-01 |
| U031 | desktop stack | MIXED: installer/update/offline/secure-local-storage obligations survive; Windows-only/direct-JWT posture superseded | F-06 §5 · F-10 · A-08 §7 · UD-TECH-01 |
| U032 | reference architecture | ACTIVE reference-use governance: inspiration only; no copied code, license conflicts or dependency adoption merely because a reference uses it | Governing MI §22; VC27-02 |
| U033 | development phase roadmap 01–21B | PRESERVED SOURCE SEQUENCE, not active fixed phase authority | MI §26/§26A/§26B · CR-04 · LG-13 |
| U034–U037 | recovery-file specifications | ACTIVE checkpoint/recovery semantics preserved and refined by current checkpoint governance | MI §24–§25/§30 |
| U038 | final delivery package | MIXED: delivery obligations preserved; historical stack/app labels normalize to current technology and Application Surface Model; source label never proves Production Ready | MI §24/§27/§33 · F-06/A-08 · F-05/A-07 · UD-TECH-01 · LG-02 |

## Correction result

`Registers/TRACEABILITY_MATRIX_UNIT.md` now records the mixed dispositions instead of treating source implementation choices as blanket-active or blanket-obsolete. `Registers/SOURCE_SPAN_COVERAGE_2026-09-27.json` marks all 38 S2.1 parent units as **OWNER_RECONCILED_2026-09-27**, with explicit mixed/superseded notes where necessary.

This is **unit-level source-owner reconciliation only**. It does not certify child-level completeness for other source families, runtime behavior, security validation, production readiness or the complete-project audit. DD-208 remains the latest governed development checkpoint; DD-209 remains held.
