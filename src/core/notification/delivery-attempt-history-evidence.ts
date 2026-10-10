import type { PersistedNotificationDelivery } from "./delivery.js";
import type { NotificationDeliveryAttempt } from "./delivery-attempt.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function hasDeliveryIdentity(
  delivery: PersistedNotificationDelivery,
): boolean {
  return Boolean(
    delivery
    && typeof delivery === "object"
    && isUuid(delivery.id),
  );
}

function hasAttemptIdentity(
  attempt: NotificationDeliveryAttempt,
): boolean {
  return Boolean(
    attempt
    && typeof attempt === "object"
    && isUuid(attempt.id)
    && isUuid(attempt.deliveryId)
    && Number.isSafeInteger(attempt.attemptNo)
    && attempt.attemptNo > 0,
  );
}

/**
 * DD-288: exact supplied NotificationDeliveryAttempt -> NotificationDelivery
 * parent identity floor only.
 *
 * Provider/status/error/timestamp evidence and Delivery lifecycle semantics are
 * deliberately uninterpreted here.
 */
export function matchesNotificationDeliveryAttemptParentFloor(
  attempt: NotificationDeliveryAttempt,
  delivery: PersistedNotificationDelivery,
): boolean {
  return hasAttemptIdentity(attempt)
    && hasDeliveryIdentity(delivery)
    && attempt.deliveryId === delivery.id;
}

/**
 * DD-289: validate one supplied finite attempt-history evidence set against one
 * supplied Delivery. The source owns uniqueness and positivity, not gap-free
 * attempt numbering.
 */
export function matchesNotificationDeliveryAttemptHistoryEvidenceFloor(
  delivery: PersistedNotificationDelivery,
  attempts: readonly NotificationDeliveryAttempt[],
): boolean {
  if (!hasDeliveryIdentity(delivery) || !Array.isArray(attempts)) return false;

  const attemptIds = new Set<string>();
  const attemptNumbers = new Set<number>();

  for (const attempt of Array.from(attempts)) {
    if (attempt === undefined
      || !matchesNotificationDeliveryAttemptParentFloor(attempt, delivery)
      || attemptIds.has(attempt.id)
      || attemptNumbers.has(attempt.attemptNo)) {
      return false;
    }
    attemptIds.add(attempt.id);
    attemptNumbers.add(attempt.attemptNo);
  }

  return true;
}

function cloneAttempt(
  attempt: NotificationDeliveryAttempt,
): NotificationDeliveryAttempt {
  return Object.freeze({
    id: attempt.id,
    deliveryId: attempt.deliveryId,
    attemptNo: attempt.attemptNo,
    ...(attempt.providerMessageRef !== undefined
      ? {providerMessageRef: attempt.providerMessageRef}
      : {}),
    normalizedStatus: attempt.normalizedStatus,
    ...(attempt.normalizedErrorCode !== undefined
      ? {normalizedErrorCode: attempt.normalizedErrorCode}
      : {}),
    startedAt: attempt.startedAt,
    ...(attempt.completedAt !== undefined
      ? {completedAt: attempt.completedAt}
      : {}),
  });
}

/**
 * DD-290: immutable canonical raw history projection.
 *
 * null => malformed supplied evidence.
 * []   => valid empty history.
 *
 * Ordering by attemptNo then id is deterministic evidence serialization only.
 */
export function projectNotificationDeliveryAttemptHistory(
  delivery: PersistedNotificationDelivery,
  attempts: readonly NotificationDeliveryAttempt[],
): readonly NotificationDeliveryAttempt[] | null {
  if (!matchesNotificationDeliveryAttemptHistoryEvidenceFloor(delivery, attempts)) {
    return null;
  }

  const projected = attempts
    .map(cloneAttempt)
    .sort((left, right) =>
      left.attemptNo - right.attemptNo
      || left.id.localeCompare(right.id));

  return Object.freeze(projected);
}

/**
 * DD-291: return only the highest supplied persisted attempt-number evidence.
 * No normalized-status or retry/finality semantics are inferred.
 */
export function projectLatestNotificationDeliveryAttemptEvidence(
  delivery: PersistedNotificationDelivery,
  attempts: readonly NotificationDeliveryAttempt[],
): NotificationDeliveryAttempt | undefined | null {
  const history = projectNotificationDeliveryAttemptHistory(delivery, attempts);
  if (history === null) return null;
  return history.length === 0 ? undefined : history[history.length - 1];
}

export interface NotificationDeliveryAttemptHistoryEvidence {
  readonly delivery: PersistedNotificationDelivery;
  readonly history: readonly NotificationDeliveryAttempt[];
  readonly latest?: NotificationDeliveryAttempt;
}

/**
 * DD-292: combined raw Delivery attempt-history evidence envelope.
 *
 * The supplied Delivery identity is preserved exactly. The envelope adds no
 * retry, finality, backoff, provider-selection, credential, dispatch or
 * scheduling authority.
 */
export function buildNotificationDeliveryAttemptHistoryEvidence(
  delivery: PersistedNotificationDelivery,
  attempts: readonly NotificationDeliveryAttempt[],
): NotificationDeliveryAttemptHistoryEvidence | null {
  const history = projectNotificationDeliveryAttemptHistory(delivery, attempts);
  if (history === null) return null;

  const latest = history.length === 0 ? undefined : history[history.length - 1];

  return Object.freeze({
    delivery,
    history,
    ...(latest !== undefined ? {latest} : {}),
  });
}
