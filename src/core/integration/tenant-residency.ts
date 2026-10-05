import type { RequestContext } from "../context/contracts.js";
import type { PersistedEventCatalogEntry } from "./event-catalog.js";
import {
  matchesPersistedOutboxEventEnvelopeEvidenceFloors,
} from "./outbox-event-envelope-floors.js";
import type { OutboxEventEvidence } from "./outbox-event.js";

export interface IntegrationTenantResidencyEvidence {
  readonly tenantId: string;
  readonly residencyRegionCode: string;
}

export interface IntegrationTenantResidencyReadPort {
  loadCurrentForContext(input: {
    readonly requestContext: RequestContext;
    readonly tenantId: string;
  }): Promise<IntegrationTenantResidencyEvidence | null>;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * DD-520 shared Integration/Event current-Tenant-residency floor.
 *
 * This reuses the persisted envelope/catalog evidence floor and proves only
 * equality with the currently authoritative Tenant residency evidence. It
 * does not reconstruct historical write-time residency or authorize delivery.
 */
export function matchesPersistedOutboxEventCurrentTenantResidencyFloors(
  event: OutboxEventEvidence,
  catalog: PersistedEventCatalogEntry,
  residency: IntegrationTenantResidencyEvidence,
): boolean {
  if (!matchesPersistedOutboxEventEnvelopeEvidenceFloors(event, catalog)
    || !residency
    || typeof residency !== "object") {
    return false;
  }

  if ((event.scopeClass !== "TENANT_CORE"
      && event.scopeClass !== "TENANT_INDUSTRY")
    || !isUuid(event.tenantId)
    || !isUuid(residency.tenantId)
    || !isNonEmptyString(residency.residencyRegionCode)
    || residency.tenantId !== event.tenantId) {
    return false;
  }

  const envelope = event.envelopeJson as Record<string, unknown>;
  return envelope.tenantId === event.tenantId
    && envelope.residencyRegion === residency.residencyRegionCode;
}
