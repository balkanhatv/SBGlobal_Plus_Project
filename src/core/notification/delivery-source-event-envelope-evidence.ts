import type { JsonObject } from "../api/schema-registry.js";
import type {
  PersistedEventCatalogEntry,
} from "../integration/event-catalog.js";
import type {
  OutboxEventEvidence,
} from "../integration/outbox-event.js";
import {
  matchesOutboxEventCatalogTupleFloors,
  type NotificationDeliverySourceEventCatalogComposedEvidence,
  type NotificationDeliverySourceEventCatalogEvidence,
} from "./delivery-source-event-catalog-evidence-reader.js";

export interface NotificationDeliverySourceEventEnvelopeEvidence {
  readonly event: OutboxEventEvidence;
  readonly catalog: PersistedEventCatalogEntry;
  readonly envelopeJson: JsonObject;
}

export interface NotificationDeliverySourceEventEnvelopeComposedEvidence {
  readonly catalogEvidence: NotificationDeliverySourceEventCatalogComposedEvidence;
  readonly sourceEventEnvelope?: NotificationDeliverySourceEventEnvelopeEvidence;
}

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

/**
 * DD-323: re-evaluate only the directly persisted Outbox row identity and
 * mandatory local envelope evidence owned by migration 0030 / DD-081.
 *
 * Payload contents are deliberately uninterpreted.
 */
export function matchesOutboxEventEnvelopeIdentityFloors(
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

/**
 * DD-324: add only the EventCatalog producer/sensitivity relation and the exact
 * DD-321 tuple to the directly persisted envelope evidence.
 *
 * Catalog lifecycle, webhook eligibility, consumers and payload-schema
 * execution remain uninterpreted.
 */
export function matchesOutboxEventEnvelopeCatalogMetadataFloors(
  event: OutboxEventEvidence,
  catalog: PersistedEventCatalogEntry,
): boolean {
  if (!matchesOutboxEventEnvelopeIdentityFloors(event)
    || !matchesOutboxEventCatalogTupleFloors(event, catalog)) {
    return false;
  }

  const envelope = event.envelopeJson as Record<string, unknown>;
  return isNonEmptyString(catalog.producerModule)
    && SENSITIVITY_CLASSES.has(catalog.sensitivityClass)
    && envelope.sourceModule === catalog.producerModule
    && envelope.dataSensitivity === catalog.sensitivityClass;
}

/**
 * DD-325: re-evaluate only local scope shape available directly from the
 * Outbox row + envelope. This does not prove Tenant residency or same-Tenant
 * ownership of explicit cross-context endpoints.
 */
export function matchesOutboxEventEnvelopeLocalScopeFloors(
  event: OutboxEventEvidence,
): boolean {
  if (!matchesOutboxEventEnvelopeIdentityFloors(event)) return false;

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

/**
 * DD-326: compose only DD-321/DD-324/DD-325 for the exact DD-322 source event
 * + catalog pair.
 */
export function matchesNotificationDeliverySourceEventEnvelopeEvidenceFloors(
  sourceEventCatalog: NotificationDeliverySourceEventCatalogEvidence,
): boolean {
  return matchesOutboxEventCatalogTupleFloors(
    sourceEventCatalog.event,
    sourceEventCatalog.catalog,
  )
    && matchesOutboxEventEnvelopeCatalogMetadataFloors(
      sourceEventCatalog.event,
      sourceEventCatalog.catalog,
    )
    && matchesOutboxEventEnvelopeLocalScopeFloors(sourceEventCatalog.event);
}

/**
 * DD-327: enrich already-loaded DD-322 evidence with only immutable persisted
 * envelope evidence. No catalog/event reread or external validator is invoked.
 */
export function buildNotificationDeliverySourceEventEnvelopeEvidence(
  catalogEvidence: NotificationDeliverySourceEventCatalogComposedEvidence,
): NotificationDeliverySourceEventEnvelopeComposedEvidence | null {
  if (!catalogEvidence || typeof catalogEvidence !== "object") return null;

  const sourceEventCatalog = catalogEvidence.sourceEventCatalog;
  if (sourceEventCatalog === undefined) {
    return Object.freeze({catalogEvidence});
  }

  if (!matchesNotificationDeliverySourceEventEnvelopeEvidenceFloors(
    sourceEventCatalog,
  )) {
    return null;
  }

  const sourceEventEnvelope = Object.freeze({
    event: sourceEventCatalog.event,
    catalog: sourceEventCatalog.catalog,
    envelopeJson: sourceEventCatalog.event.envelopeJson,
  });

  return Object.freeze({
    catalogEvidence,
    sourceEventEnvelope,
  });
}
