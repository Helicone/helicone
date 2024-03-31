require("dotenv").config({
  path: "./.env",
});

import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";
import express, {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
  urlencoded,
} from "express";
import morgan from "morgan";
import { PostHog } from "posthog-node";
import swaggerUi from "swagger-ui-express";
import { RegisterRoutes as registerTSOARoutes } from "./tsoa-build/routes";
import * as swaggerDocument from "./tsoa-build/swagger.json";
import { hashAuth } from "./lib/db/hash";
import { SupabaseConnector } from "./lib/db/supabase";
import { FineTuningManager } from "./lib/managers/FineTuningManager";
import { withAuth } from "./lib/routers/withAuth";
import { FilterNode } from "./lib/shared/filters/filterDefs";
import { getRequests, getRequestsCached } from "./lib/shared/request/request";
import { runLoopsOnce, runMainLoops } from "./mainLoops";
import { paths } from "./schema/types";
import {
  getTokenCountAnthropic,
  getTokenCountGPT3,
} from "./lib/tokens/tokenCounter";
import { legacyRouter } from "./legacy";
import { authMiddleware } from "./middleware/auth";

export const ENVIRONMENT = process.env.VERCEL_ENV ?? "development";

if (ENVIRONMENT === "production" || process.env.ENABLE_CRON_JOB === "true") {
  runMainLoops();
}

const app = express();
app.use(legacyRouter);

const v1APIRouter = express.Router();
const unAuthenticatedRouter = express.Router();
unAuthenticatedRouter.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

v1APIRouter.use(authMiddleware);

registerTSOARoutes(v1APIRouter);

app.use(unAuthenticatedRouter);

app.use(v1APIRouter);

const server = app.listen(
  parseInt(process.env.PORT ?? "8585"),
  "0.0.0.0",
  () => {
    console.log(`Server is running on http://localhost:8585`);
  }
);

server.on("error", console.error);

// Thisp
server.setTimeout(1000 * 60 * 10); // 10 minutes
