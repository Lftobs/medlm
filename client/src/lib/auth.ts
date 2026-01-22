import { betterAuth } from "better-auth";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log(process.env.VITE_SERVER_URL);

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET || "",
  baseURL: process.env.FE_URL || "http://localhost:3000",
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: "medlm.intrep.xyz",
    },
    cookies: {
      session_token: {
        attributes: {
          sameSite: "none",
          secure: true,
        },
      },
    },
  },
  trustedOrigins: [
    process.env.FE_URL || "http://localhost:3000",
    process.env.VITE_SERVER_URL || "http://localhost:8000",
  ],
});
