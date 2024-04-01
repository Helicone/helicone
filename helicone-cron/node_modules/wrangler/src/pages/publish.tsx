import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { cwd } from "node:process";
import { render, Text } from "ink";
import SelectInput from "ink-select-input";
import React from "react";
import { File, FormData } from "undici";
import { fetchResult } from "../cfetch";
import { getConfigCache, saveToConfigCache } from "../config-cache";
import { prompt } from "../dialogs";
import { FatalError } from "../errors";
import { logger } from "../logger";
import * as metrics from "../metrics";
import { requireAuth } from "../user";
import { buildFunctions } from "./build";
import { PAGES_CONFIG_CACHE_FILENAME } from "./constants";
import { FunctionsNoRoutesError, getFunctionsNoRoutesWarning } from "./errors";
import { validateRoutes } from "./functions/routes-validation";
import { listProjects } from "./projects";
import { promptSelectProject } from "./prompt-select-project";
import { upload } from "./upload";
import { pagesBetaWarning } from "./utils";
import type { YargsOptionsToInterface } from "../yargs-types";
import type { PagesConfigCache } from "./types";
import type { Project, Deployment } from "@cloudflare/types";
import type { Argv } from "yargs";

type PublishArgs = YargsOptionsToInterface<typeof Options>;

export function Options(yargs: Argv) {
	return yargs
		.positional("directory", {
			type: "string",
			demandOption: true,
			description: "The directory of static files to upload",
		})
		.options({
			"project-name": {
				type: "string",
				description: "The name of the project you want to deploy to",
			},
			branch: {
				type: "string",
				description: "The name of the branch you want to deploy to",
			},
			"commit-hash": {
				type: "string",
				description: "The SHA to attach to this deployment",
			},
			"commit-message": {
				type: "string",
				description: "The commit message to attach to this deployment",
			},
			"commit-dirty": {
				type: "boolean",
				description:
					"Whether or not the workspace should be considered dirty for this deployment",
			},
			config: {
				describe: "Pages does not support wrangler.toml",
				type: "string",
				hidden: true,
			},
		})
		.epilogue(pagesBetaWarning);
}

export const Handler = async ({
	directory,
	projectName,
	branch,
	commitHash,
	commitMessage,
	commitDirty,
	config: wranglerConfig,
}: PublishArgs) => {
	if (wranglerConfig) {
		throw new FatalError("Pages does not support wrangler.toml", 1);
	}

	if (!directory) {
		throw new FatalError("Must specify a directory.", 1);
	}

	const config = getConfigCache<PagesConfigCache>(PAGES_CONFIG_CACHE_FILENAME);
	const accountId = await requireAuth(config);

	projectName ??= config.project_name;

	const isInteractive = process.stdin.isTTY;
	if (!projectName && isInteractive) {
		const projects = (await listProjects({ accountId })).filter(
			(project) => !project.source
		);

		let existingOrNew: "existing" | "new" = "new";

		if (projects.length > 0) {
			existingOrNew = await new Promise<"new" | "existing">((resolve) => {
				const { unmount } = render(
					<>
						<Text>
							No project selected. Would you like to create one or use an
							existing project?
						</Text>
						<SelectInput
							items={[
								{
									key: "new",
									label: "Create a new project",
									value: "new",
								},
								{
									key: "existing",
									label: "Use an existing project",
									value: "existing",
								},
							]}
							onSelect={async (selected) => {
								resolve(selected.value as "new" | "existing");
								unmount();
							}}
						/>
					</>
				);
			});
		}

		switch (existingOrNew) {
			case "existing": {
				projectName = await promptSelectProject({ accountId });
				break;
			}
			case "new": {
				projectName = await prompt("Enter the name of your new project:");

				if (!projectName) {
					throw new FatalError("Must specify a project name.", 1);
				}

				let isGitDir = true;
				try {
					execSync(`git rev-parse --is-inside-work-tree`, {
						stdio: "ignore",
					});
				} catch (err) {
					isGitDir = false;
				}

				const productionBranch = await prompt(
					"Enter the production branch name:",
					"text",
					isGitDir
						? execSync(`git rev-parse --abbrev-ref HEAD`).toString().trim()
						: "production"
				);

				if (!productionBranch) {
					throw new FatalError("Must specify a production branch.", 1);
				}

				await fetchResult<Project>(`/accounts/${accountId}/pages/projects`, {
					method: "POST",
					body: JSON.stringify({
						name: projectName,
						production_branch: productionBranch,
					}),
				});

				saveToConfigCache<PagesConfigCache>(PAGES_CONFIG_CACHE_FILENAME, {
					account_id: accountId,
					project_name: projectName,
				});

				logger.log(`✨ Successfully created the '${projectName}' project.`);
				await metrics.sendMetricsEvent("create pages project");
				break;
			}
		}
	}

	if (!projectName) {
		throw new FatalError("Must specify a project name.", 1);
	}

	// We infer git info by default is not passed in
	let isGitDir = true;
	try {
		execSync(`git rev-parse --is-inside-work-tree`, {
			stdio: "ignore",
		});
	} catch (err) {
		isGitDir = false;
	}

	let isGitDirty = false;

	if (isGitDir) {
		try {
			isGitDirty = Boolean(
				execSync(`git status --porcelain`).toString().length
			);

			if (!branch) {
				branch = execSync(`git rev-parse --abbrev-ref HEAD`).toString().trim();
			}

			if (!commitHash) {
				commitHash = execSync(`git rev-parse HEAD`).toString().trim();
			}

			if (!commitMessage) {
				commitMessage = execSync(`git show -s --format=%B ${commitHash}`)
					.toString()
					.trim();
			}
		} catch (err) {}

		if (isGitDirty && !commitDirty) {
			logger.warn(
				`Warning: Your working directory is a git repo and has uncommitted changes\nTo silence this warning, pass in --commit-dirty=true`
			);
		}

		if (commitDirty === undefined) {
			commitDirty = isGitDirty;
		}
	}

	let _headers: string | undefined,
		_redirects: string | undefined,
		_routesGenerated: string | undefined,
		_routesCustom: string | undefined,
		_workerJS: string | undefined;

	try {
		_headers = readFileSync(join(directory, "_headers"), "utf-8");
	} catch {}

	try {
		_redirects = readFileSync(join(directory, "_redirects"), "utf-8");
	} catch {}

	try {
		/**
		 * Developers can specify a custom _routes.json file, for projects with Pages
		 * Functions or projects in Advanced Mode
		 */
		_routesCustom = readFileSync(join(directory, "_routes.json"), "utf-8");
	} catch {}

	try {
		_workerJS = readFileSync(join(directory, "_worker.js"), "utf-8");
	} catch {}

	// Grab the bindings from the API, we need these for shims and other such hacky inserts
	const project = await fetchResult<Project>(
		`/accounts/${accountId}/pages/projects/${projectName}`
	);
	let isProduction = true;
	if (branch) {
		isProduction = project.production_branch === branch;
	}

	/**
	 * Evaluate if this is an Advanced Mode or Pages Functions project. If Advanced Mode, we'll
	 * go ahead and upload `_worker.js` as is, but if Pages Functions, we need to attempt to build
	 * Functions first and exit if it failed
	 */
	let builtFunctions: string | undefined = undefined;
	const functionsDirectory = join(cwd(), "functions");
	const routesOutputPath = !existsSync(join(directory, "_routes.json"))
		? join(tmpdir(), `_routes-${Math.random()}.json`)
		: undefined;

	// Routing configuration displayed in the Functions tab of a deployment in Dash
	let filepathRoutingConfig: string | undefined;

	if (!_workerJS && existsSync(functionsDirectory)) {
		const outfile = join(tmpdir(), `./functionsWorker-${Math.random()}.js`);
		const outputConfigPath = join(
			tmpdir(),
			`functions-filepath-routing-config-${Math.random()}.json`
		);

		try {
			await buildFunctions({
				outfile,
				outputConfigPath,
				functionsDirectory,
				onEnd: () => {},
				buildOutputDirectory: dirname(outfile),
				routesOutputPath,
				local: false,
				d1Databases: Object.keys(
					project.deployment_configs[isProduction ? "production" : "preview"]
						.d1_databases ?? {}
				),
			});

			builtFunctions = readFileSync(outfile, "utf-8");
			filepathRoutingConfig = readFileSync(outputConfigPath, "utf-8");
		} catch (e) {
			if (e instanceof FunctionsNoRoutesError) {
				logger.warn(
					getFunctionsNoRoutesWarning(functionsDirectory, "skipping")
				);
			} else {
				throw e;
			}
		}
	}

	const manifest = await upload({ directory, accountId, projectName });

	const formData = new FormData();

	formData.append("manifest", JSON.stringify(manifest));

	if (branch) {
		formData.append("branch", branch);
	}

	if (commitMessage) {
		formData.append("commit_message", commitMessage);
	}

	if (commitHash) {
		formData.append("commit_hash", commitHash);
	}

	if (commitDirty !== undefined) {
		formData.append("commit_dirty", commitDirty);
	}

	if (_headers) {
		formData.append("_headers", new File([_headers], "_headers"));
		logger.log(`✨ Uploading _headers`);
	}

	if (_redirects) {
		formData.append("_redirects", new File([_redirects], "_redirects"));
		logger.log(`✨ Uploading _redirects`);
	}

	if (filepathRoutingConfig) {
		formData.append(
			"functions-filepath-routing-config.json",
			new File(
				[filepathRoutingConfig],
				"functions-filepath-routing-config.json"
			)
		);
	}

	/**
	 * Advanced Mode
	 * https://developers.cloudflare.com/pages/platform/functions/#advanced-mode
	 *
	 * When using a _worker.js file, the entire /functions directory is ignored
	 * – this includes its routing and middleware characteristics.
	 */
	if (_workerJS) {
		formData.append("_worker.js", new File([_workerJS], "_worker.js"));
		logger.log(`✨ Uploading _worker.js`);

		if (_routesCustom) {
			// user provided a custom _routes.json file
			try {
				const routesCustomJSON = JSON.parse(_routesCustom);
				validateRoutes(routesCustomJSON, join(directory, "_routes.json"));

				formData.append(
					"_routes.json",
					new File([_routesCustom], "_routes.json")
				);
				logger.log(`✨ Uploading _routes.json`);
				logger.warn(
					`_routes.json is an experimental feature and is subject to change. Please use with care.`
				);
			} catch (err) {
				if (err instanceof FatalError) {
					throw err;
				}
			}
		}
	}

	/**
	 * Pages Functions
	 * https://developers.cloudflare.com/pages/platform/functions/
	 */
	if (builtFunctions && !_workerJS) {
		// if Functions were build successfully, proceed to uploading the build file
		formData.append("_worker.js", new File([builtFunctions], "_worker.js"));
		logger.log(`✨ Uploading Functions`);

		if (_routesCustom) {
			// user provided a custom _routes.json file
			try {
				const routesCustomJSON = JSON.parse(_routesCustom);
				validateRoutes(routesCustomJSON, join(directory, "_routes.json"));

				formData.append(
					"_routes.json",
					new File([_routesCustom], "_routes.json")
				);
				logger.log(`✨ Uploading _routes.json`);
				logger.warn(
					`_routes.json is an experimental feature and is subject to change. Please use with care.`
				);
			} catch (err) {
				if (err instanceof FatalError) {
					throw err;
				}
			}
		} else if (routesOutputPath) {
			// no custom _routes.json file found, so fallback to the generated one
			try {
				_routesGenerated = readFileSync(routesOutputPath, "utf-8");

				if (_routesGenerated) {
					formData.append(
						"_routes.json",
						new File([_routesGenerated], "_routes.json")
					);
				}
			} catch {}
		}
	}

	const deploymentResponse = await fetchResult<Deployment>(
		`/accounts/${accountId}/pages/projects/${projectName}/deployments`,
		{
			method: "POST",
			body: formData,
		}
	);

	saveToConfigCache<PagesConfigCache>(PAGES_CONFIG_CACHE_FILENAME, {
		account_id: accountId,
		project_name: projectName,
	});

	logger.log(
		`✨ Deployment complete! Take a peek over at ${deploymentResponse.url}`
	);
	await metrics.sendMetricsEvent("create pages deployment");
};
