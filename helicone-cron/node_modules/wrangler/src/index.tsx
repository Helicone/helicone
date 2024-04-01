import os from "node:os";
import TOML from "@iarna/toml";
import chalk from "chalk";
import supportsColor from "supports-color";
import { ProxyAgent, setGlobalDispatcher } from "undici";
import makeCLI from "yargs";
import { version as wranglerVersion } from "../package.json";
import { isBuildFailure } from "./bundle";
import { loadDotEnv, readConfig } from "./config";
import { d1 } from "./d1";
import { deleteHandler, deleteOptions } from "./delete";
import { deployments } from "./deployments";
import {
	buildHandler,
	buildOptions,
	configHandler,
	noOpOptions,
	generateHandler,
	generateOptions,
	previewHandler,
	previewOptions,
	route,
	routeHandler,
	subdomainHandler,
	subdomainOptions,
} from "./deprecated";
import { devHandler, devOptions } from "./dev";
import { workerNamespaceCommands } from "./dispatch-namespace";
import { initHandler, initOptions } from "./init";
import { kvNamespace, kvKey, kvBulk } from "./kv";
import { logBuildFailure, logger } from "./logger";
import * as metrics from "./metrics";
import { pages } from "./pages";
import { formatMessage, ParseError } from "./parse";
import { publishOptions, publishHandler } from "./publish";
import { pubSubCommands } from "./pubsub/pubsub-commands";
import { queues } from "./queues/cli/commands";
import { r2 } from "./r2";
import { secret, secretBulkHandler, secretBulkOptions } from "./secret";
import { tailOptions, tailHandler } from "./tail";
import { generateTypes } from "./type-generation";
import { updateCheck } from "./update-check";
import {
	listScopes,
	login,
	logout,
	requireAuth,
	validateScopeKeys,
} from "./user";
import { whoami } from "./whoami";

import type { Config } from "./config";
import type { CommonYargsOptions } from "./yargs-types";
import type { ArgumentsCamelCase } from "yargs";
import type Yargs from "yargs";

export type ConfigPath = string | undefined;

const resetColor = "\x1b[0m";
const fgGreenColor = "\x1b[32m";
export const DEFAULT_LOCAL_PORT = 8787;
export const DEFAULT_INSPECTOR_PORT = 9229;

const proxy =
	process.env.https_proxy ||
	process.env.HTTPS_PROXY ||
	process.env.http_proxy ||
	process.env.HTTP_PROXY ||
	undefined;

if (proxy) {
	setGlobalDispatcher(new ProxyAgent(proxy));
	logger.log(
		`Proxy environment variables detected. We'll use your proxy for fetch requests.`
	);
}

export function getRules(config: Config): Config["rules"] {
	const rules = config.rules ?? config.build?.upload?.rules ?? [];

	if (config.rules && config.build?.upload?.rules) {
		throw new Error(
			`You cannot configure both [rules] and [build.upload.rules] in your wrangler.toml. Delete the \`build.upload\` section.`
		);
	}

	if (config.build?.upload?.rules) {
		logger.warn(
			`Deprecation: The \`build.upload.rules\` config field is no longer used, the rules should be specified via the \`rules\` config field. Delete the \`build.upload\` field from the configuration file, and add this:

${TOML.stringify({ rules: config.build.upload.rules })}`
		);
	}
	return rules;
}

export async function printWranglerBanner() {
	// Let's not print this in tests
	if (typeof jest !== "undefined") {
		return;
	}

	const text = ` ⛅️ wrangler ${wranglerVersion} ${await updateCheck()}`;

	logger.log(
		text +
			"\n" +
			(supportsColor.stdout
				? chalk.hex("#FF8800")("-".repeat(text.length))
				: "-".repeat(text.length))
	);
}

export function isLegacyEnv(config: Config): boolean {
	// We only read from config here, because we've already accounted for
	// args["legacy-env"] in https://github.com/cloudflare/wrangler2/blob/b24aeb5722370c2e04bce97a84a1fa1e55725d79/packages/wrangler/src/config/validation.ts#L94-L98
	return config.legacy_env;
}

export function getScriptName(
	args: { name: string | undefined; env: string | undefined },
	config: Config
): string | undefined {
	if (args.name && isLegacyEnv(config) && args.env) {
		throw new CommandLineArgsError(
			"In legacy environment mode you cannot use --name and --env together. If you want to specify a Worker name for a specific environment you can add the following to your wrangler.toml config:" +
				`
    [env.${args.env}]
    name = "${args.name}"
    `
		);
	}

	return args.name ?? config.name;
}

/**
 * Alternative to the getScriptName() because special Legacy cases allowed "name", and "env" together in Wrangler1
 */
export function getLegacyScriptName(
	args: { name: string | undefined; env: string | undefined },
	config: Config
) {
	return args.name && args.env && isLegacyEnv(config)
		? `${args.name}-${args.env}`
		: args.name ?? config.name;
}

// a helper to demand one of a set of options
// via https://github.com/yargs/yargs/issues/1093#issuecomment-491299261
export function demandOneOfOption(...options: string[]) {
	return function (argv: Yargs.Arguments) {
		const count = options.filter((option) => argv[option]).length;
		const lastOption = options.pop();

		if (count === 0) {
			throw new CommandLineArgsError(
				`Exactly one of the arguments ${options.join(
					", "
				)} and ${lastOption} is required`
			);
		} else if (count > 1) {
			throw new CommandLineArgsError(
				`Arguments ${options.join(
					", "
				)} and ${lastOption} are mutually exclusive`
			);
		}

		return true;
	};
}

export class CommandLineArgsError extends Error {}

export function createCLIParser(argv: string[]) {
	// Type check result against CommonYargsOptions to make sure we've included
	// all common options
	const wrangler: Yargs.Argv<CommonYargsOptions> = makeCLI(argv)
		.strict()
		// We handle errors ourselves in a try-catch around `yargs.parse`.
		// If you want the "help info" to be displayed then throw an instance of `CommandLineArgsError`.
		// Otherwise we just log the error that was thrown without any "help info".
		.showHelpOnFail(false)
		.fail((msg, error) => {
			if (!error || error.name === "YError") {
				// If there is no error or the error is a "YError", then this came from yargs own validation
				// Wrap it in a `CommandLineArgsError` so that we can handle it appropriately further up.
				error = new CommandLineArgsError(msg);
			}
			throw error;
		})
		.scriptName("wrangler")
		.wrap(null)
		// Define global options here, so they get included in the `Argv` type of
		// the `wrangler` variable
		.version(false)
		.option("v", {
			describe: "Show version number",
			alias: "version",
			type: "boolean",
		})
		.option("config", {
			alias: "c",
			describe: "Path to .toml configuration file",
			type: "string",
			requiresArg: true,
		})
		.option("env", {
			alias: "e",
			describe: "Environment to use for operations and .env files",
			type: "string",
			requiresArg: true,
		})
		.check((args) => {
			// Grab locally specified env params from `.env` file
			const loaded = loadDotEnv(".env", args.env);
			for (const [key, value] of Object.entries(loaded?.parsed ?? {})) {
				if (!(key in process.env)) process.env[key] = value;
			}
			return true;
		});

	wrangler.group(["config", "env", "help", "version"], "Flags:");
	wrangler.help().alias("h", "help");

	// Default help command that supports the subcommands
	const subHelp: Yargs.CommandModule<CommonYargsOptions, CommonYargsOptions> = {
		command: ["*"],
		handler: async (args) => {
			setImmediate(() =>
				wrangler.parse([...args._.map((a) => `${a}`), "--help"])
			);
		},
	};
	wrangler.command(
		["*"],
		false,
		() => {},
		async (args) => {
			if (args._.length > 0) {
				throw new CommandLineArgsError(`Unknown command: ${args._}.`);
			} else {
				// args.v will exist and be true in the case that no command is called, and the -v
				// option is present. This is to allow for running asynchronous printWranglerBanner
				// in the version command.
				if (args.v) {
					if (process.stdout.isTTY) {
						await printWranglerBanner();
					} else {
						logger.log(wranglerVersion);
					}
				} else {
					wrangler.showHelp("log");
				}
			}
		}
	);

	// You will note that we use the form for all commands where we use the builder function
	// to define options and subcommands.
	// Further we return the result of this builder even though it's not completely necessary.
	// The reason is that it's required for type inference of the args in the handle function.
	// I wish we could enforce this pattern, but this comment will have to do for now.
	// (It's also annoying that choices[] doesn't get inferred as an enum. 🤷‍♂.)

	// [DEPRECATED] generate
	wrangler.command(
		// we definitely want to move away from us cloning github templates
		// we can do something better here, let's see
		"generate [name] [template]",
		false,
		generateOptions,
		generateHandler
	);

	// init
	wrangler.command(
		"init [name]",
		"📥 Create a wrangler.toml configuration file",
		initOptions,
		initHandler
	);

	// [DEPRECATED] build
	wrangler.command("build", false, buildOptions, buildHandler);

	// [DEPRECATED] config
	wrangler.command("config", false, noOpOptions, configHandler);

	// dev
	wrangler.command(
		"dev [script]",
		"👂 Start a local server for developing your worker",
		devOptions,
		devHandler
	);

	// publish
	wrangler.command(
		"publish [script]",
		"🆙 Publish your Worker to Cloudflare.",
		publishOptions,
		publishHandler
	);

	// delete
	wrangler.command(
		"delete [script]",
		"🗑  Delete your Worker from Cloudflare.",
		deleteOptions,
		deleteHandler
	);

	// tail
	wrangler.command(
		"tail [worker]",
		"🦚 Starts a log tailing session for a published Worker.",
		tailOptions,
		tailHandler
	);

	// [DEPRECATED] preview
	wrangler.command(
		"preview [method] [body]",
		false,
		previewOptions,
		previewHandler
	);

	// [DEPRECATED] route
	wrangler.command(
		"route",
		false, // I think we want to hide this command
		// "➡️  List or delete worker routes",
		(routeYargs) => {
			return route(routeYargs);
		},
		routeHandler
	);

	// [DEPRECATED] subdomain
	wrangler.command(
		"subdomain [name]",
		false,
		// "👷 Create or change your workers.dev subdomain.",
		subdomainOptions,
		subdomainHandler
	);

	// secret
	wrangler.command(
		"secret",
		"🤫 Generate a secret that can be referenced in a Worker",
		(secretYargs) => {
			return secret(secretYargs.command(subHelp));
		}
	);

	wrangler.command(
		"secret:bulk <json>",
		"🗄️  Bulk upload secrets for a Worker",
		secretBulkOptions,
		secretBulkHandler
	);

	// kv namespace
	wrangler.command(
		"kv:namespace",
		"🗂️  Interact with your Workers KV Namespaces",
		(namespaceYargs) => {
			return kvNamespace(namespaceYargs.command(subHelp));
		}
	);

	// kv key
	wrangler.command(
		"kv:key",
		"🔑 Individually manage Workers KV key-value pairs",
		(keyYargs) => {
			return kvKey(keyYargs.command(subHelp));
		}
	);

	// kv bulk
	wrangler.command(
		"kv:bulk",
		"💪 Interact with multiple Workers KV key-value pairs at once",
		(bulkYargs) => {
			return kvBulk(bulkYargs.command(subHelp));
		}
	);

	// pages
	wrangler.command("pages", "⚡️ Configure Cloudflare Pages", (pagesYargs) => {
		return pages(pagesYargs.command(subHelp));
	});

	// queues
	wrangler.command("queues", "🇶 Configure Workers Queues", (queuesYargs) => {
		return queues(queuesYargs.command(subHelp));
	});

	// r2
	wrangler.command("r2", "📦 Interact with an R2 store", (r2Yargs) => {
		return r2(r2Yargs.command(subHelp));
	});

	// dispatch-namespace
	wrangler.command(
		"dispatch-namespace",
		"📦 Interact with a dispatch namespace",
		(workerNamespaceYargs) => {
			return workerNamespaceCommands(workerNamespaceYargs, subHelp);
		}
	);

	// d1
	wrangler.command("d1", "🗄  Interact with a D1 database", (d1Yargs) => {
		return d1(d1Yargs.command(subHelp));
	});

	// pubsub
	wrangler.command(
		"pubsub",
		"📮 Interact and manage Pub/Sub Brokers",
		(pubsubYargs) => {
			return pubSubCommands(pubsubYargs, subHelp);
		}
	);

	/**
	 * User Group: login, logout, and whoami
	 * TODO: group commands into User group similar to .group() for flags in yargs
	 */
	// login
	wrangler.command(
		// this needs scopes as an option?
		"login",
		"🔓 Login to Cloudflare",
		(yargs) => {
			// TODO: This needs some copy editing
			// I mean, this entire app does, but this too.
			return yargs
				.option("scopes-list", {
					describe: "List all the available OAuth scopes with descriptions",
				})
				.option("browser", {
					default: true,
					type: "boolean",
					describe: "Automatically open the OAuth link in a browser",
				})
				.option("scopes", {
					describe: "Pick the set of applicable OAuth scopes when logging in",
					array: true,
					type: "string",
					requiresArg: true,
				});

			// TODO: scopes
		},
		async (args) => {
			await printWranglerBanner();
			if (args["scopes-list"]) {
				listScopes();
				return;
			}
			if (args.scopes) {
				if (args.scopes.length === 0) {
					// don't allow no scopes to be passed, that would be weird
					listScopes();
					return;
				}
				if (!validateScopeKeys(args.scopes)) {
					throw new CommandLineArgsError(
						`One of ${args.scopes} is not a valid authentication scope. Run "wrangler login --list-scopes" to see the valid scopes.`
					);
				}
				await login({ scopes: args.scopes, browser: args.browser });
				return;
			}
			await login({ browser: args.browser });
			const config = readConfig(args.config as ConfigPath, args);
			await metrics.sendMetricsEvent("login user", {
				sendMetrics: config.send_metrics,
			});

			// TODO: would be nice if it optionally saved login
			// credentials inside node_modules/.cache or something
			// this way you could have multiple users on a single machine
		}
	);

	// logout
	wrangler.command(
		// this needs scopes as an option?
		"logout",
		"🚪 Logout from Cloudflare",
		() => {},
		async () => {
			await printWranglerBanner();
			await logout();
			const config = readConfig(undefined, {});
			await metrics.sendMetricsEvent("logout user", {
				sendMetrics: config.send_metrics,
			});
		}
	);

	// whoami
	wrangler.command(
		"whoami",
		"🕵️  Retrieve your user info and test your auth config",
		() => {},
		async () => {
			await printWranglerBanner();
			await whoami();
			const config = readConfig(undefined, {});
			await metrics.sendMetricsEvent("view accounts", {
				sendMetrics: config.send_metrics,
			});
		}
	);

	// type generation
	wrangler.command(
		"types",
		"📝 Generate types from bindings & module rules in config",
		() => {},
		async () => {
			await printWranglerBanner();
			const config = readConfig(undefined, {});

			const configBindings: Partial<Config> = {
				kv_namespaces: config.kv_namespaces ?? [],
				vars: { ...config.vars },
				wasm_modules: config.wasm_modules,
				text_blobs: {
					...config.text_blobs,
				},
				data_blobs: config.data_blobs,
				durable_objects: config.durable_objects,
				r2_buckets: config.r2_buckets,
				d1_databases: config.d1_databases,
				services: config.services,
				dispatch_namespaces: config.dispatch_namespaces,
				logfwdr: config.logfwdr,
				unsafe: { bindings: config.unsafe?.bindings },
				rules: config.rules,
				queues: config.queues,
			};

			await generateTypes(configBindings, config);
		}
	);

	//deployments
	const deploymentsWarning =
		"🚧`wrangler deployments` is a beta command. Please report any issues to https://github.com/cloudflare/wrangler2/issues/new/choose";
	wrangler.command(
		"deployments",
		"🚢 Displays the 10 most recent deployments for a worker",
		(yargs) => {
			yargs
				.option("name", {
					describe: "The name of your worker",
					type: "string",
				})
				.epilogue(deploymentsWarning);
		},
		async (deploymentsYargs: ArgumentsCamelCase<{ name: string }>) => {
			await printWranglerBanner();
			const config = readConfig(
				deploymentsYargs.config as ConfigPath,
				deploymentsYargs
			);
			const accountId = await requireAuth(config);
			const scriptName = getScriptName(
				{ name: deploymentsYargs.name, env: undefined },
				config
			);

			logger.log(`${deploymentsWarning}\n`);
			await deployments(accountId, scriptName);
		}
	);

	// This set to false to allow overwrite of default behaviour
	wrangler.version(false);

	// version
	wrangler.command(
		"version",
		false,
		() => {},
		async () => {
			if (process.stdout.isTTY) {
				await printWranglerBanner();
			} else {
				logger.log(wranglerVersion);
			}
		}
	);

	wrangler.exitProcess(false);

	return wrangler;
}

export async function main(argv: string[]): Promise<void> {
	const wrangler = createCLIParser(argv);
	try {
		await wrangler.parse();
	} catch (e) {
		logger.log(""); // Just adds a bit of space
		if (e instanceof CommandLineArgsError) {
			logger.error(e.message);
			// We are not able to ask the `wrangler` CLI parser to show help for a subcommand programmatically.
			// The workaround is to re-run the parsing with an additional `--help` flag, which will result in the correct help message being displayed.
			// The `wrangler` object is "frozen"; we cannot reuse that with different args, so we must create a new CLI parser to generate the help message.
			await createCLIParser([...argv, "--help"]).parse();
		} else if (e instanceof ParseError) {
			e.notes.push({
				text: "\nIf you think this is a bug, please open an issue at: https://github.com/cloudflare/wrangler2/issues/new/choose",
			});
			logger.log(formatMessage(e));
		} else if (
			e instanceof Error &&
			e.message.includes("Raw mode is not supported on")
		) {
			// the current terminal doesn't support raw mode, which Ink needs to render
			// Ink doesn't throw a typed error or subclass or anything, so we just check the message content.
			// https://github.com/vadimdemedes/ink/blob/546fe16541fd05ad4e638d6842ca4cbe88b4092b/src/components/App.tsx#L138-L148

			const currentPlatform = os.platform();

			const thisTerminalIsUnsupported =
				"This terminal doesn't support raw mode.";
			const soWranglerWontWork =
				"Wrangler uses raw mode to read user input and write output to the terminal, and won't function correctly without it.";
			const tryRunningItIn =
				"Try running your previous command in a terminal that supports raw mode";
			const oneOfThese =
				currentPlatform === "win32"
					? ", such as Command Prompt or Powershell."
					: currentPlatform === "darwin"
					? ", such as Terminal.app or iTerm."
					: "."; // linux user detected, hand holding disengaged.

			logger.error(
				`${thisTerminalIsUnsupported}\n${soWranglerWontWork}\n${tryRunningItIn}${oneOfThese}`
			);
		} else if (isBuildFailure(e)) {
			logBuildFailure(e);
			logger.error(e.message);
		} else {
			logger.error(e instanceof Error ? e.message : e);
			logger.log(
				`${fgGreenColor}%s${resetColor}`,
				"If you think this is a bug then please create an issue at https://github.com/cloudflare/wrangler2/issues/new/choose"
			);
		}
		throw e;
	}
}

export function getDevCompatibilityDate(
	config: Config,
	compatibilityDate = config.compatibility_date
) {
	const currentDate = new Date().toISOString().substring(0, 10);
	if (config.configPath !== undefined && compatibilityDate === undefined) {
		logger.warn(
			`No compatibility_date was specified. Using today's date: ${currentDate}.\n` +
				"Add one to your wrangler.toml file:\n" +
				"```\n" +
				`compatibility_date = "${currentDate}"\n` +
				"```\n" +
				"or pass it in your terminal:\n" +
				"```\n" +
				`--compatibility-date=${currentDate}\n` +
				"```\n" +
				"See https://developers.cloudflare.com/workers/platform/compatibility-dates/ for more information."
		);
	}
	return compatibilityDate ?? currentDate;
}
