import { ContextResolutionError } from "../../core/context/errors.js";
import type {
  AuthStrength,
  IdentityPort,
  VerifiedIdentityEvidence,
  VerifiedMachineEvidence,
} from "../../core/identity/contracts.js";
import type {
  IdentitySecurityStorePort,
  MachineCredentialVerifierPort,
} from "../../core/identity/session-security-contracts.js";

export type ClerkProviderErrorCode =
  | "TOKEN_INVALID"
  | "SESSION_NOT_FOUND"
  | "DEPENDENCY_UNAVAILABLE";

export class ClerkProviderError extends Error {
  constructor(readonly code: ClerkProviderErrorCode) {
    super("The identity provider request could not be completed.");
    this.name = "ClerkProviderError";
  }
}

export interface ClerkVerifiedSessionToken {
  readonly subject: string;
  readonly sessionId: string;
  readonly factorVerificationAgeMinutes?: readonly [number, number];
}

export interface ClerkSessionRecord {
  readonly id: string;
  readonly userId: string;
  readonly status: string;
  readonly createdAtMs: number;
}

export interface ClerkBackendPort {
  verifySessionToken(token: string): Promise<ClerkVerifiedSessionToken>;
  getSession(sessionId: string): Promise<ClerkSessionRecord>;
  revokeSession(sessionId: string): Promise<void>;
}

function providerFailure(error: unknown): ContextResolutionError {
  if (error instanceof ClerkProviderError
    && (error.code === "TOKEN_INVALID" || error.code === "SESSION_NOT_FOUND")) {
    return new ContextResolutionError("SESSION_INVALID", "The session is not valid.");
  }
  return new ContextResolutionError(
    "DEPENDENCY_UNAVAILABLE",
    "The identity provider is temporarily unavailable.",
  );
}

export function inferClerkAuthStrength(
  factorVerificationAgeMinutes?: readonly [number, number],
): AuthStrength {
  return factorVerificationAgeMinutes
    && Number.isFinite(factorVerificationAgeMinutes[1])
    && factorVerificationAgeMinutes[1] >= 0
    ? "MFA"
    : "PASSWORD";
}

/**
 * Provider-specific IdentityPort adapter.
 *
 * The concrete Next.js bootstrap must implement ClerkBackendPort with Clerk's
 * official backend SDK and enforce signature/issuer/expiry plus an
 * authorized-parties allowlist. This adapter intentionally does not trust
 * custom session-token claims for SBGlobal authorization or session epochs.
 */
export class ClerkIdentityAdapter implements IdentityPort {
  constructor(
    private readonly clerk: ClerkBackendPort,
    private readonly store: IdentitySecurityStorePort,
    private readonly machine: MachineCredentialVerifierPort,
  ) {}

  async verifyHumanSession(
    credential: string,
    deviceRegistrationId?: string,
  ): Promise<VerifiedIdentityEvidence> {
    let token: ClerkVerifiedSessionToken;
    try {
      token = await this.clerk.verifySessionToken(credential);
    } catch (error) {
      throw providerFailure(error);
    }

    if (!token.subject || !token.sessionId) {
      throw new ContextResolutionError("SESSION_INVALID", "The session is not valid.");
    }

    let providerSession: ClerkSessionRecord;
    try {
      providerSession = await this.clerk.getSession(token.sessionId);
    } catch (error) {
      throw providerFailure(error);
    }

    if (providerSession.id !== token.sessionId
      || providerSession.userId !== token.subject
      || providerSession.status !== "active"
      || !Number.isFinite(providerSession.createdAtMs)) {
      throw new ContextResolutionError("SESSION_INVALID", "The session is not active.");
    }

    let identity;
    try {
      identity = await this.store.resolveHumanProviderIdentity({
        provider: "CLERK",
        providerSubject: token.subject,
      });
    } catch {
      throw new ContextResolutionError(
        "DEPENDENCY_UNAVAILABLE",
        "The identity directory is temporarily unavailable.",
      );
    }

    if (!identity
      || (identity.principalType !== "HUMAN"
        && identity.principalType !== "PLATFORM_OPERATOR")) {
      throw new ContextResolutionError("SESSION_INVALID", "The session identity is not valid.");
    }

    return Object.freeze({
      principalId: identity.principalId,
      principalType: identity.principalType,
      providerSubject: token.subject,
      providerSessionId: token.sessionId,
      providerSessionCreatedAtMs: providerSession.createdAtMs,
      authEpoch: identity.authEpoch,
      authStrength: inferClerkAuthStrength(token.factorVerificationAgeMinutes),
      deviceId: deviceRegistrationId,
    });
  }

  verifyMachineCredential(credential: string): Promise<VerifiedMachineEvidence> {
    return this.machine.verifyMachineCredential(credential);
  }

  async revokeProviderSession(reference: string): Promise<void> {
    try {
      await this.clerk.revokeSession(reference);
    } catch (error) {
      throw providerFailure(error);
    }
  }

  getAuthStrength(evidence: VerifiedIdentityEvidence): AuthStrength {
    return evidence.authStrength;
  }

  getProviderSubject(evidence: VerifiedIdentityEvidence): string {
    return evidence.providerSubject;
  }
}
