import { createLogger } from "./lib/logger";
import { getConfig } from "./config";
import { createApp } from "./app";

const cfg = getConfig();
const logger = createLogger(cfg.logLevel);
const app = createApp(cfg, logger);

app
  .listen({ port: cfg.port, host: "0.0.0.0" })
  .then(() => logger.info({ port: cfg.port }, "server listening"))
  .catch((err) => {
    logger.error({ err }, "failed to start server");
    process.exit(1);
  });
