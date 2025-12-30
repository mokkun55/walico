import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";

if (!process.env.LINE_CLIENT_ID) {
  throw new Error("LINE_CLIENT_ID is not set");
}

if (!process.env.LINE_CLIENT_SECRET) {
  throw new Error("LINE_CLIENT_SECRET is not set");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: schema,
    usePlural: true,
  }),
  socialProviders: {
    line: {
      clientId: process.env.LINE_CLIENT_ID as string,
      clientSecret: process.env.LINE_CLIENT_SECRET as string,
      scope: ["openid", "profile", "email"],
    },
  },
});
