import type { Config } from "drizzle-kit";

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  throw new Error("TURSO_DATABASE_URL or TURSO_AUTH_TOKEN is not set");
}

export default {
  schema: "./src/libs/db/schema.ts",
  out: "./src/libs/db/migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;
