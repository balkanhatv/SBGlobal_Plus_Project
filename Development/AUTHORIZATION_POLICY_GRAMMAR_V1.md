# DEV-AUTHZ-POLICY-GRAMMAR-001 — Permission Set v1 + ABAC Expression v1
**Date:** 2026-09-17  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTATION CONTRACT — GRAMMAR ONLY / PDP EVALUATOR NOT CLAIMED

## 1. Authority and bounded scope

This contract is the next governed continuation after `DEV-AUTHZ-PDP-001`. It refines F-03, A-03, DD-03, DD-16, DD-17, DD-041, DD-043 and the existing `core_authz` persistence without redesigning them.

The preceding audit proved that `permission_set_json` and `abac_policy.expression_ast_json` were versioned containers but did not yet have one deterministic executable v1 shape. Implementing a PDP before locking those shapes would require evaluator-specific invention. This slice therefore defines and validates the data grammar only.

This slice does **not** implement:
- Authorization snapshot/policy readers;
- RBAC/ABAC evaluation;
- Authorization compiler publication;
- Commercial integration;
- tRPC/REST transports;
- UI or production readiness.

## 2. Version ownership

The database already owns the schema-version columns and they remain authoritative:

- `compiled_permission_snapshot.permission_schema_version = 1` selects **Permission Set v1**;
- `compiled_platform_permission_snapshot.permission_schema_version = 1` selects the same **Permission Set v1**;
- `abac_policy.expression_version = 1` selects **ABAC Expression v1**.

The JSON payload does not repeat those version fields. Unknown future versions must fail closed until a new governed parser/evaluator exists.

## 3. Permission Set v1

Canonical JSON shape:

```json
{
  "permissions": [
    { "code": "core.identity.role.assign", "effect": "DENY" },
    { "code": "rtl.pos.refund.approve", "effect": "ALLOW" }
  ]
}
```

Rules:

1. The root has exactly one field: `permissions`.
2. Each entry has exactly `code` and `effect`; unknown fields are invalid.
3. Permission code is exactly four lowercase capability segments: `<domain>.<module>.<capability>.<action>`. Segment characters are lowercase letters, digits, `_` or `-`, and every segment starts with a letter.
4. `effect` is only `ALLOW` or `DENY`. ABAC `RESTRICT` is not an RBAC grant effect.
5. Entries are unique and strictly sorted by `code`. This makes the compiled set canonical and prevents role/source ordering from changing the serialized result.
6. Maximum entries: 4096 in v1. This is an implementation safety bound, not a licensing/plan limit.
7. Permission Set v1 intentionally contains **effective compiled RBAC facts only**. It does not execute or embed arbitrary `role_permission.constraints_json`.
8. A future Authorization compiler encountering a non-empty source constraint that cannot be converted to a separately governed supported restriction/ABAC contract must fail compilation; it must never copy arbitrary JSON into an executable policy surface.
9. Multiple source roles for one permission must be resolved by the future compiler before publication. A compiled v1 payload never contains duplicate permission codes. DENY precedence remains the governing security rule; the grammar itself does not perform compilation.

`canonicalPermissionSetJsonV1()` parses and emits one deterministic key/array ordering for v1.

## 4. ABAC Expression v1 attribute registry

Only these exact server-derived attribute paths exist in v1:

| Namespace | Attributes | Kind |
|---|---|---|
| `subject` | `principalId`, `type`, `clearance`, `membershipStatus` | STRING |
| `subject` | `roles`, `orgUnits` | STRING_SET |
| `resource` | `tenantId`, `industryContextId`, `owner`, `orgUnitId`, `state`, `sensitivity` | STRING |
| `environment` | `time` | TIMESTAMP |
| `environment` | `channel`, `deviceTrust`, `region`, `authStrength`, `risk` | STRING |
| `commercial` | `subscriptionState` | STRING |
| `commercial` | `licenseSet`, `entitlementFacts` | STRING_SET |

No dotted child traversal, dynamic property lookup, provider object, request body, raw token/claim, SQL row object, environment variable or client-computed authorization value is available to the AST.

The future evaluator may populate only server-authoritative facts already permitted by DD-03/DD-16. Missing optional attributes remain absent; `exists` is the explicit presence test.

## 5. ABAC Expression v1 nodes

Every node is a plain data object with exact keys. Unknown keys/operators are invalid.

### Logical

```json
{ "op": "all", "args": [EXPR, EXPR] }
{ "op": "any", "args": [EXPR, EXPR] }
{ "op": "not", "arg": EXPR }
```

`all`/`any` require 1–16 children.

### Scalar comparison

```json
{ "op": "eq", "attribute": "subject.type", "value": "HUMAN" }
{ "op": "neq", "attribute": "resource.state", "value": "CLOSED" }
{ "op": "in", "attribute": "environment.channel", "values": ["WEB", "MOBILE"] }
{ "op": "notIn", "attribute": "resource.sensitivity", "values": ["REGULATED"] }
```

These operators are valid only on scalar STRING/TIMESTAMP attributes. `values` contains 1–64 unique literals.

### Set membership

```json
{ "op": "contains", "attribute": "subject.roles", "value": "TENANT_ADMIN" }
{ "op": "notContains", "attribute": "commercial.licenseSet", "value": "RTL_POS" }
```

These operators are valid only on STRING_SET attributes.

### Presence

```json
{ "op": "exists", "attribute": "resource.owner" }
```

### Time

```json
{ "op": "before", "attribute": "environment.time", "value": "2026-12-31T23:59:59Z" }
{ "op": "after", "attribute": "environment.time", "value": "2026-01-01T00:00:00Z" }
```

`before`/`after` are valid only for `environment.time`. The literal must be a valid UTC ISO-8601 timestamp ending in `Z`.

## 6. Expression safety bounds

ABAC v1 is deliberately **not** a programming language.

- Maximum AST depth: 8.
- Maximum AST nodes: 128.
- Maximum logical children per node: 16.
- Maximum set literals per `in/notIn`: 64.
- String literals are bounded by the parser.
- No JavaScript/eval/function calls.
- No SQL or query fragments.
- No shell/process execution.
- No regex/glob expression engine inside the AST.
- No templates/interpolation.
- No network/filesystem/provider calls.
- No dynamic attribute names or object traversal.

These are v1 parser-safety limits. Changing them requires an explicit versioned contract change rather than tenant-provided executable content.

`canonicalAbacExpressionJsonV1()` parses and emits a deterministic v1 JSON shape.

## 7. Permission pattern v1

`abac_policy.applies_to_permission_pattern` accepts only:

1. one exact four-segment permission code, such as `rtl.pos.sale.view`; or
2. one terminal prefix wildcard, such as `rtl.*`, `core.identity.*`, or `rtl.pos.sale.*`.

`*` is permitted only as the final complete segment. Regex, wildcard-in-the-middle, double wildcard and arbitrary pattern languages are invalid.

A future reader/evaluator must use this same matcher contract; it must not delegate the pattern to SQL regex, JavaScript regex or shell/glob semantics.

## 8. Policy effect semantics preserved

`abac_policy.effect` remains database-owned and can be only `DENY` or `RESTRICT`.

The v1 AST is a boolean applicability condition. A true condition applies the row's effect. It can never create `ALLOW` where compiled RBAC denied. All applicable ACTIVE policies remain narrowing controls; `priority` may define stable evaluation/audit order but may not be used to bypass another applicable DENY.

This grammar does not invent a generic merge algebra for `AccessDecision.restrictionSet`. Restriction combination remains fail-closed unless a dedicated governed reducer exists, consistent with the current GuardPipeline collision protection.

## 9. Failure semantics

`parsePermissionSetV1`, `parseAbacExpressionV1` and `parsePermissionPatternV1` reject malformed/unknown/non-canonical input with `AUTHORIZATION_POLICY_GRAMMAR_INVALID`.

The future store/evaluator must convert unsupported schema/expression versions, invalid persisted JSON, invalid attributes/operators, unavailable current snapshots or policy-read failures into a fail-closed dependency/policy result. It must not silently skip malformed active authorization state.

## 10. Acceptance evidence for this slice

`tests/core/authorization-policy-grammar.test.mjs` proves at minimum:

1. canonical sorted Permission Set v1 parses and serializes deterministically;
2. malformed codes, duplicates, out-of-order entries, invalid effects and executable-shaped extra fields reject;
3. allowed logical/scalar/set/time/presence ABAC nodes parse;
4. `eval`, unknown attributes, extra SQL-like fields and type/operator mismatches reject;
5. excessive AST depth rejects;
6. exact permission patterns and terminal prefix wildcards accept while regex/mid-wildcards reject.

## 11. Next governed sequence after this slice passes exact-head CI

1. Implement Authorization read store for tenant + platform CURRENT compiled snapshots and applicable ACTIVE ABAC policies using these v1 parsers.
2. Implement fail-closed `AuthorizationDecisionPort` PDP/ABAC evaluation and DD-17 `AUTH-001`…`AUTH-008` tests.
3. Add the dedicated least-privilege Authorization compiler write boundary and compiler publication separately.
4. Continue Commercial current-state validation integration.
5. Continue DD-06 tRPC/REST transports.

No later item is claimed by this grammar checkpoint.
