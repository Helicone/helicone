/**
 * Jest setup file for e2e tests
 */

import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file if it exists
dotenv.config({ path: path.join(__dirname, "../.env") });

// Set default environment variables for tests
process.env.GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:8793";

// Global test setup
beforeAll(() => {
  console.log("🚀 Starting E2E tests");
  console.log(`Gateway URL: ${process.env.GATEWAY_URL}`);
});

afterAll(() => {
  console.log("✅ E2E tests completed");
});
