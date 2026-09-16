import type {
  SecurityContext,
  VerifiedAuthentication,
} from "../../core/context/contracts.js";
import { ContextResolutionError } from "../../core/context/errors.js";
import type { SessionSecurityPort } from "../../core/context/ports.js";
import type {
  DeviceSecurityRecord,
  IdentitySecurityStorePort,
} from "../../core/identity/session-security-contracts.js";

function riskLevel(record?: DeviceSecurityRecord): "LOW" | "MEDIUM" | "HIGH" {
  if (!record) return "LOW";
  if (record.riskLevel === "LOW" || record.riskLevel === "MEDIUM") {
    return record.riskLevel;
  }
  return "HIGH";
}

export class SessionSecurityService implements SessionSecurityPort {
  constructor(private readonly store: IdentitySecurityStorePort) {}

  async validateAndResolve(input: {
    readonly authentication: VerifiedAuthentication;
    readonly tenantId?: string;
    readonly industryContextId?: string;
    readonly actorIpHash?: string;
    readonly networkContext?: string;
  }): Promise<SecurityContext> {
    if (input.authentication.kind === "MACHINE") {
      return Object.freeze({
        deviceTrust: "NOT_APPLICABLE",
        riskLevel: "LOW",
        attributes: Object.freeze({
          credentialVersion: input.authentication.evidence.credentialVersion,
        }),
      });
    }

    const evidence = input.authentication.evidence;
    if (!Number.isFinite(evidence.providerSessionCreatedAtMs)) {
      throw new ContextResolutionError("SESSION_INVALID", "The session age is not valid.");
    }

    let sessionVersion;
    try {
      sessionVersion = await this.store.getSessionVersion({
        principalId: evidence.principalId,
        tenantId: input.tenantId,
      });
    } catch {
      throw new ContextResolutionError(
        "DEPENDENCY_UNAVAILABLE",
        "Session security state is temporarily unavailable.",
      );
    }

    if (sessionVersion
      && evidence.providerSessionCreatedAtMs < sessionVersion.changedAtMs) {
      throw new ContextResolutionError(
        "SESSION_INVALID",
        "The session predates the current security epoch.",
      );
    }

    let device: DeviceSecurityRecord | undefined;
    if (evidence.deviceId) {
      if (!input.tenantId) {
        throw new ContextResolutionError(
          "DEVICE_UNTRUSTED",
          "The device registration is not valid for this scope.",
        );
      }

      try {
        device = (await this.store.getDeviceRegistration({
          deviceId: evidence.deviceId,
          principalId: evidence.principalId,
          tenantId: input.tenantId,
        })) ?? undefined;
      } catch {
        throw new ContextResolutionError(
          "DEPENDENCY_UNAVAILABLE",
          "Device security state is temporarily unavailable.",
        );
      }

      if (!device || device.status === "PENDING" || device.status === "REVOKED") {
        throw new ContextResolutionError(
          "DEVICE_UNTRUSTED",
          "The registered device is not trusted.",
        );
      }
      if (device.status === "RISK_HOLD") {
        throw new ContextResolutionError(
          "STEP_UP_REQUIRED",
          "Additional authentication is required.",
        );
      }
    }

    return Object.freeze({
      authStrength: evidence.authStrength,
      deviceTrust: device ? "TRUSTED" : "NOT_APPLICABLE",
      riskLevel: riskLevel(device),
      sessionVersion: sessionVersion?.version,
      attributes: Object.freeze({
        sessionScope: input.tenantId ? "TENANT" : "PLATFORM",
        deviceRegistrationVersion: device?.registrationVersion,
      }),
    });
  }
}
