import { betterAuth } from "better-auth"
import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

export const auth = betterAuth({
    database: pool,
    secret: process.env.BETTER_AUTH_SECRET || "",
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
    },
})
