import { beforeAll, afterAll } from "@jest/globals";
import { testClickhouseDb } from "../src/lib/db/test/TestClickhouseWrapper";

// Ensure test environment for code paths that depend on NODE_ENV
process.env.NODE_ENV = "test";

// Global setup - runs once before all test suites
/**
 * @doc https://jestjs.io/docs/configuration#setupfilesafterenv-array
 */
beforeAll(async () => {
  // Set NODE_ENV to test to ensure we use test database
  console.log(process.env.NODE_ENV, "setting up test env");
}, 30000); // 30 second timeout for setup
