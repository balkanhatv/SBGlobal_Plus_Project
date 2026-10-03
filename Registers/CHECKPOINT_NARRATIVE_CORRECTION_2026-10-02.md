# Active checkpoint narrative correction — 2026-10-02

## Finding and smallest correction

At `606b76870a8318d5d9f962f30953b0f417eb137d`, all three exact-head workflows pass, but nine of twelve active checkpoint narratives disagree with their DD-362 headers. They still describe DD-338…DD-342, DD-348…DD-352 or DD-353…DD-357 as current. HANDOFF_NOTE additionally carries a second DD-225…DD-230 continuation instruction. REPO-007 only checks the first eight lines, so it cannot detect stale body scope, evidence, counts or next actions.

Synchronize the twelve active narrative blocks to the existing DD-358…DD-362 owner and verified promotion. Preserve historical sections and prior batch verification registers. Replace the duplicate handoff instruction with a reference to the single current next action. No feature decision, runtime, database, RLS, RawSource or UI change.

## Regression evidence

New REPO-011 fails on the unchanged baseline body with `README_FOUNDATION.md: stale active batch narrative`, observed DD-352 versus manifest DD-362. It validates the narrative decision, verified HEAD/tree, Core/PostgreSQL counts, source audit, feature evidence and next action separately from the existing header check. It also rejects a duplicate batch-specific handoff instruction. Expected Core delta: 1117 → 1118; PostgreSQL remains 529.

## Verified promotion used as evidence

HEAD `606b76870a8318d5d9f962f30953b0f417eb137d` / tree `88a2f9e3494a425b6d83ae5fb12005e04aa16280`:
- Core run 36908612232 / job 110525354152: 1117/1117 PASS, fail/skip 0.
- PostgreSQL same run / job 110525354464: 529/529 PASS, fail/skip 0; bootstrap PASS.
- Database run 36908612322 / job 110525355694: PASS; 48 migrations / 42 verification files.
- Web run 36908612248 / job 110525354332: PASS.

These green results cover the prior promotion, not this correction. This correction requires its own exact-head gates before forward development.

## Affected current narratives

- `README_FOUNDATION.md`
- `Development/DEVELOPMENT_STATE.md`
- `Development/CORE_SERVICE_CHECKPOINT.md`
- `Development/DB_CHECKPOINT.md`
- `State/PROJECT_STATE.md`
- `State/HANDOFF_NOTE.md`
- `State/PHASE_SUMMARY.md`
- `DetailedDesign/DD-PHASE_STATE.md`
- `DetailedDesign/DD-REVIEW_REQUIRED.md`
- `DetailedDesign/DD-CHECKPOINT.md`
- `DetailedDesign/DD-INDEX.md`
- `Registers/D-CHECKPOINT.md`

## Exact-head correction closure

Correction `5c84e635285fceea1b3e28030d872bb8b51546dd` / tree `38bb9a253940c4c5105286b29497f3dbb90d7d39`: Core run `36958140793` / job `110685638195` **1118/1118 PASS**; PostgreSQL job `110685638317` **529/529 PASS**, fail/skip 0 and bootstrap PASS. Database run `36958140792` / job `110685638025` PASS (**48/42**); Web run `36958140791` / job `110685638024` PASS. Both push and PR workflow sets passed. The targeted finding is closed; source-owned forward development may resume.

## Canonical index and duplicate-overlay follow-up

Before DD-363…DD-367 promotion, the canonical-index read exposed two additional nonstandard DD-218 summaries in D-INDEX and REVIEW_REQUIRED. Their body format escaped the first twelve-file narrative inventory. The expanded REPO-011 reproduces this mismatch before correction and now includes all fourteen active summaries. Old separately dated “Current project overlay” notes are explicitly labeled historical, preserving their contents; current Updated dates are checked against the manifest. Existing dependency locks and historical evidence remain intact. This follow-up is included in the next canonical promotion and requires that commit's own full exact-head gate.
