import type { PersistedAIIndustryConfig } from "./industry-config.js";
import type {
  PersistedTenantCountryPackActivation,
  TenantCountryPackActivationStatus,
} from "../config/tenant-country-pack-activation.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIVATION_STATUSES = new Set<TenantCountryPackActivationStatus>([
  "PENDING",
  "ACTIVE",
  "DISABLED",
]);

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isDenseUuidSet(value: unknown): value is readonly string[] {
  return Array.isArray(value)
    && Array.from(value).every((entry) => isUuid(entry))
    && new Set(value).size === value.length;
}

function hasValidIndustryShape(config: PersistedAIIndustryConfig): boolean {
  return Boolean(
    config
    && typeof config === "object"
    && isUuid(config.id)
    && isUuid(config.tenantId)
    && isUuid(config.industryContextId)
    && isDenseUuidSet(config.countryPackRefs),
  );
}

function hasValidActivationShape(
  activation: PersistedTenantCountryPackActivation,
): boolean {
  return Boolean(
    activation
    && typeof activation === "object"
    && isUuid(activation.id)
    && isUuid(activation.tenantId)
    && isUuid(activation.countryPackId)
    && typeof activation.status === "string"
    && ACTIVATION_STATUSES.has(
      activation.status as TenantCountryPackActivationStatus,
    ),
  );
}

/**
 * Re-evaluates only migration-0031's IndustryAIConfig country-pack reference
 * requirement against an exact supplied evidence set of same-Tenant ACTIVE
 * TenantCountryPackActivation rows.
 *
 * A true result is not current/effective CountryPack selection, catalog
 * currentness, localization/default materialization, effective AI
 * configuration, provisioning, routing, or AI execution authority.
 */
export function matchesAIIndustryConfigCountryPackActivationFloors(
  industryConfig: PersistedAIIndustryConfig,
  activations: readonly PersistedTenantCountryPackActivation[],
): boolean {
  if (!hasValidIndustryShape(industryConfig) || !Array.isArray(activations)) {
    return false;
  }

  if (activations.length !== industryConfig.countryPackRefs.length) {
    return false;
  }

  const referencedPacks = new Set(industryConfig.countryPackRefs);
  const evidenceIds = new Set<string>();
  const evidencePackIds = new Set<string>();

  for (const activation of activations) {
    if (!hasValidActivationShape(activation)) return false;
    if (evidenceIds.has(activation.id)) return false;
    if (evidencePackIds.has(activation.countryPackId)) return false;
    if (activation.tenantId !== industryConfig.tenantId) return false;
    if (!referencedPacks.has(activation.countryPackId)) return false;
    if (activation.status !== "ACTIVE") return false;

    evidenceIds.add(activation.id);
    evidencePackIds.add(activation.countryPackId);
  }

  return evidencePackIds.size === referencedPacks.size
    && industryConfig.countryPackRefs.every((packId) => evidencePackIds.has(packId));
}
