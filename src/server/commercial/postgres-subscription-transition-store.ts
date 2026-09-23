import type { RequestContext } from "../../core/context/contracts.js";
import type {
  CommercialSubscriptionState,
  PersistedSubscriptionTransition,
  SubscriptionTransitionReadPort,
} from "../../core/commercial/subscription-transition.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface SubscriptionTransitionRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly subscription_id: string;
  readonly from_state: string | null;
  readonly to_state: string;
  readonly trigger_code: string;
  readonly actor_principal_id: string | null;
  readonly source_event_id: string | null;
  readonly reason_code: string | null;
  readonly occurred_at: string | Date;
  readonly correlation_id: string;
}

export class SubscriptionTransitionPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubscriptionTransitionPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATES = new Set<CommercialSubscriptionState>([
  "PENDING",
  "TRIAL",
  "ACTIVE",
  "GRACE",
  "SUSPENDED",
  "EXPIRED",
  "CANCELLED",
]);

function invalid(message: string): never {
  throw new SubscriptionTransitionPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted SubscriptionTransition ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted SubscriptionTransition ${field} is invalid.`);
  }
  return value;
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return textValue(value, field);
}

function state(value: string, field: string): CommercialSubscriptionState {
  if (!STATES.has(value as CommercialSubscriptionState)) {
    invalid(`Persisted SubscriptionTransition ${field} is invalid.`);
  }
  return value as CommercialSubscriptionState;
}

function optionalState(
  value: string | null | undefined,
  field: string,
): CommercialSubscriptionState | undefined {
  if (value === null || value === undefined) return undefined;
  return state(value, field);
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted SubscriptionTransition ${field} is invalid.`);
  }
  return date.toISOString();
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("SubscriptionTransition reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if (
      (context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE") ||
      context.tenantId ||
      context.industryContextId
    ) {
      invalid("SubscriptionTransition platform reads require trusted platform-global context.");
    }
    return;
  }

  if (
    (context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY") ||
    !context.tenantId ||
    !UUID_PATTERN.test(context.tenantId) ||
    (context.scopeClass === "TENANT_CORE" && context.industryContextId) ||
    (
      context.scopeClass === "TENANT_INDUSTRY" &&
      (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId))
    )
  ) {
    invalid("SubscriptionTransition reads require a resolved private context.");
  }
}

function parseRow(row: SubscriptionTransitionRow): PersistedSubscriptionTransition {
  const fromState = optionalState(row.from_state, "fromState");
  const actorPrincipalId = optionalUuid(row.actor_principal_id, "actorPrincipalId");
  const sourceEventId = optionalUuid(row.source_event_id, "sourceEventId");
  const reasonCode = optionalText(row.reason_code, "reasonCode");

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    subscriptionId: uuid(row.subscription_id, "Subscription id"),
    ...(fromState !== undefined ? {fromState} : {}),
    toState: state(row.to_state, "toState"),
    triggerCode: textValue(row.trigger_code, "triggerCode"),
    ...(actorPrincipalId ? {actorPrincipalId} : {}),
    ...(sourceEventId ? {sourceEventId} : {}),
    ...(reasonCode !== undefined ? {reasonCode} : {}),
    occurredAt: timestamp(row.occurred_at, "occurredAt"),
    correlationId: uuid(row.correlation_id, "correlationId"),
  });
}

async function readSubscriptionTransition(
  transaction: SqlTransaction,
  transitionId: string,
): Promise<PersistedSubscriptionTransition | null> {
  const result = await transaction.query<SubscriptionTransitionRow>(
    `SELECT id,
            tenant_id,
            subscription_id,
            from_state::text,
            to_state::text,
            trigger_code,
            actor_principal_id,
            source_event_id,
            reason_code,
            occurred_at,
            correlation_id
       FROM core_commercial.subscription_transition
      WHERE id=$1::uuid`,
    [transitionId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted SubscriptionTransition is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresSubscriptionTransitionStore
implements SubscriptionTransitionReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly transitionId: string;
  }): Promise<PersistedSubscriptionTransition | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.transitionId)) {
      invalid("SubscriptionTransition id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readSubscriptionTransition(transaction, input.transitionId),
    );
  }
}
