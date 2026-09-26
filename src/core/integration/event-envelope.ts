import type { JsonValue } from "../api/schema-registry.js";

export type EventScopeClass =
  | "PLATFORM_GLOBAL"
  | "TENANT_CORE"
  | "TENANT_INDUSTRY"
  | "EXPLICIT_CROSS_CONTEXT";

export type EventSensitivityClass =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "SENSITIVE_PERSONAL"
  | "REGULATED";

export interface DomainEventEnvelope {
  readonly eventId: string;
  readonly eventType: string;
  readonly eventVersion: number;
  readonly scopeClass: EventScopeClass;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly sourceIndustryContextId?: string;
  readonly targetIndustryContextId?: string;
  readonly actorPrincipalId?: string;
  readonly actorType: string;
  readonly sourceModule: string;
  readonly sourceResourceType: string;
  readonly sourceResourceId: string;
  readonly aggregateVersion?: number | string;
  readonly correlationId: string;
  readonly causationId?: string;
  readonly occurredAt: string;
  readonly dataSensitivity: EventSensitivityClass;
  readonly residencyRegion?: string;
  readonly payloadSchema: string;
  readonly payload: JsonValue;
}

export interface EventCatalogContract {
  readonly eventType: string;
  readonly eventVersion: number;
  readonly producerModule: string;
  readonly scopeClass: EventScopeClass;
  readonly sensitivityClass: EventSensitivityClass;
  readonly payloadSchema: JsonValue;
}

export interface EventPersistenceBinding {
  readonly eventId: string;
  readonly eventType: string;
  readonly eventVersion: number;
  readonly scopeClass: EventScopeClass;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly tenantResidencyRegion?: string;
}

export interface EventCrossContextAuthorityPort {
  verifySameTenantEndpoints(input: {
    readonly tenantId: string;
    readonly sourceIndustryContextId: string;
    readonly targetIndustryContextId: string;
  }): Promise<boolean>;
}

export interface EventPayloadValidatorPort {
  validatePayload(input: {
    readonly eventType: string;
    readonly eventVersion: number;
    readonly payloadSchemaId: string;
    readonly catalogPayloadSchema: JsonValue;
    readonly payload: JsonValue;
  }): void | Promise<void>;
}

export class EventEnvelopeValidationError extends Error {
  constructor(messageSafe: string) {
    super(messageSafe);
    this.name = "EventEnvelopeValidationError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new EventEnvelopeValidationError(message);
}

function asObject(value: unknown): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    invalid("The event envelope must be a JSON object.");
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    invalid("The event envelope must be a plain JSON object.");
  }
  return value as Record<string, unknown>;
}

function asNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`The event envelope field ${field} is required.`);
  }
  return value;
}

function asUuid(value: unknown, field: string): string {
  const text = asNonEmptyString(value, field);
  if (!UUID_PATTERN.test(text)) {
    invalid(`The event envelope field ${field} must be a UUID.`);
  }
  return text;
}

function optionalUuid(
  source: Record<string, unknown>,
  field: string,
): string | undefined {
  const value = source[field];
  if (value === undefined || value === null) return undefined;
  return asUuid(value, field);
}

function optionalString(
  source: Record<string, unknown>,
  field: string,
): string | undefined {
  const value = source[field];
  if (value === undefined || value === null) return undefined;
  return asNonEmptyString(value, field);
}

function asPositiveVersion(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    invalid(`The event envelope field ${field} must be a positive integer.`);
  }
  return value as number;
}

function optionalAggregateVersion(
  source: Record<string, unknown>,
): number | string | undefined {
  const value = source.aggregateVersion;
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value)) return value;
  invalid("The event envelope aggregateVersion must be an integer.");
}

function asScopeClass(value: unknown): EventScopeClass {
  if (value === "PLATFORM_GLOBAL"
    || value === "TENANT_CORE"
    || value === "TENANT_INDUSTRY"
    || value === "EXPLICIT_CROSS_CONTEXT") {
    return value;
  }
  invalid("The event envelope scopeClass is invalid.");
}

function asSensitivity(value: unknown): EventSensitivityClass {
  if (value === "PUBLIC"
    || value === "INTERNAL"
    || value === "CONFIDENTIAL"
    || value === "SENSITIVE_PERSONAL"
    || value === "REGULATED") {
    return value;
  }
  invalid("The event envelope dataSensitivity is invalid.");
}

function asDateTime(value: unknown): string {
  const text = asNonEmptyString(value, "occurredAt");
  if (!Number.isFinite(Date.parse(text))) {
    invalid("The event envelope occurredAt is invalid.");
  }
  return text;
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`The event payload contains a non-finite number at ${path}.`);
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return Object.freeze(
      value.map((entry, index) => normalizeJson(entry, `${path}[${index}]`)),
    );
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      invalid(`The event payload contains a non-JSON value at ${path}.`);
    }
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const entry = (value as Record<string, unknown>)[key];
      if (entry === undefined) {
        invalid(`The event payload contains undefined at ${path}.${key}.`);
      }
      Object.defineProperty(normalized, key, {
        value: normalizeJson(entry, `${path}.${key}`),
        enumerable: true,
        configurable: false,
        writable: false,
      });
    }
    return Object.freeze(normalized);
  }
  invalid(`The event payload contains a non-JSON value at ${path}.`);
}

function assertNoContextSelectors(
  envelope: DomainEventEnvelope,
): void {
  if (envelope.industryContextId
    || envelope.sourceIndustryContextId
    || envelope.targetIndustryContextId) {
    invalid("The event envelope carries Industry Context outside its governed scope.");
  }
}

function validateCatalogContract(catalog: EventCatalogContract): void {
  if (!catalog.eventType
    || !Number.isSafeInteger(catalog.eventVersion)
    || catalog.eventVersion <= 0
    || !catalog.producerModule
    || !["PLATFORM_GLOBAL", "TENANT_CORE", "TENANT_INDUSTRY", "EXPLICIT_CROSS_CONTEXT"]
      .includes(catalog.scopeClass)
    || !["PUBLIC", "INTERNAL", "CONFIDENTIAL", "SENSITIVE_PERSONAL", "REGULATED"]
      .includes(catalog.sensitivityClass)) {
    invalid("The authoritative event catalog contract is invalid.");
  }
  normalizeJson(catalog.payloadSchema);
}

function validateBinding(binding: EventPersistenceBinding): void {
  if (!UUID_PATTERN.test(binding.eventId)
    || !binding.eventType
    || !Number.isSafeInteger(binding.eventVersion)
    || binding.eventVersion <= 0
    || !["PLATFORM_GLOBAL", "TENANT_CORE", "TENANT_INDUSTRY", "EXPLICIT_CROSS_CONTEXT"]
      .includes(binding.scopeClass)) {
    invalid("The authoritative event persistence binding is invalid.");
  }

  if (binding.scopeClass === "PLATFORM_GLOBAL") {
    if (binding.tenantId || binding.industryContextId || binding.tenantResidencyRegion) {
      invalid("Platform-global event persistence cannot carry Tenant ownership.");
    }
    return;
  }

  if (!binding.tenantId || !UUID_PATTERN.test(binding.tenantId)
    || !binding.tenantResidencyRegion) {
    invalid("Tenant event persistence requires authoritative Tenant residency.");
  }

  if (binding.scopeClass === "TENANT_INDUSTRY") {
    if (!binding.industryContextId || !UUID_PATTERN.test(binding.industryContextId)) {
      invalid("Tenant-industry event persistence requires Industry Context.");
    }
  } else if (binding.industryContextId) {
    invalid("This event persistence scope cannot carry Industry Context.");
  }
}

function parseEnvelope(raw: unknown): DomainEventEnvelope {
  const source = asObject(raw);
  if (!Object.prototype.hasOwnProperty.call(source, "payload")) {
    invalid("The event envelope payload is required.");
  }

  const eventId = asUuid(source.eventId, "eventId");
  const eventType = asNonEmptyString(source.eventType, "eventType");
  const eventVersion = asPositiveVersion(source.eventVersion, "eventVersion");
  const scopeClass = asScopeClass(source.scopeClass);
  const tenantId = optionalUuid(source, "tenantId");
  const industryContextId = optionalUuid(source, "industryContextId");
  const sourceIndustryContextId = optionalUuid(source, "sourceIndustryContextId");
  const targetIndustryContextId = optionalUuid(source, "targetIndustryContextId");
  const actorPrincipalId = optionalUuid(source, "actorPrincipalId");
  const actorType = asNonEmptyString(source.actorType, "actorType");
  const sourceModule = asNonEmptyString(source.sourceModule, "sourceModule");
  const sourceResourceType = asNonEmptyString(
    source.sourceResourceType,
    "sourceResourceType",
  );
  const sourceResourceId = asNonEmptyString(
    source.sourceResourceId,
    "sourceResourceId",
  );
  const aggregateVersion = optionalAggregateVersion(source);
  const correlationId = asUuid(source.correlationId, "correlationId");
  const causationId = optionalUuid(source, "causationId");
  const occurredAt = asDateTime(source.occurredAt);
  const dataSensitivity = asSensitivity(source.dataSensitivity);
  const residencyRegion = optionalString(source, "residencyRegion");
  const payloadSchema = asNonEmptyString(source.payloadSchema, "payloadSchema");
  const payload = normalizeJson(source.payload);

  return Object.freeze({
    eventId,
    eventType,
    eventVersion,
    scopeClass,
    ...(tenantId ? { tenantId } : {}),
    ...(industryContextId ? { industryContextId } : {}),
    ...(sourceIndustryContextId ? { sourceIndustryContextId } : {}),
    ...(targetIndustryContextId ? { targetIndustryContextId } : {}),
    ...(actorPrincipalId ? { actorPrincipalId } : {}),
    actorType,
    sourceModule,
    sourceResourceType,
    sourceResourceId,
    ...(aggregateVersion !== undefined ? { aggregateVersion } : {}),
    correlationId,
    ...(causationId ? { causationId } : {}),
    occurredAt,
    dataSensitivity,
    ...(residencyRegion ? { residencyRegion } : {}),
    payloadSchema,
    payload,
  });
}

export class EventEnvelopeCatalogValidator {
  constructor(
    private readonly payloadValidator: EventPayloadValidatorPort,
    private readonly crossContextAuthority?: EventCrossContextAuthorityPort,
  ) {}

  async validate(input: {
    readonly envelope: unknown;
    readonly catalog: EventCatalogContract;
    readonly binding: EventPersistenceBinding;
  }): Promise<DomainEventEnvelope> {
    validateCatalogContract(input.catalog);
    validateBinding(input.binding);
    const envelope = parseEnvelope(input.envelope);

    if (envelope.eventId !== input.binding.eventId
      || envelope.eventType !== input.binding.eventType
      || envelope.eventVersion !== input.binding.eventVersion
      || envelope.scopeClass !== input.binding.scopeClass) {
      invalid("The event envelope identity does not match its persistence binding.");
    }

    if (input.catalog.eventType !== input.binding.eventType
      || input.catalog.eventVersion !== input.binding.eventVersion
      || input.catalog.scopeClass !== input.binding.scopeClass
      || envelope.sourceModule !== input.catalog.producerModule
      || envelope.dataSensitivity !== input.catalog.sensitivityClass) {
      invalid("The event envelope does not match its authoritative catalog entry.");
    }

    if (envelope.scopeClass === "PLATFORM_GLOBAL") {
      if (envelope.tenantId || envelope.residencyRegion) {
        invalid("Platform-global event envelope cannot carry Tenant ownership.");
      }
      assertNoContextSelectors(envelope);
    } else {
      if (envelope.tenantId !== input.binding.tenantId
        || envelope.residencyRegion !== input.binding.tenantResidencyRegion) {
        invalid("The event envelope Tenant or residency does not match authoritative scope.");
      }

      if (envelope.scopeClass === "TENANT_CORE") {
        assertNoContextSelectors(envelope);
      } else if (envelope.scopeClass === "TENANT_INDUSTRY") {
        if (envelope.industryContextId !== input.binding.industryContextId
          || envelope.sourceIndustryContextId
          || envelope.targetIndustryContextId) {
          invalid("The event envelope Industry Context does not match authoritative scope.");
        }
      } else {
        if (envelope.industryContextId
          || !envelope.sourceIndustryContextId
          || !envelope.targetIndustryContextId
          || envelope.sourceIndustryContextId === envelope.targetIndustryContextId) {
          invalid("Cross-context event requires distinct source and target Industry Contexts.");
        }
        if (!this.crossContextAuthority) {
          invalid("Cross-context event validation requires authoritative context ownership.");
        }
        let allowed = false;
        try {
          allowed = await this.crossContextAuthority.verifySameTenantEndpoints({
            tenantId: envelope.tenantId!,
            sourceIndustryContextId: envelope.sourceIndustryContextId,
            targetIndustryContextId: envelope.targetIndustryContextId,
          });
        } catch {
          invalid("Cross-context event ownership could not be verified.");
        }
        if (!allowed) {
          invalid("Cross-context event endpoints are outside the authoritative Tenant.");
        }
      }
    }

    try {
      await this.payloadValidator.validatePayload({
        eventType: envelope.eventType,
        eventVersion: envelope.eventVersion,
        payloadSchemaId: envelope.payloadSchema,
        catalogPayloadSchema: normalizeJson(input.catalog.payloadSchema),
        payload: envelope.payload,
      });
    } catch (error) {
      if (error instanceof EventEnvelopeValidationError) throw error;
      invalid("The event payload does not satisfy its catalog schema.");
    }

    return envelope;
  }
}
