import type { RequestContext } from "../context/contracts.js";
import type { CommercialSubscriptionState } from "./current-state.js";

export interface PersistedSubscriptionTransition {
  readonly id: string;
  readonly tenantId: string;
  readonly subscriptionId: string;
  readonly fromState?: CommercialSubscriptionState;
  readonly toState: CommercialSubscriptionState;
  readonly triggerCode: string;
  readonly actorPrincipalId?: string;
  readonly sourceEventId?: string;
  readonly reasonCode?: string;
  readonly occurredAt: string;
  readonly correlationId: string;
}

export interface SubscriptionTransitionReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly transitionId: string;
  }): Promise<PersistedSubscriptionTransition | null>;
}
