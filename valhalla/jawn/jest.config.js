module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "./valhalla/jawn",
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup/jest.setup.ts"],
  testTimeout: 30000, // 30 seconds for database operations
  verbose: true,
};
