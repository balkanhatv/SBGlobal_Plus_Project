import type { PersistedEventCatalogEntry } from "./event-catalog.js";
import type { OutboxEventEvidence } from "./outbox-event.js";
import type { WebhookSubscription } from "./webhook-subscription.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isValidTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function hasValidIndustryAllowlist(values: readonly string[]): boolean {
  if (!Array.isArray(values)) return false;
  // Array.prototype.every skips sparse holes. Materialize first so every
  // position is validated and a hole becomes undefined -> invalid UUID.
  const dense = Array.from(values);
  return dense.every(isUuid) && new Set(dense).size === dense.length;
}

/**
 * DD-163 ordinary single-context Webhook delivery necessary floors.
 *
 * True is not delivery authorization. Event-filter interpretation, endpoint/SSRF
 * checks, signing secrets, permission profiles, dispatcher readiness/retry/DLQ,
 * cross-context endpoint validation and network delivery remain separately governed.
 */
export function matchesWebhookDeliveryNecessaryFloors(
  subscription: WebhookSubscription,
  event: OutboxEventEvidence,
  catalog: PersistedEventCatalogEntry,
): boolean {
  if (subscription.status !== "ACTIVE"
    || !isUuid(subscription.tenantId)
    || !isValidTimestamp(subscription.verifiedAt)
    || !hasValidIndustryAllowlist(subscription.allowedIndustryContextIds)) {
    return false;
  }

  if ((event.scopeClass !== "TENANT_CORE"
      && event.scopeClass !== "TENANT_INDUSTRY")
    || !isUuid(event.tenantId)
    || event.tenantId !== subscription.tenantId) {
    return false;
  }

  if (typeof event.eventType !== "string"
    || event.eventType.length === 0
    || !Number.isSafeInteger(event.eventVersion)
    || event.eventVersion <= 0
    || catalog.eventType !== event.eventType
    || catalog.eventVersion !== event.eventVersion
    || catalog.scopeClass !== event.scopeClass
    || catalog.webhookEligible !== true) {
    return false;
  }

  if (event.scopeClass === "TENANT_CORE") {
    return event.industryContextId === undefined;
  }

  return isUuid(event.industryContextId)
    && subscription.allowedIndustryContextIds.includes(event.industryContextId);
}
