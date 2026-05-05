import { z } from "zod";

/**
 * Wraps a Zod schema with a preprocessing step that parses JSON strings.
 * Some MCP clients (e.g. Claude Code) serialize complex object parameters
 * as JSON strings rather than native objects. This ensures validation
 * still works regardless of how the client sends the data.
 */
export function jsonPreprocess<T extends z.ZodTypeAny>(schema: T) {
	return z.preprocess((val) => {
		if (typeof val === "string" && val !== "all") {
			try { return JSON.parse(val); } catch { return val; }
		}
		return val;
	}, schema);
}
