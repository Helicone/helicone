import pgPromise from "pg-promise";

export const pgp = pgPromise();
export const dbPromise = pgp({
  connectionString: process.env.SUPABASE_DATABASE_URL,
  ssl:
    process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "development"
      ? {
          rejectUnauthorized: true,
          ca: process.env.SUPABASE_SSL_CERT_CONTENTS?.split("\\n").join("\n"),
        }
      : undefined,
});
