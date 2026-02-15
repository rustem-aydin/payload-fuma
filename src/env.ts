import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },

  server: {
    // Database
    DATABASE_URL: z.string().url(),
    PREVIEW_SECRET: z.string().min(1),
    PAYLOAD_SECRET: z.string().min(1),

    RESEND_API_KEY: z.string().min(1).startsWith("re_"),
    RESEND_AUDIENCE_ID: z.string().min(1),
    EMAIL_FROM: z.email(),
    EMAIL_TO: z.email(),
    // Authentication
    BETTER_AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).optional(),
    BETTER_AUTH_URL: z.string().min(1).optional(),
    // BotID
    BOTID_DEV_BYPASS: z.enum(["BAD-BOT", "GOOD-BOT", "HUMAN"]).optional(),
    // Google
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
  },

  client: {
    // App
        NEXT_PUBLIC_SERVER_URL: z.string().min(1),

    NEXT_PUBLIC_BASE_URL: z.url().min(1).optional(),
    // Analytics
  },

  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,

    NEXT_PUBLIC_BASE_URL:
      process.env.NEXT_PUBLIC_BASE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : undefined),
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
