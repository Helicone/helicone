import { fetch } from "@miniflare/core";
import {
	DurableObjectNamespace,
	DurableObjectStub,
} from "@miniflare/durable-objects";
import {
	Log as MiniflareLog,
	LogLevel as MiniflareLogLevel,
	Miniflare,
	Request as MiniflareRequest,
	Response as MiniflareResponse,
} from "miniflare";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { FatalError } from "../errors";
import generateASSETSBinding from "./assets";
import { getRequestContextCheckOptions } from "./request-context";
import type { LoggerLevel } from "../logger";
import type { Options } from "./assets";
import type { AddressInfo } from "net";

export interface EnablePagesAssetsServiceBindingOptions {
	proxyPort?: number;
	directory?: string;
}

// miniflare defines this but importing it throws:
// Dynamic require of "path" is not supported
class MiniflareNoOpLog extends MiniflareLog {
	log(): void {}

	error(message: Error): void {
		throw message;
	}
}

async function main() {
	const args = await yargs(hideBin(process.argv)).help(false).version(false)
		.argv;

	const requestContextCheckOptions = await getRequestContextCheckOptions();
	const config = {
		...JSON.parse((args._[0] as string) ?? "{}"),
		...requestContextCheckOptions,
	};

	let logLevelString: Uppercase<LoggerLevel> = config.logLevel.toUpperCase();
	if (logLevelString === "LOG") logLevelString = "INFO";
	const logLevel = MiniflareLogLevel[logLevelString];

	config.log =
		logLevel === MiniflareLogLevel.NONE
			? new MiniflareNoOpLog()
			: new MiniflareLog(logLevel, config.logOptions);

	if (logLevel === MiniflareLogLevel.DEBUG) {
		console.log("MINIFLARE OPTIONS:\n", JSON.stringify(config, null, 2));
	}

	config.bindings = {
		...config.bindings,
		...(config.externalDurableObjects &&
			Object.fromEntries(
				Object.entries(
					config.externalDurableObjects as Record<
						string,
						{ name: string; host: string; port: number }
					>
				).map(([binding, { name, host, port }]) => {
					const factory = () => {
						throw new FatalError(
							"An external Durable Object instance's state has somehow been attempted to be accessed.",
							1
						);
					};
					const namespace = new DurableObjectNamespace(name as string, factory);
					namespace.get = (id) => {
						const stub = new DurableObjectStub(factory, id);
						stub.fetch = (...reqArgs) => {
							const requestFromArgs = new MiniflareRequest(...reqArgs);
							const url = new URL(requestFromArgs.url);
							url.host = host;
							if (port !== undefined) url.port = port.toString();
							const request = new MiniflareRequest(
								url.toString(),
								requestFromArgs
							);
							request.headers.set("x-miniflare-durable-object-name", name);
							request.headers.set(
								"x-miniflare-durable-object-id",
								id.toString()
							);

							return fetch(request);
						};
						return stub;
					};
					return [binding, namespace];
				})
			)),
	};

	let mf: Miniflare | undefined;
	let durableObjectsMf: Miniflare | undefined = undefined;
	let durableObjectsMfPort: number | undefined = undefined;

	try {
		if (args._[1]) {
			const opts: EnablePagesAssetsServiceBindingOptions = JSON.parse(
				args._[1] as string
			);

			if (isNaN(opts.proxyPort || NaN) && !opts.directory) {
				throw new Error(
					"MiniflareCLIOptions: built in service bindings set to true, but no port or directory provided"
				);
			}

			const options: Options = {
				log: config.log,
				proxyPort: opts.proxyPort,
				directory: opts.directory,
			};

			config.serviceBindings = {
				...config.serviceBindings,
				ASSETS: await generateASSETSBinding(options),
			};
		}
		mf = new Miniflare(config);
		// Start Miniflare development server
		const mfServer = await mf.startServer();
		const mfPort = (mfServer.address() as AddressInfo).port;
		await mf.startScheduler();

		const internalDurableObjectClassNames = Object.values(
			config.durableObjects as Record<string, string>
		);

		if (internalDurableObjectClassNames.length > 0) {
			durableObjectsMf = new Miniflare({
				host: config.host,
				port: 0,
				script: `
				export default {
					fetch(request, env) {
						return env.DO.fetch(request)
					}
				}`,
				serviceBindings: {
					DO: async (request: MiniflareRequest) => {
						request = new MiniflareRequest(request);

						const name = request.headers.get("x-miniflare-durable-object-name");
						const idString = request.headers.get(
							"x-miniflare-durable-object-id"
						);
						request.headers.delete("x-miniflare-durable-object-name");
						request.headers.delete("x-miniflare-durable-object-id");

						if (!name || !idString) {
							return new MiniflareResponse(
								"[durable-object-proxy-err] Missing `x-miniflare-durable-object-name` or `x-miniflare-durable-object-id` headers.",
								{ status: 400 }
							);
						}

						const namespace = await mf?.getDurableObjectNamespace(name);
						const id = namespace?.idFromString(idString);

						if (!id) {
							return new MiniflareResponse(
								"[durable-object-proxy-err] Could not generate an ID. Possibly due to a mismatched DO name and ID?",
								{ status: 500 }
							);
						}

						const stub = namespace?.get(id);

						if (!stub) {
							return new MiniflareResponse(
								"[durable-object-proxy-err] Could not generate a stub. Possibly due to a mismatched DO name and ID?",
								{ status: 500 }
							);
						}

						return stub.fetch(request);
					},
				},
				modules: true,
			});
			const server = await durableObjectsMf.startServer();
			durableObjectsMfPort = (server.address() as AddressInfo).port;
		}

		process.send &&
			process.send(
				JSON.stringify({
					port: mfPort,
					ready: true,
					durableObjectsPort: durableObjectsMfPort,
				})
			);
	} catch (e) {
		mf?.log.error(e as Error);
		process.exitCode = 1;
		// Unmount any mounted workers
		await mf?.dispose();
		await durableObjectsMf?.dispose();
	}
}

await main();
