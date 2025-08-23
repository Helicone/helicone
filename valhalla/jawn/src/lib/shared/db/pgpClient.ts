import pgPromise from "pg-promise";
import { SecretManager } from "@helicone-package/secrets/SecretManager";

export const HELICONE_PGP = pgPromise();
export const HELICONE_DB = HELICONE_PGP({
  connectionString: SecretManager.getSecret("SUPABASE_DATABASE_URL"),
  ssl:
    process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "development"
      ? {
          rejectUnauthorized: true,
          ca: SecretManager.getSecret("SUPABASE_SSL_CERT_CONTENTS")
            ?.split("\\n")
            .join("\n"),
        }
      : undefined,
});
