import { toUrlPath } from "../../paths";
import {
	MAX_FUNCTIONS_ROUTES_RULES,
	ROUTES_SPEC_VERSION,
	ROUTES_SPEC_DESCRIPTION,
} from "../constants";
import {
	compareRoutes,
	convertRoutesToGlobPatterns,
	convertRoutesToRoutesJSONSpec,
	optimizeRoutesJSONSpec,
} from "./routes-transformation";

// TODO: make a convenience function for creating a list
// of `convertRoutesToGlobPatterns` inputs from a string array
describe("route-paths-to-glob-patterns", () => {
	describe("convertRoutePathsToGlobPatterns()", () => {
		it("should pass through routes with no wildcards", () => {
			expect(
				convertRoutesToGlobPatterns([{ routePath: toUrlPath("/api/foo") }])
			).toEqual(["/api/foo"]);
			expect(
				convertRoutesToGlobPatterns([
					{ routePath: toUrlPath("/api/foo") },
					{ routePath: toUrlPath("/api/bar") },
				])
			).toEqual(["/api/foo", "/api/bar"]);
			expect(
				convertRoutesToGlobPatterns([
					{ routePath: toUrlPath("/api/foo") },
					{ routePath: toUrlPath("/api/bar/foo") },
					{ routePath: toUrlPath("/foo/bar") },
				])
			).toEqual(["/api/foo", "/api/bar/foo", "/foo/bar"]);
		});

		it("should escalate a single param route to a wildcard", () => {
			expect(
				convertRoutesToGlobPatterns([{ routePath: toUrlPath("/api/:foo") }])
			).toEqual(["/api/*"]);
			expect(
				convertRoutesToGlobPatterns([{ routePath: toUrlPath("/api/foo/:bar") }])
			).toEqual(["/api/foo/*"]);
			expect(
				convertRoutesToGlobPatterns([
					{ routePath: toUrlPath("/bar/:barId/foo") },
				])
			).toEqual(["/bar/*"]);
			expect(
				convertRoutesToGlobPatterns([
					{ routePath: toUrlPath("/bar/:barId/foo/:fooId") },
				])
			).toEqual(["/bar/*"]);
			expect(
				convertRoutesToGlobPatterns([
					{ routePath: toUrlPath("/api/:foo") },
					{ routePath: toUrlPath("/bar/:barName/profile") },
					{ routePath: toUrlPath("/foo/bar/:barId/:fooId") },
				])
			).toEqual(["/api/*", "/bar/*", "/foo/bar/*"]);
		});

		it("should pass through a single wildcard route", () => {
			expect(
				convertRoutesToGlobPatterns([{ routePath: toUrlPath("/api/:baz*") }])
			).toEqual(["/api/*"]);
			expect(
				convertRoutesToGlobPatterns([
					{ routePath: toUrlPath("/api/foo/bar/:baz*") },
				])
			).toEqual(["/api/foo/bar/*"]);
			expect(
				convertRoutesToGlobPatterns([
					{ routePath: toUrlPath("/api/:foo/:bar*") },
				])
			).toEqual(["/api/*"]);
			expect(
				convertRoutesToGlobPatterns([
					{ routePath: toUrlPath("/foo/:foo*/bar/:bar*") },
				])
			).toEqual(["/foo/*"]);
			expect(
				convertRoutesToGlobPatterns([
					{ routePath: toUrlPath("/foo/:foo/bar/:bar*") },
				])
			).toEqual(["/foo/*"]);
			expect(
				convertRoutesToGlobPatterns([
					{ routePath: toUrlPath("/api/:baz*") },
					{ routePath: toUrlPath("/api/foo/bar/:baz*") },
					{ routePath: toUrlPath("/api/:foo/:bar*") },
				])
			).toEqual(["/api/*", "/api/foo/bar/*"]);
		});

		it("should deduplicate identical rules", () => {
			expect(
				convertRoutesToGlobPatterns([
					{ routePath: toUrlPath("/api/foo") },
					{ routePath: toUrlPath("/api/foo") },
				])
			).toEqual(["/api/foo"]);
			expect(
				convertRoutesToGlobPatterns([
					{ routePath: toUrlPath("/api/foo/bar") },
					{ routePath: toUrlPath("/foo/bar") },
					{ routePath: toUrlPath("/api/foo/bar") },
				])
			).toEqual(["/api/foo/bar", "/foo/bar"]);
			expect(
				convertRoutesToGlobPatterns([
					{ routePath: toUrlPath("/api/foo/:bar") },
					{ routePath: toUrlPath("/api/foo") },
					{ routePath: toUrlPath("/api/foo/:fooId/bar") },
					{ routePath: toUrlPath("/api/foo/*") },
				])
			).toEqual(["/api/foo/*", "/api/foo"]);
			expect(
				convertRoutesToGlobPatterns([
					{ routePath: toUrlPath("/api/:baz*") },
					{ routePath: toUrlPath("/api/:foo") },
				])
			).toEqual(["/api/*"]);
		});

		it("should handle middleware mounting", () => {
			expect(
				convertRoutesToGlobPatterns([
					{
						routePath: toUrlPath("/middleware"),
						middleware: ["./some-middleware.ts"],
					},
				])
			).toEqual(["/middleware/*"]);

			expect(
				convertRoutesToGlobPatterns([
					{
						routePath: toUrlPath("/middleware"),
						middleware: "./some-middleware.ts",
					},
				])
			).toEqual(["/middleware/*"]);

			expect(
				convertRoutesToGlobPatterns([
					{
						routePath: toUrlPath("/middleware"),
						middleware: [],
					},
				])
			).toEqual(["/middleware"]);
		});
	});

	describe("convertRoutesToRoutesJSONSpec()", () => {
		it("should convert and consolidate routes into JSONSpec", () => {
			expect(
				convertRoutesToRoutesJSONSpec([
					{ routePath: toUrlPath("/api/foo/bar") },
					{ routePath: toUrlPath("/foo/bar") },
					{ routePath: toUrlPath("/foo/:bar") },
					{ routePath: toUrlPath("/api/foo/bar") },
					{
						routePath: toUrlPath("/middleware"),
						middleware: "./some-middleware.ts",
					},
				])
			).toEqual({
				version: ROUTES_SPEC_VERSION,
				description: ROUTES_SPEC_DESCRIPTION,
				include: ["/middleware/*", "/foo/*", "/api/foo/bar"],
				exclude: [],
			});
		});

		it("should truncate all routes if over limit", () => {
			const routes = [];
			for (let i = 0; i < MAX_FUNCTIONS_ROUTES_RULES + 1; i++) {
				routes.push({ routePath: toUrlPath(`/api/foo-${i}`) });
			}
			expect(convertRoutesToRoutesJSONSpec(routes)).toEqual({
				version: ROUTES_SPEC_VERSION,
				description: ROUTES_SPEC_DESCRIPTION,
				include: ["/*"],
				exclude: [],
			});
		});

		it("should allow max routes", () => {
			const routes = [];
			for (let i = 0; i < MAX_FUNCTIONS_ROUTES_RULES; i++) {
				routes.push({ routePath: toUrlPath(`/api/foo-${i}`) });
			}
			expect(convertRoutesToRoutesJSONSpec(routes).include.length).toEqual(
				MAX_FUNCTIONS_ROUTES_RULES
			);
		});
	});

	describe("optimizeRoutesJSONSpec()", () => {
		it("should convert and consolidate routes into JSONSpec", () => {
			expect(
				optimizeRoutesJSONSpec({
					version: ROUTES_SPEC_VERSION,
					description: ROUTES_SPEC_DESCRIPTION,
					exclude: [],
					include: [
						"/api/foo/bar",
						"/foo/bar",
						"/foo/*",
						"/api/foo/bar",
						"/middleware/*",
					],
				})
			).toEqual({
				version: ROUTES_SPEC_VERSION,
				description: ROUTES_SPEC_DESCRIPTION,
				include: ["/middleware/*", "/foo/*", "/api/foo/bar"],
				exclude: [],
			});
		});

		it("should truncate all routes if over limit", () => {
			const include: string[] = [];
			for (let i = 0; i < MAX_FUNCTIONS_ROUTES_RULES + 1; i++) {
				include.push(`/api/foo-${i}`);
			}
			expect(
				optimizeRoutesJSONSpec({
					version: ROUTES_SPEC_VERSION,
					description: ROUTES_SPEC_DESCRIPTION,
					include,
					exclude: [],
				})
			).toEqual({
				version: ROUTES_SPEC_VERSION,
				description: ROUTES_SPEC_DESCRIPTION,
				include: ["/*"],
				exclude: [],
			});
		});

		it("should allow max routes", () => {
			const include: string[] = [];
			for (let i = 0; i < MAX_FUNCTIONS_ROUTES_RULES; i++) {
				include.push(`/api/foo-${i}`);
			}
			expect(
				optimizeRoutesJSONSpec({
					version: ROUTES_SPEC_VERSION,
					description: ROUTES_SPEC_DESCRIPTION,
					include,
					exclude: [],
				}).include.length
			).toEqual(MAX_FUNCTIONS_ROUTES_RULES);
		});
	});

	describe("compareRoutes()", () => {
		describe("compareRoutes()", () => {
			test("routes / last", () => {
				expect(compareRoutes("/", "/foo")).toBeGreaterThanOrEqual(1);
				expect(compareRoutes("/", "/*")).toBeGreaterThanOrEqual(1);
			});

			test("routes with fewer segments come after those with more segments", () => {
				expect(compareRoutes("/foo", "/foo/bar")).toBeGreaterThanOrEqual(1);
				expect(compareRoutes("/foo", "/foo/bar/cat")).toBeGreaterThanOrEqual(1);
			});

			test("routes with wildcard segments come after those without", () => {
				expect(compareRoutes("/*", "/foo")).toBe(1);
				expect(compareRoutes("/foo/*", "/foo/bar")).toBe(1);
			});

			test("routes with dynamic segments occurring earlier come after those with dynamic segments in later positions", () => {
				expect(compareRoutes("/foo/*/bar", "/foo/bar/*")).toBe(1);
			});
		});
	});
});
