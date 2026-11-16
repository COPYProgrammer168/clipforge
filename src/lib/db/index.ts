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

await client.execute("PRAGMA foreign_keys = ON");
await client.execute("PRAGMA busy_timeout = 5000");
try {
  await client.execute("PRAGMA journal_mode = WAL");
} catch {
  // Another connection may hold the file; the default journal still works.
}

export const db = drizzle(client, { schema });
