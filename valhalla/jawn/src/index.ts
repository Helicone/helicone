// Load env before anything else
import "./lib/env";

import bodyParser from "body-parser";
import express, { Request as ExpressRequest, NextFunction } from "express";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import { proxyRouter } from "./controllers/public/proxyController";
import { ENVIRONMENT } from "./lib/clients/constant";
import {
  DLQ_WORKER_COUNT,
  NORMAL_WORKER_COUNT,
  SCORES_WORKER_COUNT,
} from "./lib/clients/kafkaConsumers/constant";
import { webSocketProxyForwarder } from "./lib/proxy/WebSocketProxyForwarder";
import { RequestWrapper } from "./lib/requestWrapper/requestWrapper";
import { tokenRouter } from "./lib/routers/tokenRouter";
import { DelayedOperationService } from "./lib/shared/delayedOperationService";
import { runLoopsOnce, runMainLoops } from "./mainLoops";
import { authFromRequest, authMiddleware } from "./middleware/auth";
import { IS_RATE_LIMIT_ENABLED, limiter } from "./middleware/ratelimitter";
import { RegisterRoutes as registerPrivateTSOARoutes } from "./tsoa-build/private/routes";
import { RegisterRoutes as registerPublicTSOARoutes } from "./tsoa-build/public/routes";
import * as publicSwaggerDoc from "./tsoa-build/public/swagger.json";
import { initLogs } from "./utils/injectLogs";
import { initSentry } from "./utils/injectSentry";
import { startConsumers, startSQSConsumers } from "./workers/consumerInterface";
import { IS_ON_PREM } from "./constants/IS_ON_PREM";
import { toExpressRequest } from "./utils/expressHelpers";
import { webSocketControlPlaneServer } from "./controlPlane/controlPlane";
import { startDBListener } from "./controlPlane/dbListener";

if (ENVIRONMENT === "production" || process.env.ENABLE_CRON_JOB === "true") {
  runMainLoops();
}
const allowedOriginsEnv = {
  production: [
    /^https?:\/\/(www\.)?helicone\.ai$/,
    /^https?:\/\/(www\.)?.*-helicone\.vercel\.app$/,
    /^https?:\/\/(www\.)?helicone\.vercel\.app$/,
    /^https?:\/\/(www\.)?helicone-git-valhalla-use-jawn-to-read-helicone\.vercel\.app$/,
    /^http:\/\/localhost:3000$/,
    /^http:\/\/localhost:3001$/,
    /^http:\/\/localhost:3002$/,
    /^https?:\/\/(www\.)?eu\.helicone\.ai$/, // Added eu.helicone.ai
    /^https?:\/\/(www\.)?us\.helicone\.ai$/,
  ],
  development: [
    /^http:\/\/localhost:3000$/,
    /^http:\/\/localhost:3001$/,
    /^http:\/\/localhost:3002$/,
  ],
  preview: [
    /^http:\/\/localhost:3000$/,
    /^http:\/\/localhost:3001$/,
    /^http:\/\/localhost:3002$/,
  ],
};

const allowedOrigins = allowedOriginsEnv[ENVIRONMENT];

const app = express();

const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    if (!origin) {
      // Allow requests with no origin (like server-to-server, curl)
      callback(null, true);
      return;
    }
    if (
      allowedOrigins.some((allowedOrigin) => allowedOrigin.test(origin)) ||
      IS_ON_PREM
    ) {
      callback(null, true);
    } else {
      // Important: Disallow origins not in the list
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Helicone-Authorization",
    "x-vercel-set-bypass-cookie",
    "x-vercel-protection-bypass",
  ],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.options("/{*any}", cors(corsOptions));
app.use(cors(corsOptions));

var rawBodySaver = function (req: any, res: any, buf: any, encoding: any) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || "utf8");
  }
};

app.use(bodyParser.json({ verify: rawBodySaver, limit: "50mb" }));
app.use(
  bodyParser.urlencoded({
    verify: rawBodySaver,
    extended: true,
    limit: "50mb",
    parameterLimit: 50000,
  })
);
app.use(bodyParser.raw({ verify: rawBodySaver, type: "*/*", limit: "50mb" }));

const KAFKA_CREDS = JSON.parse(process.env.KAFKA_CREDS ?? "{}");
const KAFKA_ENABLED = (KAFKA_CREDS?.KAFKA_ENABLED ?? "false") === "true";

if (KAFKA_ENABLED) {
  console.log("Starting Kafka consumers");
  startConsumers({
    dlqCount: 0,
    normalCount: 0,
    scoresCount: 0,
    scoresDlqCount: 0,
    backFillCount: 0,
  });
  startSQSConsumers({
    dlqCount: DLQ_WORKER_COUNT,
    normalCount: NORMAL_WORKER_COUNT,
    scoresCount: SCORES_WORKER_COUNT,
    scoresDlqCount: SCORES_WORKER_COUNT,
    backFillCount: 0,
  });
}

startDBListener();

app.get("/healthcheck", (req, res) => {
  res.json({
    status: "healthy :)",
  });
});

if (ENVIRONMENT !== "production") {
  app.get("/run-loops/:index", async (req, res) => {
    const index = parseInt(req.params.index);
    await runLoopsOnce(index);
    res.json({
      status: "done",
    });
  });
}

initSentry(app);
initLogs(app);

const v1APIRouter = express.Router();
const unAuthenticatedRouter = express.Router();
const v1ProxyRouter = express.Router();

v1ProxyRouter.use(proxyRouter);
app.use(v1ProxyRouter);

unAuthenticatedRouter.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(publicSwaggerDoc as any)
);

unAuthenticatedRouter.use(tokenRouter);

unAuthenticatedRouter.use("/download/swagger.json", (req, res) => {
  res.json(publicSwaggerDoc as any);
});

// v1APIRouter.use(
//   "/v1/public/dataisbeautiful",
//   unauthorizedCacheMiddleware("/v1/public/dataisbeautiful")
// );

v1APIRouter.use(authMiddleware);

// Create and use the rate limiter
if (IS_RATE_LIMIT_ENABLED) {
  v1APIRouter.use(limiter);
}

v1APIRouter.use(bodyParser.json({ limit: "50mb" }));
v1APIRouter.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);

registerPublicTSOARoutes(v1APIRouter);
registerPrivateTSOARoutes(v1APIRouter);

app.use(unAuthenticatedRouter);
app.use(v1APIRouter);

function setRouteTimeout(
  req: express.Request,
  res: express.Response,
  next: NextFunction
) {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).send("Request timed out");
    }
  }, 10000); // 10 seconds

  res.on("finish", () => clearTimeout(timeout));
  next();
}

app.use(setRouteTimeout);

const port = parseInt(process.env.PORT ?? "8585");
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${port}`);
});

server.on("upgrade", async (req, socket, head) => {
  const { data: requestWrapper, error: requestWrapperErr } =
    await RequestWrapper.create(toExpressRequest(req));

  if (requestWrapperErr || !requestWrapper) {
    throw new Error("Error creating request wrapper");
  }
  if (req.url?.startsWith("/v1/gateway/oai/realtime")) {
    webSocketProxyForwarder(requestWrapper, socket, head);
  } else if (req.url?.startsWith("/ws/v1/router/control-plane")) {
    const auth = await authFromRequest(toExpressRequest(req));
    if (auth.error) {
      socket.write(
        JSON.stringify({
          type: "error",
          error: auth.error,
        })
      );
      socket.destroy();
      return;
    } else {
      return webSocketControlPlaneServer(requestWrapper, socket, head);
    }
  } else {
    socket.destroy();
  }
});

// ... existing code ...
server.on("error", console.error);

server.setTimeout(1000 * 60 * 10); // 10 minutes

// This shuts down the server and all delayed operations with delay only locally, on AWS it will be killed by the OS with no delay
// Please wait few minutes before terminating the original task on AWS
async function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log("HTTP server closed.");

    await DelayedOperationService.getInstance().executeShutdown();

    console.log("Graceful shutdown completed.");
    process.exit(0);
  });

  // If server hasn't closed in 30 seconds, force shutdown
  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 30000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
