import { join as pathJoin } from "node:path";
import { toUrlPath } from "../../paths";
import {
	MAX_FUNCTIONS_ROUTES_RULES,
	ROUTES_SPEC_DESCRIPTION,
	ROUTES_SPEC_VERSION,
} from "../constants";
import { consolidateRoutes } from "./routes-consolidation";
import type { RouteConfig } from "./routes";

/** Interface for _routes.json */
export interface RoutesJSONSpec {
	version: typeof ROUTES_SPEC_VERSION;
	description?: string;
	include: string[];
	exclude: string[];
}

type RoutesJSONRouteInput = Pick<RouteConfig, "routePath" | "middleware">[];

export function convertRoutesToGlobPatterns(
	routes: RoutesJSONRouteInput
): string[] {
	const convertedRoutes = routes.map(({ routePath, middleware }) => {
		const globbedRoutePath: string = routePath.replace(/:\w+\*?.*/, "*");

		// Middleware mountings need to end in glob so that they can handle their
		// own sub-path routes
		if (
			typeof middleware === "string" ||
			(Array.isArray(middleware) && middleware.length > 0)
		) {
			if (!globbedRoutePath.endsWith("*")) {
				return toUrlPath(pathJoin(globbedRoutePath, "*"));
			}
		}

		return toUrlPath(globbedRoutePath);
	});

	return Array.from(new Set(convertedRoutes));
}

/**
 * Converts Functions routes like /foo/:bar to a Routing object that's used
 * to determine if a request should run in the Functions user-worker.
 * Also consolidates redundant routes such as [/foo/bar, /foo/:bar] -> /foo/*
 *
 * @returns RoutesJSONSpec to be written to _routes.json
 */
export function convertRoutesToRoutesJSONSpec(
	routes: RoutesJSONRouteInput
): RoutesJSONSpec {
	// The initial routes coming in are sorted most-specific to least-specific.
	// The order doesn't have any affect on the output of this function, but
	// it should speed up route consolidation with less-specific routes being first.
	const reversedRoutes = [...routes].reverse();
	const include = convertRoutesToGlobPatterns(reversedRoutes);
	return optimizeRoutesJSONSpec({
		version: ROUTES_SPEC_VERSION,
		description: ROUTES_SPEC_DESCRIPTION,
		include,
		exclude: [],
	});
}

/**
 * Optimizes and returns a new Routes JSON Spec instance performing
 * de-duping, consolidation, truncation, and sorting
 */
export function optimizeRoutesJSONSpec(spec: RoutesJSONSpec): RoutesJSONSpec {
	const optimizedSpec = { ...spec };

	let consolidatedRoutes = consolidateRoutes(optimizedSpec.include);
	if (consolidatedRoutes.length > MAX_FUNCTIONS_ROUTES_RULES) {
		consolidatedRoutes = ["/*"];
	}
	// Sort so that least-specific routes are first
	consolidatedRoutes.sort((a, b) => compareRoutes(b, a));

	optimizedSpec.include = consolidatedRoutes;

	return optimizedSpec;
}

/**
 * Simplified routes comparison (copied from the one in filepath-routing.)
 * This version will sort most-specific to least-specific, but the input is simplified
 * routes like /foo/*, /foo, etc
 */
export function compareRoutes(routeA: string, routeB: string) {
	function parseRoutePath(routePath: string): string[] {
		return routePath.slice(1).split("/").filter(Boolean);
	}

	const segmentsA = parseRoutePath(routeA);
	const segmentsB = parseRoutePath(routeB);

	// sort routes with fewer segments after those with more segments
	if (segmentsA.length !== segmentsB.length) {
		return segmentsB.length - segmentsA.length;
	}

	for (let i = 0; i < segmentsA.length; i++) {
		const isWildcardA = segmentsA[i].includes("*");
		const isWildcardB = segmentsB[i].includes("*");

		// sort wildcard segments after non-wildcard segments
		if (isWildcardA && !isWildcardB) return 1;
		if (!isWildcardA && isWildcardB) return -1;
	}

	// all else equal, just sort the paths lexicographically
	return routeA.localeCompare(routeB);
}
