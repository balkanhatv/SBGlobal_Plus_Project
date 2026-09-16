import type { SqlDatabase } from "../database/contracts.js";
import type {
  DeviceSecurityRecord,
  HumanProviderIdentityRecord,
  IdentityProviderCode,
  IdentitySecurityStorePort,
  SessionVersionRecord,
} from "../../core/identity/session-security-contracts.js";

function exactOneOrNull<Row>(
  rows: readonly Row[],
  name: string,
): Row | null {
  if (rows.length === 0) return null;
  if (rows.length !== 1) {
    throw new Error(`Identity store invariant failed: ${name}`);
  }
  return rows[0] ?? null;
}

export class PostgresIdentitySecurityStore implements IdentitySecurityStorePort {
  constructor(private readonly database: SqlDatabase) {}

  async resolveHumanProviderIdentity(input: {
    readonly provider: IdentityProviderCode;
    readonly providerSubject: string;
  }): Promise<HumanProviderIdentityRecord | null> {
    return this.database.transaction(async (transaction) => {
      const result = await transaction.query<{
        principal_id: string;
        principal_type: "HUMAN" | "PLATFORM_OPERATOR";
        auth_epoch: string | number;
      }>(`SELECT
          principal.id::text AS principal_id,
          principal.principal_type::text AS principal_type,
          principal.auth_epoch AS auth_epoch
        FROM core_identity.identity_provider_link provider_link
        JOIN core_identity.platform_principal principal
          ON principal.id=provider_link.principal_id
        WHERE provider_link.provider=$1::core_identity.provider_code
          AND provider_link.provider_subject=$2
          AND provider_link.status='ACTIVE'
          AND principal.status='ACTIVE'
          AND principal.principal_type IN ('HUMAN','PLATFORM_OPERATOR')`,
        [input.provider, input.providerSubject]);

      const row = exactOneOrNull(result.rows, "provider identity");
      return row ? Object.freeze({
        principalId: row.principal_id,
        principalType: row.principal_type,
        authEpoch: Number(row.auth_epoch),
      }) : null;
    });
  }

  async getSessionVersion(input: {
    readonly principalId: string;
    readonly tenantId?: string;
  }): Promise<SessionVersionRecord | null> {
    return this.database.transaction(async (transaction) => {
      const result = await transaction.query<{
        version: string | number;
        changed_at_ms: string | number;
      }>(`SELECT version,
          (EXTRACT(EPOCH FROM changed_at)*1000)::bigint AS changed_at_ms
        FROM core_identity.session_version
        WHERE principal_id=$1::uuid
          AND tenant_id IS NOT DISTINCT FROM $2::uuid`,
        [input.principalId, input.tenantId ?? null]);

      const row = exactOneOrNull(result.rows, "session version");
      return row ? Object.freeze({
        version: Number(row.version),
        changedAtMs: Number(row.changed_at_ms),
      }) : null;
    });
  }

  async getDeviceRegistration(input: {
    readonly deviceId: string;
    readonly principalId: string;
    readonly tenantId: string;
  }): Promise<DeviceSecurityRecord | null> {
    return this.database.transaction(async (transaction) => {
      const result = await transaction.query<{
        id: string;
        tenant_id: string;
        principal_id: string;
        status: DeviceSecurityRecord["status"];
        risk_level: string;
        registration_version: string | number;
      }>(`SELECT id::text,tenant_id::text,principal_id::text,
          status::text,risk_level,registration_version
        FROM core_identity.device_registration
        WHERE id=$1::uuid AND principal_id=$2::uuid AND tenant_id=$3::uuid`,
        [input.deviceId, input.principalId, input.tenantId]);

      const row = exactOneOrNull(result.rows, "device registration");
      return row ? Object.freeze({
        id: row.id,
        tenantId: row.tenant_id,
        principalId: row.principal_id,
        status: row.status,
        riskLevel: row.risk_level,
        registrationVersion: Number(row.registration_version),
      }) : null;
    });
  }
}
