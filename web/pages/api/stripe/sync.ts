import { NextApiRequest, NextApiResponse } from "next";
import { StripeSync } from "@supabase/stripe-sync-engine";
import { SecretManager } from "@helicone-package/secrets/SecretManager";

// Load secrets from environment variables
const databaseUrl = process.env.DATABASE_URL!;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SYNC_SECRET!;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;

const ssl =
  process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "development"
    ? {
        rejectUnauthorized: true,
        ca: SecretManager.getSecret("SUPABASE_SSL_CERT_CONTENTS")!
          .split("\\n")
          .join("\n"),
      }
    : undefined;
// Initialize StripeSync
const stripeSync = new StripeSync({
  poolConfig: {
    connectionString: databaseUrl,
    ssl: ssl,
  },
  stripeWebhookSecret,
  stripeSecretKey,
  backfillRelatedEntities: false,
  autoExpandLists: true,
});
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // TODO: Uncomment and run once locally when pointing to production
    // await stripeSync.syncBackfill({
    //   object: "subscription",
    //   created: { gte: 1643872333 }, // Unix timestamp
    // });
    // await stripeSync.syncBackfill({
    //   object: "customer",
    //   created: { gte: 1643872333 }, // Unix timestamp
    // });
    const stripeSignature = req.headers["stripe-signature"] as string;

    if (!stripeSignature) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    // Read the raw body since we disabled bodyParser
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks).toString();

    await stripeSync.processWebhook(rawBody, stripeSignature);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    res.status(400).json({ error: "Webhook processing failed" });
  }
};

export default handler;

export const config = {
  api: {
    bodyParser: false,
  },
};
