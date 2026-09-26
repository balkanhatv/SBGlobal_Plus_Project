import type { CredentialReferenceMetadata } from "./credential-reference-metadata.js";
import type { PersistedTenantIntegration } from "./tenant-integration.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function parseInstant(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Re-evaluates only the TenantIntegration -> CredentialReference relationship and
 * currentness predicates already owned by migration 0030.
 *
 * A true result is a necessary current-binding floor only. It is not provider,
 * secret, permission-profile, health, callback, sync or network authorization.
 */
export function matchesCurrentTenantIntegrationCredentialFloors(
  integration: PersistedTenantIntegration,
  credential: CredentialReferenceMetadata,
  evaluatedAt: string,
): boolean {
  const evaluatedAtMs = parseInstant(evaluatedAt);
  if (evaluatedAtMs === null) return false;

  if (
    !isUuid(integration.id)
    || !isUuid(integration.tenantId)
    || !isUuid(integration.credentialReferenceId)
    || !isUuid(credential.id)
    || !isUuid(credential.tenantId)
  ) {
    return false;
  }

  if (integration.scopeClass === "TENANT_CORE") {
    if (integration.industryContextId !== undefined) return false;
  } else if (integration.scopeClass === "TENANT_INDUSTRY") {
    if (!isUuid(integration.industryContextId)) return false;
  } else {
    return false;
  }

  if (
    credential.id !== integration.credentialReferenceId
    || credential.tenantId !== integration.tenantId
  ) {
    return false;
  }

  if (credential.industryContextId !== undefined) {
    if (
      !isUuid(credential.industryContextId)
      || credential.industryContextId !== integration.industryContextId
    ) {
      return false;
    }
  }

  if (credential.status !== "ACTIVE") return false;
  if (credential.expiresAt === undefined) return true;

  const expiresAtMs = parseInstant(credential.expiresAt);
  return expiresAtMs !== null && expiresAtMs > evaluatedAtMs;
}
