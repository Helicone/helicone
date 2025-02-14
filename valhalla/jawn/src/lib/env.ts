import path from "path";

console.log("Loading environment variables...");
// This ensures env is only loaded once
if (!process.env.HELICONE_ENV_LOADED) {
  const envPath = path.resolve(__dirname, "../../.env");

  require("dotenv").config({
    path: envPath,
  });
  process.env.HELICONE_ENV_LOADED = "true";
}

export const envLoaded = true;
