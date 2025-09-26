import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";
import express from "express";

export function initSentry(router: express.Router) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      // enable HTTP calls tracing
      // new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      // new Sentry.Integrations.Express({ app: router }),
      new ProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 0.01, //  Capture 1% of the transactions (reduced from 100%)
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 0.01,
  });

  // router.use(Sentry.Handlers.requestHandler());
  // router.use(Sentry.Handlers.tracingHandler());
  router.use(Sentry.Handlers.errorHandler());
}
