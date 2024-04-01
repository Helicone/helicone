import path from "node:path";
import { fetchResult } from "../cfetch";
import { readConfig } from "../config";
import { createWorkerUploadForm } from "../create-worker-upload-form";
import { confirm, prompt } from "../dialogs";
import {
	getLegacyScriptName,
	isLegacyEnv,
	printWranglerBanner,
} from "../index";
import { logger } from "../logger";
import * as metrics from "../metrics";
import { parseJSON, readFileSync } from "../parse";
import { requireAuth } from "../user";

import type { ConfigPath } from "../index";
import type {
	CommonYargsOptions,
	YargsOptionsToInterface,
} from "../yargs-types";
import type { Argv } from "yargs";

export const secret = (secretYargs: Argv<CommonYargsOptions>) => {
	return secretYargs
		.option("legacy-env", {
			type: "boolean",
			describe: "Use legacy environments",
			hidden: true,
		})
		.command(
			"put <key>",
			"Create or update a secret variable for a Worker",
			(yargs) => {
				return yargs
					.positional("key", {
						describe: "The variable name to be accessible in the Worker",
						type: "string",
					})
					.option("name", {
						describe: "Name of the Worker",
						type: "string",
						requiresArg: true,
					});
			},
			async (args) => {
				await printWranglerBanner();
				const config = readConfig(args.config as ConfigPath, args);

				const scriptName = getLegacyScriptName(args, config);
				if (!scriptName) {
					throw new Error(
						"Required Worker name missing. Please specify the Worker name in wrangler.toml, or pass it as an argument with `--name <worker-name>`"
					);
				}

				const accountId = await requireAuth(config);

				const isInteractive = process.stdin.isTTY;
				const secretValue = trimTrailingWhitespace(
					isInteractive
						? await prompt("Enter a secret value:", "password")
						: await readFromStdin()
				);

				logger.log(
					`🌀 Creating the secret for the Worker "${scriptName}" ${
						args.env && !isLegacyEnv(config) ? `(${args.env})` : ""
					}`
				);

				async function submitSecret() {
					const url =
						!args.env || isLegacyEnv(config)
							? `/accounts/${accountId}/workers/scripts/${scriptName}/secrets`
							: `/accounts/${accountId}/workers/services/${scriptName}/environments/${args.env}/secrets`;

					return await fetchResult(url, {
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							name: args.key,
							text: secretValue,
							type: "secret_text",
						}),
					});
				}

				const createDraftWorker = async () => {
					// TODO: log a warning
					await fetchResult(
						!isLegacyEnv(config) && args.env
							? `/accounts/${accountId}/workers/services/${scriptName}/environments/${args.env}`
							: `/accounts/${accountId}/workers/scripts/${scriptName}`,
						{
							method: "PUT",
							body: createWorkerUploadForm({
								name: scriptName,
								main: {
									name: scriptName,
									content: `export default { fetch() {} }`,
									type: "esm",
								},
								bindings: {
									kv_namespaces: [],
									vars: {},
									durable_objects: { bindings: [] },
									queues: [],
									r2_buckets: [],
									d1_databases: [],
									services: [],
									wasm_modules: {},
									text_blobs: {},
									data_blobs: {},
									dispatch_namespaces: [],
									logfwdr: { schema: undefined, bindings: [] },
									unsafe: [],
								},
								modules: [],
								migrations: undefined,
								compatibility_date: undefined,
								compatibility_flags: undefined,
								usage_model: undefined,
								keepVars: false, // this doesn't matter since it's a new script anyway
								logpush: false,
							}),
						}
					);
				};

				function isMissingWorkerError(e: unknown): e is { code: 10007 } {
					return (
						typeof e === "object" &&
						e !== null &&
						(e as { code: number }).code === 10007
					);
				}

				try {
					await submitSecret();
					await metrics.sendMetricsEvent("create encrypted variable", {
						sendMetrics: config.send_metrics,
					});
				} catch (e) {
					if (isMissingWorkerError(e)) {
						// create a draft worker and try again
						await createDraftWorker();
						await submitSecret();
						// TODO: delete the draft worker if this failed too?
					} else {
						throw e;
					}
				}

				logger.log(`✨ Success! Uploaded secret ${args.key}`);
			}
		)
		.command(
			"delete <key>",
			"Delete a secret variable from a Worker",
			async (yargs) => {
				await printWranglerBanner();
				return yargs
					.positional("key", {
						describe: "The variable name to be accessible in the Worker",
						type: "string",
					})
					.option("name", {
						describe: "Name of the Worker",
						type: "string",
						requiresArg: true,
					});
			},
			async (args) => {
				const config = readConfig(args.config as ConfigPath, args);

				const scriptName = getLegacyScriptName(args, config);
				if (!scriptName) {
					throw new Error(
						"Required Worker name missing. Please specify the Worker name in wrangler.toml, or pass it as an argument with `--name <worker-name>`"
					);
				}

				const accountId = await requireAuth(config);

				if (
					await confirm(
						`Are you sure you want to permanently delete the secret ${
							args.key
						} on the Worker ${scriptName}${
							args.env && !isLegacyEnv(config) ? ` (${args.env})` : ""
						}?`
					)
				) {
					logger.log(
						`🌀 Deleting the secret ${args.key} on the Worker ${scriptName}${
							args.env && !isLegacyEnv(config) ? ` (${args.env})` : ""
						}`
					);

					const url =
						!args.env || isLegacyEnv(config)
							? `/accounts/${accountId}/workers/scripts/${scriptName}/secrets`
							: `/accounts/${accountId}/workers/services/${scriptName}/environments/${args.env}/secrets`;

					await fetchResult(`${url}/${args.key}`, { method: "DELETE" });
					await metrics.sendMetricsEvent("delete encrypted variable", {
						sendMetrics: config.send_metrics,
					});
					logger.log(`✨ Success! Deleted secret ${args.key}`);
				}
			}
		)
		.command(
			"list",
			"List all secrets for a Worker",
			(yargs) => {
				return yargs.option("name", {
					describe: "Name of the Worker",
					type: "string",
					requiresArg: true,
				});
			},
			async (args) => {
				const config = readConfig(args.config as ConfigPath, args);

				const scriptName = getLegacyScriptName(args, config);
				if (!scriptName) {
					throw new Error(
						"Required Worker name missing. Please specify the Worker name in wrangler.toml, or pass it as an argument with `--name <worker-name>`"
					);
				}

				const accountId = await requireAuth(config);

				const url =
					!args.env || isLegacyEnv(config)
						? `/accounts/${accountId}/workers/scripts/${scriptName}/secrets`
						: `/accounts/${accountId}/workers/services/${scriptName}/environments/${args.env}/secrets`;

				logger.log(JSON.stringify(await fetchResult(url), null, "  "));
				await metrics.sendMetricsEvent("list encrypted variables", {
					sendMetrics: config.send_metrics,
				});
			}
		);
};

export const secretBulkOptions = (yargs: Argv<CommonYargsOptions>) => {
	return yargs
		.positional("json", {
			describe: `The JSON file of key-value pairs to upload, in form {"key": value, ...}`,
			type: "string",
			demandOption: "true",
		})
		.option("name", {
			describe: "Name of the Worker",
			type: "string",
			requiresArg: true,
		});
};

/**
 * Remove trailing white space from inputs.
 * Matching Wrangler legacy behavior with handling inputs
 */
function trimTrailingWhitespace(str: string) {
	return str.trimEnd();
}

/**
 * Get a promise to the streamed input from stdin.
 *
 * This function can be used to grab the incoming stream of data from, say,
 * piping the output of another process into the wrangler process.
 */
function readFromStdin(): Promise<string> {
	return new Promise((resolve, reject) => {
		const stdin = process.stdin;
		const chunks: string[] = [];

		// When there is data ready to be read, the `readable` event will be triggered.
		// In the handler for `readable` we call `read()` over and over until all the available data has been read.
		stdin.on("readable", () => {
			let chunk;
			while (null !== (chunk = stdin.read())) {
				chunks.push(chunk);
			}
		});

		// When the streamed data is complete the `end` event will be triggered.
		// In the handler for `end` we join the chunks together and resolve the promise.
		stdin.on("end", () => {
			resolve(chunks.join(""));
		});

		// If there is an `error` event then the handler will reject the promise.
		stdin.on("error", (err) => {
			reject(err);
		});
	});
}

type SecretBulkArgs = YargsOptionsToInterface<typeof secretBulkOptions>;

export const secretBulkHandler = async (secretBulkArgs: SecretBulkArgs) => {
	await printWranglerBanner();
	const config = readConfig(
		secretBulkArgs.config as ConfigPath,
		secretBulkArgs
	);

	const scriptName = getLegacyScriptName(secretBulkArgs, config);
	if (!scriptName) {
		throw new Error(
			"Required Worker name missing. Please specify the Worker name in wrangler.toml, or pass it as an argument with `--name <worker-name>`"
		);
	}

	const accountId = await requireAuth(config);

	logger.log(
		`🌀 Creating the secrets for the Worker "${scriptName}" ${
			secretBulkArgs.env && !isLegacyEnv(config)
				? `(${secretBulkArgs.env})`
				: ""
		}`
	);
	const jsonFilePath = path.resolve(secretBulkArgs.json);
	const content = parseJSON<Record<string, string>>(
		readFileSync(jsonFilePath),
		jsonFilePath
	);
	for (const key in content) {
		if (typeof content[key] !== "string") {
			throw new Error(
				`The value for ${key} in ${jsonFilePath} is not a string.`
			);
		}
	}

	const url =
		!secretBulkArgs.env || isLegacyEnv(config)
			? `/accounts/${accountId}/workers/scripts/${scriptName}/secrets`
			: `/accounts/${accountId}/workers/services/${scriptName}/environments/${secretBulkArgs.env}/secrets`;
	// Until we have a bulk route for secrets, we need to make a request for each key/value pair
	const bulkOutcomes = await Promise.all(
		Object.entries(content).map(async ([key, value]) => {
			return fetchResult(url, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: key,
					text: value,
					type: "secret_text",
				}),
			})
				.then(() => {
					logger.log(`✨ Successfully created secret for key: ${key}`);
					return true;
				})
				.catch((e) => {
					logger.error(
						`🚨 Error uploading secret for key: ${key}:
                ${e.message}`
					);
					return false;
				});
		})
	);
	const successes = bulkOutcomes.filter((outcome) => outcome).length;
	const failures = bulkOutcomes.length - successes;
	logger.log("");
	logger.log("Finished processing secrets JSON file:");
	logger.log(`✨ ${successes} secrets successfully uploaded`);
	if (failures > 0) {
		logger.log(`🚨 ${failures} secrets failed to upload`);
	}
};
