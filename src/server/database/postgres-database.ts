import type { Pool, PoolClient, QueryResultRow } from "pg";
import type { SqlDatabase, SqlTransaction } from "./contracts.js";

export class PostgresDatabaseError extends Error {
  constructor(readonly code:
    | "DATABASE_UNAVAILABLE"
    | "DATABASE_QUERY_FAILED"
    | "DATABASE_TRANSACTION_FAILED"
    | "DATABASE_ROLE_UNSAFE"
    | "DATABASE_TRANSACTION_CLOSED") {
    super("The database operation could not be completed.");
    this.name = "PostgresDatabaseError";
  }
}

const clearScope = `SELECT
  set_config('app.tenant_id', '', true),
  set_config('app.industry_context_id', '', true),
  set_config('app.scope_class', '', true),
  set_config('app.principal_id', '', true),
  set_config('app.operator_elevation_id', '', true)`;

const resetScope = `RESET app.tenant_id; RESET app.industry_context_id;
  RESET app.scope_class; RESET app.principal_id; RESET app.operator_elevation_id`;

/** Application-role adapter only. Identity/control-plane bootstrap needs its own
 * governed adapter. The pool and SQL are server-owned, never transport inputs. */
export class PostgresDatabase implements SqlDatabase {
  constructor(private readonly pool: Pick<Pool, "connect">) {}

  async transaction<T>(work: (transaction: SqlTransaction) => Promise<T>): Promise<T> {
    let client: PoolClient;
    try {
      client = await this.pool.connect();
    } catch {
      throw new PostgresDatabaseError("DATABASE_UNAVAILABLE");
    }

    let active = false;
    let destroy = false;
    let domainFailure = false;
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL ROLE sbg_app_rw");
      await client.query("SET LOCAL row_security = on");
      const role = await client.query<{ safe: boolean }>(`SELECT
        current_user = 'sbg_app_rw'
        AND NOT runtime.rolsuper AND NOT runtime.rolbypassrls
        AND NOT login.rolsuper AND NOT login.rolbypassrls AS safe
        FROM pg_roles runtime, pg_roles login
        WHERE runtime.rolname = current_user AND login.rolname = session_user`);
      if (role.rows.length !== 1 || role.rows[0]?.safe !== true) {
        throw new PostgresDatabaseError("DATABASE_ROLE_UNSAFE");
      }
      await client.query(clearScope);
      active = true;
      const transaction: SqlTransaction = Object.freeze({
        async query<Row>(text: string, parameters: readonly unknown[] = []) {
          if (!active) throw new PostgresDatabaseError("DATABASE_TRANSACTION_CLOSED");
          try {
            const result = await client.query<Row & QueryResultRow>(text, [...parameters]);
            if (Array.isArray(result)) throw new PostgresDatabaseError("DATABASE_QUERY_FAILED");
            return { rows: result.rows, rowCount: result.rowCount ?? 0 };
          } catch {
            // No SQL, parameters, credentials or provider diagnostics cross this boundary.
            throw new PostgresDatabaseError("DATABASE_QUERY_FAILED");
          }
        },
      });

      let result: T;
      try {
        result = await work(transaction);
      } catch (error) {
        domainFailure = true;
        throw error;
      } finally {
        active = false;
      }
      const commit = await client.query("COMMIT");
      // PostgreSQL can answer ROLLBACK when a caller swallowed an earlier SQL error.
      if (commit.command !== "COMMIT") throw new PostgresDatabaseError("DATABASE_TRANSACTION_FAILED");
      return result;
    } catch (error) {
      active = false;
      try {
        await client.query("ROLLBACK");
      } catch {
        destroy = true;
      }
      if (domainFailure || error instanceof PostgresDatabaseError) throw error;
      throw new PostgresDatabaseError("DATABASE_TRANSACTION_FAILED");
    } finally {
      if (!destroy) {
        try {
          // Also remove a stale session-level setting inherited from a reused connection.
          await client.query(resetScope);
        } catch {
          destroy = true;
        }
      }
      // A failed cleanup never returns the connection to another Tenant's request.
      client.release(destroy);
    }
  }
}
