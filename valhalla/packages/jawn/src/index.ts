// src/index.ts
import express, { Request, Response } from "express";
import morgan from "morgan";
import { createValhallaClient, withDB, withAuth } from "helicone-shared-ts";

require("dotenv").config({
  path: "./.env",
});

const app = express();

// for logs
app.use(morgan("combined"));

app.use(express.json()); // for parsing application/json

app.post(
  "/v1/request",
  withAuth(({ req, res, supabaseClient }) => {
    // Handle your logic here
    res.json({
      message: "Request received! :)",
      orgId: supabaseClient.organizationId,
    });
  })
);

app.get(
  "/healthcheck-db",
  withDB(async ({ db, req, res }) => {
    const now = await db.now();
    if (now.error) {
      res.json({ status: "unhealthy :(", error: now.error });
      return;
    }
    res.json({ status: "healthy :)", dataBase: now.data?.rows });
  })
);

app.get("/healthcheck", (req, res) => {
  res.json({
    status: "healthy :)",
  });
});

app.listen(8585, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:8585`);
});

console.log("Hello, world!");
