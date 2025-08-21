import { beforeAll, afterAll } from "@jest/globals";
import { testClickhouseDb } from "../src/lib/db/test/RealClickhouseWrapper";

// Global setup - runs once before all test suites
/**
 * @doc https://jestjs.io/docs/configuration#setupfilesafterenv-array
 */
beforeAll(async () => {
  // Set NODE_ENV to test to ensure we use test database
  console.log(process.env.NODE_ENV, "setting up test env");
}, 30000); // 30 second timeout for setup
