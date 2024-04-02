require("dotenv").config({
  path: "./.env",
});

import express from "express";
import swaggerUi from "swagger-ui-express";
import { legacyRouter } from "./legacy";
import { runLoopsOnce, runMainLoops } from "./mainLoops";
import { authMiddleware } from "./middleware/auth";
import { RegisterRoutes as registerTSOARoutes } from "./tsoa-build/routes";
import * as swaggerDocument from "./tsoa-build/swagger.json";
import { initLogs } from "./utils/injectLogs";
import { initSentry } from "./utils/injectSentry";

export const ENVIRONMENT = process.env.VERCEL_ENV ?? "development";

if (ENVIRONMENT === "production" || process.env.ENABLE_CRON_JOB === "true") {
  runMainLoops();
}

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
app.use(legacyRouter);

const v1APIRouter = express.Router();
const unAuthenticatedRouter = express.Router();
unAuthenticatedRouter.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

v1APIRouter.use(authMiddleware);
v1APIRouter.use(express.json({ limit: "50mb" }));
v1APIRouter.use(express.urlencoded({ limit: "50mb" }));
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
