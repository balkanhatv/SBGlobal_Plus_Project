import test from "node:test";
import assert from "node:assert/strict";
import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";

function fixture(fail = () => false) {
  const calls = [];
  const client = {
    async query(text, parameters) {
      calls.push({ text, parameters });
      if (fail(text)) throw new Error("private SQL and credential diagnostics");
      if (text.includes("FROM pg_roles")) return { rows: [{ safe: true }], rowCount: 1 };
      return { command: text === "COMMIT" ? "COMMIT" : "SELECT", rows: [], rowCount: 0 };
    },
    release(destroy) { calls.push({ release: destroy }); },
  };
  return { calls, client, database: new PostgresDatabase({ connect: async () => client }) };
}

test("failed rollback destroys the pooled connection while preserving domain error", async () => {
  const { database, calls } = fixture((text) => text === "ROLLBACK");
  const failure = new Error("domain failure");
  await assert.rejects(database.transaction(async () => { throw failure; }), (error) => error === failure);
  assert.deepEqual(calls.at(-1), { release: true });
});

test("failed cleanup destroys the connection after a committed result without retrying the write", async () => {
  const { database, calls } = fixture((text) => text.startsWith("RESET app."));
  assert.equal(await database.transaction(async () => "committed"), "committed");
  assert.deepEqual(calls.at(-1), { release: true });
  assert.equal(calls.filter((call) => call.text === "COMMIT").length, 1);
});

test("connect/setup/query failures expose safe codes without SQL or credential details", async () => {
  const broken = new PostgresDatabase({ connect: async () => { throw new Error("postgres://secret"); } });
  await assert.rejects(broken.transaction(async () => {}), (error) => error.code === "DATABASE_UNAVAILABLE"
    && !error.message.includes("secret") && error.cause === undefined);
  for (const query of ["SET LOCAL ROLE sbg_app_rw", "SELECT private_data"]) {
    const { database, calls } = fixture((text) => text === query);
    await assert.rejects(database.transaction((tx) => tx.query("SELECT private_data")),
      (error) => error.code.startsWith("DATABASE_") && !error.message.includes("private"));
    assert.deepEqual(calls.at(-1), { release: false });
  }
});

test("leaked transaction handles cannot query a client after it returns to the pool", async () => {
  const { database, calls } = fixture();
  let leaked;
  await database.transaction(async (tx) => { leaked = tx; });
  const count = calls.length;
  await assert.rejects(leaked.query("SELECT 1"), (error) => error.code === "DATABASE_TRANSACTION_CLOSED");
  assert.equal(calls.length, count);
});

test("COMMIT returning ROLLBACK is not reported as a successful transaction", async () => {
  const { database, client } = fixture();
  const query = client.query.bind(client);
  client.query = (text, parameters) => text === "COMMIT"
    ? Promise.resolve({ command: "ROLLBACK", rows: [], rowCount: null }) : query(text, parameters);
  await assert.rejects(database.transaction(async () => "must not return"),
    (error) => error.code === "DATABASE_TRANSACTION_FAILED");
});
