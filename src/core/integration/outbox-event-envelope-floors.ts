import type { PersistedEventCatalogEntry } from "./event-catalog.js";
import type { OutboxEventEvidence } from "./outbox-event.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EVENT_SCOPE_CLASSES = new Set([
  "PLATFORM_GLOBAL",
  "TENANT_CORE",
  "TENANT_INDUSTRY",
  "EXPLICIT_CROSS_CONTEXT",
] as const);

const SENSITIVITY_CLASSES = new Set([
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "SENSITIVE_PERSONAL",
  "REGULATED",
] as const);

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isAbsent(value: unknown): boolean {
  return value === undefined || value === null;
}

function isParseableTimestamp(value: unknown): boolean {
  return typeof value === "string"
    && value.trim().length > 0
    && Number.isFinite(Date.parse(value));
}

export function matchesPersistedOutboxEventCatalogTupleFloors(
  event: OutboxEventEvidence,
  catalog: PersistedEventCatalogEntry,
): boolean {
  return typeof event.eventType === "string"
    && event.eventType.trim().length > 0
    && Number.isSafeInteger(event.eventVersion)
    && event.eventVersion > 0
    && EVENT_SCOPE_CLASSES.has(event.scopeClass)
    && catalog.eventType === event.eventType
    && catalog.eventVersion === event.eventVersion
    && catalog.scopeClass === event.scopeClass;
}

export function matchesPersistedOutboxEventEnvelopeIdentityFloors(
  event: OutboxEventEvidence,
): boolean {
  const envelope = event?.envelopeJson;
  if (!isPlainObject(envelope)) return false;

  return isUuid(event.id)
    && isNonEmptyString(event.eventType)
    && Number.isSafeInteger(event.eventVersion)
    && event.eventVersion > 0
    && EVENT_SCOPE_CLASSES.has(event.scopeClass)
    && envelope.eventId === event.id
    && envelope.eventType === event.eventType
    && envelope.eventVersion === event.eventVersion
    && envelope.scopeClass === event.scopeClass
    && isUuid(envelope.correlationId)
    && isParseableTimestamp(envelope.occurredAt)
    && isNonEmptyString(envelope.actorType)
    && isNonEmptyString(envelope.sourceResourceType)
    && isNonEmptyString(envelope.sourceResourceId)
    && isNonEmptyString(envelope.payloadSchema)
    && Object.prototype.hasOwnProperty.call(envelope, "payload");
}

export function matchesPersistedOutboxEventEnvelopeCatalogMetadataFloors(
  event: OutboxEventEvidence,
  catalog: PersistedEventCatalogEntry,
): boolean {
  if (
    !matchesPersistedOutboxEventEnvelopeIdentityFloors(event)
    || !matchesPersistedOutboxEventCatalogTupleFloors(event, catalog)
  ) {
    return false;
  }

  const envelope = event.envelopeJson as Record<string, unknown>;
  return isNonEmptyString(catalog.producerModule)
    && SENSITIVITY_CLASSES.has(catalog.sensitivityClass)
    && envelope.sourceModule === catalog.producerModule
    && envelope.dataSensitivity === catalog.sensitivityClass;
}

export function matchesPersistedOutboxEventEnvelopeLocalScopeFloors(
  event: OutboxEventEvidence,
): boolean {
  if (!matchesPersistedOutboxEventEnvelopeIdentityFloors(event)) return false;

  const envelope = event.envelopeJson as Record<string, unknown>;
  const tenantId = envelope.tenantId;
  const industryContextId = envelope.industryContextId;
  const sourceIndustryContextId = envelope.sourceIndustryContextId;
  const targetIndustryContextId = envelope.targetIndustryContextId;

  if (event.scopeClass === "PLATFORM_GLOBAL") {
    return event.tenantId === undefined
      && event.industryContextId === undefined
      && isAbsent(tenantId)
      && isAbsent(industryContextId)
      && isAbsent(sourceIndustryContextId)
      && isAbsent(targetIndustryContextId);
  }

  if (!isUuid(event.tenantId) || tenantId !== event.tenantId) return false;

  if (event.scopeClass === "TENANT_CORE") {
    return event.industryContextId === undefined
      && isAbsent(industryContextId)
      && isAbsent(sourceIndustryContextId)
      && isAbsent(targetIndustryContextId);
  }

  if (event.scopeClass === "TENANT_INDUSTRY") {
    return isUuid(event.industryContextId)
      && industryContextId === event.industryContextId
      && isAbsent(sourceIndustryContextId)
      && isAbsent(targetIndustryContextId);
  }

  if (event.scopeClass === "EXPLICIT_CROSS_CONTEXT") {
    return event.industryContextId === undefined
      && isAbsent(industryContextId)
      && isUuid(sourceIndustryContextId)
      && isUuid(targetIndustryContextId)
      && sourceIndustryContextId !== targetIndustryContextId;
  }

  return false;
}

export function matchesPersistedOutboxEventEnvelopeEvidenceFloors(
  event: OutboxEventEvidence,
  catalog: PersistedEventCatalogEntry,
): boolean {
  return matchesPersistedOutboxEventCatalogTupleFloors(event, catalog)
    && matchesPersistedOutboxEventEnvelopeCatalogMetadataFloors(event, catalog)
    && matchesPersistedOutboxEventEnvelopeLocalScopeFloors(event);
}
