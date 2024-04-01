import { spawn } from "node:child_process";
import * as path from "node:path";
import * as util from "node:util";
import { watch } from "chokidar";
import clipboardy from "clipboardy";
import commandExists from "command-exists";
import { Box, Text, useApp, useInput, useStdin } from "ink";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { withErrorBoundary, useErrorHandler } from "react-error-boundary";
import onExit from "signal-exit";
import tmp from "tmp-promise";
import { fetch } from "undici";
import {
	getBoundRegisteredWorkers,
	startWorkerRegistry,
	stopWorkerRegistry,
	unregisterWorker,
} from "../dev-registry";
import { runCustomBuild } from "../entry";
import { openInspector } from "../inspect";
import { logger } from "../logger";
import openInBrowser from "../open-in-browser";
import { Local } from "./local";
import { Remote } from "./remote";
import { useEsbuild } from "./use-esbuild";
import { validateDevProps } from "./validate-dev-props";
import type { Config } from "../config";
import type { Route } from "../config/environment";
import type { WorkerRegistry } from "../dev-registry";
import type { Entry } from "../entry";
import type { EnablePagesAssetsServiceBindingOptions } from "../miniflare-cli";
import type { AssetPaths } from "../sites";
import type { CfWorkerInit } from "../worker";

/**
 * This hooks establishes a connection with the dev registry,
 * and periodically updates itself with details of workers currently
 * running a dev session on this system.
 */
function useDevRegistry(
	name: string | undefined,
	services: Config["services"] | undefined,
	durableObjects: Config["durable_objects"] | undefined,
	mode: "local" | "remote"
): WorkerRegistry {
	const [workers, setWorkers] = useState<WorkerRegistry>({});

	useEffect(() => {
		// Let's try to start registry
		// TODO: we should probably call this in a loop
		// in case the registry dies elsewhere
		startWorkerRegistry().catch((err) => {
			logger.error("failed to start worker registry", err);
		});

		const interval =
			// TODO: enable this for remote mode as well
			// https://github.com/cloudflare/wrangler2/issues/1182
			mode === "local"
				? setInterval(() => {
						getBoundRegisteredWorkers({
							services,
							durableObjects,
						}).then(
							(boundRegisteredWorkers: WorkerRegistry | undefined) => {
								setWorkers((prevWorkers) => {
									if (
										!util.isDeepStrictEqual(boundRegisteredWorkers, prevWorkers)
									) {
										return boundRegisteredWorkers || {};
									}
									return prevWorkers;
								});
							},
							(err) => {
								logger.warn("Failed to get worker definitions", err);
							}
						);
				  }, 300)
				: undefined;

		return () => {
			interval && clearInterval(interval);
			Promise.allSettled([
				name ? unregisterWorker(name) : Promise.resolve(),
				stopWorkerRegistry(),
			]).then(
				([unregisterResult, stopRegistryResult]) => {
					if (unregisterResult.status === "rejected") {
						logger.error(
							"Failed to unregister worker",
							unregisterResult.reason
						);
					}
					if (stopRegistryResult.status === "rejected") {
						logger.error(
							"Failed to stop worker registry",
							stopRegistryResult.reason
						);
					}
				},
				(err) => {
					logger.error("Failed to clear dev registry effect", err);
				}
			);
		};
	}, [name, services, durableObjects, mode]);

	return workers;
}

export type DevProps = {
	name: string | undefined;
	noBundle: boolean;
	entry: Entry;
	initialPort: number;
	initialIp: string;
	inspectorPort: number;
	rules: Config["rules"];
	accountId: string | undefined;
	initialMode: "local" | "remote";
	jsxFactory: string | undefined;
	jsxFragment: string | undefined;
	tsconfig: string | undefined;
	upstreamProtocol: "https" | "http";
	localProtocol: "https" | "http";
	localUpstream: string | undefined;
	localPersistencePath: string | null;
	liveReload: boolean;
	bindings: CfWorkerInit["bindings"];
	define: Config["define"];
	crons: Config["triggers"]["crons"];
	queueConsumers: Config["queues"]["consumers"];
	isWorkersSite: boolean;
	assetPaths: AssetPaths | undefined;
	assetsConfig: Config["assets"];
	compatibilityDate: string;
	compatibilityFlags: string[] | undefined;
	usageModel: "bundled" | "unbound" | undefined;
	minify: boolean | undefined;
	nodeCompat: boolean | undefined;
	build: Config["build"];
	env: string | undefined;
	legacyEnv: boolean;
	zone: string | undefined;
	host: string | undefined;
	routes: Route[] | undefined;
	inspect: boolean;
	logPrefix?: string;
	onReady: ((ip: string, port: number) => void) | undefined;
	showInteractiveDevSession: boolean | undefined;
	forceLocal: boolean | undefined;
	enablePagesAssetsServiceBinding?: EnablePagesAssetsServiceBindingOptions;
	firstPartyWorker: boolean | undefined;
	sendMetrics: boolean | undefined;
	testScheduled: boolean | undefined;
	experimentalLocal: boolean | undefined;
	experimentalLocalRemoteKv: boolean | undefined;
};

export function DevImplementation(props: DevProps): JSX.Element {
	validateDevProps(props);

	// only load the UI if we're running in a supported environment
	const { isRawModeSupported } = useStdin();

	return props.showInteractiveDevSession ?? isRawModeSupported ? (
		<InteractiveDevSession {...props} />
	) : (
		<DevSession {...props} local={props.initialMode === "local"} />
	);
}

// This is a nasty hack to allow `useHotkeys` and its "[b] open a browser" feature to read these values
// without triggering a re-render loop when `onReady()` updates them.
// The initially requested port can be different than what's actually used, if, for example, you request port 0.
let ip: string;
let port: number;

function InteractiveDevSession(props: DevProps) {
	const toggles = useHotkeys({
		initial: {
			local: props.initialMode === "local",
			tunnel: false,
		},
		inspectorPort: props.inspectorPort,
		inspect: props.inspect,
		localProtocol: props.localProtocol,
		forceLocal: props.forceLocal,
	});

	ip = props.initialIp;
	port = props.initialPort;

	useTunnel(toggles.tunnel);

	const onReady = (newIp: string, newPort: number) => {
		if (newIp !== props.initialIp || newPort !== props.initialPort) {
			ip = newIp;
			port = newPort;
			if (props.onReady) {
				props.onReady(newIp, newPort);
			}
		}
	};

	return (
		<>
			<DevSession {...props} local={toggles.local} onReady={onReady} />
			<Box borderStyle="round" paddingLeft={1} paddingRight={1}>
				<Text bold={true}>[b]</Text>
				<Text> open a browser, </Text>
				{props.inspect ? (
					<>
						<Text bold={true}>[d]</Text>
						<Text> open Devtools, </Text>
					</>
				) : null}
				{!props.forceLocal ? (
					<>
						<Text bold={true}>[l]</Text>
						<Text> {toggles.local ? "turn off" : "turn on"} local mode, </Text>
					</>
				) : null}
				<Text bold={true}>[c]</Text>
				<Text> clear console, </Text>
				<Text bold={true}>[x]</Text>
				<Text> to exit</Text>
			</Box>
		</>
	);
}

type DevSessionProps = DevProps & {
	local: boolean;
	experimentalLocal?: boolean;
};

function DevSession(props: DevSessionProps) {
	useCustomBuild(props.entry, props.build);

	const directory = useTmpDir();
	const handleError = useErrorHandler();

	// Note: when D1 is out of beta, this (and all instances of `betaD1Shims`) can be removed.
	// Additionally, useMemo is used so that new arrays aren't created on every render
	// cause re-rendering further down.
	const betaD1Shims = useMemo(
		() => props.bindings.d1_databases?.map((db) => db.binding),
		[props.bindings.d1_databases]
	);
	const everyD1BindingHasPreview = props.bindings.d1_databases?.every(
		(binding) => binding.preview_database_id
	);
	if (
		betaD1Shims &&
		betaD1Shims.length > 0 &&
		!(props.local || everyD1BindingHasPreview)
	) {
		handleError(
			new Error(
				"D1 bindings require dev --local or preview_database_id for now"
			)
		);
	}

	// If we are using d1 bindings, and are not bundling the worker
	// we should error here as the d1 shim won't be added
	if (Array.isArray(betaD1Shims) && betaD1Shims.length > 0 && props.noBundle) {
		handleError(
			new Error(
				"While in beta, you cannot use D1 bindings without bundling your worker. Please remove `no_bundle` from your wrangler.toml file or remove the `--no-bundle` flag to access D1 bindings."
			)
		);
	}

	const workerDefinitions = useDevRegistry(
		props.name,
		props.bindings.services,
		props.bindings.durable_objects,
		props.local ? "local" : "remote"
	);

	const bundle = useEsbuild({
		entry: props.entry,
		destination: directory,
		jsxFactory: props.jsxFactory,
		rules: props.rules,
		jsxFragment: props.jsxFragment,
		serveAssetsFromWorker: Boolean(
			props.assetPaths && !props.isWorkersSite && props.local
		),
		tsconfig: props.tsconfig,
		minify: props.minify,
		nodeCompat: props.nodeCompat,
		betaD1Shims,
		define: props.define,
		noBundle: props.noBundle,
		assets: props.assetsConfig,
		workerDefinitions,
		services: props.bindings.services,
		durableObjects: props.bindings.durable_objects || { bindings: [] },
		firstPartyWorkerDevFacade: props.firstPartyWorker,
		local: props.local,
		// Enable the bundling to know whether we are using dev or publish
		targetConsumer: "dev",
		testScheduled: props.testScheduled ?? false,
		experimentalLocal: props.experimentalLocal,
	});

	// TODO(queues) support remote wrangler dev
	if (
		!props.local &&
		(props.bindings.queues?.length || props.queueConsumers?.length)
	) {
		logger.warn(
			"Queues are currently in Beta and are not supported in wrangler dev remote mode."
		);
	}

	const announceAndOnReady: typeof props.onReady = (finalIp, finalPort) => {
		if (process.send) {
			process.send(
				JSON.stringify({
					event: "DEV_SERVER_READY",
					ip: finalIp,
					port: finalPort,
				})
			);
		}

		if (props.onReady) {
			props.onReady(finalIp, finalPort);
		}
	};

	return props.local ? (
		<Local
			name={props.name}
			bundle={bundle}
			format={props.entry.format}
			compatibilityDate={props.compatibilityDate}
			compatibilityFlags={props.compatibilityFlags}
			usageModel={props.usageModel}
			bindings={props.bindings}
			workerDefinitions={workerDefinitions}
			assetPaths={props.assetPaths}
			initialPort={props.initialPort}
			initialIp={props.initialIp}
			rules={props.rules}
			inspectorPort={props.inspectorPort}
			localPersistencePath={props.localPersistencePath}
			liveReload={props.liveReload}
			crons={props.crons}
			queueConsumers={props.queueConsumers}
			localProtocol={props.localProtocol}
			localUpstream={props.localUpstream}
			logPrefix={props.logPrefix}
			inspect={props.inspect}
			onReady={announceAndOnReady}
			enablePagesAssetsServiceBinding={props.enablePagesAssetsServiceBinding}
			experimentalLocal={props.experimentalLocal}
			accountId={props.accountId}
			experimentalLocalRemoteKv={props.experimentalLocalRemoteKv}
		/>
	) : (
		<Remote
			name={props.name}
			bundle={bundle}
			format={props.entry.format}
			accountId={props.accountId}
			bindings={props.bindings}
			assetPaths={props.assetPaths}
			isWorkersSite={props.isWorkersSite}
			port={props.initialPort}
			ip={props.initialIp}
			localProtocol={props.localProtocol}
			inspectorPort={props.inspectorPort}
			// TODO: @threepointone #1167
			// liveReload={props.liveReload}
			inspect={props.inspect}
			compatibilityDate={props.compatibilityDate}
			compatibilityFlags={props.compatibilityFlags}
			usageModel={props.usageModel}
			env={props.env}
			legacyEnv={props.legacyEnv}
			zone={props.zone}
			host={props.host}
			routes={props.routes}
			onReady={announceAndOnReady}
			sourceMapPath={bundle?.sourceMapPath}
			sendMetrics={props.sendMetrics}
		/>
	);
}

export interface DirectorySyncResult {
	name: string;
	removeCallback: () => void;
}

function useTmpDir(): string | undefined {
	const [directory, setDirectory] = useState<DirectorySyncResult>();
	const handleError = useErrorHandler();
	useEffect(() => {
		let dir: DirectorySyncResult | undefined;
		try {
			dir = tmp.dirSync({ unsafeCleanup: true });
			setDirectory(dir);
			return;
		} catch (err) {
			logger.error(
				"Failed to create temporary directory to store built files."
			);
			handleError(err);
		}
		return () => {
			dir?.removeCallback();
		};
	}, [handleError]);
	return directory?.name;
}

function useCustomBuild(expectedEntry: Entry, build: Config["build"]): void {
	useEffect(() => {
		if (!build.command) return;
		let watcher: ReturnType<typeof watch> | undefined;
		if (build.watch_dir) {
			watcher = watch(build.watch_dir, {
				persistent: true,
				ignoreInitial: true,
			}).on("all", (_event, filePath) => {
				const relativeFile =
					path.relative(expectedEntry.directory, expectedEntry.file) || ".";
				//TODO: we should buffer requests to the proxy until this completes
				logger.log(`The file ${filePath} changed, restarting build...`);
				runCustomBuild(expectedEntry.file, relativeFile, build).catch((err) => {
					logger.error("Custom build failed:", err);
				});
			});
		}

		return () => {
			watcher?.close();
		};
	}, [build, expectedEntry]);
}

function sleep(period: number) {
	return new Promise((resolve) => setTimeout(resolve, period));
}
const SLEEP_DURATION = 2000;
// really need a first class api for this
const hostNameRegex = /userHostname="(.*)"/g;
async function findTunnelHostname() {
	let hostName: string | undefined;
	while (!hostName) {
		try {
			const resp = await fetch("http://localhost:8789/metrics");
			const data = await resp.text();
			const matches = Array.from(data.matchAll(hostNameRegex));
			hostName = matches[0][1];
		} catch (err) {
			await sleep(SLEEP_DURATION);
		}
	}
	return hostName;
}

/**
 * Create a tunnel to the remote worker.
 * We've disabled this for now until we figure out a better user experience.
 */
function useTunnel(toggle: boolean) {
	const tunnel = useRef<ReturnType<typeof spawn>>();
	const removeSignalExitListener = useRef<() => void>();
	// TODO: test if cloudflared is available, if not
	// point them to a url where they can get docs to install it
	useEffect(() => {
		async function startTunnel() {
			if (toggle) {
				try {
					await commandExists("cloudflared");
				} catch (e) {
					logger.warn(
						"To share your worker on the Internet, please install `cloudflared` from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation"
					);
					return;
				}
				logger.log("⎔ Starting a tunnel...");
				tunnel.current = spawn("cloudflared", [
					"tunnel",
					"--url",
					"http://localhost:8787",
					"--metrics",
					"localhost:8789",
				]);

				tunnel.current.on("close", (code) => {
					if (code) {
						logger.log(`Tunnel process exited with code ${code}`);
					}
				});

				removeSignalExitListener.current = onExit((_code, _signal) => {
					logger.log("⎔ Shutting down local tunnel.");
					tunnel.current?.kill();
					tunnel.current = undefined;
				});

				const hostName = await findTunnelHostname();
				await clipboardy.write(hostName);
				logger.log(`⬣ Sharing at ${hostName}, copied to clipboard.`);
			}
		}

		startTunnel().catch(async (err) => {
			logger.error("tunnel:", err);
		});

		return () => {
			if (tunnel.current) {
				logger.log("⎔ Shutting down tunnel.");
				tunnel.current?.kill();
				tunnel.current = undefined;
				removeSignalExitListener.current && removeSignalExitListener.current();
				removeSignalExitListener.current = undefined;
			}
		};
	}, [toggle]);
}

type useHotkeysInitialState = {
	local: boolean;
	tunnel: boolean;
};
function useHotkeys(props: {
	initial: useHotkeysInitialState;
	inspectorPort: number;
	inspect: boolean;
	localProtocol: "http" | "https";
	forceLocal: boolean | undefined;
}) {
	const { initial, inspectorPort, inspect, localProtocol, forceLocal } = props;
	// UGH, we should put port in context instead
	const [toggles, setToggles] = useState(initial);
	const { exit } = useApp();

	useInput(
		async (
			input,
			// eslint-disable-next-line unused-imports/no-unused-vars
			key
		) => {
			switch (input.toLowerCase()) {
				// clear console
				case "c":
					console.clear();
					// This console.log causes Ink to re-render the `DevSession` component.
					// Couldn't find a better way to tell it to do so...
					console.log();
					break;
				// open browser
				case "b": {
					if (ip === "0.0.0.0") {
						await openInBrowser(`${localProtocol}://127.0.0.1:${port}`);
						return;
					}
					await openInBrowser(`${localProtocol}://${ip}:${port}`);
					break;
				}
				// toggle inspector
				case "d": {
					if (inspect) {
						await openInspector(inspectorPort);
					}
					break;
				}
				// toggle local
				case "l":
					if (forceLocal) return;
					setToggles((previousToggles) => ({
						...previousToggles,
						local: !previousToggles.local,
					}));
					break;
				// shut down
				case "q":
				case "x":
					exit();
					break;
				default:
					// nothing?
					break;
			}
		}
	);
	return toggles;
}

function ErrorFallback(props: { error: Error }) {
	const { exit } = useApp();
	useEffect(() => exit(props.error));
	return (
		<>
			<Text>Something went wrong:</Text>
			<Text>{props.error.stack}</Text>
		</>
	);
}

export default withErrorBoundary(DevImplementation, {
	FallbackComponent: ErrorFallback,
});
