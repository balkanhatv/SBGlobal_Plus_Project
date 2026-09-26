# API Credential verifier remaining-boundary audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-API-CREDENTIAL-CORE-NECESSARY-FLOORS-001`  
**Verified synchronized basis:** `7dcf265eaf05e37126a0583cd8470e05998f5d36` / tree `6ca10f7fcc733b5474f40af625695f0c3bf9f0e0`

## Current verified machine-credential foundation

The repository now owns and has exact-head verified:

- DD-147 raw API Credential verification material lookup by exact persisted prefix;
- DD-158 current credential lifecycle;
- DD-159 machine-principal metadata;
- DD-160 current machine-principal admissibility;
- DD-161 requested-scope compatibility;
- DD-162 composition of lifecycle + principal-currentness + requested-scope.

## Remaining seams inspected

### Presented credential wire format / prefix extraction

DD-03 exposes `IdentityPort.verifyMachineCredential(credential: string)`.
DD-16 requires a persisted lookup prefix plus one-way verifier hash.
No canonical source currently fixes the presented token grammar, delimiter,
prefix length/encoding or extraction algorithm.

**Result:** not implementation-authorized.

### Verifier execution

DD-16 requires Argon2id / approved one-way verifier material, but current source
does not lock the verifier library, accepted encoded-hash grammar, algorithm
migration policy, parameter floor/ceiling, constant-time wrapper contract or
legacy verifier compatibility.

**Result:** not implementation-authorized.

### CIDR enforcement

`allowed_cidrs` is persisted and DD-16 requires optional CIDR restriction, but
the source does not yet own the trusted client-network evidence source
(reverse-proxy trust chain / direct peer address), normalization contract or
request-time integration point.

**Result:** do not implement request CIDR authorization yet.

### Permission-profile mapping

`permission_profile_id` is persisted, but no executable profile table/registry
and no machine-evidence permission-profile resolver are currently source-owned.

**Result:** not implementation-authorized.

### Successful-use mutation / audit

`last_used_at` and security audit requirements exist, but the atomic ordering
relative to secret verification, final evidence construction and authentication
success is not yet fixed. A usage write must not turn a failed verification into
a recorded success or create split-brain audit semantics.

**Result:** not implementation-authorized.

## Governance conclusion

DD-162 is the current maximum safe machine-credential runtime boundary.
No DD-163 machine-auth implementation is authorized from the inspected source.

The next Development slice should come from another source-complete prerequisite
unless/until the missing verifier/CIDR/profile/use-audit contracts are canonically
defined.

No production code, schema, migration, RLS, role/grant or checkpoint semantics
are changed by this audit.
