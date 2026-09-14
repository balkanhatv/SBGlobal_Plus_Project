import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlDatabase, SqlTransaction } from "./contracts.js";

export type DatabaseScopeErrorCode =
  | "DB_ROUTE_CONTEXT_MISMATCH"
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
  constructor(private readonly database: SqlDatabase) {}

  async withContext<T>(
    context: RequestContext,
    work: (transaction: SqlTransaction) => Promise<T>,
  ): Promise<T> {
    this.assertSupportedScope(context);

    return this.database.transaction(async (transaction) => {
      await transaction.query(
        `SELECT
           set_config('app.tenant_id', $1, true),
           set_config('app.industry_context_id', $2, true),
           set_config('app.scope_class', $3, true),
           set_config('app.principal_id', $4, true),
           set_config('app.operator_elevation_id', $5, true)`,
        [
          context.tenantId ?? "",
          context.industryContextId ?? "",
          context.scopeClass,
          context.principalId ?? "",
          "",
        ],
      );

      return work(transaction);
    });
  }

  private assertSupportedScope(context: RequestContext): void {
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
