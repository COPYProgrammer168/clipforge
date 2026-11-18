import path from "node:path";
import { createClient } from "@libsql/client";
import { readMigrationFiles } from "drizzle-orm/migrator";

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

function errorChain(error) {
  const messages = [];
  let current = error;
  while (current) {
    const message =
      current instanceof Error ? current.message : String(current);
    if (message && !messages.includes(message)) messages.push(message);
    current = current instanceof Error ? current.cause : undefined;
  }
  return messages.join("\n  caused by: ");
}

console.log(`[db] applying migrations to ${url.startsWith("file:") ? url : "remote libSQL"}`);

try {
  const migrations = readMigrationFiles({
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  });

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash text NOT NULL,
      created_at numeric
    )
  `);

  const existing = await client.execute(
    'SELECT hash, created_at FROM "__drizzle_migrations" ORDER BY created_at DESC LIMIT 1'
  );
  const lastCreatedAt = existing.rows[0]
    ? Number(existing.rows[0].created_at)
    : 0;
  let applied = 0;

  for (const migration of migrations) {
    if (lastCreatedAt >= migration.folderMillis) continue;
    console.log(
      `[db] applying migration ${migration.hash.slice(0, 12)} (${migration.sql.length} statements)`
    );
    for (const statement of migration.sql) {
      await client.execute(statement);
    }
    await client.execute({
      sql: 'INSERT INTO "__drizzle_migrations" ("hash", "created_at") VALUES (?, ?)',
      args: [migration.hash, migration.folderMillis],
    });
    applied += 1;
  }

  console.log(
    applied > 0 ? `[db] applied ${applied} migration(s)` : "[db] schema ready"
  );
} catch (error) {
  console.error(`[db] migration failed: ${errorChain(error)}`);
  process.exitCode = 1;
} finally {
  client.close();
}
