module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["./setup/jest.setup.ts"],
  testTimeout: 30000, // 30 seconds for database operations
  verbose: true,
};
