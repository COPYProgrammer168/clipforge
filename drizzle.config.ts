import { defineConfig, type Config } from "drizzle-kit";

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {}
}

const url = process.env.DATABASE_URL ?? "file:./clipforge.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;
const isRemoteLibsql = url.startsWith("libsql://") || url.startsWith("https://");

const config: Config = isRemoteLibsql
  ? {
      dialect: "turso",
      schema: "./src/lib/db/schema.ts",
      out: "./drizzle",
      dbCredentials: { url, authToken },
    }
  : {
      dialect: "sqlite",
      schema: "./src/lib/db/schema.ts",
      out: "./drizzle",
      dbCredentials: { url },
    };

export default defineConfig(config);
