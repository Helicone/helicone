// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const REGION = process.env.REGION || "us";

if (REGION === "us") {
  Sentry.init({
    dsn: "https://b0bf4af8adaecf90a2efaff9fb4ed029@o4506562130280448.ingest.us.sentry.io/4508259500687360",

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
}
