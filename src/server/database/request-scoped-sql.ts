import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlDatabase, SqlTransaction } from "./contracts.js";

export type DatabaseScopeErrorCode =
  | "DB_ROUTE_CONTEXT_MISMATCH"
  | "DATABASE_CONTEXT_INVALID"
  | "DATABASE_PUBLIC_SCOPE_FORBIDDEN"
  | "DATABASE_CROSS_CONTEXT_REQUIRES_DEDICATED_PATH";

export class DatabaseScopeError extends Error {
  readonly code: DatabaseScopeErrorCode;

  constructor(code: DatabaseScopeErrorCode, message: string) {
    super(message);
    this.name = "DatabaseScopeError";
    this.code = code;
  }
}

export class RequestScopedSql {
  private readonly route: Readonly<{
    dataHomeId: string;
    regionCode: string;
    dedicatedTenantId?: string;
  }>;

  constructor(
    private readonly database: SqlDatabase,
    route: {
      readonly dataHomeId: string;
      readonly regionCode: string;
      readonly dedicatedTenantId?: string;
    },
  ) {
    this.route = Object.freeze({ ...route });
  }

  async withContext<T>(
    context: RequestContext,
    work: (transaction: SqlTransaction) => Promise<T>,
  ): Promise<T> {
    // Snapshot the validated scalar routing fields before asynchronous pool checkout.
    const resolved = Object.freeze({ ...context });
    this.assertSupportedScope(resolved);

    return this.database.transaction(async (transaction) => {
      await transaction.query(
        `SELECT
           set_config('app.tenant_id', $1, true),
           set_config('app.industry_context_id', $2, true),
           set_config('app.scope_class', $3, true),
           set_config('app.principal_id', $4, true),
           set_config('app.operator_elevation_id', $5, true)`,
        [
          resolved.tenantId ?? "",
          resolved.industryContextId ?? "",
          resolved.scopeClass,
          resolved.principalId ?? "",
          "",
        ],
      );

      return work(transaction);
    });
  }

  private assertSupportedScope(context: RequestContext): void {
    if (!["PUBLIC", "PLATFORM_GLOBAL", "TENANT_CORE", "TENANT_INDUSTRY", "EXPLICIT_CROSS_CONTEXT"]
      .includes(context.scopeClass)) {
      throw new DatabaseScopeError("DB_ROUTE_CONTEXT_MISMATCH", "Unknown database scope.");
    }
    if (context.scopeClass === "PUBLIC") {
      throw new DatabaseScopeError(
        "DATABASE_PUBLIC_SCOPE_FORBIDDEN",
        "Public scope cannot open a private application database context.",
      );
    }

    if (context.scopeClass === "EXPLICIT_CROSS_CONTEXT") {
      throw new DatabaseScopeError(
        "DATABASE_CROSS_CONTEXT_REQUIRES_DEDICATED_PATH",
        "Explicit cross-context database access requires a dedicated governed repository.",
      );
    }

    if (context.scopeClass === "PLATFORM_GLOBAL") {
      if (context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE") {
        throw new DatabaseScopeError(
          "DATABASE_CONTEXT_INVALID",
          "Platform-global database scope requires a trusted platform operator or service principal.",
        );
      }
      if (!context.principalId || context.tenantId || context.industryContextId) {
        throw new DatabaseScopeError(
          "DB_ROUTE_CONTEXT_MISMATCH",
          "Platform-global scope cannot carry Tenant or Industry Context.",
        );
      }
      return;
    }

    if (!context.tenantId || !context.principalId) {
      throw new DatabaseScopeError(
        "DB_ROUTE_CONTEXT_MISMATCH",
        "Tenant database access requires resolved Tenant and principal context.",
      );
    }

    if (!this.route?.dataHomeId || !this.route.regionCode
      || context.dataHomeId !== this.route.dataHomeId
      || context.regionCode !== this.route.regionCode
      || (this.route.dedicatedTenantId && context.tenantId !== this.route.dedicatedTenantId)) {
      throw new DatabaseScopeError(
        "DB_ROUTE_CONTEXT_MISMATCH",
        "The resolved context does not match this database route.",
      );
    }

    if (context.scopeClass === "TENANT_CORE" && context.industryContextId) {
      throw new DatabaseScopeError(
        "DB_ROUTE_CONTEXT_MISMATCH",
        "Tenant Core scope cannot carry Industry Context.",
      );
    }

    if (context.scopeClass === "TENANT_INDUSTRY" && !context.industryContextId) {
      throw new DatabaseScopeError(
        "DB_ROUTE_CONTEXT_MISMATCH",
        "Tenant Industry scope requires Industry Context.",
      );
    }
  }
}
