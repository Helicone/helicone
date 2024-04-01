import fs from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import { toUrlPath } from "../../paths";
import type { UrlPath } from "../../paths";
import type { HTTPMethod, RouteConfig } from "./routes";

export async function generateConfigFromFileTree({
	baseDir,
	baseURL,
}: {
	baseDir: string;
	baseURL: UrlPath;
}) {
	let routeEntries: RouteConfig[] = [];

	if (!baseURL.startsWith("/")) {
		baseURL = `/${baseURL}` as UrlPath;
	}

	if (baseURL.endsWith("/")) {
		baseURL = baseURL.slice(0, -1) as UrlPath;
	}

	await forEachFile(baseDir, async (filepath) => {
		const ext = path.extname(filepath);
		if (/^\.(mjs|js|ts|tsx|jsx)$/.test(ext)) {
			const { metafile } = await build({
				metafile: true,
				write: false,
				bundle: false,
				entryPoints: [path.resolve(filepath)],
			});
			const exportNames: string[] = [];
			if (metafile) {
				for (const output in metafile?.outputs) {
					exportNames.push(...metafile.outputs[output].exports);
				}
			}
			for (const exportName of exportNames) {
				const [match, method = ""] = (exportName.match(
					/^onRequest(Get|Post|Put|Patch|Delete|Options|Head)?$/
				) ?? []) as (string | undefined)[];

				if (match) {
					const basename = path.basename(filepath).slice(0, -ext.length);

					const isIndexFile = basename === "index";
					// TODO: deprecate _middleware_ in favor of _middleware
					const isMiddlewareFile =
						basename === "_middleware" || basename === "_middleware_";

					let routePath = path
						.relative(baseDir, filepath)
						.slice(0, -ext.length);
					let mountPath = path.dirname(routePath);

					if (isIndexFile || isMiddlewareFile) {
						routePath = path.dirname(routePath);
					}

					if (routePath === ".") {
						routePath = "";
					}
					if (mountPath === ".") {
						mountPath = "";
					}

					routePath = `${baseURL}/${routePath}`;
					mountPath = `${baseURL}/${mountPath}`;

					routePath = routePath.replace(/\[\[([^\]]+)\]\]/g, ":$1*"); // transform [[id]] => :id*
					routePath = routePath.replaceAll(/\[([^\]]+)\]/g, ":$1"); // transform [id] => :id
					mountPath = mountPath.replace(/\[\[([^\]]+)\]\]/g, ":$1*"); // transform [[id]] => :id*
					mountPath = mountPath.replaceAll(/\[([^\]]+)\]/g, ":$1"); // transform [id] => :id

					// These are used as module specifiers so UrlPaths are okay to use even on Windows
					const modulePath = toUrlPath(path.relative(baseDir, filepath));

					const routeEntry: RouteConfig = {
						routePath: toUrlPath(routePath),
						mountPath: toUrlPath(mountPath),
						method: method.toUpperCase() as HTTPMethod,
						[isMiddlewareFile ? "middleware" : "module"]: [
							`${modulePath}:${exportName}`,
						],
					};

					routeEntries.push(routeEntry);
				}
			}
		}
	});
	// Combine together any routes (index routes) which contain both a module and a middleware
	routeEntries = routeEntries.reduce(
		(acc: typeof routeEntries, { routePath, ...rest }) => {
			const existingRouteEntry = acc.find(
				(routeEntry) =>
					routeEntry.routePath === routePath &&
					routeEntry.method === rest.method
			);
			if (existingRouteEntry !== undefined) {
				Object.assign(existingRouteEntry, rest);
			} else {
				acc.push({ routePath, ...rest });
			}
			return acc;
		},
		[]
	);

	routeEntries.sort((a, b) => compareRoutes(a, b));

	return {
		routes: routeEntries,
	};
}

// Ensure routes are produced in order of precedence so that
// more specific routes aren't occluded from matching due to
// less specific routes appearing first in the route list.
export function compareRoutes(
	{ routePath: routePathA, method: methodA }: RouteConfig,
	{ routePath: routePathB, method: methodB }: RouteConfig
) {
	function parseRoutePath(routePath: UrlPath): string[] {
		return routePath.slice(1).split("/").filter(Boolean);
	}

	const segmentsA = parseRoutePath(routePathA);
	const segmentsB = parseRoutePath(routePathB);

	// sort routes with fewer segments after those with more segments
	if (segmentsA.length !== segmentsB.length) {
		return segmentsB.length - segmentsA.length;
	}

	for (let i = 0; i < segmentsA.length; i++) {
		const isWildcardA = segmentsA[i].includes("*");
		const isWildcardB = segmentsB[i].includes("*");
		const isParamA = segmentsA[i].includes(":");
		const isParamB = segmentsB[i].includes(":");

		// sort wildcard segments after non-wildcard segments
		if (isWildcardA && !isWildcardB) return 1;
		if (!isWildcardA && isWildcardB) return -1;

		// sort dynamic param segments after non-param segments
		if (isParamA && !isParamB) return 1;
		if (!isParamA && isParamB) return -1;
	}

	// sort routes that specify an HTTP before those that don't
	if (methodA && !methodB) return -1;
	if (!methodA && methodB) return 1;

	// all else equal, just sort the paths lexicographically
	return routePathA.localeCompare(routePathB);
}

async function forEachFile<T>(
	baseDir: string,
	fn: (filepath: string) => T | Promise<T>
) {
	const searchPaths = [baseDir];
	const returnValues: T[] = [];

	while (isNotEmpty(searchPaths)) {
		const cwd = searchPaths.shift();
		const dir = await fs.readdir(cwd, { withFileTypes: true });
		for (const entry of dir) {
			const pathname = path.join(cwd, entry.name);
			if (entry.isDirectory()) {
				searchPaths.push(pathname);
			} else if (entry.isFile()) {
				returnValues.push(await fn(pathname));
			}
		}
	}

	return returnValues;
}

interface NonEmptyArray<T> extends Array<T> {
	shift(): T;
}
function isNotEmpty<T>(array: T[]): array is NonEmptyArray<T> {
	return array.length > 0;
}
