# PROJECT_STATE — SBGlobal Plus
**Updated:** 2026-09-21 · **Checkpoint:** `DEV-COMMERCIAL-ADJUSTMENT-PRECEDENCE-001`

- Branch: `docs/architecture-branch-2`.
- Verified feature executable: `1c8844ec982ef91cacc3545576d102fbac3fcaf9` / `0792a28622e000beba2e785ce1f0a3282b1fff96`.
- Core **207/207 PASS**; PostgreSQL **56/56 PASS**; full DB bootstrap **46 migrations / 40 verification files PASS**.
- Next.js 15.5.25 production build: **PASS**.
- Feature-tree inventory: **363 blobs / 74 source / 50 test files**.
- RawSourceCorpus accepted blobs unchanged; `main` remains `3911590ff2020993ce51b32d7b091efd6f5f466f`.
- **9 Industries / 41 canonical MS / 181 registered Industry tables** remain the verified scope.
- ADR-001…ADR-020 and DD-001…DD-071 are contiguous with no duplicate definitions.
- DD-071 implements deterministic adjustment precedence only; it does not complete the target preview.
- Failed `f52f0d1…` TypeScript attempt remains historical/non-promoted; corrected `1c8844ec982ef91cacc3545576d102fbac3fcaf9` is the verified feature basis.
- Concrete production eligibility, compliance/security restriction input, usage impact, lifecycle overlay, Billing/payment/proration and Workflow approval remain unfinished.
- Public `core.commercial.subscription.changePlan` remains intentionally unbound.
- PR #2 remains OPEN DRAFT / unmerged.

Next: **compliance/security restriction input contract**, then usage-meter impact and lifecycle overlay before final publication/apply.

Evidence: `Registers/DEVELOPMENT_DD071_VERIFICATION_2026-09-21.md`.
