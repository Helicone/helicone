// src/index.ts
import express from "express";
import morgan from "morgan";
import { ValhallaDB } from "helicone-shared-ts";

require("dotenv").config({
  path: "./.env",
});

const app = express();

// for logs
app.use(morgan("combined"));

app.use(express.json()); // for parsing application/json

app.post("/v1/request", (req, res) => {
  // Handle your logic here
  res.json({ message: "Request received!" });
});

app.get("/healthcheck-db", async (req, res) => {
  const valhallaDB = new ValhallaDB();
  const now = await valhallaDB.now();
  if (now.error) {
    res.json({ status: "unhealthy :(", error: now.error });
    return;
  }

  res.json({ status: "healthy :)", dataBase: now.data?.rows });
});

app.get("/healthcheck", (req, res) => {
  res.json({
    status: "healthy :)",
  });
});

app.listen(8585, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:8585`);
});

console.log("Hello, world!");
