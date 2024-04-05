require("dotenv").config({
  path: "./.env",
});

import express from "express";
import swaggerUi from "swagger-ui-express";

import { runLoopsOnce, runMainLoops } from "./mainLoops";
import { authMiddleware } from "./middleware/auth";
import { RegisterRoutes as registerTSOARoutes } from "./tsoa-build/routes";
import * as swaggerDocument from "./tsoa-build/swagger.json";
import { initLogs } from "./utils/injectLogs";
import { initSentry } from "./utils/injectSentry";
import { redisClient } from "./lib/clients/redisClient";
import { IS_RATE_LIMIT_ENABLED, limiter } from "./middleware/ratelimitter";
import { filterSwaggerDocument } from "./utils/filterSwaggerDocument";
import { tokenRouter } from "./lib/routers/tokenRouter";

export const ENVIRONMENT: "production" | "development" = (process.env
  .VERCEL_ENV ?? "development") as any;

if (ENVIRONMENT === "production" || process.env.ENABLE_CRON_JOB === "true") {
  runMainLoops();
}
const allowedOriginsEnv = {
  production: [
    /^https?:\/\/(www\.)?helicone\.ai$/,
    /^https?:\/\/(www\.)?.*-helicone\.vercel\.app$/,
    /^https?:\/\/(www\.)?helicone\.vercel\.app$/,
    /^https?:\/\/(www\.)?helicone-git-valhalla-use-jawn-to-read-helicone\.vercel\.app$/,
  ],
  development: [/^http:\/\/localhost:3000$/, /^http:\/\/localhost:3001$/],
};

const allowedOrigins = allowedOriginsEnv[ENVIRONMENT];

const app = express();

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

app.options("*", (req, res) => {
  if (
    req.headers.origin &&
    allowedOrigins.some((allowedOrigin) =>
      allowedOrigin.test(req.headers.origin ?? "")
    )
  ) {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Helicone-Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.status(200).send();
});

const v1APIRouter = express.Router();
const unAuthenticatedRouter = express.Router();

// Specify tags to hide
const tagsToHide: string[] = ["beta"]; // Adjust based on your Swagger tags

unAuthenticatedRouter.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(filterSwaggerDocument(swaggerDocument as any, tagsToHide))
);

unAuthenticatedRouter.use(
  "/docs-beta",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

unAuthenticatedRouter.use(tokenRouter);

unAuthenticatedRouter.use("/download/swagger.json", (req, res) => {
  res.json(filterSwaggerDocument(swaggerDocument as any, tagsToHide));
});

v1APIRouter.use(authMiddleware);

// Create and use the rate limiter
if (IS_RATE_LIMIT_ENABLED) {
  v1APIRouter.use((req, res) => {
    res.json({
      status: "rate limited",
    });
  });
}

v1APIRouter.use(express.json({ limit: "50mb" }));
v1APIRouter.use(express.urlencoded({ limit: "50mb" }));
registerTSOARoutes(v1APIRouter);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) {
    return next();
  }
  if (allowedOrigins.some((allowedOrigin) => allowedOrigin.test(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Helicone-Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

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
