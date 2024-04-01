import { logger } from "../logger";
import { mockConsoleMethods } from "./helpers/mock-console";

describe("logger", () => {
	const std = mockConsoleMethods();

	it("should add colored markers to error and warning messages", () => {
		logger.loggerLevel = "debug";
		logger.debug("This is a debug message");
		logger.log("This is a log message");
		logger.warn("This is a warn message");
		logger.error("This is a error message");

		expect(std.debug).toMatchInlineSnapshot(`"This is a debug message"`);
		expect(std.out).toMatchInlineSnapshot(`"This is a log message"`);
		expect(std.warn).toMatchInlineSnapshot(`
      "[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mThis is a warn message[0m

      "
    `);
		expect(std.err).toMatchInlineSnapshot(`
      "[31mX [41;31m[[41;97mERROR[41;31m][0m [1mThis is a error message[0m

      "
    `);
	});

	describe("loggerLevel=debug", () => {
		it("should render messages that are at or above the log level set in the logger", () => {
			logger.loggerLevel = "debug";
			logger.debug("This is a debug message");
			logger.log("This is a log message");
			logger.warn("This is a warn message");
			logger.error("This is a error message");

			expect(std.debug).toMatchInlineSnapshot(`"This is a debug message"`);
			expect(std.out).toMatchInlineSnapshot(`"This is a log message"`);
			expect(std.warn).toMatchInlineSnapshot(`
        "[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mThis is a warn message[0m

        "
      `);
			expect(std.err).toMatchInlineSnapshot(`
        "[31mX [41;31m[[41;97mERROR[41;31m][0m [1mThis is a error message[0m

        "
      `);
		});
	});

	describe("loggerLevel=log", () => {
		it("should render messages that are at or above the log level set in the logger", () => {
			logger.loggerLevel = "log";
			logger.debug("This is a debug message");
			logger.log("This is a log message");
			logger.warn("This is a warn message");
			logger.error("This is a error message");

			expect(std.debug).toMatchInlineSnapshot(`""`);
			expect(std.out).toMatchInlineSnapshot(`"This is a log message"`);
			expect(std.warn).toMatchInlineSnapshot(`
        "[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mThis is a warn message[0m

        "
      `);
			expect(std.err).toMatchInlineSnapshot(`
        "[31mX [41;31m[[41;97mERROR[41;31m][0m [1mThis is a error message[0m

        "
      `);
		});
	});

	describe("loggerLevel=warn", () => {
		it("should render messages that are at or above the log level set in the logger", () => {
			logger.loggerLevel = "warn";
			logger.debug("This is a debug message");
			logger.log("This is a log message");
			logger.warn("This is a warn message");
			logger.error("This is a error message");

			expect(std.debug).toMatchInlineSnapshot(`""`);
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`
        "[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mThis is a warn message[0m

        "
      `);
			expect(std.err).toMatchInlineSnapshot(`
        "[31mX [41;31m[[41;97mERROR[41;31m][0m [1mThis is a error message[0m

        "
      `);
		});
	});

	describe("loggerLevel=error", () => {
		it("should render messages that are at or above the log level set in the logger", () => {
			logger.loggerLevel = "error";
			logger.debug("This is a debug message");
			logger.log("This is a log message");
			logger.warn("This is a warn message");
			logger.error("This is a error message");

			expect(std.debug).toMatchInlineSnapshot(`""`);
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`
        "[31mX [41;31m[[41;97mERROR[41;31m][0m [1mThis is a error message[0m

        "
      `);
		});
	});

	describe("loggerLevelFromEnvVar=error", () => {
		beforeEach(() => {
			process.env.WRANGLER_LOG = "error";
		});
		afterEach(() => {
			process.env.WRANGLER_LOG = undefined;
		});

		it("should render messages that are at or above the log level set in the env var", () => {
			logger.loggerLevel = "error";
			logger.debug("This is a debug message");
			logger.log("This is a log message");
			logger.warn("This is a warn message");
			logger.error("This is a error message");

			expect(std.debug).toMatchInlineSnapshot(`""`);
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`
        "[31mX [41;31m[[41;97mERROR[41;31m][0m [1mThis is a error message[0m

        "
      `);
		});
	});
});
