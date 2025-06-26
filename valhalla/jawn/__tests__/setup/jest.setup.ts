import { beforeAll, afterAll } from "@jest/globals";
import { testClickhouseDb } from "../../src/lib/db/TestClickhouseWrapper";

// Global setup - runs once before all test suites
/**
 * @doc https://jestjs.io/docs/configuration#setupfilesafterenv-array
 */
beforeAll(async () => {
  console.log("Setting up test database...");

  // Set NODE_ENV to test to ensure we use test database
  process.env.NODE_ENV = "test";

  // Create test database
  const createDbResult = await testClickhouseDb.createTestDatabase();
  if (createDbResult.error) {
    console.error("Failed to create test database:", createDbResult.error);
    throw new Error(`Failed to create test database: ${createDbResult.error}`);
  }

  // Create tables
  const createTablesResult = await testClickhouseDb.createTables();
  if (createTablesResult.error) {
    console.error("Failed to create test tables:", createTablesResult.error);
    throw new Error(
      `Failed to create test tables: ${createTablesResult.error}`
    );
  }

  // Insert initial test data
  const insertDataResult = await testClickhouseDb.insertTestData();
  if (insertDataResult.error) {
    console.error("Failed to insert test data:", insertDataResult.error);
    throw new Error(`Failed to insert test data: ${insertDataResult.error}`);
  }

  console.log("Test database setup complete");
}, 30000); // 30 second timeout for setup

// Global teardown - runs once after all tests
afterAll(async () => {
  console.log("Cleaning up test database...");

  // Drop tables
  const dropTablesResult = await testClickhouseDb.dropTables();
  if (dropTablesResult.error) {
    console.error("Failed to drop test tables:", dropTablesResult.error);
  }

  // Drop test database
  const dropDbResult = await testClickhouseDb.dropTestDatabase();
  if (dropDbResult.error) {
    console.error("Failed to drop test database:", dropDbResult.error);
  }

  console.log("Test database cleanup complete");
}, 30000); // 30 second timeout for cleanup
