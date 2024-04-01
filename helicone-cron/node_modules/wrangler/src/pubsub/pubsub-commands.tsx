import { type ConfigPath } from "..";
import { readConfig } from "../config";
import { confirm } from "../dialogs";
import { CommandLineArgsError } from "../index";
import { logger } from "../logger";
import * as metrics from "../metrics";
import { parseHumanDuration } from "../parse";
import { requireAuth } from "../user";
import * as pubsub from ".";
import type { CommonYargsOptions } from "../yargs-types";
import type { Argv, CommandModule } from "yargs";

export function pubSubCommands(
	pubsubYargs: Argv<CommonYargsOptions>,
	subHelp: CommandModule<CommonYargsOptions, CommonYargsOptions>
): Argv {
	return pubsubYargs
		.command(subHelp)
		.command(
			"namespace",
			"Manage your Pub/Sub Namespaces",
			(pubsubNamespaceYargs) => {
				return pubsubNamespaceYargs
					.command(
						"create <name>",
						"Create a new Pub/Sub Namespace",
						(yargs) => {
							return yargs
								.positional("name", {
									describe:
										"The name of the new Namespace. This name will form part of the public endpoint, in the form <broker>.<namespace>.cloudflarepubsub.com",
									type: "string",
									demandOption: true,
								})
								.option("description", {
									describe: "Textual description of Namespace",
									type: "string",
								})
								.epilogue(pubsub.pubSubBetaWarning);
						},
						async (args) => {
							const config = readConfig(args.config as ConfigPath, args);
							const accountId = await requireAuth(config);

							const namespace: pubsub.PubSubNamespace = {
								name: args.name,
							};
							if (args.description) {
								namespace.description = args.description;
							}

							logger.log(`Creating Pub/SubNamespace ${args.name}...`);
							await pubsub.createPubSubNamespace(accountId, namespace);
							logger.log(`Success! Created Pub/Sub Namespace ${args.name}`);
							await metrics.sendMetricsEvent("create pubsub namespace", {
								sendMetrics: config.send_metrics,
							});
						}
					)
					.command(
						"list",
						"List your existing Pub/Sub Namespaces",
						(yargs) => {
							return yargs.epilogue(pubsub.pubSubBetaWarning);
						},
						async (args) => {
							const config = readConfig(args.config as ConfigPath, args);
							const accountId = await requireAuth(config);

							logger.log(await pubsub.listPubSubNamespaces(accountId));
							await metrics.sendMetricsEvent("list pubsub namespaces", {
								sendMetrics: config.send_metrics,
							});
						}
					)
					.command(
						"delete <name>",
						"Delete a Pub/Sub Namespace",
						(yargs) => {
							return yargs
								.positional("name", {
									describe: "The name of the namespace to delete",
									type: "string",
									demandOption: true,
								})
								.epilogue(pubsub.pubSubBetaWarning);
						},
						async (args) => {
							const config = readConfig(args.config as ConfigPath, args);
							const accountId = await requireAuth(config);

							if (
								await confirm(
									`️❗️ Are you sure you want to delete the Pub/Sub Namespace ${args.name}? This cannot be undone.\nThis name will be available for others to register.`
								)
							) {
								logger.log(`Deleting namespace ${args.name}...`);
								await pubsub.deletePubSubNamespace(accountId, args.name);
								logger.log(`Deleted namespace ${args.name}.`);
								await metrics.sendMetricsEvent("delete pubsub namespace", {
									sendMetrics: config.send_metrics,
								});
							}
						}
					)
					.command(
						"describe <name>",
						"Describe a Pub/Sub Namespace",
						(yargs) => {
							return yargs
								.positional("name", {
									describe: "The name of the namespace to describe.",
									type: "string",
									demandOption: true,
								})
								.epilogue(pubsub.pubSubBetaWarning);
						},
						async (args) => {
							const config = readConfig(args.config as ConfigPath, args);
							const accountId = await requireAuth(config);

							logger.log(
								await pubsub.describePubSubNamespace(accountId, args.name)
							);
							await metrics.sendMetricsEvent("view pubsub namespace", {
								sendMetrics: config.send_metrics,
							});
						}
					)
					.epilogue(pubsub.pubSubBetaWarning);
			}
		)
		.command("broker", "Interact with your Pub/Sub Brokers", (brokersYargs) => {
			brokersYargs.command(
				"create <name>",
				"Create a new Pub/Sub Broker",
				(yargs) =>
					yargs
						.positional("name", {
							describe:
								"The name of the Pub/Sub Broker. This name will form part of the public endpoint, in the form <broker>.<namespace>.cloudflarepubsub.com",
							type: "string",
							demandOption: true,
						})
						.option("namespace", {
							describe:
								"An existing Namespace to associate the Broker with. This name will form part of the public endpoint, in the form <broker>.<namespace>.cloudflarepubsub.com",
							type: "string",
							alias: "ns",
							demandOption: true,
						})
						.option("description", {
							describe: "Longer description for the broker",
							type: "string",
						})
						.option("expiration", {
							describe:
								"Time to allow token validity (can use seconds, hours, months, weeks, years)",
							type: "string",
						})
						.option("on-publish-url", {
							describe:
								"A (HTTPS) Cloudflare Worker (or webhook) URL that messages will be sent to on-publish.",
							type: "string",
						})
						.epilogue(pubsub.pubSubBetaWarning),
				async (args) => {
					const config = readConfig(args.config as ConfigPath, args);
					const accountId = await requireAuth(config);

					const broker: pubsub.PubSubBroker = {
						name: args.name,
					};
					if (args.description) {
						broker.description = args.description;
					}
					if (args.expiration) {
						const expiration = parseHumanDuration(args.expiration);
						if (isNaN(expiration)) {
							throw new CommandLineArgsError(
								`${args.expiration} is not a time duration.  (Example of valid values are: 1y, 6 days)`
							);
						}
						broker.expiration = expiration;
					}
					if (args["on-publish-url"]) {
						broker.on_publish = {
							url: args["on-publish-url"],
						};
					}

					logger.log(
						await pubsub.createPubSubBroker(accountId, args.namespace, broker)
					);
					await metrics.sendMetricsEvent("create pubsub broker", {
						sendMetrics: config.send_metrics,
					});
				}
			);

			brokersYargs.command(
				"update <name>",
				"Update an existing Pub/Sub Broker's configuration.",
				(yargs) =>
					yargs
						.positional("name", {
							describe: "The name of an existing Pub/Sub Broker",
							type: "string",
							demandOption: true,
						})
						.option("namespace", {
							describe: "The Namespace the Broker is associated with",
							type: "string",
							alias: "ns",
							demandOption: true,
						})
						.option("description", {
							describe: "A optional description of the Broker.",
							type: "string",
						})
						.option("expiration", {
							describe:
								"The expiration date for all client credentials issued by the Broker (can use seconds, hours, months, weeks, years)",
							type: "string",
						})
						.option("on-publish-url", {
							describe:
								"A (HTTPS) Cloudflare Worker (or webhook) URL that messages will be sent to on-publish.",
							type: "string",
						})
						.epilogue(pubsub.pubSubBetaWarning),
				async (args) => {
					const config = readConfig(args.config as ConfigPath, args);
					const accountId = await requireAuth(config);

					const broker: pubsub.PubSubBrokerUpdate = {};

					if (args.description) {
						broker.description = args.description;
					}

					if (args.expiration) {
						const expiration = parseHumanDuration(args.expiration);
						if (isNaN(expiration)) {
							throw new CommandLineArgsError(
								`${args.expiration} is not a time duration. Examples of valid values include: '1y', '24h', or '6 days'.`
							);
						}
						broker.expiration = expiration;
					}

					if (args["on-publish-url"]) {
						broker.on_publish = {
							url: args["on-publish-url"],
						};
					}

					logger.log(
						await pubsub.updatePubSubBroker(
							accountId,
							args.namespace,
							args.name,
							broker
						)
					);
					logger.log(`Successfully updated Pub/Sub Broker ${args.name}`);
					await metrics.sendMetricsEvent("update pubsub broker", {
						sendMetrics: config.send_metrics,
					});
				}
			);

			brokersYargs.command(
				"list",
				"List the Pub/Sub Brokers within a Namespace",
				(yargs) => {
					return yargs
						.option("namespace", {
							describe: "The Namespace the Brokers are associated with.",
							type: "string",
							alias: "ns",
							demandOption: true,
						})
						.epilogue(pubsub.pubSubBetaWarning);
				},
				async (args) => {
					const config = readConfig(args.config as ConfigPath, args);
					const accountId = await requireAuth(config);

					logger.log(await pubsub.listPubSubBrokers(accountId, args.namespace));
					await metrics.sendMetricsEvent("list pubsub brokers", {
						sendMetrics: config.send_metrics,
					});
				}
			);

			brokersYargs
				.command(
					"delete <name>",
					"Delete an existing Pub/Sub Broker",
					(yargs) => {
						return yargs
							.positional("name", {
								describe: "The name of the Broker to delete",
								type: "string",
								demandOption: true,
							})
							.option("namespace", {
								describe: "The Namespace the Broker is associated with.",
								type: "string",
								alias: "ns",
								demandOption: true,
							})
							.epilogue(pubsub.pubSubBetaWarning);
					},
					async (args) => {
						const config = readConfig(args.config as ConfigPath, args);
						const accountId = await requireAuth(config);

						if (
							await confirm(
								`️❗️ Are you sure you want to delete the Pub/Sub Broker ${args.name}? This cannot be undone.\nAll existing clients will be disconnected.`
							)
						) {
							logger.log(`Deleting Pub/Sub Broker ${args.name}.`);
							await pubsub.deletePubSubBroker(
								accountId,
								args.namespace,
								args.name
							);
							logger.log(`Deleted Pub/Sub Broker ${args.name}.`);
							await metrics.sendMetricsEvent("delete pubsub broker", {
								sendMetrics: config.send_metrics,
							});
						}
					}
				)
				.command(
					"describe <name>",
					"Describe an existing Pub/Sub Broker.",
					(yargs) => {
						return yargs
							.positional("name", {
								describe: "The name of the Broker to describe.",
								type: "string",
								demandOption: true,
							})
							.option("namespace", {
								describe: "The Namespace the Broker is associated with.",
								type: "string",
								alias: "ns",
								demandOption: true,
							})
							.epilogue(pubsub.pubSubBetaWarning);
					},
					async (args) => {
						const config = readConfig(args.config as ConfigPath, args);
						const accountId = await requireAuth(config);

						logger.log(
							await pubsub.describePubSubBroker(
								accountId,
								args.namespace,
								args.name
							)
						);
						await metrics.sendMetricsEvent("view pubsub broker", {
							sendMetrics: config.send_metrics,
						});
					}
				);

			brokersYargs.command(
				"issue <name>",
				"Issue new client credentials for a specific Pub/Sub Broker.",
				(yargs) => {
					return yargs
						.positional("name", {
							describe: "The name of the Broker to issue credentials for.",
							type: "string",
							demandOption: true,
						})
						.option("namespace", {
							describe: "The Namespace the Broker is associated with.",
							type: "string",
							alias: "ns",
							demandOption: true,
						})
						.option("number", {
							describe: "The number of credentials to generate.",
							type: "number",
							alias: "n",
							default: 1,
						})
						.option("type", {
							describe: "The type of credential to generate.",
							type: "string",
							default: "TOKEN",
						})
						.option("expiration", {
							describe:
								"The expiration to set on the issued credentials. This overrides any Broker-level expiration that is set.",
							type: "string",
							alias: "exp",
						})
						.option("client-id", {
							describe:
								"A list of existing clientIds to generate tokens for. By default, clientIds are randomly generated.",
							type: "string",
							alias: "jti",
							array: true,
						})
						.epilogue(pubsub.pubSubBetaWarning);
				},
				async (args) => {
					const config = readConfig(args.config as ConfigPath, args);
					const accountId = await requireAuth(config);

					let parsedExpiration: number | undefined;
					if (args.expiration) {
						const expiration = parseHumanDuration(args.expiration);
						if (isNaN(expiration)) {
							throw new CommandLineArgsError(
								`${args.expiration} is not a time duration. Example of valid values are: 1y, 6 days.`
							);
						}
						parsedExpiration = expiration;
					}

					logger.log(
						`🔑 Issuing credential(s) for ${args.name}.${args.namespace}...`
					);

					logger.log(
						await pubsub.issuePubSubBrokerTokens(
							accountId,
							args.namespace,
							args.name,
							args.number,
							args.type,
							args["client-id"],
							parsedExpiration
						)
					);
					await metrics.sendMetricsEvent("issue pubsub broker credentials", {
						sendMetrics: config.send_metrics,
					});
				}
			);

			brokersYargs.command(
				"revoke <name>",
				"Revoke a set of active client credentials associated with the given Broker",
				(yargs) => {
					return yargs
						.positional("name", {
							describe: "The name of the Broker to revoke credentials against.",
							type: "string",
							demandOption: true,
						})
						.option("namespace", {
							describe: "The Namespace the Broker is associated with.",
							type: "string",
							alias: "ns",
							demandOption: true,
						})
						.option("jti", {
							describe: "Tokens to revoke",
							type: "string",
							demandOption: true,
							array: true,
						})
						.epilogue(pubsub.pubSubBetaWarning);
				},
				async (args) => {
					const config = readConfig(args.config as ConfigPath, args);
					const accountId = await requireAuth(config);

					const numTokens = args.jti.length;

					logger.log(
						`🔴 Revoking access to ${args.name} for ${numTokens} credential(s)...`
					);

					await pubsub.revokePubSubBrokerTokens(
						accountId,
						args.namespace,
						args.name,
						args.jti
					);

					logger.log(`Revoked ${args.jti.length} credential(s).`);
					await metrics.sendMetricsEvent("revoke pubsub broker credentials", {
						sendMetrics: config.send_metrics,
					});
				}
			);

			brokersYargs.command(
				"unrevoke <name>",
				"Restore access to a set of previously revoked client credentials.",
				(yargs) => {
					return yargs
						.positional("name", {
							describe: "The name of the Broker to revoke credentials against.",
							type: "string",
							demandOption: true,
						})
						.option("namespace", {
							describe: "The Namespace the Broker is associated with.",
							type: "string",
							alias: "ns",
							demandOption: true,
						})
						.option("jti", {
							describe: "Tokens to revoke",
							type: "string",
							demandOption: true,
							array: true,
						})
						.epilogue(pubsub.pubSubBetaWarning);
				},
				async (args) => {
					const config = readConfig(args.config as ConfigPath, args);
					const accountId = await requireAuth(config);

					const numTokens = args.jti.length;
					logger.log(
						`🟢 Restoring access to ${args.broker} for ${numTokens} credential(s)...`
					);

					await pubsub.unrevokePubSubBrokerTokens(
						accountId,
						args.namespace,
						args.name,
						args.jti
					);

					logger.log(`Unrevoked ${numTokens} credential(s)`);
					await metrics.sendMetricsEvent("unrevoke pubsub broker credentials", {
						sendMetrics: config.send_metrics,
					});
				}
			);

			brokersYargs.command(
				"show-revocations <name>",
				"Show all previously revoked client credentials.",
				(yargs) => {
					return yargs
						.positional("name", {
							describe: "The name of the Broker to revoke credentials against.",
							type: "string",
							demandOption: true,
						})
						.option("namespace", {
							describe: "The Namespace the Broker is associated with.",
							type: "string",
							alias: "ns",
							demandOption: true,
						})
						.epilogue(pubsub.pubSubBetaWarning);
				},
				async (args) => {
					const config = readConfig(args.config as ConfigPath, args);
					const accountId = await requireAuth(config);

					logger.log(`Listing previously revoked tokens for ${args.name}...`);
					logger.log(
						await pubsub.listRevokedPubSubBrokerTokens(
							accountId,
							args.namespace,
							args.name
						)
					);
					await metrics.sendMetricsEvent(
						"list pubsub broker revoked credentials",
						{
							sendMetrics: config.send_metrics,
						}
					);
				}
			);

			brokersYargs.command(
				"public-keys <name>",
				"Show the public keys used for verifying on-publish hooks and credentials for a Broker.",
				(yargs) => {
					return yargs
						.positional("name", {
							describe: "The name of the Broker to revoke credentials against.",
							type: "string",
							demandOption: true,
						})
						.option("namespace", {
							describe: "The Namespace the Broker is associated with.",
							type: "string",
							alias: "ns",
							demandOption: true,
						})
						.epilogue(pubsub.pubSubBetaWarning);
				},
				async (args) => {
					const config = readConfig(args.config as ConfigPath, args);
					const accountId = await requireAuth(config);

					logger.log(
						await pubsub.getPubSubBrokerPublicKeys(
							accountId,
							args.namespace,
							args.name
						)
					);
					await metrics.sendMetricsEvent("list pubsub broker public-keys", {
						sendMetrics: config.send_metrics,
					});
				}
			);

			brokersYargs.epilogue(pubsub.pubSubBetaWarning);
			return brokersYargs;
		})
		.epilogue(pubsub.pubSubBetaWarning);
}
