import express from "express";
import morgan from "morgan";

export function initLogs(router: express.Router) {
  router.use(
    morgan(function (tokens, req, res) {
      // Check if the request is for the specific route
      if (req.url === "/v1/tokens/anthropic" && req.method === "POST") {
        // Skip logging and return null
        return null;
      }

      if (req.url === "/v1/tokens/gpt3" && req.method === "POST") {
        // Skip logging and return null
        return null;
      }

      // Default Morgan combined format
      return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, "content-length"),
        "-",
        tokens["response-time"](req, res),
        "ms",
      ].join(" ");
    })
  );
}
