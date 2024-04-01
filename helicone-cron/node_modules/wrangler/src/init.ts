import * as fs from "node:fs";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import TOML from "@iarna/toml";
import { findUp } from "find-up";
import { version as wranglerVersion } from "../package.json";

import { fetchResult } from "./cfetch";
import { fetchDashboardScript } from "./cfetch/internal";
import { readConfig } from "./config";
import { confirm, select } from "./dialogs";
import { initializeGit, getGitVersioon, isInsideGitRepo } from "./git-client";
import { logger } from "./logger";
import { getPackageManager } from "./package-manager";
import { parsePackageJSON, parseTOML, readFileSync } from "./parse";
import { getBasePath } from "./paths";
import { requireAuth } from "./user";
import { CommandLineArgsError, printWranglerBanner } from "./index";

import type { RawConfig } from "./config";
import type { Route, SimpleRoute } from "./config/environment";
import type { WorkerMetadata } from "./create-worker-upload-form";
import type { ConfigPath } from "./index";
import type { PackageManager } from "./package-manager";
import type { CommonYargsOptions } from "./yargs-types";
import type { Argv, ArgumentsCamelCase } from "yargs";

export async function initOptions(yargs: Argv<CommonYargsOptions>) {
	return yargs
		.positional("name", {
			describe: "The name of your worker",
			type: "string",
		})
		.option("type", {
			describe: "The type of worker to create",
			type: "string",
			choices: ["rust", "javascript", "webpack"],
			hidden: true,
			deprecated: true,
		})
		.option("site", {
			hidden: true,
			type: "boolean",
			deprecated: true,
		})
		.option("yes", {
			describe: 'Answer "yes" to any prompts for new projects',
			type: "boolean",
			alias: "y",
		})
		.option("from-dash", {
			describe: "Download script from the dashboard for local development",
			type: "string",
			requiresArg: true,
		});
}

interface InitArgs {
	name: string;
	type?: string;
	site?: boolean;
	yes?: boolean;
}

export type ServiceMetadataRes = {
	id: string;
	default_environment: {
		environment: string;
		created_on: string;
		modified_on: string;
		script: {
			id: string;
			tag: string;
			etag: string;
			handlers: string[];
			modified_on: string;
			created_on: string;
			migration_tag: string;
			usage_model: "bundled" | "unbound";
			compatibility_date: string;
			last_deployed_from?: "wrangler" | "dash" | "api";
		};
	};
	created_on: string;
	modified_on: string;
	usage_model: "bundled" | "unbound";
	environments: [
		{
			environment: string;
			created_on: string;
			modified_on: string;
		}
	];
};

export type RawSimpleRoute = { pattern: string };
export type RawRoutes = (RawSimpleRoute | Exclude<Route, SimpleRoute>) & {
	id: string;
};
export type RoutesRes = RawRoutes[];

export type CronTriggersRes = {
	schedules: [
		{
			cron: string;
			created_on: Date;
			modified_on: Date;
		}
	];
};

export async function initHandler(args: ArgumentsCamelCase<InitArgs>) {
	await printWranglerBanner();
	if (args.type) {
		let message = "The --type option is no longer supported.";
		if (args.type === "webpack") {
			message +=
				"\nIf you wish to use webpack then you will need to create a custom build.";
			// TODO: Add a link to docs
		}
		throw new CommandLineArgsError(message);
	}

	const devDepsToInstall: string[] = [];
	const instructions: string[] = [];
	let shouldRunPackageManagerInstall = false;
	const fromDashScriptName = args["from-dash"] as string;
	const creationDirectory = path.resolve(
		process.cwd(),
		(args.name ? args.name : fromDashScriptName) ?? ""
	);

	if (args.site) {
		const gitDirectory =
			creationDirectory !== process.cwd()
				? path.basename(creationDirectory)
				: "my-site";
		const message =
			"The --site option is no longer supported.\n" +
			"If you wish to create a brand new Worker Sites project then clone the `worker-sites-template` starter repository:\n\n" +
			"```\n" +
			`git clone --depth=1 --branch=wrangler2 https://github.com/cloudflare/worker-sites-template ${gitDirectory}\n` +
			`cd ${gitDirectory}\n` +
			"```\n\n" +
			"Find out more about how to create and maintain Sites projects at https://developers.cloudflare.com/workers/platform/sites.\n" +
			"Have you considered using Cloudflare Pages instead? See https://pages.cloudflare.com/.";
		throw new CommandLineArgsError(message);
	}

	// TODO: make sure args.name is a valid identifier for a worker name
	const workerName = path
		.basename(creationDirectory)
		.toLowerCase()
		.replaceAll(/[^a-z0-9\-_]/gm, "-");

	const packageManager = await getPackageManager(creationDirectory);

	// TODO: ask which directory to make the worker in (defaults to args.name)
	// TODO: if args.name isn't provided, ask what to name the worker
	// Note: `--from-dash` will be a fallback creationDir/Worker name if none is provided.

	const wranglerTomlDestination = path.join(
		creationDirectory,
		"./wrangler.toml"
	);
	let justCreatedWranglerToml = false;

	if (fs.existsSync(wranglerTomlDestination)) {
		let shouldContinue = false;
		logger.warn(
			`${path.relative(process.cwd(), wranglerTomlDestination)} already exists!`
		);
		if (!fromDashScriptName) {
			shouldContinue = await confirm(
				"Do you want to continue initializing this project?"
			);
		}
		if (!shouldContinue) {
			return;
		}
	} else {
		await mkdir(creationDirectory, { recursive: true });
		const compatibilityDate = new Date().toISOString().substring(0, 10);

		try {
			await writeFile(
				wranglerTomlDestination,
				TOML.stringify({
					name: workerName,
					compatibility_date: compatibilityDate,
				}) + "\n"
			);

			logger.log(
				`✨ Created ${path.relative(process.cwd(), wranglerTomlDestination)}`
			);
			justCreatedWranglerToml = true;
		} catch (err) {
			throw new Error(
				`Failed to create ${path.relative(
					process.cwd(),
					wranglerTomlDestination
				)}.\n${(err as Error).message ?? err}`
			);
		}
	}

	const yesFlag = args.yes ?? false;

	if (!(await isInsideGitRepo(creationDirectory)) && (await getGitVersioon())) {
		const shouldInitGit =
			yesFlag ||
			(await confirm("Would you like to use git to manage this Worker?"));
		if (shouldInitGit) {
			await initializeGit(creationDirectory);
			await writeFile(
				path.join(creationDirectory, ".gitignore"),
				readFileSync(path.join(getBasePath(), "templates/gitignore"))
			);
			logger.log(
				args.name && args.name !== "."
					? `✨ Initialized git repository at ${path.relative(
							process.cwd(),
							creationDirectory
					  )}`
					: `✨ Initialized git repository`
			);
		}
	}

	const isolatedInit = !!args.name;
	let pathToPackageJson = await findPath(
		isolatedInit,
		creationDirectory,
		"package.json"
	);
	let shouldCreatePackageJson = false;
	let shouldCreateTests = false;
	let newWorkerTestType: "jest" | "vitest" = "jest";

	if (!pathToPackageJson) {
		// If no package.json exists, ask to create one
		shouldCreatePackageJson =
			yesFlag ||
			(await confirm("No package.json found. Would you like to create one?"));

		if (shouldCreatePackageJson) {
			await writeFile(
				path.join(creationDirectory, "./package.json"),
				JSON.stringify(
					{
						name: workerName,
						version: "0.0.0",
						devDependencies: {
							wrangler: wranglerVersion,
						},
						private: true,
					},
					null,
					"  "
				) + "\n"
			);

			shouldRunPackageManagerInstall = true;
			pathToPackageJson = path.join(creationDirectory, "package.json");
			logger.log(
				`✨ Created ${path.relative(process.cwd(), pathToPackageJson)}`
			);
		} else {
			return;
		}
	} else {
		// If package.json exists and wrangler isn't installed,
		// then ask to add wrangler to devDependencies
		const packageJson = parsePackageJSON(
			readFileSync(pathToPackageJson),
			pathToPackageJson
		);
		if (
			!(
				packageJson.devDependencies?.wrangler ||
				packageJson.dependencies?.wrangler
			)
		) {
			const shouldInstall =
				yesFlag ||
				(await confirm(
					`Would you like to install wrangler into ${path.relative(
						process.cwd(),
						pathToPackageJson
					)}?`
				));
			if (shouldInstall) {
				devDepsToInstall.push(`wrangler@${wranglerVersion}`);
			}
		}
	}

	let isTypescriptProject = false;
	let pathToTSConfig = await findPath(
		isolatedInit,
		creationDirectory,
		"tsconfig.json"
	);
	if (!pathToTSConfig) {
		// If there's no tsconfig, offer to create one
		// and install @cloudflare/workers-types
		if (yesFlag || (await confirm("Would you like to use TypeScript?"))) {
			isTypescriptProject = true;
			await writeFile(
				path.join(creationDirectory, "./tsconfig.json"),
				readFileSync(path.join(getBasePath(), "templates/tsconfig.json"))
			);
			devDepsToInstall.push("@cloudflare/workers-types");
			devDepsToInstall.push("typescript");
			pathToTSConfig = path.join(creationDirectory, "tsconfig.json");
			logger.log(`✨ Created ${path.relative(process.cwd(), pathToTSConfig)}`);
		}
	} else {
		isTypescriptProject = true;
		// If there's a tsconfig, check if @cloudflare/workers-types
		// is already installed, and offer to install it if not
		const packageJson = parsePackageJSON(
			readFileSync(pathToPackageJson),
			pathToPackageJson
		);
		if (
			!(
				packageJson.devDependencies?.["@cloudflare/workers-types"] ||
				packageJson.dependencies?.["@cloudflare/workers-types"]
			)
		) {
			const shouldInstall = await confirm(
				"Would you like to install the type definitions for Workers into your package.json?"
			);
			if (shouldInstall) {
				devDepsToInstall.push("@cloudflare/workers-types");
				// We don't update the tsconfig.json because
				// it could be complicated in existing projects
				// and we don't want to break them. Instead, we simply
				// tell the user that they need to update their tsconfig.json
				instructions.push(
					`🚨 Please add "@cloudflare/workers-types" to compilerOptions.types in ${path.relative(
						process.cwd(),
						pathToTSConfig
					)}`
				);
			}
		}
	}

	const packageJsonContent = parsePackageJSON(
		readFileSync(pathToPackageJson),
		pathToPackageJson
	);
	const shouldWritePackageJsonScripts =
		!packageJsonContent.scripts?.start &&
		!packageJsonContent.scripts?.publish &&
		shouldCreatePackageJson;

	async function writePackageJsonScriptsAndUpdateWranglerToml({
		isWritingScripts,
		isAddingTests,
		testRunner,
		isCreatingWranglerToml,
		packagePath,
		scriptPath,
		extraToml,
	}: {
		isWritingScripts: boolean;
		isAddingTests?: boolean;
		testRunner?: "jest" | "vitest";
		isCreatingWranglerToml: boolean;
		packagePath: string;
		scriptPath: string;
		extraToml: TOML.JsonMap;
	}) {
		if (isAddingTests && !testRunner) {
			logger.error("testRunner is required if isAddingTests");
		}
		if (isCreatingWranglerToml) {
			// rewrite wrangler.toml with main = "path/to/script" and any additional config specified in `extraToml`
			const parsedWranglerToml = parseTOML(
				readFileSync(wranglerTomlDestination)
			);
			const newToml = {
				name: parsedWranglerToml.name,
				main: scriptPath,
				compatibility_date: parsedWranglerToml.compatibility_date,
				...extraToml,
			};
			fs.writeFileSync(wranglerTomlDestination, TOML.stringify(newToml));
		}
		const isNamedWorker =
			isCreatingWranglerToml && path.dirname(packagePath) !== process.cwd();
		const isAddingTestScripts =
			isAddingTests && !packageJsonContent.scripts?.test;
		if (isWritingScripts) {
			await writeFile(
				packagePath,
				JSON.stringify(
					{
						...packageJsonContent,
						scripts: {
							...packageJsonContent.scripts,
							start: isCreatingWranglerToml
								? `wrangler dev`
								: `wrangler dev ${scriptPath}`,
							deploy: isCreatingWranglerToml
								? `wrangler publish`
								: `wrangler publish ${scriptPath}`,
							...(isAddingTestScripts && { test: testRunner }),
						},
					},
					null,
					2
				) + "\n"
			);
			instructions.push(
				`\nTo start developing your Worker, run \`${
					isNamedWorker ? `cd ${args.name || fromDashScriptName} && ` : ""
				}npm start\``
			);
			if (isAddingTestScripts) {
				instructions.push(`To start testing your Worker, run \`npm test\``);
			}
			instructions.push(
				`To publish your Worker to the Internet, run \`npm run deploy\``
			);
		} else {
			instructions.push(
				`\nTo start developing your Worker, run \`npx wrangler dev\`${
					isCreatingWranglerToml ? "" : ` ${scriptPath}`
				}`
			);
			instructions.push(
				`To publish your Worker to the Internet, run \`npx wrangler publish\`${
					isCreatingWranglerToml ? "" : ` ${scriptPath}`
				}`
			);
		}
	}

	if (isTypescriptProject) {
		if (!fs.existsSync(path.join(creationDirectory, "./src/index.ts"))) {
			const newWorkerFilename = path.relative(
				process.cwd(),
				path.join(creationDirectory, "./src/index.ts")
			);
			if (fromDashScriptName) {
				logger.warn(
					`After running "wrangler init --from-dash", modifying your worker via the Cloudflare dashboard is discouraged.
					Edits made via the Dashboard will not be synchronized locally and will be overridden by your local code and config when you publish.`
				);
				const config = readConfig(args.config as ConfigPath, args);
				const accountId = await requireAuth(config);
				await mkdir(path.join(creationDirectory, "./src"), {
					recursive: true,
				});
				const serviceMetaData = await fetchResult<ServiceMetadataRes>(
					`/accounts/${accountId}/workers/services/${fromDashScriptName}`
				);
				const defaultEnvironment =
					serviceMetaData.default_environment.environment;
				// I want the default environment, assuming it's the most up to date code.
				const dashScript = await fetchDashboardScript(
					`/accounts/${accountId}/workers/services/${fromDashScriptName}/environments/${defaultEnvironment}/content`
				);

				await writeFile(
					path.join(creationDirectory, "./src/index.ts"),
					dashScript
				);

				await writePackageJsonScriptsAndUpdateWranglerToml({
					isWritingScripts: shouldWritePackageJsonScripts,
					isCreatingWranglerToml: justCreatedWranglerToml,
					packagePath: pathToPackageJson,
					scriptPath: "src/index.ts",
					extraToml: (await getWorkerConfig(accountId, fromDashScriptName, {
						defaultEnvironment,
						environments: serviceMetaData.environments,
					})) as TOML.JsonMap,
				});
			} else {
				const newWorkerType = yesFlag
					? "fetch"
					: await getNewWorkerType(newWorkerFilename);

				if (newWorkerType !== "none") {
					const template = getNewWorkerTemplate("ts", newWorkerType);

					await mkdir(path.join(creationDirectory, "./src"), {
						recursive: true,
					});
					await writeFile(
						path.join(creationDirectory, "./src/index.ts"),
						readFileSync(path.join(getBasePath(), `templates/${template}`))
					);

					logger.log(
						`✨ Created ${path.relative(
							process.cwd(),
							path.join(creationDirectory, "./src/index.ts")
						)}`
					);

					await writePackageJsonScriptsAndUpdateWranglerToml({
						isWritingScripts: shouldWritePackageJsonScripts,
						isCreatingWranglerToml: justCreatedWranglerToml,
						packagePath: pathToPackageJson,
						scriptPath: "src/index.ts",
						extraToml: getNewWorkerToml(newWorkerType),
					});
				}
			}
		}
	} else {
		if (!fs.existsSync(path.join(creationDirectory, "./src/index.js"))) {
			const newWorkerFilename = path.relative(
				process.cwd(),
				path.join(creationDirectory, "./src/index.js")
			);

			if (fromDashScriptName) {
				logger.warn(
					`After running "wrangler init --from-dash", modifying your worker via the Cloudflare dashboard is discouraged.
					Edits made via the Dashboard will not be synchronized locally and will be overridden by your local code and config when you publish.`
				);
				const config = readConfig(args.config as ConfigPath, args);
				const accountId = await requireAuth(config);
				await mkdir(path.join(creationDirectory, "./src"), {
					recursive: true,
				});

				const serviceMetaData = await fetchResult<ServiceMetadataRes>(
					`/accounts/${accountId}/workers/services/${fromDashScriptName}`
				);
				const defaultEnvironment =
					serviceMetaData.default_environment.environment;

				// I want the default environment, assuming it's the most up to date code.
				const dashScript = await fetchDashboardScript(
					`/accounts/${accountId}/workers/services/${fromDashScriptName}/environments/${defaultEnvironment}/content`
				);

				await writeFile(
					path.join(creationDirectory, "./src/index.js"),
					dashScript
				);

				await writePackageJsonScriptsAndUpdateWranglerToml({
					isWritingScripts: shouldWritePackageJsonScripts,
					isCreatingWranglerToml: justCreatedWranglerToml,
					packagePath: pathToPackageJson,
					scriptPath: "src/index.ts",
					//? Should we have Environment argument for `wrangler init --from-dash` - Jacob
					extraToml: (await getWorkerConfig(accountId, fromDashScriptName, {
						defaultEnvironment,
						environments: serviceMetaData.environments,
					})) as TOML.JsonMap,
				});
			} else {
				const newWorkerType = yesFlag
					? "fetch"
					: await getNewWorkerType(newWorkerFilename);

				if (newWorkerType !== "none") {
					const template = getNewWorkerTemplate("js", newWorkerType);

					await mkdir(path.join(creationDirectory, "./src"), {
						recursive: true,
					});
					await writeFile(
						path.join(creationDirectory, "./src/index.js"),
						readFileSync(path.join(getBasePath(), `templates/${template}`))
					);

					logger.log(
						`✨ Created ${path.relative(
							process.cwd(),
							path.join(creationDirectory, "./src/index.js")
						)}`
					);

					shouldCreateTests =
						yesFlag ||
						(await confirm("Would you like us to write your first test?"));

					if (shouldCreateTests) {
						newWorkerTestType = await getNewWorkerTestType();
						devDepsToInstall.push(newWorkerTestType);
						await writeFile(
							path.join(creationDirectory, "./src/index.test.js"),
							readFileSync(
								path.join(
									getBasePath(),
									`templates/init-tests/test-${newWorkerTestType}-new-worker.js`
								)
							)
						);
						logger.log(
							`✨ Created ${path.relative(
								process.cwd(),
								path.join(creationDirectory, "./src/index.test.js")
							)}`
						);
					}

					await writePackageJsonScriptsAndUpdateWranglerToml({
						isWritingScripts: shouldWritePackageJsonScripts,
						isAddingTests: shouldCreateTests,
						testRunner: newWorkerTestType,
						isCreatingWranglerToml: justCreatedWranglerToml,
						packagePath: pathToPackageJson,
						scriptPath: "src/index.js",
						extraToml: getNewWorkerToml(newWorkerType),
					});
				}
			}
		}
	}
	// install packages as the final step of init
	try {
		await installPackages(
			shouldRunPackageManagerInstall,
			devDepsToInstall,
			packageManager
		);
	} catch (e) {
		// fetching packages could fail due to loss of internet, etc
		// we should let folks know we failed to fetch, but their
		// workers project is still ready to go
		logger.error(e instanceof Error ? e.message : e);
		instructions.push(
			"\n🚨 wrangler was unable to fetch your npm packages, but your project is ready to go"
		);
	}

	// let users know what to do now
	instructions.forEach((instruction) => logger.log(instruction));
}

/*
 * Passes the array of accumulated devDeps to install through to
 * the package manager. Also generates a human-readable list
 * of packages it installed.
 * If there are no devDeps to install, optionally runs
 * the package manager's install command.
 */
async function installPackages(
	shouldRunInstall: boolean,
	depsToInstall: string[],
	packageManager: PackageManager
) {
	//lets install the devDeps they asked for
	//and run their package manager's install command if needed
	if (depsToInstall.length > 0) {
		const formatter = new Intl.ListFormat("en", {
			style: "long",
			type: "conjunction",
		});
		await packageManager.addDevDeps(...depsToInstall);
		const versionlessPackages = depsToInstall.map((dep) =>
			dep === `wrangler@${wranglerVersion}` ? "wrangler" : dep
		);

		logger.log(
			`✨ Installed ${formatter.format(
				versionlessPackages
			)} into devDependencies`
		);
	} else {
		if (shouldRunInstall) {
			await packageManager.install();
		}
	}
}

async function getNewWorkerType(newWorkerFilename: string) {
	return select(
		`Would you like to create a Worker at ${newWorkerFilename}?`,
		[
			{
				value: "none",
				label: "None",
			},
			{
				value: "fetch",
				label: "Fetch handler",
			},
			{
				value: "scheduled",
				label: "Scheduled handler",
			},
		],
		1
	) as Promise<"none" | "fetch" | "scheduled">;
}

async function getNewWorkerTestType() {
	return select(
		`Which test runner would you like to use?`,
		[
			{
				value: "vitest",
				label: "Vitest",
			},
			{
				value: "jest",
				label: "Jest",
			},
		],
		1
	) as Promise<"jest" | "vitest">;
}

function getNewWorkerTemplate(
	lang: "js" | "ts",
	workerType: "fetch" | "scheduled"
) {
	const templates = {
		"js-fetch": "new-worker.js",
		"js-scheduled": "new-worker-scheduled.js",
		"ts-fetch": "new-worker.ts",
		"ts-scheduled": "new-worker-scheduled.ts",
	};

	return templates[`${lang}-${workerType}`];
}

function getNewWorkerToml(workerType: "fetch" | "scheduled"): TOML.JsonMap {
	if (workerType === "scheduled") {
		return {
			triggers: {
				crons: ["1 * * * *"],
			},
		};
	}

	return {};
}

/**
 * Find the path to the given `basename` file from the `cwd`.
 *
 * If `isolatedInit` is true then we only look in the `cwd` directory for the file.
 * Otherwise we also search up the tree.
 */
async function findPath(
	isolatedInit: boolean,
	cwd: string,
	basename: string
): Promise<string | undefined> {
	if (isolatedInit) {
		return fs.existsSync(path.resolve(cwd, basename))
			? path.resolve(cwd, basename)
			: undefined;
	} else {
		return await findUp(basename, {
			cwd: cwd,
		});
	}
}

async function getWorkerConfig(
	accountId: string,
	fromDashScriptName: string,
	{
		defaultEnvironment,
		environments,
	}: {
		defaultEnvironment: string;
		environments: ServiceMetadataRes["environments"];
	}
): Promise<RawConfig> {
	const [bindings, routes, serviceEnvMetadata, cronTriggers] =
		await Promise.all([
			fetchResult<WorkerMetadata["bindings"]>(
				`/accounts/${accountId}/workers/services/${fromDashScriptName}/environments/${defaultEnvironment}/bindings`
			),
			fetchResult<RoutesRes>(
				`/accounts/${accountId}/workers/services/${fromDashScriptName}/environments/${defaultEnvironment}/routes`
			),
			fetchResult<ServiceMetadataRes["default_environment"]>(
				`/accounts/${accountId}/workers/services/${fromDashScriptName}/environments/${defaultEnvironment}`
			),
			fetchResult<CronTriggersRes>(
				`/accounts/${accountId}/workers/scripts/${fromDashScriptName}/schedules`
			),
		]).catch((e) => {
			throw new Error(
				`Error Occurred ${e}: Unable to fetch bindings, routes, or services metadata from the dashboard. Please try again later.`
			);
		});

	const mappedBindings = bindings
		.filter((binding) => (binding.type as string) !== "secret_text")
		// Combine the same types into {[type]: [binding]}
		.reduce((configObj, binding) => {
			// Some types have different names in wrangler.toml
			// I want the type safety of the binding being destructured after the case narrowing the union but type is unused

			switch (binding.type) {
				case "plain_text":
					{
						configObj.vars = {
							...(configObj.vars ?? {}),
							[binding.name]: binding.text,
						};
					}
					break;
				case "json":
					{
						configObj.vars = {
							...(configObj.vars ?? {}),
							name: binding.name,
							json: binding.json,
						};
					}
					break;
				case "kv_namespace":
					{
						configObj.kv_namespaces = [
							...(configObj.kv_namespaces ?? []),
							{ id: binding.namespace_id, binding: binding.name },
						];
					}
					break;
				case "durable_object_namespace":
					{
						configObj.durable_objects = {
							bindings: [
								...(configObj.durable_objects?.bindings ?? []),
								{
									name: binding.name,
									class_name: binding.class_name,
									script_name: binding.script_name,
									environment: binding.environment,
								},
							],
						};
					}
					break;
				case "r2_bucket":
					{
						configObj.r2_buckets = [
							...(configObj.r2_buckets ?? []),
							{ binding: binding.name, bucket_name: binding.bucket_name },
						];
					}
					break;
				case "service":
					{
						configObj.services = [
							...(configObj.services ?? []),
							{
								binding: binding.name,
								service: binding.service,
								environment: binding.environment,
							},
						];
					}
					break;
				case "namespace":
					{
						configObj.dispatch_namespaces = [
							...(configObj.dispatch_namespaces ?? []),
							{ binding: binding.name, namespace: binding.namespace },
						];
					}
					break;
				case "logfwdr":
					{
						configObj.logfwdr = {
							// TODO: Messaging about adding schema file path
							schema: "",
							bindings: [
								...(configObj.logfwdr?.bindings ?? []),
								{ name: binding.name, destination: binding.destination },
							],
						};
					}
					break;
				case "wasm_module":
					{
						configObj.wasm_modules = {
							...(configObj.wasm_modules ?? {}),
							[binding.name]: binding.part,
						};
					}
					break;
				case "text_blob":
					{
						configObj.text_blobs = {
							...(configObj.text_blobs ?? {}),
							[binding.name]: binding.part,
						};
					}
					break;
				case "data_blob":
					{
						configObj.data_blobs = {
							...(configObj.data_blobs ?? {}),
							[binding.name]: binding.part,
						};
					}
					break;
				default: {
					// If we don't know what the type is, its an unsafe binding
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					if (!(binding as any)?.type) break;
					configObj.unsafe = {
						bindings: [...(configObj.unsafe?.bindings ?? []), binding],
					};
				}
			}

			return configObj;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		}, {} as RawConfig);

	const durableObjectClassNames = bindings
		.filter((binding) => binding.type === "durable_object_namespace")
		.map(
			(durableObject) => (durableObject as { class_name: string }).class_name
		);

	const routeOrRoutes = routes.map((rawRoute) => {
		const { id: _id, ...route } = rawRoute;
		if (Object.keys(route).length === 1) {
			return route.pattern;
		} else {
			return route as Route;
		}
	});
	const routeOrRoutesToConfig =
		routeOrRoutes.length > 1
			? { routes: routeOrRoutes }
			: { route: routeOrRoutes[0] };

	return {
		compatibility_date:
			serviceEnvMetadata.script.compatibility_date ??
			new Date().toISOString().substring(0, 10),
		...routeOrRoutesToConfig,
		usage_model: serviceEnvMetadata.script.usage_model,
		...(durableObjectClassNames.length
			? {
					migrations: [
						{
							tag: serviceEnvMetadata.script.migration_tag,
							new_classes: durableObjectClassNames,
						},
					],
			  }
			: {}),
		triggers: {
			crons: cronTriggers.schedules.map((scheduled) => scheduled.cron),
		},
		env: environments
			.filter((env) => env.environment !== "production")
			// `env` can have multiple Environments, with different configs.
			.reduce((envObj, { environment }) => {
				return { ...envObj, [environment]: {} };
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			}, {} as RawConfig["env"]),
		...mappedBindings,
	};
}
