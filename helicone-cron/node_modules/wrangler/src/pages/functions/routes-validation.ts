import { FatalError } from "../../errors";
import {
	MAX_FUNCTIONS_ROUTES_RULES,
	MAX_FUNCTIONS_ROUTES_RULE_LENGTH,
	ROUTES_SPEC_VERSION,
} from "../constants";
import { getRoutesValidationErrorMessage } from "../errors";
import type { RoutesJSONSpec } from "./routes-transformation";

/* eslint-disable-next-line no-shadow */
export enum RoutesValidationError {
	INVALID_JSON_SPEC,
	NO_INCLUDE_RULES,
	INVALID_RULES,
	TOO_MANY_RULES,
	RULE_TOO_LONG,
	OVERLAPPING_RULES,
}

/**
 *  Check if given routes data is a valid RoutesJSONSpec
 */
export function isRoutesJSONSpec(data: unknown): data is RoutesJSONSpec {
	return (
		(typeof data === "object" &&
			data &&
			"version" in data &&
			typeof (data as RoutesJSONSpec).version === "number" &&
			(data as RoutesJSONSpec).version === ROUTES_SPEC_VERSION &&
			Array.isArray((data as RoutesJSONSpec).include) &&
			Array.isArray((data as RoutesJSONSpec).exclude)) ||
		false
	);
}

export function validateRoutes(routesJSON: RoutesJSONSpec, routesPath: string) {
	if (!isRoutesJSONSpec(routesJSON)) {
		throw new FatalError(
			getRoutesValidationErrorMessage(
				RoutesValidationError.INVALID_JSON_SPEC,
				routesPath
			),
			1
		);
	}

	if (!hasIncludeRules(routesJSON)) {
		throw new FatalError(
			getRoutesValidationErrorMessage(
				RoutesValidationError.NO_INCLUDE_RULES,
				routesPath
			),
			1
		);
	}

	if (!hasValidRulesCount(routesJSON)) {
		throw new FatalError(
			getRoutesValidationErrorMessage(
				RoutesValidationError.TOO_MANY_RULES,
				routesPath
			),
			1
		);
	}

	if (!hasValidRuleCharCount(routesJSON)) {
		throw new FatalError(
			getRoutesValidationErrorMessage(
				RoutesValidationError.RULE_TOO_LONG,
				routesPath
			),
			1
		);
	}

	if (!hasValidRules(routesJSON)) {
		throw new FatalError(
			getRoutesValidationErrorMessage(
				RoutesValidationError.INVALID_RULES,
				routesPath
			),
			1
		);
	}

	if (
		hasOverlappingRules(routesJSON.include) ||
		hasOverlappingRules(routesJSON.exclude)
	) {
		throw new FatalError(
			getRoutesValidationErrorMessage(
				RoutesValidationError.OVERLAPPING_RULES,
				routesPath
			),
			1
		);
	}
}

/**
 * Returns true if the given `routingSpec` object contains at least
 * `MIN_FUNCTIONS_ROUTES_INCLUDE_RULES` include routing rules
 */
function hasIncludeRules(routesJSON: RoutesJSONSpec): boolean {
	// sanity check
	// this should never be the case, because of the context from which these validation fns are
	// called, but let's not assume anything
	if (!routesJSON || !routesJSON.include) {
		throw new Error(
			"Function `hasIncludeRules` was called out of context. Attempting to validate include rules for routes that are undefined or an invalid RoutesJSONSpec"
		);
	}

	return routesJSON?.include?.length > 0;
}

/**
 * Returns true if the given `routesJSON` object contains at most MAX_FUNCTIONS_ROUTES_RULES
 * include and exclude routing rules, combined
 */
function hasValidRulesCount(routesJSON: RoutesJSONSpec): boolean {
	// sanity check
	if (!routesJSON || !routesJSON.include || !routesJSON.exclude) {
		throw new Error(
			"Function `hasValidRulesCount` was called out of context. Attempting to validate maximum rules count for routes that are undefined or an invalid RoutesJSONSpec"
		);
	}

	return (
		routesJSON.include.length + routesJSON.exclude.length <=
		MAX_FUNCTIONS_ROUTES_RULES
	);
}

/**
 * Returns true if each individual routing rule of the given `routesJSON` object is at most
 * MAX_FUNCTIONS_ROUTES_RULE_LENGTH characters long
 */
function hasValidRuleCharCount(routesJSON: RoutesJSONSpec): boolean {
	// sanity check
	if (!routesJSON || !routesJSON.include || !routesJSON.exclude) {
		throw new Error(
			"Function `hasValidRuleCharCount` was called out of context. Attempting to validate rules maximum character count for routes that are undefined or an invalid RoutesJSONSpec"
		);
	}

	const rules = [...routesJSON.include, ...routesJSON.exclude];
	return (
		rules.filter((rule) => rule.length > MAX_FUNCTIONS_ROUTES_RULE_LENGTH)
			.length === 0
	);
}

/**
 * Returns true if each individual routing rule of the given `routesJSON` object is valid.
 * We consider a rule to be valid if it is prefixed by slash ('/')
 */
function hasValidRules(routesJSON: RoutesJSONSpec): boolean {
	// sanity check
	if (!routesJSON || !routesJSON.include || !routesJSON.exclude) {
		throw new Error(
			"Function `hasValidRules` was called out of context. Attempting to validate rules for routes that are undefined or an invalid RoutesJSONSpec"
		);
	}

	const rules = [...routesJSON.include, ...routesJSON.exclude];
	return rules.filter((rule) => !rule.match(/^\//)).length === 0;
}

/**
 * Returns true if the given routes array has overlapping routing rules (eg. ["/api/*"", "/api/foo"])
 *
 * based on `consolidateRoutes()`
 * 🚨 O(n2) time complexity 🚨
 */
function hasOverlappingRules(routes: string[]): boolean {
	if (!routes) {
		throw new Error(
			"Function `hasverlappingRules` was called out of context. Attempting to validate rules for routes that are undefined"
		);
	}

	// Find routes that might render other routes redundant
	const endingSplatRoutes = routes.filter((route) => route.endsWith("/*"));

	for (let i = 0; i < endingSplatRoutes.length; i++) {
		const crrRoute = endingSplatRoutes[i];
		// Remove splat at the end, leaving the /
		// eg. /api/* -> /api/
		const crrRouteTrimmed = crrRoute.substring(0, crrRoute.length - 1);

		for (let j = 0; j < routes.length; j++) {
			const nextRoute = routes[j];
			if (nextRoute !== crrRoute && nextRoute.startsWith(crrRouteTrimmed)) {
				return true;
			}
		}
	}

	return false;
}
