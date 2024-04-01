import { writeFileSync, mkdirSync } from "fs";
import { runInTempDir } from "../../__tests__/helpers/run-in-tmp";
import { toUrlPath } from "../../paths";
import { compareRoutes, generateConfigFromFileTree } from "./filepath-routing";
import type { UrlPath } from "../../paths";
import type { HTTPMethod, RouteConfig } from "./routes";

describe("filepath-routing", () => {
	describe("compareRoutes()", () => {
		test("routes / last", () => {
			expect(
				compareRoutes(routeConfig("/"), routeConfig("/foo"))
			).toBeGreaterThanOrEqual(1);
			expect(
				compareRoutes(routeConfig("/"), routeConfig("/:foo"))
			).toBeGreaterThanOrEqual(1);
			expect(
				compareRoutes(routeConfig("/"), routeConfig("/:foo*"))
			).toBeGreaterThanOrEqual(1);
		});

		test("routes with fewer segments come after those with more segments", () => {
			expect(
				compareRoutes(routeConfig("/foo"), routeConfig("/foo/bar"))
			).toBeGreaterThanOrEqual(1);
			expect(
				compareRoutes(routeConfig("/foo"), routeConfig("/foo/bar/cat"))
			).toBeGreaterThanOrEqual(1);
		});

		test("routes with wildcard segments come after those without", () => {
			expect(compareRoutes(routeConfig("/:foo*"), routeConfig("/foo"))).toBe(1);
			expect(compareRoutes(routeConfig("/:foo*"), routeConfig("/:foo"))).toBe(
				1
			);
		});

		test("routes with dynamic segments come after those without", () => {
			expect(compareRoutes(routeConfig("/:foo"), routeConfig("/foo"))).toBe(1);
		});

		test("routes with dynamic segments occurring earlier come after those with dynamic segments in later positions", () => {
			expect(
				compareRoutes(routeConfig("/foo/:id/bar"), routeConfig("/foo/bar/:id"))
			).toBe(1);
		});

		test("routes with no HTTP method come after those specifying a method", () => {
			expect(
				compareRoutes(routeConfig("/foo"), routeConfig("/foo", "GET"))
			).toBe(1);
		});

		test("two equal routes are sorted according to their original position in the list", () => {
			expect(
				compareRoutes(routeConfig("/foo", "GET"), routeConfig("/foo", "GET"))
			).toBe(0);
		});

		test("it returns -1 if the first argument should appear first in the list", () => {
			expect(
				compareRoutes(routeConfig("/foo", "GET"), routeConfig("/foo"))
			).toBe(-1);
		});
	});

	describe("generateConfigFromFileTree", () => {
		runInTempDir();

		it("should generate a route entry for each file in the tree", async () => {
			writeFileSync(
				"foo.ts",
				`
      export function onRequestGet() {}
      export function onRequestPost() {}
      `
			);
			writeFileSync(
				"bar.ts",
				`
      export function onRequestPut() {}
      export function onRequestDelete() {}
      `
			);

			mkdirSync("todos");

			writeFileSync(
				"todos/[id].ts",
				`
      export function onRequestPost() {}
      export function onRequestDelete() {}
      `
			);

			mkdirSync("authors");
			mkdirSync("authors/[authorId]");
			mkdirSync("authors/[authorId]/todos");

			writeFileSync(
				"authors/[authorId]/todos/[todoId].ts",
				`
      export function onRequestPost() {}
      `
			);

			mkdirSync("books");

			writeFileSync(
				"books/[[title]].ts",
				`
      export function onRequestPost() {}
      `
			);

			mkdirSync("cats");
			mkdirSync("cats/[[breed]]");

			writeFileSync(
				"cats/[[breed]]/blah.ts",
				`
      export function onRequestPost() {}
      `
			);

			// This won't actually work at runtime.
			writeFileSync(
				"cats/[[breed]]/[[name]].ts",
				`
      export function onRequestPost() {}
      `
			);

			const entries = await generateConfigFromFileTree({
				baseDir: ".",
				baseURL: "/base" as UrlPath,
			});
			expect(entries).toMatchInlineSnapshot(`
        Object {
          "routes": Array [
            Object {
              "method": "POST",
              "module": Array [
                "authors/[authorId]/todos/[todoId].ts:onRequestPost",
              ],
              "mountPath": "/base/authors/:authorId/todos",
              "routePath": "/base/authors/:authorId/todos/:todoId",
            },
            Object {
              "method": "POST",
              "module": Array [
                "cats/[[breed]]/blah.ts:onRequestPost",
              ],
              "mountPath": "/base/cats/:breed*",
              "routePath": "/base/cats/:breed*/blah",
            },
            Object {
              "method": "POST",
              "module": Array [
                "cats/[[breed]]/[[name]].ts:onRequestPost",
              ],
              "mountPath": "/base/cats/:breed*",
              "routePath": "/base/cats/:breed*/:name*",
            },
            Object {
              "method": "DELETE",
              "module": Array [
                "todos/[id].ts:onRequestDelete",
              ],
              "mountPath": "/base/todos",
              "routePath": "/base/todos/:id",
            },
            Object {
              "method": "POST",
              "module": Array [
                "todos/[id].ts:onRequestPost",
              ],
              "mountPath": "/base/todos",
              "routePath": "/base/todos/:id",
            },
            Object {
              "method": "POST",
              "module": Array [
                "books/[[title]].ts:onRequestPost",
              ],
              "mountPath": "/base/books",
              "routePath": "/base/books/:title*",
            },
            Object {
              "method": "DELETE",
              "module": Array [
                "bar.ts:onRequestDelete",
              ],
              "mountPath": "/base/",
              "routePath": "/base/bar",
            },
            Object {
              "method": "PUT",
              "module": Array [
                "bar.ts:onRequestPut",
              ],
              "mountPath": "/base/",
              "routePath": "/base/bar",
            },
            Object {
              "method": "GET",
              "module": Array [
                "foo.ts:onRequestGet",
              ],
              "mountPath": "/base/",
              "routePath": "/base/foo",
            },
            Object {
              "method": "POST",
              "module": Array [
                "foo.ts:onRequestPost",
              ],
              "mountPath": "/base/",
              "routePath": "/base/foo",
            },
          ],
        }
      `);
		});
	});
});

function routeConfig(routePath: string, method?: string): RouteConfig {
	return {
		routePath: toUrlPath(routePath),
		mountPath: toUrlPath("/"),
		method: method as HTTPMethod,
	};
}
