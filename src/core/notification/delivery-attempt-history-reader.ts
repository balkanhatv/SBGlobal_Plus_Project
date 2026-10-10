import type { RequestContext } from "../context/contracts.js";
import type {
  NotificationDeliveryAttemptReadPort,
} from "./delivery-attempt.js";
import {
  buildNotificationDeliveryAttemptHistoryEvidence,
  type NotificationDeliveryAttemptHistoryEvidence,
} from "./delivery-attempt-history-evidence.js";
import type { NotificationDeliveryReadPort } from "./delivery.js";

export interface NotificationDeliveryAttemptHistoryReadInput {
  readonly requestContext: RequestContext;
  readonly notificationDeliveryId: string;
}

/**
 * DD-293…DD-297: parent-first RequestContext-scoped read composition.
 *
 * - the exact supplied RequestContext/id are captured once and forwarded
 *   unchanged to both existing read ports;
 * - attempt evidence is not requested when the parent Delivery is absent/hidden;
 * - reader dependency/persistence errors propagate unchanged;
 * - the already-governed DD-292 builder owns relationship validation,
 *   canonical history ordering, valid-empty and latest-evidence semantics.
 *
 * This boundary adds no retry/finality/backoff/provider/credential/dispatch/
 * worker/scheduling authority.
 */
export async function loadNotificationDeliveryAttemptHistoryEvidence(
  input: NotificationDeliveryAttemptHistoryReadInput,
  deliveryReader: NotificationDeliveryReadPort,
  attemptReader: NotificationDeliveryAttemptReadPort,
): Promise<NotificationDeliveryAttemptHistoryEvidence | null> {
  const requestContext = input.requestContext;
  const notificationDeliveryId = input.notificationDeliveryId;

  const delivery = await deliveryReader.loadForContext({
    requestContext,
    notificationDeliveryId,
  });
  if (delivery === null) return null;

  const attempts = await attemptReader.loadForDelivery({
    requestContext,
    notificationDeliveryId,
  });

  return buildNotificationDeliveryAttemptHistoryEvidence(delivery, attempts);
}
