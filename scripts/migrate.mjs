import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local present.
}
try {
  process.loadEnvFile(".env");
} catch {
  // No .env present.
}

const url = process.env.DATABASE_URL ?? "file:./clipforge.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;
const client = createClient({
  url,
  ...(authToken ? { authToken } : {}),
});

console.log(`[db] applying migrations to ${url.startsWith("file:") ? url : "remote libSQL"}`);

try {
  await migrate(drizzle(client), {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  });
  console.log("[db] schema ready");
} catch (error) {
  console.error(
    `[db] migration failed: ${error instanceof Error ? error.message : error}`
  );
  process.exitCode = 1;
} finally {
  client.close();
}
