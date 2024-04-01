import * as fs from "node:fs";
import * as stream from "node:stream";

import prettyBytes from "pretty-bytes";
import { readConfig } from "../config";
import { FatalError } from "../errors";
import { CommandLineArgsError, printWranglerBanner } from "../index";
import { logger } from "../logger";
import * as metrics from "../metrics";
import { requireAuth } from "../user";
import { MAX_UPLOAD_SIZE } from "./constants";
import {
	bucketAndKeyFromObjectPath,
	createR2Bucket,
	deleteR2Bucket,
	deleteR2Object,
	getR2Object,
	listR2Buckets,
	putR2Object,
} from "./helpers";

import type { ConfigPath } from "../index";
import type { Readable } from "node:stream";
import type { BuilderCallback } from "yargs";

export const r2: BuilderCallback<unknown, unknown> = (r2Yargs) => {
	return r2Yargs
		.command("object", "Manage R2 objects", (r2ObjectYargs) => {
			return r2ObjectYargs
				.command(
					"get <objectPath>",
					"Fetch an object from an R2 bucket",
					(Objectyargs) => {
						return Objectyargs.positional("objectPath", {
							describe: "The source object path in the form of {bucket}/{key}",
							type: "string",
						})
							.option("file", {
								describe: "The destination file to create",
								alias: "f",
								conflicts: "pipe",
								requiresArg: true,
								type: "string",
							})
							.option("pipe", {
								describe:
									"Enables the file to be piped to a destination, rather than specified with the --file option",
								alias: "p",
								conflicts: "file",
								type: "boolean",
							});
					},
					async (objectGetYargs) => {
						const config = readConfig(
							objectGetYargs.config as ConfigPath,
							objectGetYargs
						);
						const accountId = await requireAuth(config);
						const { objectPath, pipe } = objectGetYargs;
						const { bucket, key } = bucketAndKeyFromObjectPath(objectPath);

						let file = objectGetYargs.file;
						if (!file && !pipe) {
							file = key;
						}
						if (!pipe) {
							await printWranglerBanner();
							logger.log(`Downloading "${key}" from "${bucket}".`);
						}
						const input = await getR2Object(accountId, bucket, key);
						const output = file ? fs.createWriteStream(file) : process.stdout;
						await new Promise<void>((resolve, reject) => {
							stream.pipeline(input, output, (err: unknown) => {
								err ? reject(err) : resolve();
							});
						});
						if (!pipe) logger.log("Download complete.");
					}
				)
				.command(
					"put <objectPath>",
					"Create an object in an R2 bucket",
					(Objectyargs) => {
						return Objectyargs.positional("objectPath", {
							describe:
								"The destination object path in the form of {bucket}/{key}",
							type: "string",
						})
							.option("file", {
								describe: "The path of the file to upload",
								alias: "f",
								conflicts: "pipe",
								requiresArg: true,
								type: "string",
							})
							.option("pipe", {
								describe:
									"Enables the file to be piped in, rather than specified with the --file option",
								alias: "p",
								conflicts: "file",
								type: "boolean",
							})
							.option("content-type", {
								describe:
									"A standard MIME type describing the format of the object data",
								alias: "ct",
								requiresArg: true,
								type: "string",
							})
							.option("content-disposition", {
								describe: "Specifies presentational information for the object",
								alias: "cd",
								requiresArg: true,
								type: "string",
							})
							.option("content-encoding", {
								describe:
									"Specifies what content encodings have been applied to the object and thus what decoding mechanisms must be applied to obtain the media-type referenced by the Content-Type header field",
								alias: "ce",
								requiresArg: true,
								type: "string",
							})
							.option("content-language", {
								describe: "The language the content is in",
								alias: "cl",
								requiresArg: true,
								type: "string",
							})
							.option("cache-control", {
								describe:
									"Specifies caching behavior along the request/reply chain",
								alias: "cc",
								requiresArg: true,
								type: "string",
							})
							.option("expires", {
								describe:
									"The date and time at which the object is no longer cacheable",
								alias: "e",
								requiresArg: true,
								type: "string",
							});
					},
					async (objectPutYargs) => {
						await printWranglerBanner();

						const config = readConfig(
							objectPutYargs.config as ConfigPath,
							objectPutYargs
						);
						const accountId = await requireAuth(config);
						const { objectPath, file, pipe, ...options } = objectPutYargs;
						const { bucket, key } = bucketAndKeyFromObjectPath(objectPath);
						if (!file && !pipe) {
							throw new CommandLineArgsError(
								"Either the --file or --pipe options are required."
							);
						}
						let object: Readable | Buffer;
						let objectSize: number;
						if (file) {
							object = fs.createReadStream(file);
							const stats = fs.statSync(file);
							objectSize = stats.size;
						} else {
							object = await new Promise<Buffer>((resolve, reject) => {
								const stdin = process.stdin;
								const chunks = Array<Buffer>();
								stdin.on("data", (chunk) => chunks.push(chunk));
								stdin.on("end", () => resolve(Buffer.concat(chunks)));
								stdin.on("error", (err) =>
									reject(
										new CommandLineArgsError(
											`Could not pipe. Reason: "${err.message}"`
										)
									)
								);
							});
							objectSize = object.byteLength;
						}

						if (objectSize > MAX_UPLOAD_SIZE) {
							throw new FatalError(
								`Error: Wrangler only supports uploading files up to ${prettyBytes(
									MAX_UPLOAD_SIZE
								)} in size\n${key} is ${prettyBytes(objectSize)} in size`,
								1
							);
						}

						logger.log(`Creating object "${key}" in bucket "${bucket}".`);
						await putR2Object(accountId, bucket, key, object, {
							...options,
							"content-length": `${objectSize}`,
						});
						logger.log("Upload complete.");
					}
				)
				.command(
					"delete <objectPath>",
					"Delete an object in an R2 bucket",
					(objectDeleteYargs) => {
						return objectDeleteYargs.positional("objectPath", {
							describe:
								"The destination object path in the form of {bucket}/{key}",
							type: "string",
						});
					},
					async (args) => {
						const { objectPath } = args;
						await printWranglerBanner();

						const config = readConfig(args.config as ConfigPath, args);
						const accountId = await requireAuth(config);
						const { bucket, key } = bucketAndKeyFromObjectPath(objectPath);
						logger.log(`Deleting object "${key}" from bucket "${bucket}".`);

						await deleteR2Object(accountId, bucket, key);
						logger.log("Delete complete.");
					}
				);
		})

		.command("bucket", "Manage R2 buckets", (r2BucketYargs) => {
			r2BucketYargs.command(
				"create <name>",
				"Create a new R2 bucket",
				(yargs) => {
					return yargs.positional("name", {
						describe: "The name of the new bucket",
						type: "string",
						demandOption: true,
					});
				},
				async (args) => {
					await printWranglerBanner();

					const config = readConfig(args.config as ConfigPath, args);

					const accountId = await requireAuth(config);

					logger.log(`Creating bucket ${args.name}.`);
					await createR2Bucket(accountId, args.name);
					logger.log(`Created bucket ${args.name}.`);
					await metrics.sendMetricsEvent("create r2 bucket", {
						sendMetrics: config.send_metrics,
					});
				}
			);

			r2BucketYargs.command("list", "List R2 buckets", {}, async (args) => {
				const config = readConfig(args.config as ConfigPath, args);

				const accountId = await requireAuth(config);

				logger.log(JSON.stringify(await listR2Buckets(accountId), null, 2));
				await metrics.sendMetricsEvent("list r2 buckets", {
					sendMetrics: config.send_metrics,
				});
			});

			r2BucketYargs.command(
				"delete <name>",
				"Delete an R2 bucket",
				(yargs) => {
					return yargs.positional("name", {
						describe: "The name of the bucket to delete",
						type: "string",
						demandOption: true,
					});
				},
				async (args) => {
					await printWranglerBanner();

					const config = readConfig(args.config as ConfigPath, args);

					const accountId = await requireAuth(config);

					logger.log(`Deleting bucket ${args.name}.`);
					await deleteR2Bucket(accountId, args.name);
					logger.log(`Deleted bucket ${args.name}.`);
					await metrics.sendMetricsEvent("delete r2 bucket", {
						sendMetrics: config.send_metrics,
					});
				}
			);
			return r2BucketYargs;
		});
};
