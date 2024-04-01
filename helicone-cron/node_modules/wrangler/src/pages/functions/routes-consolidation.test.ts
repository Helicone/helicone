import { consolidateRoutes, shortenRoute } from "./routes-consolidation";

describe("route-consolidation", () => {
	const maxRuleLength = 100; // from constants.MAX_FUNCTIONS_ROUTES_RULE_LENGTH
	describe("consolidateRoutes()", () => {
		it("should consolidate redundant routes", () => {
			expect(consolidateRoutes(["/api/foo", "/api/*"])).toEqual(["/api/*"]);
			expect(
				consolidateRoutes([
					"/api/foo",
					"/api/foo/*",
					"/api/bar/*",
					"/api/*",
					"/foo",
					"/foo/bar",
					"/bar/*",
					"/bar/baz/*",
					"/bar/baz/hello",
				])
			).toEqual(["/api/*", "/foo", "/foo/bar", "/bar/*"]);
		});
		it("should consolidate thousands of redundant routes", () => {
			// Test to make sure the consolidator isn't horribly slow
			const routes: string[] = [];
			const limit = 1000;
			for (let i = 0; i < limit; i++) {
				// Add 3 routes per id
				const id = `some-id-${i}`;
				routes.push(`/${id}/*`, `/${id}/foo`, `/${id}/bar/*`);
			}
			const consolidated = consolidateRoutes(routes);
			expect(consolidated.length).toEqual(limit);
			// Should be all unique
			expect(Array.from(new Set(consolidated)).length).toEqual(limit);
			// Should all have pattern `/$id/*`
			expect(
				consolidated.every((route) => route.match(/\/[a-z0-9-]+\/\*/) !== null)
			).toEqual(true);
		});

		it("should consolidate many redundant sub-routes", () => {
			const routes: string[] = [];
			const limit = 15;

			// Create $limit of top-level catch-all routes, with a lot of sub-routes
			for (let i = 0; i < limit; i++) {
				routes.push(`/foo-${i}/*`);
				for (let j = 0; j < limit; j++) {
					routes.push(`/foo-${i}/bar-${j}/hello`);
					for (let k = 0; k < limit; k++) {
						routes.push(`/foo-${i}/bar-${j}/baz-${k}/*`);
						routes.push(`/foo-${i}/bar-${j}/baz-${k}/profile`);
					}
				}
			}

			const consolidated = consolidateRoutes(routes);
			expect(consolidated.length).toEqual(limit);
			// Should be all unique
			expect(Array.from(new Set(consolidated)).length).toEqual(limit);
			// Should all have pattern `/$id/*`
			expect(
				consolidated.every((route) => route.match(/\/[a-z0-9-]+\/\*/) !== null)
			).toEqual(true);
		});

		it("should truncate long single-level path into catch-all path, removing other paths", () => {
			expect(
				consolidateRoutes([
					// [/aaaaaaa, /foo] -> [/*]
					"/" + "a".repeat(maxRuleLength * 2),
					"/foo",
					"/bar/*",
					"/baz/bagel/coffee",
				])
			).toEqual(["/*"]);
		});

		it("should truncate long nested path, removing other paths", () => {
			expect(
				consolidateRoutes([
					// [/aaaaaaa, /foo] -> [/*]
					"/foo/" + "a".repeat(maxRuleLength * 2),
					"/foo/bar",
				])
			).toEqual(["/foo/*"]);
		});
	});

	describe(`shortenRoute()`, () => {
		it("should allow max length path", () => {
			const route = "/" + "a".repeat(maxRuleLength - 1);
			// Make sure we don't have an off-by-one error, that'd be embarrassing...
			expect(route.length).toEqual(maxRuleLength);
			expect(
				// Should stay the same
				shortenRoute(route)
			).toEqual(route);
		});

		it("should allow max length path (with slash)", () => {
			const route = "/" + "a".repeat(maxRuleLength - 2) + "/";
			expect(route.length).toEqual(maxRuleLength);
			expect(
				// Should stay the same
				shortenRoute(route)
			).toEqual(route);
		});

		it("should allow max length wildcard path", () => {
			const route = "/" + "a".repeat(maxRuleLength - 3) + "/*";
			expect(route.length).toEqual(maxRuleLength);
			expect(
				// Should stay the same
				shortenRoute(route)
			).toEqual(route);
		});

		it("should truncate long specific path to shorter wildcard path", () => {
			const short = shortenRoute(
				// /aaa/bbb -> /aaa/*
				"/" +
					"a".repeat(maxRuleLength * 0.6) +
					"/" +
					"b".repeat(maxRuleLength * 0.6)
			);
			expect(short).toEqual("/" + "a".repeat(maxRuleLength * 0.6) + "/*");
			expect(short.length).toBeLessThanOrEqual(maxRuleLength);
		});

		it("should truncate long specific path (with slash) to shorter wildcard path", () => {
			const short = shortenRoute(
				// /aaa/bbb/ -> /aaa/*
				"/" +
					"a".repeat(maxRuleLength * 0.6) +
					"/" +
					"b".repeat(maxRuleLength * 0.6) +
					"/"
			);
			expect(short).toEqual("/" + "a".repeat(maxRuleLength * 0.6) + "/*");
			expect(short.length).toBeLessThanOrEqual(maxRuleLength);
		});

		it("should truncate long wildcard path to shorter wildcard path", () => {
			const short = shortenRoute(
				// /aaa/bbb/* -> /aaa/*
				"/" +
					"a".repeat(maxRuleLength * 0.6) +
					"/" +
					"b".repeat(maxRuleLength * 0.6) +
					"/*"
			);
			expect(short).toEqual("/" + "a".repeat(maxRuleLength * 0.6) + "/*");
			expect(short.length).toBeLessThanOrEqual(maxRuleLength);
		});

		it("should truncate long single-level specific path to catch-all path", () => {
			expect(
				shortenRoute(
					// /aaa -> /*
					"/" + "a".repeat(maxRuleLength * 2)
				)
			).toEqual("/*");
		});

		it("should truncate long single-level specific path (with slash) to catch-all path", () => {
			expect(
				shortenRoute(
					// /aaa/ -> /*
					"/" + "a".repeat(maxRuleLength * 2) + "/"
				)
			).toEqual("/*");
		});

		it("should truncate long single-level wildcard path to catch-all path", () => {
			expect(
				shortenRoute(
					// /aaa/* -> /*
					"/" + "a".repeat(maxRuleLength * 2) + "/*"
				)
			).toEqual("/*");
		});

		it("should truncate many single-character segements", () => {
			const short = shortenRoute(
				// /a/a/a -> /a/a/*
				"/a".repeat(maxRuleLength) // 2x limit
			);
			expect(short).toEqual("/a".repeat(maxRuleLength / 2 - 1) + "/*");
			// Should be the exact max length
			expect(short.length).toEqual(maxRuleLength);
		});

		it("should truncate many double-character segements", () => {
			// === odd ===
			const short = shortenRoute(
				// /aa/aa/aa -> /aa/aa/*
				"/aa".repeat(maxRuleLength) // 3x limit
			);
			expect(short).toEqual("/aa".repeat(maxRuleLength / 3 - 1) + "/*");
			// Should be the exact max length
			expect(short.length).toEqual(maxRuleLength - 2); // -2 because of the odd number
		});

		it("should truncate many single-character segements with wildcard", () => {
			const short = shortenRoute(
				// /a/a/a -> /a/a/*
				"/a".repeat(maxRuleLength) + "/*" // 2x limit
			);
			expect(short).toEqual("/a".repeat(maxRuleLength / 2 - 1) + "/*");
			// Should be the exact max length
			expect(short.length).toEqual(maxRuleLength);
		});

		it("should truncate many double-character segements with wildcard", () => {
			const short = shortenRoute(
				// /aa/aa/aa -> /aa/*
				"/aa".repeat(maxRuleLength) + "/*" // 2x limit
			);
			expect(short).toEqual("/aa".repeat(maxRuleLength / 3 - 1) + "/*");
			// Should be the exact max length
			expect(short.length).toEqual(maxRuleLength - 2); // -2 because of the odd number
		});

		// This is probably the best test here - tests variable-length segments, up until the max.
		// This ensures that it's always able to shorten rules, without failing and returning "/*"
		// The other tests are great for ensuring exact sequences instead of only asserting length, though.
		for (const suffix of ["", "/", "/*"]) {
			// Test each type of path: /a, /a/a, /a/*
			it(`should truncate many variable-character segements (suffix="${suffix}") without truncating to /*`, () => {
				// "/" + 97 chars + "/*" === 100
				for (let i = 1; i < maxRuleLength - 2; i++) {
					const segment = "/" + "a".repeat(i);
					// make sure the segment isn't too long since we are testing not resulting to /*
					expect(segment.length).toBeLessThanOrEqual(maxRuleLength);
					const route =
						segment.repeat((maxRuleLength / segment.length) * 2) + suffix;
					// Make sure we made the rule too long
					expect(route.length).toBeGreaterThan(maxRuleLength);
					const short = shortenRoute(route);

					// Make sure it's not over the limit
					expect(short.length).toBeLessThanOrEqual(maxRuleLength);
					// It should never have to fall back to /*
					expect(short).not.toEqual("/*");
				}
			});
		}
	});
});
