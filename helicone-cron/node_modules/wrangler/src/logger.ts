import { format } from "node:util";
import { formatMessagesSync } from "esbuild";
import { getEnvironmentVariableFactory } from "./environment-variables";
import type { BuildFailure } from "esbuild";

export const LOGGER_LEVELS = {
	none: -1,
	error: 0,
	warn: 1,
	info: 2,
	log: 3,
	debug: 4,
} as const;

export type LoggerLevel = keyof typeof LOGGER_LEVELS;

/** A map from LOGGER_LEVEL to the error `kind` needed by `formatMessagesSync()`. */
const LOGGER_LEVEL_FORMAT_TYPE_MAP = {
	error: "error",
	warn: "warning",
	info: undefined,
	log: undefined,
	debug: undefined,
} as const;

const getLogLevelFromEnv = getEnvironmentVariableFactory({
	variableName: "WRANGLER_LOG",
	defaultValue: "log",
});

class Logger {
	constructor() {}

	loggerLevel: LoggerLevel = (getLogLevelFromEnv() as LoggerLevel) ?? "log";
	columns = process.stdout.columns;

	debug = (...args: unknown[]) => this.doLog("debug", args);
	info = (...args: unknown[]) => this.doLog("info", args);
	log = (...args: unknown[]) => this.doLog("log", args);
	warn = (...args: unknown[]) => this.doLog("warn", args);
	error = (...args: unknown[]) => this.doLog("error", args);

	private doLog(messageLevel: Exclude<LoggerLevel, "none">, args: unknown[]) {
		if (LOGGER_LEVELS[this.loggerLevel] >= LOGGER_LEVELS[messageLevel]) {
			console[messageLevel](this.formatMessage(messageLevel, format(...args)));
		}
	}

	private formatMessage(
		level: Exclude<LoggerLevel, "none">,
		message: string
	): string {
		const kind = LOGGER_LEVEL_FORMAT_TYPE_MAP[level];
		if (kind) {
			// Format the message using the esbuild formatter.
			// The first line of the message is the main `text`,
			// subsequent lines are put into the `notes`.
			const [firstLine, ...otherLines] = message.split("\n");
			const notes =
				otherLines.length > 0
					? otherLines.map((text) => ({ text }))
					: undefined;
			return formatMessagesSync([{ text: firstLine, notes }], {
				color: true,
				kind,
				terminalWidth: this.columns,
			})[0];
		} else {
			return message;
		}
	}
}

/**
 * A drop-in replacement for `console` for outputting logging messages.
 *
 * Errors and Warnings will get additional formatting to highlight them to the user.
 * You can also set a `logger.loggerLevel` value to one of "debug", "log", "warn" or "error",
 * to filter out logging messages.
 */
export const logger = new Logger();

/**
 * Logs all errors/warnings associated with an esbuild BuildFailure in the same
 * style esbuild would.
 */
export function logBuildFailure(failure: BuildFailure) {
	let logs = formatMessagesSync(failure.errors, { kind: "error", color: true });
	for (const log of logs) console.error(log);
	logs = formatMessagesSync(failure.warnings, { kind: "warning", color: true });
	for (const log of logs) console.warn(log);
}
