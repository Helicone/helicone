import {
	MAX_FUNCTIONS_ROUTES_RULES,
	MAX_FUNCTIONS_ROUTES_RULE_LENGTH,
	ROUTES_SPEC_VERSION,
} from "./constants";
import { RoutesValidationError } from "./functions/routes-validation";

/**
 * Exit code for `pages functions build` when no routes are found.
 */
export const EXIT_CODE_FUNCTIONS_NO_ROUTES_ERROR = 156;

/**
 * Pages error when no routes are found in the functions directory
 */
export class FunctionsNoRoutesError extends Error {
	constructor(message: string) {
		super(message);
	}
}

/**
 * Warning message for when buildFunctions throws FunctionsNoRoutesError
 */
export function getFunctionsNoRoutesWarning(
	functionsDirectory: string,
	suffix?: string
) {
	return `No routes found when building Functions directory: ${functionsDirectory}${
		suffix ? " - " + suffix : ""
	}`;
}

export function getRoutesValidationErrorMessage(
	errorCode: RoutesValidationError,
	routesPath: string
): string {
	switch (errorCode) {
		case RoutesValidationError.NO_INCLUDE_RULES:
			return `Invalid _routes.json file found at: ${routesPath}
Routes must have at least 1 include rule, but no include rules were detected.`;
		case RoutesValidationError.TOO_MANY_RULES:
			return `Invalid _routes.json file found at: ${routesPath}
Detected rules that are over the ${MAX_FUNCTIONS_ROUTES_RULES} rule limit. Please make sure you have a total of ${MAX_FUNCTIONS_ROUTES_RULES} include and exclude rules combined.`;
		case RoutesValidationError.RULE_TOO_LONG:
			return `Invalid _routes.json file found at: ${routesPath}
Detected rules the are over the ${MAX_FUNCTIONS_ROUTES_RULE_LENGTH} character limit. Please make sure that each include and exclude routing rule is at most ${MAX_FUNCTIONS_ROUTES_RULE_LENGTH} characters long.`;
		case RoutesValidationError.INVALID_RULES:
			return `Invalid _routes.json file found at: ${routesPath}
All rules must start with '/'.`;
		case RoutesValidationError.OVERLAPPING_RULES:
			return `Invalid _routes.json file found at: ${routesPath}
Overlapping rules found. Please make sure that rules ending with a splat (eg. "/api/*") don't overlap any other rules (eg. "/api/foo"). This applies to both include and exclude rules individually.`;
		case RoutesValidationError.INVALID_JSON_SPEC:
		default:
			return `Invalid _routes.json file found at: ${routesPath}
Please make sure the JSON object has the following format:
{
	version: ${ROUTES_SPEC_VERSION};
	include: string[];
	exclude: string[];
}
and that at least one include rule is provided.
			`;
	}
}
