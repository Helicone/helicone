import path from "path";

console.log("Loading environment variables...");
// This ensures env is only loaded once
if (!process.env.HELICONE_ENV_LOADED) {
  const envPath = path.resolve(__dirname, "../../.env");
  console.log("Loading .env from:", envPath);

  const result = require("dotenv").config({
    path: envPath,
  });

  if (result.error) {
    console.error("Error loading .env file:", result.error);
    process.exit(1);
  }

  console.log("Environment variables loaded successfully");
  process.env.HELICONE_ENV_LOADED = "true";
}

export const envLoaded = true;
