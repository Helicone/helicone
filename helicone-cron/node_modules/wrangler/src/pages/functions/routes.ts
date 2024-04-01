import fs from "node:fs/promises";
import path from "node:path";
import { isValidIdentifier, normalizeIdentifier } from "./identifiers";
import type { UrlPath } from "../../paths";

export const HTTP_METHODS = [
	"HEAD",
	"OPTIONS",
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE",
] as const;
export type HTTPMethod = typeof HTTP_METHODS[number];

export type RoutesCollection = Array<{
	routePath: UrlPath;
	mountPath: UrlPath;
	method?: HTTPMethod;
	modules: string[];
	middlewares: string[];
}>;

export type Config = {
	routes?: RouteConfig[];
	schedules?: unknown;
};

export type RouteConfig = {
	routePath: UrlPath;
	mountPath: UrlPath;
	method?: HTTPMethod;
	middleware?: string | string[];
	module?: string | string[];
};

type ImportMap = Map<
	string,
	{
		filepath: string;
		name: string;
		identifier: string;
	}
>;

type Arguments = {
	config: Config;
	outfile: string;
	srcDir: string;
};

export async function writeRoutesModule({
	config,
	srcDir,
	outfile = "_routes.js",
}: Arguments) {
	const { importMap, routes } = parseConfig(config, srcDir);
	const routesModule = generateRoutesModule(importMap, routes);

	await fs.writeFile(outfile, routesModule);

	return outfile;
}

export function parseConfig(config: Config, baseDir: string) {
	const routes: RoutesCollection = [];
	const importMap: ImportMap = new Map();
	const identifierCount = new Map<string, number>(); // to keep track of identifier collisions

	function parseModuleIdentifiers(paths: string | string[] | undefined) {
		if (typeof paths === "undefined") {
			paths = [];
		}

		if (typeof paths === "string") {
			paths = [paths];
		}

		return paths.map((modulePath) => {
			const [filepath, name = "default"] = modulePath.split(":");
			let { identifier } = importMap.get(modulePath) ?? {};

			const resolvedPath = path.resolve(baseDir, filepath);

			// ensure the filepath isn't attempting to resolve to anything outside of the project
			if (path.relative(baseDir, resolvedPath).startsWith("..")) {
				throw new Error(`Invalid module path "${filepath}"`);
			}

			// ensure the module name (if provided) is a valid identifier to guard against injection attacks
			if (name !== "default" && !isValidIdentifier(name)) {
				throw new Error(`Invalid module identifier "${name}"`);
			}

			if (!identifier) {
				identifier = normalizeIdentifier(`__${filepath}_${name}`);

				let count = identifierCount.get(identifier) ?? 0;
				identifierCount.set(identifier, ++count);

				if (count > 1) {
					identifier += `_${count}`;
				}

				importMap.set(modulePath, { filepath: resolvedPath, name, identifier });
			}

			return identifier;
		});
	}

	for (const { routePath, mountPath, method, ...props } of config.routes ??
		[]) {
		routes.push({
			routePath,
			mountPath,
			method,
			middlewares: parseModuleIdentifiers(props.middleware),
			modules: parseModuleIdentifiers(props.module),
		});
	}

	return { routes, importMap };
}

export function generateRoutesModule(
	importMap: ImportMap,
	routes: RoutesCollection
) {
	return `${[...importMap.values()]
		.map(
			({ filepath, name, identifier }) =>
				`import { ${name} as ${identifier} } from ${JSON.stringify(filepath)}`
		)
		.join("\n")}

export const routes = [
  ${routes
		.map(
			(route) => `  {
      routePath: "${route.routePath}",
      mountPath: "${route.mountPath}",
      method: "${route.method}",
      middlewares: [${route.middlewares.join(", ")}],
      modules: [${route.modules.join(", ")}],
    },`
		)
		.join("\n")}
  ]`;
}
