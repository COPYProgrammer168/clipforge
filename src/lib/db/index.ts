import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/lib/db/schema";

const url = process.env.DATABASE_URL ?? "file:./clipforge.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const globalForDb = globalThis as unknown as {
  __clipforgeClient?: ReturnType<typeof createClient>;
};

const client =
  globalForDb.__clipforgeClient ??
  createClient({ url, ...(authToken ? { authToken } : {}) });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__clipforgeClient = client;
}

async function applyPragma(statement: string) {
  try {
    await client.execute(statement);
  } catch {
    // Hosted libSQL may not support every file-oriented pragma.
  }
}

await applyPragma("PRAGMA foreign_keys = ON");
await applyPragma("PRAGMA busy_timeout = 5000");
if (url.startsWith("file:")) {
  await applyPragma("PRAGMA journal_mode = WAL");
}

export const db = drizzle(client, { schema });
