/* eslint-disable no-shadow */

import * as Build from "./build";
import * as DeploymentTails from "./deployment-tails";
import * as Deployments from "./deployments";
import * as Dev from "./dev";
import * as Functions from "./functions";
import * as Projects from "./projects";
import * as Publish from "./publish";
import * as Upload from "./upload";
import { CLEANUP, pagesBetaWarning } from "./utils";
import type { BuilderCallback } from "yargs";

process.on("SIGINT", () => {
	CLEANUP();
	process.exit();
});
process.on("SIGTERM", () => {
	CLEANUP();
	process.exit();
});

export const pages: BuilderCallback<unknown, unknown> = (yargs) => {
	return (
		yargs
			.command(
				"dev [directory] [-- command..]",
				"🧑‍💻 Develop your full-stack Pages application locally",
				Dev.Options,
				Dev.Handler
			)
			/**
			 * `wrangler pages functions` is meant for internal use only for now,
			 * so let's hide this command from the help output
			 */
			.command("functions", false, (yargs) =>
				yargs
					.command(
						"build [directory]",
						"Compile a folder of Cloudflare Pages Functions into a single Worker",
						Build.Options,
						Build.Handler
					)
					.command(
						"optimize-routes [routesPath] [outputRoutesPath]",
						"Consolidate and optimize the route paths declared in _routes.json",
						Functions.OptimizeRoutesOptions,
						Functions.OptimizeRoutesHandler
					)
			)
			.command("project", "⚡️ Interact with your Pages projects", (yargs) =>
				yargs
					.command(
						"list",
						"List your Cloudflare Pages projects",
						Projects.ListOptions,
						Projects.ListHandler
					)
					.command(
						"create [project-name]",
						"Create a new Cloudflare Pages project",
						Projects.CreateOptions,
						Projects.CreateHandler
					)
					.command("upload [directory]", false, Upload.Options, Upload.Handler)
					.epilogue(pagesBetaWarning)
			)
			.command(
				"deployment",
				"🚀 Interact with the deployments of a project",
				(yargs) =>
					yargs
						.command(
							"list",
							"List deployments in your Cloudflare Pages project",
							Deployments.ListOptions,
							Deployments.ListHandler
						)
						.command(
							"create [directory]",
							"🆙 Publish a directory of static assets as a Pages deployment",
							Publish.Options,
							Publish.Handler
						)
						.command(
							"tail [deployment]",
							"Start a tailing session for a project's deployment and " +
								"livestream logs from your Functions",
							DeploymentTails.Options,
							DeploymentTails.Handler
						)
						.epilogue(pagesBetaWarning)
			)
			.command(
				"publish [directory]",
				"🆙 Publish a directory of static assets as a Pages deployment",
				Publish.Options,
				Publish.Handler
			)
			.epilogue(pagesBetaWarning)
	);
};
