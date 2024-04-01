import { StringDecoder } from "node:string_decoder";
import { readConfig } from "../config";
import { confirm } from "../dialogs";
import {
	demandOneOfOption,
	printWranglerBanner,
	CommandLineArgsError,
} from "../index";
import { logger } from "../logger";
import * as metrics from "../metrics";
import { parseJSON, readFileSync, readFileSyncToBuffer } from "../parse";
import { requireAuth } from "../user";
import {
	createKVNamespace,
	deleteKVNamespace,
	getKVNamespaceId,
	isValidKVNamespaceBinding,
	listKVNamespaces,
	deleteKVBulkKeyValue,
	deleteKVKeyValue,
	getKVKeyValue,
	isKVKeyValue,
	listKVNamespaceKeys,
	putKVBulkKeyValue,
	putKVKeyValue,
	unexpectedKVKeyValueProps,
} from "./helpers";
import type { ConfigPath } from "../index";
import type { CommonYargsOptions } from "../yargs-types";
import type { KeyValue } from "./helpers";
import type { Argv } from "yargs";

export const kvNamespace = (kvYargs: Argv<CommonYargsOptions>) => {
	return kvYargs
		.command(
			"create <namespace>",
			"Create a new namespace",
			(yargs) => {
				return yargs
					.positional("namespace", {
						describe: "The name of the new namespace",
						type: "string",
						demandOption: true,
					})
					.option("preview", {
						type: "boolean",
						describe: "Interact with a preview namespace",
					});
			},
			async (args) => {
				await printWranglerBanner();

				if (!isValidKVNamespaceBinding(args.namespace)) {
					throw new CommandLineArgsError(
						`The namespace binding name "${args.namespace}" is invalid. It can only have alphanumeric and _ characters, and cannot begin with a number.`
					);
				}

				const config = readConfig(args.config as ConfigPath, args);
				if (!config.name) {
					logger.warn(
						"No configured name present, using `worker` as a prefix for the title"
					);
				}

				const name = config.name || "worker";
				const environment = args.env ? `-${args.env}` : "";
				const preview = args.preview ? "_preview" : "";
				const title = `${name}${environment}-${args.namespace}${preview}`;

				const accountId = await requireAuth(config);

				// TODO: generate a binding name stripping non alphanumeric chars

				logger.log(`🌀 Creating namespace with title "${title}"`);
				const namespaceId = await createKVNamespace(accountId, title);
				await metrics.sendMetricsEvent("create kv namespace", {
					sendMetrics: config.send_metrics,
				});

				logger.log("✨ Success!");
				const envString = args.env ? ` under [env.${args.env}]` : "";
				const previewString = args.preview ? "preview_" : "";
				logger.log(
					`Add the following to your configuration file in your kv_namespaces array${envString}:`
				);
				logger.log(
					`{ binding = "${args.namespace}", ${previewString}id = "${namespaceId}" }`
				);

				// TODO: automatically write this block to the wrangler.toml config file??
			}
		)
		.command(
			"list",
			"Outputs a list of all KV namespaces associated with your account id.",
			{},
			async (args) => {
				const config = readConfig(args.config as ConfigPath, args);

				const accountId = await requireAuth(config);

				// TODO: we should show bindings if they exist for given ids

				logger.log(
					JSON.stringify(await listKVNamespaces(accountId), null, "  ")
				);
				await metrics.sendMetricsEvent("list kv namespaces", {
					sendMetrics: config.send_metrics,
				});
			}
		)
		.command(
			"delete",
			"Deletes a given namespace.",
			(yargs) => {
				return yargs
					.option("binding", {
						type: "string",
						requiresArg: true,
						describe: "The name of the namespace to delete",
					})
					.option("namespace-id", {
						type: "string",
						requiresArg: true,
						describe: "The id of the namespace to delete",
					})
					.check(demandOneOfOption("binding", "namespace-id"))
					.option("preview", {
						type: "boolean",
						describe: "Interact with a preview namespace",
					});
			},
			async (args) => {
				await printWranglerBanner();
				const config = readConfig(args.config as ConfigPath, args);

				let id;
				try {
					id = getKVNamespaceId(args, config);
				} catch (e) {
					throw new CommandLineArgsError(
						"Not able to delete namespace.\n" + ((e as Error).message ?? e)
					);
				}

				const accountId = await requireAuth(config);

				logger.log(`Deleting KV namespace ${id}.`);
				await deleteKVNamespace(accountId, id);
				logger.log(`Deleted KV namespace ${id}.`);
				await metrics.sendMetricsEvent("delete kv namespace", {
					sendMetrics: config.send_metrics,
				});

				// TODO: recommend they remove it from wrangler.toml

				// test-mf wrangler kv:namespace delete --namespace-id 2a7d3d8b23fc4159b5afa489d6cfd388
				// Are you sure you want to delete namespace 2a7d3d8b23fc4159b5afa489d6cfd388? [y/n]
				// n
				// 💁  Not deleting namespace 2a7d3d8b23fc4159b5afa489d6cfd388
				// ➜  test-mf wrangler kv:namespace delete --namespace-id 2a7d3d8b23fc4159b5afa489d6cfd388
				// Are you sure you want to delete namespace 2a7d3d8b23fc4159b5afa489d6cfd388? [y/n]
				// y
				// 🌀  Deleting namespace 2a7d3d8b23fc4159b5afa489d6cfd388
				// ✨  Success
				// ⚠️  Make sure to remove this "kv-namespace" entry from your configuration file!
				// ➜  test-mf

				// TODO: do it automatically

				// TODO: delete the preview namespace as well?
			}
		);
};

export const kvKey = (kvYargs: Argv<CommonYargsOptions>) => {
	return kvYargs
		.command(
			"put <key> [value]",
			"Writes a single key/value pair to the given namespace.",
			(yargs) => {
				return yargs
					.positional("key", {
						type: "string",
						describe: "The key to write to",
						demandOption: true,
					})
					.positional("value", {
						type: "string",
						describe: "The value to write",
					})
					.option("binding", {
						type: "string",
						requiresArg: true,
						describe: "The binding of the namespace to write to",
					})
					.option("namespace-id", {
						type: "string",
						requiresArg: true,
						describe: "The id of the namespace to write to",
					})
					.check(demandOneOfOption("binding", "namespace-id"))
					.option("preview", {
						type: "boolean",
						describe: "Interact with a preview namespace",
					})
					.option("ttl", {
						type: "number",
						describe: "Time for which the entries should be visible",
					})
					.option("expiration", {
						type: "number",
						describe: "Time since the UNIX epoch after which the entry expires",
					})
					.option("metadata", {
						type: "string",
						describe: "Arbitrary JSON that is associated with a key",
						coerce: (jsonStr: string): KeyValue["metadata"] => {
							try {
								return JSON.parse(jsonStr);
							} catch (_) {}
						},
					})
					.option("path", {
						type: "string",
						requiresArg: true,
						describe: "Read value from the file at a given path",
					})
					.check(demandOneOfOption("value", "path"));
			},
			async ({ key, ttl, expiration, metadata, ...args }) => {
				await printWranglerBanner();
				const config = readConfig(args.config as ConfigPath, args);
				const namespaceId = getKVNamespaceId(args, config);
				// One of `args.path` and `args.value` must be defined
				const value = args.path
					? readFileSyncToBuffer(args.path)
					: // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					  args.value!;

				const metadataLog = metadata
					? ` with metadata "${JSON.stringify(metadata)}"`
					: "";

				if (args.path) {
					logger.log(
						`Writing the contents of ${args.path} to the key "${key}" on namespace ${namespaceId}${metadataLog}.`
					);
				} else {
					logger.log(
						`Writing the value "${value}" to key "${key}" on namespace ${namespaceId}${metadataLog}.`
					);
				}

				const accountId = await requireAuth(config);

				await putKVKeyValue(accountId, namespaceId, {
					key,
					value,
					expiration,
					expiration_ttl: ttl,
					metadata: metadata as KeyValue["metadata"],
				});
				await metrics.sendMetricsEvent("write kv key-value", {
					sendMetrics: config.send_metrics,
				});
			}
		)
		.command(
			"list",
			"Outputs a list of all keys in a given namespace.",
			(yargs) => {
				return yargs
					.option("binding", {
						type: "string",
						requiresArg: true,
						describe: "The name of the namespace to list",
					})
					.option("namespace-id", {
						type: "string",
						requiresArg: true,
						describe: "The id of the namespace to list",
					})
					.check(demandOneOfOption("binding", "namespace-id"))
					.option("preview", {
						type: "boolean",
						// In the case of listing keys we will default to non-preview mode
						default: false,
						describe: "Interact with a preview namespace",
					})
					.option("prefix", {
						type: "string",
						requiresArg: true,
						describe: "A prefix to filter listed keys",
					});
			},
			async ({ prefix, ...args }) => {
				// TODO: support for limit+cursor (pagination)
				const config = readConfig(args.config as ConfigPath, args);
				const namespaceId = getKVNamespaceId(args, config);

				const accountId = await requireAuth(config);

				const results = await listKVNamespaceKeys(
					accountId,
					namespaceId,
					prefix
				);
				logger.log(JSON.stringify(results, undefined, 2));
				await metrics.sendMetricsEvent("list kv keys", {
					sendMetrics: config.send_metrics,
				});
			}
		)
		.command(
			"get <key>",
			"Reads a single value by key from the given namespace.",
			(yargs) => {
				return yargs
					.positional("key", {
						describe: "The key value to get.",
						type: "string",
						demandOption: true,
					})
					.option("binding", {
						type: "string",
						requiresArg: true,
						describe: "The name of the namespace to get from",
					})
					.option("namespace-id", {
						type: "string",
						requiresArg: true,
						describe: "The id of the namespace to get from",
					})
					.check(demandOneOfOption("binding", "namespace-id"))
					.option("preview", {
						type: "boolean",
						describe: "Interact with a preview namespace",
					})
					.option("preview", {
						type: "boolean",
						// In the case of getting key values we will default to non-preview mode
						default: false,
						describe: "Interact with a preview namespace",
					})
					.option("text", {
						type: "boolean",
						default: false,
						describe: "Decode the returned value as a utf8 string",
					});
			},
			async ({ key, ...args }) => {
				const config = readConfig(args.config as ConfigPath, args);
				const namespaceId = getKVNamespaceId(args, config);

				const accountId = await requireAuth(config);
				const bufferKVValue = Buffer.from(
					await getKVKeyValue(accountId, namespaceId, key)
				);

				if (args.text) {
					const decoder = new StringDecoder("utf8");
					logger.log(decoder.write(bufferKVValue));
				} else {
					process.stdout.write(bufferKVValue);
				}
				await metrics.sendMetricsEvent("read kv value", {
					sendMetrics: config.send_metrics,
				});
			}
		)
		.command(
			"delete <key>",
			"Removes a single key value pair from the given namespace.",
			(yargs) => {
				return yargs
					.positional("key", {
						describe: "The key value to delete",
						type: "string",
						demandOption: true,
					})
					.option("binding", {
						type: "string",
						requiresArg: true,
						describe: "The name of the namespace to delete from",
					})
					.option("namespace-id", {
						type: "string",
						requiresArg: true,
						describe: "The id of the namespace to delete from",
					})
					.check(demandOneOfOption("binding", "namespace-id"))
					.option("preview", {
						type: "boolean",
						describe: "Interact with a preview namespace",
					});
			},
			async ({ key, ...args }) => {
				await printWranglerBanner();
				const config = readConfig(args.config as ConfigPath, args);
				const namespaceId = getKVNamespaceId(args, config);

				logger.log(`Deleting the key "${key}" on namespace ${namespaceId}.`);

				const accountId = await requireAuth(config);

				await deleteKVKeyValue(accountId, namespaceId, key);
				await metrics.sendMetricsEvent("delete kv key-value", {
					sendMetrics: config.send_metrics,
				});
			}
		);
};

export const kvBulk = (kvYargs: Argv<CommonYargsOptions>) => {
	return kvYargs
		.command(
			"put <filename>",
			"Upload multiple key-value pairs to a namespace",
			(yargs) => {
				return yargs
					.positional("filename", {
						describe: `The JSON file of key-value pairs to upload, in form [{"key":..., "value":...}"...]`,
						type: "string",
						demandOption: true,
					})
					.option("binding", {
						type: "string",
						requiresArg: true,
						describe: "The name of the namespace to insert values into",
					})
					.option("namespace-id", {
						type: "string",
						requiresArg: true,
						describe: "The id of the namespace to insert values into",
					})
					.check(demandOneOfOption("binding", "namespace-id"))
					.option("preview", {
						type: "boolean",
						describe: "Interact with a preview namespace",
					});
			},
			async ({ filename, ...args }) => {
				await printWranglerBanner();
				// The simplest implementation I could think of.
				// This could be made more efficient with a streaming parser/uploader
				// but we'll do that in the future if needed.

				const config = readConfig(args.config as ConfigPath, args);
				const namespaceId = getKVNamespaceId(args, config);
				const content = parseJSON(readFileSync(filename), filename);

				if (!Array.isArray(content)) {
					throw new Error(
						`Unexpected JSON input from "${filename}".\n` +
							`Expected an array of key-value objects but got type "${typeof content}".`
					);
				}

				const errors: string[] = [];
				const warnings: string[] = [];
				for (let i = 0; i < content.length; i++) {
					const keyValue = content[i];
					if (!isKVKeyValue(keyValue)) {
						errors.push(
							`The item at index ${i} is ${JSON.stringify(keyValue)}`
						);
					} else {
						const props = unexpectedKVKeyValueProps(keyValue);
						if (props.length > 0) {
							warnings.push(
								`The item at index ${i} contains unexpected properties: ${JSON.stringify(
									props
								)}.`
							);
						}
					}
				}
				if (warnings.length > 0) {
					logger.warn(
						`Unexpected key-value properties in "${filename}".\n` +
							warnings.join("\n")
					);
				}
				if (errors.length > 0) {
					throw new Error(
						`Unexpected JSON input from "${filename}".\n` +
							`Each item in the array should be an object that matches:\n\n` +
							`interface KeyValue {\n` +
							`  key: string;\n` +
							`  value: string;\n` +
							`  expiration?: number;\n` +
							`  expiration_ttl?: number;\n` +
							`  metadata?: object;\n` +
							`  base64?: boolean;\n` +
							`}\n\n` +
							errors.join("\n")
					);
				}

				const accountId = await requireAuth(config);
				await putKVBulkKeyValue(accountId, namespaceId, content);
				await metrics.sendMetricsEvent("write kv key-values (bulk)", {
					sendMetrics: config.send_metrics,
				});

				logger.log("Success!");
			}
		)
		.command(
			"delete <filename>",
			"Delete multiple key-value pairs from a namespace",
			(yargs) => {
				return yargs
					.positional("filename", {
						describe: `The JSON file of keys to delete, in the form ["key1", "key2", ...]`,
						type: "string",
						demandOption: true,
					})
					.option("binding", {
						type: "string",
						requiresArg: true,
						describe: "The name of the namespace to delete from",
					})
					.option("namespace-id", {
						type: "string",
						requiresArg: true,
						describe: "The id of the namespace to delete from",
					})
					.check(demandOneOfOption("binding", "namespace-id"))
					.option("preview", {
						type: "boolean",
						describe: "Interact with a preview namespace",
					})
					.option("force", {
						type: "boolean",
						alias: "f",
						describe: "Do not ask for confirmation before deleting",
					});
			},
			async ({ filename, ...args }) => {
				await printWranglerBanner();
				const config = readConfig(args.config as ConfigPath, args);
				const namespaceId = getKVNamespaceId(args, config);

				if (!args.force) {
					const result = await confirm(
						`Are you sure you want to delete all the keys read from "${filename}" from kv-namespace with id "${namespaceId}"?`
					);
					if (!result) {
						logger.log(`Not deleting keys read from "${filename}".`);
						return;
					}
				}

				const content = parseJSON(readFileSync(filename), filename) as string[];

				if (!Array.isArray(content)) {
					throw new Error(
						`Unexpected JSON input from "${filename}".\n` +
							`Expected an array of strings but got:\n${content}`
					);
				}

				const errors: string[] = [];
				for (let i = 0; i < content.length; i++) {
					const key = content[i];
					if (typeof key !== "string") {
						errors.push(
							`The item at index ${i} is type: "${typeof key}" - ${JSON.stringify(
								key
							)}`
						);
					}
				}

				if (errors.length > 0) {
					throw new Error(
						`Unexpected JSON input from "${filename}".\n` +
							`Expected an array of strings.\n` +
							errors.join("\n")
					);
				}

				const accountId = await requireAuth(config);

				await deleteKVBulkKeyValue(accountId, namespaceId, content);
				await metrics.sendMetricsEvent("delete kv key-values (bulk)", {
					sendMetrics: config.send_metrics,
				});

				logger.log("Success!");
			}
		);
};
