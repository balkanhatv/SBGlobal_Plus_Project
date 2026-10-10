import type { RequestContext } from "../context/contracts.js";

export interface CommercialProvisioningVersionEvidence {
  readonly tenantId: string;
  readonly currentSubscriptionId?: string;
  readonly subscriptionVersion?: string;
  readonly entitlementSnapshotId?: string;
  readonly entitlementSnapshotVersion?: string;
}

export interface CommercialProvisioningVersionReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
  }): Promise<CommercialProvisioningVersionEvidence | null>;
}
