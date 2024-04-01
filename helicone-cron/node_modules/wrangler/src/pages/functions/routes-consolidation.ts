import { MAX_FUNCTIONS_ROUTES_RULE_LENGTH } from "../constants";

/**
 * consolidateRoutes consolidates redundant routes - eg. ["/api/*"", "/api/foo"] -> ["/api/*""]
 * @param routes If this is the same order as Functions routes (with most-specific first),
 *   it will be more efficient to reverse it first. Should be in the format: /api/foo, /api/*
 * @returns Non-redundant list of routes
 */
export function consolidateRoutes(routes: string[]): string[] {
	// First we need to trim any rules that are too long and deduplicate the result
	const routesShortened = Array.from(
		new Set(routes.map((route) => shortenRoute(route)))
	);

	// create a map of the routes
	const routesMap = new Map<string, boolean>();
	for (const route of routesShortened) {
		routesMap.set(route, true);
	}
	// Find routes that might render other routes redundant
	for (const route of routesShortened.filter((r) => r.endsWith("/*"))) {
		// Make sure the route still exists in the map
		if (routesMap.has(route)) {
			// Remove splat at the end, leaving the /
			// eg. /api/* -> /api/
			const routeTrimmed = route.substring(0, route.length - 1);
			for (const nextRoute of routesMap.keys()) {
				// Delete any route that has the wildcard route as a prefix
				if (nextRoute !== route && nextRoute.startsWith(routeTrimmed)) {
					routesMap.delete(nextRoute);
				}
			}
		}
	}
	return Array.from(routesMap.keys());
}

/**
 * Shortens a route until it's within the rule length limit defined in
 * constants.MAX_FUNCTIONS_ROUTES_RULE_LENGTH
 * Eg. /aaa/bbb -> /aaa/*
 * @param routeToShorten Route to shorten if needed
 * @param maxLength Max length of route to try to shorten to
 */
export function shortenRoute(
	routeToShorten: string,
	maxLength: number = MAX_FUNCTIONS_ROUTES_RULE_LENGTH
): string {
	if (routeToShorten.length <= maxLength) {
		return routeToShorten;
	}

	let route = routeToShorten;
	// May have to try multiple times for longer segments
	for (let i = 0; i < routeToShorten.length; i++) {
		// Shorten to the first slash within the limit
		for (let j = maxLength - 1 - i; j > 0; j--) {
			if (route[j] === "/") {
				route = route.slice(0, j) + "/*";
				break;
			}
		}
		if (route.length <= maxLength) {
			break;
		}
	}

	// If we failed to shorten it, fall back to include-all rather than breaking
	if (route.length > maxLength) {
		route = "/*";
	}
	return route;
}
