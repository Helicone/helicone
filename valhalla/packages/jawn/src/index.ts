// src/index.ts
import express from "express";
import morgan from "morgan";
import { Client } from "pg";
import { hello } from "helicone-shared-ts";

const app = express();
const environment = process.env.ENV || "development";

// for logs
app.use(morgan("combined"));

app.use(express.json()); // for parsing application/json

app.post("/v1/request", (req, res) => {
  // Handle your logic here
  res.json({ message: "Request received!" });
});

app.get("/healthcheck-db", async (req, res) => {
  const auroraCreds = process.env.AURORA_CREDS || "";
  const auroraHost = process.env.AURORA_HOST;
  const auroraPort = process.env.AURORA_PORT;
  const auroraDb = process.env.AURORA_DATABASE;

  if (!auroraCreds) {
    res.json({ status: "healthy :)", dataBase: "no creds :(" });
    return;
  }

  if (!auroraHost) {
    res.json({ status: "healthy :)", dataBase: "no host :(" });
    return;
  }

  if (!auroraPort) {
    res.json({ status: "healthy :)", dataBase: "no port :(" });
    return;
  }
  const {
    username,
    password,
  }: {
    username: string;
    password: string;
  } = JSON.parse(auroraCreds);

  const client = new Client({
    host: auroraHost,
    port: parseInt(auroraPort),
    user: username,
    password: password,
    database: auroraDb,
    ssl:
      environment === "development"
        ? undefined
        : {
            rejectUnauthorized: true, // This should be set to true for better security
          },
  });

  let databaseStatus = "healthy :)";
  try {
    console.log("Connecting to database...");
    console.log("Host: ", auroraHost);
    console.log("Port: ", auroraPort);
    console.log("User: ", username);
    console.log("Password: ", password);
    await client.connect();

    // Test the connection
    const result = await client.query("SELECT NOW() as now");
    console.log(result);
  } catch (err) {
    databaseStatus = "unhealthy :(" + JSON.stringify(err);
  } finally {
    await client.end();
  }

  res.json({ status: "healthy :)", dataBase: databaseStatus });
});

app.get("/healthcheck", (req, res) => {
  const h = hello();
  console.log("BYE", h, hello.prototype);
  res.json({
    status: "healthy :)",
  });
});

app.listen(8585, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:8585`);
});

console.log("Hello, world!");
