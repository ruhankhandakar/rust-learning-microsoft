import { betterAuth } from "better-auth";
import { LibsqlDialect } from "kysely-libsql";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: {
    dialect: new LibsqlDialect({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    }),
    type: "sqlite",
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  account: { accountLinking: { enabled: false } },
  disabledPaths: ["/update-user", "/get-access-token", "/refresh-token", "/account-info", "/link-social", "/unlink-account", "/list-accounts"],
  plugins: [nextCookies()],
});
