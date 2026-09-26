import test from "node:test";
import assert from "node:assert/strict";
import { PostgresAuthorizationCompilerDatabase } from "../../dist/server/database/postgres-authorization-compiler-database.js";

function fixture(options = {}) {
  const calls = [];
  const client = {
    async query(text, parameters) {
      calls.push({ text, parameters });
      if (options.fail?.(text)) throw new Error("private compiler database detail");
      if (text.includes("FROM pg_roles")) {
        return { rows: [{ safe: options.safe ?? true }], rowCount: 1 };
      }
      return { command: text === "COMMIT" ? "COMMIT" : "SELECT", rows: [], rowCount: 0 };
    },
    release(destroy) { calls.push({ release: destroy }); },
  };
  return {
    calls,
    database: new PostgresAuthorizationCompilerDatabase({ connect: async () => client }),
  };
}

test("compiler database fixes the dedicated NOBYPASSRLS compiler role and clears pooled scope", async () => {
  const { database, calls } = fixture();
  await database.transaction((tx) => tx.query("SELECT 1"));

  assert.ok(calls.some((call) => call.text === "SET LOCAL ROLE sbg_authorization_compiler_rw"));
  assert.ok(calls.some((call) => String(call.text).includes("set_config('app.tenant_id'")));
  assert.deepEqual(calls.at(-1), { release: false });
});

test("compiler database refuses unsafe login/runtime role evidence", async () => {
  const { database } = fixture({ safe: false });
  await assert.rejects(
    database.transaction(async () => {}),
    (error) => error.code === "DATABASE_ROLE_UNSAFE",
  );
});

test("compiler database destroys a connection when cleanup fails", async () => {
  const { database, calls } = fixture({
    fail: (text) => String(text).startsWith("RESET app."),
  });
  assert.equal(await database.transaction(async () => "ok"), "ok");
  assert.deepEqual(calls.at(-1), { release: true });
});

test("compiler transaction handles expire after callback completion", async () => {
  const { database } = fixture();
  let leaked;
  await database.transaction(async (tx) => { leaked = tx; });
  await assert.rejects(
    leaked.query("SELECT 1"),
    (error) => error.code === "DATABASE_TRANSACTION_CLOSED",
  );
});
