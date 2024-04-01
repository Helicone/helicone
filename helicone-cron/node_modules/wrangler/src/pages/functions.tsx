import { existsSync, lstatSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { FatalError } from "../errors";
import { logger } from "../logger";
import { isInPagesCI } from "./constants";
import { optimizeRoutesJSONSpec } from "./functions/routes-transformation";
import { validateRoutes } from "./functions/routes-validation";
import { pagesBetaWarning } from "./utils";
import type { YargsOptionsToInterface } from "../yargs-types";
import type { Argv } from "yargs";

type OptimizeRoutesArgs = YargsOptionsToInterface<typeof OptimizeRoutesOptions>;

export function OptimizeRoutesOptions(yargs: Argv) {
	return yargs
		.options({
			"routes-path": {
				type: "string",
				demandOption: true,
				description: "The location of the _routes.json file",
			},
		})
		.options({
			"output-routes-path": {
				type: "string",
				demandOption: true,
				description: "The location of the optimized output routes file",
			},
		});
}

export async function OptimizeRoutesHandler({
	routesPath,
	outputRoutesPath,
}: OptimizeRoutesArgs) {
	if (!isInPagesCI) {
		// Beta message for `wrangler pages <commands>` usage
		logger.log(pagesBetaWarning);
	}

	let routesFileContents: string;
	const routesOutputDirectory = path.dirname(outputRoutesPath);

	if (!existsSync(routesPath)) {
		throw new FatalError(
			`Oops! File ${routesPath} does not exist. Please make sure --routes-path is a valid file path (for example "/public/_routes.json").`,
			1
		);
	}

	if (
		!existsSync(routesOutputDirectory) ||
		!lstatSync(routesOutputDirectory).isDirectory()
	) {
		throw new FatalError(
			`Oops! Folder ${routesOutputDirectory} does not exist. Please make sure --output-routes-path is a valid file path (for example "/public/_routes.json").`,
			1
		);
	}

	try {
		routesFileContents = readFileSync(routesPath, "utf-8");
	} catch (err) {
		throw new FatalError(`Error while reading ${routesPath} file: ${err}`);
	}

	const routes = JSON.parse(routesFileContents);

	validateRoutes(routes, routesPath);

	const optimizedRoutes = optimizeRoutesJSONSpec(routes);
	const optimizedRoutesContents = JSON.stringify(optimizedRoutes);

	try {
		writeFileSync(outputRoutesPath, optimizedRoutesContents);
	} catch (err) {
		throw new FatalError(
			`Error writing to ${outputRoutesPath} file: ${err}`,
			1
		);
	}
}
