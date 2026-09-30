import type { RequestContext } from "../context/contracts.js";
import type { OutboxEventReadPort } from "../integration/outbox-event.js";
import type { TenantIntegrationReadPort } from "../integration/tenant-integration.js";
import {
  buildNotificationDeliveryAttemptHistoryEvidence,
  type NotificationDeliveryAttemptHistoryEvidence,
} from "./delivery-attempt-history-evidence.js";
import type { NotificationDeliveryAttemptReadPort } from "./delivery-attempt.js";
import type { NotificationDeliveryReadPort } from "./delivery.js";
import {
  loadVisibleNotificationDeliveryKnownRelationshipEvidence,
} from "./delivery-visible-known-relationship-reader.js";
import type {
  NotificationDeliveryKnownRelationshipEvidence,
} from "./delivery-known-relationship-reader.js";
import type { NotificationTemplateReadPort } from "./template.js";

export interface NotificationDeliveryComposedEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly notificationDeliveryId: string;
}

export interface NotificationDeliveryComposedEvidence {
  readonly relationships: NotificationDeliveryKnownRelationshipEvidence;
  readonly attemptHistory: NotificationDeliveryAttemptHistoryEvidence;
}

/**
 * DD-308…DD-312: compose the already-governed visible known-relationship
 * evidence boundary with the raw attempt-history evidence boundary.
 *
 * The exact RequestContext/id are forwarded first into DD-307. Attempt evidence
 * is not requested unless DD-307 succeeds. DD-292 then validates and projects
 * only the exact visible Delivery plus exact supplied raw attempts.
 *
 * This boundary adds no recipient-currentness, Delivery lifecycle/finality,
 * retryability, rendering, provider/credential, dispatch, scheduling, send or
 * mutation authority.
 */
export async function loadNotificationDeliveryComposedEvidence(
  input: NotificationDeliveryComposedEvidenceReadInput,
  deliveryReader: NotificationDeliveryReadPort,
  integrationReader: TenantIntegrationReadPort,
  eventReader: OutboxEventReadPort,
  templateReader: NotificationTemplateReadPort,
  attemptReader: NotificationDeliveryAttemptReadPort,
): Promise<NotificationDeliveryComposedEvidence | null> {
  const requestContext = input.requestContext;
  const notificationDeliveryId = input.notificationDeliveryId;

  const relationships = await loadVisibleNotificationDeliveryKnownRelationshipEvidence(
    {requestContext, notificationDeliveryId},
    deliveryReader,
    integrationReader,
    eventReader,
    templateReader,
  );
  if (relationships === null) return null;

  const attempts = await attemptReader.loadForDelivery({
    requestContext,
    notificationDeliveryId,
  });

  const attemptHistory = buildNotificationDeliveryAttemptHistoryEvidence(
    relationships.delivery,
    attempts,
  );
  if (attemptHistory === null) return null;

  return Object.freeze({
    relationships,
    attemptHistory,
  });
}
