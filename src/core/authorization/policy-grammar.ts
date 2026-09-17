export const PERMISSION_SET_SCHEMA_VERSION_V1 = 1 as const;
export const ABAC_EXPRESSION_SCHEMA_VERSION_V1 = 1 as const;

export const MAX_PERMISSION_ENTRIES_V1 = 4096;
export const MAX_ABAC_AST_DEPTH_V1 = 8;
export const MAX_ABAC_AST_NODES_V1 = 128;
export const MAX_ABAC_LOGICAL_ARGS_V1 = 16;
export const MAX_ABAC_SET_ITEMS_V1 = 64;

const PERMISSION_SEGMENT = "[a-z][a-z0-9_-]*";
const PERMISSION_CODE_PATTERN = new RegExp(
  `^${PERMISSION_SEGMENT}\\.${PERMISSION_SEGMENT}\\.${PERMISSION_SEGMENT}\\.${PERMISSION_SEGMENT}$`,
);
const PERMISSION_PREFIX_PATTERN = new RegExp(
  `^${PERMISSION_SEGMENT}(?:\\.${PERMISSION_SEGMENT}){0,2}\\.\\*$`,
);
const ISO_UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

export type CompiledPermissionEffectV1 = "ALLOW" | "DENY";

export interface CompiledPermissionV1 {
  readonly code: string;
  readonly effect: CompiledPermissionEffectV1;
}

export interface PermissionSetV1 {
  readonly permissions: readonly CompiledPermissionV1[];
}

export const ABAC_ATTRIBUTE_KINDS_V1 = Object.freeze({
  "subject.principalId": "STRING",
  "subject.type": "STRING",
  "subject.roles": "STRING_SET",
  "subject.orgUnits": "STRING_SET",
  "subject.clearance": "STRING",
  "subject.membershipStatus": "STRING",
  "resource.tenantId": "STRING",
  "resource.industryContextId": "STRING",
  "resource.owner": "STRING",
  "resource.orgUnitId": "STRING",
  "resource.state": "STRING",
  "resource.sensitivity": "STRING",
  "environment.time": "TIMESTAMP",
  "environment.channel": "STRING",
  "environment.deviceTrust": "STRING",
  "environment.region": "STRING",
  "environment.authStrength": "STRING",
  "environment.risk": "STRING",
  "commercial.subscriptionState": "STRING",
  "commercial.licenseSet": "STRING_SET",
  "commercial.entitlementFacts": "STRING_SET",
} as const);

export type AbacAttributePathV1 = keyof typeof ABAC_ATTRIBUTE_KINDS_V1;
export type AbacAttributeKindV1 = (typeof ABAC_ATTRIBUTE_KINDS_V1)[AbacAttributePathV1];

export type AbacExpressionV1 =
  | Readonly<{ op: "all" | "any"; args: readonly AbacExpressionV1[] }>
  | Readonly<{ op: "not"; arg: AbacExpressionV1 }>
  | Readonly<{ op: "eq" | "neq"; attribute: AbacAttributePathV1; value: string }>
  | Readonly<{ op: "in" | "notIn"; attribute: AbacAttributePathV1; values: readonly string[] }>
  | Readonly<{ op: "contains" | "notContains"; attribute: AbacAttributePathV1; value: string }>
  | Readonly<{ op: "exists"; attribute: AbacAttributePathV1 }>
  | Readonly<{ op: "before" | "after"; attribute: "environment.time"; value: string }>;

export class AuthorizationPolicyGrammarError extends Error {
  readonly code = "AUTHORIZATION_POLICY_GRAMMAR_INVALID";
  readonly path: string;

  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = "AuthorizationPolicyGrammarError";
    this.path = path;
  }
}

function fail(path: string, message: string): never {
  throw new AuthorizationPolicyGrammarError(path, message);
}

function asRecord(input: unknown, path: string): Record<string, unknown> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    fail(path, "expected an object");
  }
  return input as Record<string, unknown>;
}

function assertExactKeys(
  input: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(input)) {
    if (!allowedSet.has(key)) fail(`${path}.${key}`, "unknown field");
  }
  for (const key of allowed) {
    if (!Object.hasOwn(input, key)) fail(`${path}.${key}`, "missing required field");
  }
}

function asBoundedString(input: unknown, path: string, maxLength = 256): string {
  if (typeof input !== "string" || input.length === 0 || input.length > maxLength) {
    fail(path, `expected a non-empty string up to ${maxLength} characters`);
  }
  return input;
}

function parsePermissionCode(input: unknown, path: string): string {
  const code = asBoundedString(input, path, 160);
  if (!PERMISSION_CODE_PATTERN.test(code)) {
    fail(path, "expected <domain>.<module>.<capability>.<action> lowercase permission grammar");
  }
  return code;
}

function parseEffect(input: unknown, path: string): CompiledPermissionEffectV1 {
  if (input !== "ALLOW" && input !== "DENY") {
    fail(path, "expected ALLOW or DENY");
  }
  return input;
}

function parseAttribute(input: unknown, path: string): AbacAttributePathV1 {
  const attribute = asBoundedString(input, path, 96);
  if (!Object.hasOwn(ABAC_ATTRIBUTE_KINDS_V1, attribute)) {
    fail(path, "attribute is outside the ABAC v1 allowlist");
  }
  return attribute as AbacAttributePathV1;
}

function attributeKind(attribute: AbacAttributePathV1): AbacAttributeKindV1 {
  return ABAC_ATTRIBUTE_KINDS_V1[attribute];
}

function assertScalarAttribute(attribute: AbacAttributePathV1, path: string): void {
  if (attributeKind(attribute) === "STRING_SET") {
    fail(path, "operator requires a scalar attribute");
  }
}

function parseLiteralForAttribute(
  input: unknown,
  attribute: AbacAttributePathV1,
  path: string,
): string {
  const value = asBoundedString(input, path, 256);
  if (attributeKind(attribute) === "TIMESTAMP") {
    if (!ISO_UTC_TIMESTAMP_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
      fail(path, "timestamp literal must be a valid UTC ISO-8601 value ending in Z");
    }
  }
  return value;
}

interface AstState {
  nodes: number;
}

function parseExpressionNode(
  input: unknown,
  path: string,
  depth: number,
  state: AstState,
): AbacExpressionV1 {
  if (depth > MAX_ABAC_AST_DEPTH_V1) {
    fail(path, `AST depth exceeds ${MAX_ABAC_AST_DEPTH_V1}`);
  }
  state.nodes += 1;
  if (state.nodes > MAX_ABAC_AST_NODES_V1) {
    fail(path, `AST node count exceeds ${MAX_ABAC_AST_NODES_V1}`);
  }

  const node = asRecord(input, path);
  const op = asBoundedString(node.op, `${path}.op`, 32);

  if (op === "all" || op === "any") {
    assertExactKeys(node, ["op", "args"], path);
    if (!Array.isArray(node.args)
      || node.args.length === 0
      || node.args.length > MAX_ABAC_LOGICAL_ARGS_V1) {
      fail(`${path}.args`, `expected 1-${MAX_ABAC_LOGICAL_ARGS_V1} expressions`);
    }
    const args = node.args.map((child, index) =>
      parseExpressionNode(child, `${path}.args[${index}]`, depth + 1, state));
    return Object.freeze({ op, args: Object.freeze(args) });
  }

  if (op === "not") {
    assertExactKeys(node, ["op", "arg"], path);
    return Object.freeze({
      op,
      arg: parseExpressionNode(node.arg, `${path}.arg`, depth + 1, state),
    });
  }

  if (op === "exists") {
    assertExactKeys(node, ["op", "attribute"], path);
    return Object.freeze({ op, attribute: parseAttribute(node.attribute, `${path}.attribute`) });
  }

  if (op === "eq" || op === "neq") {
    assertExactKeys(node, ["op", "attribute", "value"], path);
    const attribute = parseAttribute(node.attribute, `${path}.attribute`);
    assertScalarAttribute(attribute, `${path}.attribute`);
    return Object.freeze({
      op,
      attribute,
      value: parseLiteralForAttribute(node.value, attribute, `${path}.value`),
    });
  }

  if (op === "in" || op === "notIn") {
    assertExactKeys(node, ["op", "attribute", "values"], path);
    const attribute = parseAttribute(node.attribute, `${path}.attribute`);
    assertScalarAttribute(attribute, `${path}.attribute`);
    if (!Array.isArray(node.values)
      || node.values.length === 0
      || node.values.length > MAX_ABAC_SET_ITEMS_V1) {
      fail(`${path}.values`, `expected 1-${MAX_ABAC_SET_ITEMS_V1} literal values`);
    }
    const values = node.values.map((value, index) =>
      parseLiteralForAttribute(value, attribute, `${path}.values[${index}]`));
    if (new Set(values).size !== values.length) {
      fail(`${path}.values`, "duplicate literals are not canonical");
    }
    return Object.freeze({ op, attribute, values: Object.freeze(values) });
  }

  if (op === "contains" || op === "notContains") {
    assertExactKeys(node, ["op", "attribute", "value"], path);
    const attribute = parseAttribute(node.attribute, `${path}.attribute`);
    if (attributeKind(attribute) !== "STRING_SET") {
      fail(`${path}.attribute`, "operator requires a string-set attribute");
    }
    return Object.freeze({
      op,
      attribute,
      value: asBoundedString(node.value, `${path}.value`, 256),
    });
  }

  if (op === "before" || op === "after") {
    assertExactKeys(node, ["op", "attribute", "value"], path);
    const attribute = parseAttribute(node.attribute, `${path}.attribute`);
    if (attribute !== "environment.time") {
      fail(`${path}.attribute`, "before/after are valid only for environment.time in v1");
    }
    return Object.freeze({
      op,
      attribute,
      value: parseLiteralForAttribute(node.value, attribute, `${path}.value`),
    });
  }

  fail(`${path}.op`, "unsupported operator");
}

export function parsePermissionSetV1(input: unknown): PermissionSetV1 {
  const root = asRecord(input, "$permissionSet");
  assertExactKeys(root, ["permissions"], "$permissionSet");
  if (!Array.isArray(root.permissions) || root.permissions.length > MAX_PERMISSION_ENTRIES_V1) {
    fail("$permissionSet.permissions", `expected an array with at most ${MAX_PERMISSION_ENTRIES_V1} entries`);
  }

  let previousCode: string | undefined;
  const permissions = root.permissions.map((item, index) => {
    const path = `$permissionSet.permissions[${index}]`;
    const entry = asRecord(item, path);
    assertExactKeys(entry, ["code", "effect"], path);
    const code = parsePermissionCode(entry.code, `${path}.code`);
    if (previousCode !== undefined && previousCode >= code) {
      fail(`${path}.code`, "permission entries must be unique and strictly sorted by code");
    }
    previousCode = code;
    return Object.freeze({
      code,
      effect: parseEffect(entry.effect, `${path}.effect`),
    });
  });

  return Object.freeze({ permissions: Object.freeze(permissions) });
}

export function parseAbacExpressionV1(input: unknown): AbacExpressionV1 {
  return parseExpressionNode(input, "$expression", 1, { nodes: 0 });
}

export function parsePermissionPatternV1(input: unknown): string {
  const pattern = asBoundedString(input, "$permissionPattern", 160);
  if (PERMISSION_CODE_PATTERN.test(pattern) || PERMISSION_PREFIX_PATTERN.test(pattern)) {
    return pattern;
  }
  fail(
    "$permissionPattern",
    "expected an exact permission code or a terminal prefix wildcard such as core.identity.*",
  );
}

export function canonicalPermissionSetJsonV1(input: unknown): string {
  return JSON.stringify(parsePermissionSetV1(input));
}

export function canonicalAbacExpressionJsonV1(input: unknown): string {
  return JSON.stringify(parseAbacExpressionV1(input));
}
