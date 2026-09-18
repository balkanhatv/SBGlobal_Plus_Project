# PROJECT_STATE — SBGlobal Plus
**Updated:** 2026-09-18 · **Checkpoint:** `DEV-AUTHZ-SOURCE-COMPILER-001`

- Branch: `docs/architecture-branch-2`.
- Verified executable: `13346932455c79637e9644f970db47052c1fe6ad` / `32ee41587e5569e598bc600b8d2ce9f8db602252`.
- Core **117/117**, PostgreSQL **27/27**, Database **38 migrations / 32 verification files** PASS.
- Authorization source-to-snapshot RBAC calculation is implemented and tested.
- DENY wins; constrained permissions cannot become unconstrained allows.
- Tenant Core null Industry assignments never bleed into Tenant Industry snapshots.
- Compiler source truth is SELECT-only; compiled publication remains the only compiler mutation surface.
- Existing deliberate ABAC RESTRICT fail-closed DENY remains unchanged.
- RawSourceCorpus immutable; `main` unmerged; PR #2 draft/unmerged.

Next: **DD-06 transport-neutral idempotency runtime boundary**, then runtime rate-limit enforcement before tRPC/REST transport wiring.
