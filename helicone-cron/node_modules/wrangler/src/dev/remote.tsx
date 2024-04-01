import { readFile } from "node:fs/promises";
import path from "node:path";
import React, { useState, useEffect, useRef } from "react";
import { useErrorHandler } from "react-error-boundary";
import { printBundleSize } from "../bundle-reporter";
import {
	createPreviewSession,
	createWorkerPreview,
} from "../create-worker-preview";
import useInspector from "../inspect";
import { logger } from "../logger";
import { startPreviewServer, usePreviewServer } from "../proxy";
import { syncAssets } from "../sites";
import {
	ChooseAccount,
	getAccountChoices,
	requireApiToken,
	saveAccountToCache,
} from "../user";
import type { Route } from "../config/environment";
import type {
	CfPreviewToken,
	CfPreviewSession,
} from "../create-worker-preview";
import type { AssetPaths } from "../sites";
import type { ChooseAccountItem } from "../user";
import type {
	CfModule,
	CfWorkerInit,
	CfScriptFormat,
	CfAccount,
	CfWorkerContext,
} from "../worker";
import type { EsbuildBundle } from "./use-esbuild";

interface RemoteProps {
	name: string | undefined;
	bundle: EsbuildBundle | undefined;
	format: CfScriptFormat | undefined;
	isWorkersSite: boolean;
	assetPaths: AssetPaths | undefined;
	port: number;
	ip: string;
	localProtocol: "https" | "http";
	inspect: boolean;
	inspectorPort: number;
	accountId: string | undefined;
	bindings: CfWorkerInit["bindings"];
	compatibilityDate: string;
	compatibilityFlags: string[] | undefined;
	usageModel: "bundled" | "unbound" | undefined;
	env: string | undefined;
	legacyEnv: boolean | undefined;
	zone: string | undefined;
	host: string | undefined;
	routes: Route[] | undefined;
	onReady?: ((ip: string, port: number) => void) | undefined;
	sourceMapPath: string | undefined;
	sendMetrics: boolean | undefined;
}

export function Remote(props: RemoteProps) {
	const [accountId, setAccountId] = useState(props.accountId);
	const accountChoicesRef = useRef<Promise<ChooseAccountItem[]>>();
	const [accountChoices, setAccountChoices] = useState<ChooseAccountItem[]>();

	const previewToken = useWorker({
		name: props.name,
		bundle: props.bundle,
		format: props.format,
		modules: props.bundle ? props.bundle.modules : [],
		accountId,
		bindings: props.bindings,
		assetPaths: props.assetPaths,
		isWorkersSite: props.isWorkersSite,
		compatibilityDate: props.compatibilityDate,
		compatibilityFlags: props.compatibilityFlags,
		usageModel: props.usageModel,
		env: props.env,
		legacyEnv: props.legacyEnv,
		zone: props.zone,
		host: props.host,
		routes: props.routes,
		onReady: props.onReady,
		sendMetrics: props.sendMetrics,
		port: props.port,
	});

	usePreviewServer({
		previewToken,
		assetDirectory: props.isWorkersSite
			? undefined
			: props.assetPaths?.assetDirectory,
		localProtocol: props.localProtocol,
		localPort: props.port,
		ip: props.ip,
	});

	useInspector({
		inspectorUrl:
			props.inspect && previewToken
				? previewToken.inspectorUrl.href
				: undefined,
		port: props.inspectorPort,
		logToTerminal: true,
		sourceMapPath: props.sourceMapPath,
		host: previewToken?.host,
	});

	const errorHandler = useErrorHandler();

	// This effect handles the async step of fetching the available accounts for the current user.
	// If only one account is available then it is just used by calling `setAccountId()`.
	useEffect(() => {
		if (
			accountChoicesRef.current !== undefined ||
			props.accountId !== undefined
		) {
			return;
		}
		accountChoicesRef.current = getAccountChoices();
		accountChoicesRef.current.then(
			(accounts) => {
				if (accounts.length === 1) {
					saveAccountToCache({
						id: accounts[0].id,
						name: accounts[0].name,
					});
					setAccountId(accounts[0].id);
				} else {
					setAccountChoices(accounts);
				}
			},
			(err) => {
				errorHandler(err);
			}
		);
	});

	// If we have not already chosen an account and there are multiple accounts available
	// allow the users to select one.
	return accountId === undefined && accountChoices !== undefined ? (
		<ChooseAccount
			accounts={accountChoices}
			onSelect={(selectedAccount) => {
				saveAccountToCache(selectedAccount);
				setAccountId(selectedAccount.id);
			}}
			onError={(err) => errorHandler(err)}
		></ChooseAccount>
	) : null;
}

interface RemoteWorkerProps {
	name: string | undefined;
	bundle: EsbuildBundle | undefined;
	format: CfScriptFormat | undefined;
	modules: CfModule[];
	accountId: string | undefined;
	bindings: CfWorkerInit["bindings"];
	assetPaths: AssetPaths | undefined;
	isWorkersSite: boolean;
	compatibilityDate: string | undefined;
	compatibilityFlags: string[] | undefined;
	usageModel: "bundled" | "unbound" | undefined;
	env: string | undefined;
	legacyEnv: boolean | undefined;
	zone: string | undefined;
	host: string | undefined;
	routes: Route[] | undefined;
	onReady: ((ip: string, port: number) => void) | undefined;
	sendMetrics: boolean | undefined;
	port: number;
}

export function useWorker(
	props: RemoteWorkerProps
): CfPreviewToken | undefined {
	const [session, setSession] = useState<CfPreviewSession | undefined>();
	const [token, setToken] = useState<CfPreviewToken | undefined>();
	const [restartCounter, setRestartCounter] = useState<number>(0);
	// This is the most reliable way to detect whether
	// something's "happened" in our system; We make a ref and
	// mark it once we log our initial message. Refs are vars!
	const startedRef = useRef(false);
	// functions must be destructured before use inside a useEffect, otherwise the entire props object has to be added to the dependency array
	const { onReady } = props;
	// This effect sets up the preview session
	useEffect(() => {
		const abortController = new AbortController();
		async function start() {
			if (props.accountId === undefined) {
				return;
			}
			const { workerAccount, workerContext } = getWorkerAccountAndContext({
				accountId: props.accountId,
				env: props.env,
				legacyEnv: props.legacyEnv,
				zone: props.zone,
				host: props.host,
				routes: props.routes,
				sendMetrics: props.sendMetrics,
			});

			setSession(
				await createPreviewSession(
					workerAccount,
					workerContext,
					abortController.signal
				)
			);
		}
		start().catch((err) => {
			// instead of logging the raw API error to the user,
			// give them friendly instructions
			// for error 10063 (workers.dev subdomain required)
			if (err.code === 10063) {
				const errorMessage =
					"Error: You need to register a workers.dev subdomain before running the dev command in remote mode";
				const solutionMessage =
					"You can either enable local mode by pressing l, or register a workers.dev subdomain here:";
				const onboardingLink = `https://dash.cloudflare.com/${props.accountId}/workers/onboarding`;
				logger.error(`${errorMessage}\n${solutionMessage}\n${onboardingLink}`);
			}
			// we want to log the error, but not end the process
			// since it could recover after the developer fixes whatever's wrong
			else if ((err as { code: string }).code !== "ABORT_ERR") {
				logger.error("Error while creating remote dev session:", err);
			}
		});

		return () => {
			abortController.abort();
		};
	}, [
		props.accountId,
		props.env,
		props.host,
		props.legacyEnv,
		props.routes,
		props.zone,
		props.sendMetrics,
		restartCounter,
	]);

	// This effect uses the session to upload the worker and create a preview
	useEffect(() => {
		const abortController = new AbortController();
		async function start() {
			if (props.accountId === undefined) {
				return;
			}
			if (session === undefined) {
				return;
			}
			setToken(undefined); // reset token in case we're re-running

			if (!props.bundle || !props.format) return;

			if (!startedRef.current) {
				startedRef.current = true;
			} else {
				logger.log("⎔ Detected changes, restarted server.");
			}

			const init = await createRemoteWorkerInit({
				bundle: props.bundle,
				modules: props.modules,
				accountId: props.accountId,
				name: props.name,
				legacyEnv: props.legacyEnv,
				env: props.env,
				isWorkersSite: props.isWorkersSite,
				assetPaths: props.assetPaths,
				format: props.format,
				bindings: props.bindings,
				compatibilityDate: props.compatibilityDate,
				compatibilityFlags: props.compatibilityFlags,
				usageModel: props.usageModel,
			});

			const { workerAccount, workerContext } = getWorkerAccountAndContext({
				accountId: props.accountId,
				env: props.env,
				legacyEnv: props.legacyEnv,
				zone: props.zone,
				host: props.host,
				routes: props.routes,
				sendMetrics: props.sendMetrics,
			});

			const workerPreviewToken = await createWorkerPreview(
				init,
				workerAccount,
				workerContext,
				session,
				abortController.signal
			);

			setToken(workerPreviewToken);

			// TODO: Once we get service bindings working in the
			// edge preview server, we can define remote dev service bindings
			// and you can uncomment this code.
			// https://github.com/cloudflare/wrangler2/issues/1182

			/*
			if (name) {
				await registerWorker(name, {
					mode: "remote",
					// upstream protocol is always https (https://github.com/cloudflare/wrangler2/issues/583)
					protocol: "https",
					port: undefined,
					host: workerPreviewToken.host,
					headers: {
						"cf-workers-preview-token": workerPreviewToken.value,
						host: workerPreviewToken.host,
					},
				});
			}
			*/
			onReady?.(props.host || "localhost", props.port);
		}
		start().catch((err) => {
			// we want to log the error, but not end the process
			// since it could recover after the developer fixes whatever's wrong
			if ((err as { code: string }).code !== "ABORT_ERR") {
				// instead of logging the raw API error to the user,
				// give them friendly instructions
				// for error 10063 (workers.dev subdomain required)
				if (err.code === 10063) {
					const errorMessage =
						"Error: You need to register a workers.dev subdomain before running the dev command in remote mode";
					const solutionMessage =
						"You can either enable local mode by pressing l, or register a workers.dev subdomain here:";
					const onboardingLink = `https://dash.cloudflare.com/${props.accountId}/workers/onboarding`;
					logger.error(
						`${errorMessage}\n${solutionMessage}\n${onboardingLink}`
					);
				} else if (err.code === 10049) {
					logger.log("Preview token expired, fetching a new one");
					// code 10049 happens when the preview token expires
					// since we want a new preview token when this happens,
					// lets increment the counter, and trigger a rerun of
					// the useEffect above
					setRestartCounter((prevCount) => prevCount + 1);
				} else {
					logger.error("Error on remote worker:", err);
				}
			}
		});

		return () => {
			abortController.abort();
		};
	}, [
		props.name,
		props.bundle,
		props.format,
		props.accountId,
		props.assetPaths,
		props.isWorkersSite,
		props.compatibilityDate,
		props.compatibilityFlags,
		props.usageModel,
		props.bindings,
		props.modules,
		props.env,
		props.legacyEnv,
		props.zone,
		props.host,
		props.routes,
		session,
		onReady,
		props.sendMetrics,
		props.port,
	]);

	return token;
}

export async function startRemoteServer(props: RemoteProps) {
	let accountId = props.accountId;
	if (accountId === undefined) {
		const accountChoices = await getAccountChoices();
		if (accountChoices.length === 1) {
			saveAccountToCache({
				id: accountChoices[0].id,
				name: accountChoices[0].name,
			});
			accountId = accountChoices[0].id;
		} else {
			throw logger.error(
				"In a non-interactive environment, it is mandatory to specify an account ID, either by assigning its value to CLOUDFLARE_ACCOUNT_ID, or as `account_id` in your `wrangler.toml` file."
			);
		}
	}

	const previewToken = await getRemotePreviewToken({
		...props,
		accountId: accountId,
	});

	if (previewToken === undefined) {
		throw logger.error("Failed to get a previewToken");
	}
	// start our proxy server
	const previewServer = await startPreviewServer({
		previewToken,
		assetDirectory: props.isWorkersSite
			? undefined
			: props.assetPaths?.assetDirectory,
		localProtocol: props.localProtocol,
		localPort: props.port,
		ip: props.ip,
		onReady: props.onReady,
	});
	if (!previewServer) {
		throw logger.error("Failed to start remote server");
	}
	return { stop: previewServer.stop };
}

/**
 * getRemotePreviewToken is a react-free version of `useWorker`.
 * It returns a preview token, which we then use in our proxy server
 */
export async function getRemotePreviewToken(props: RemoteProps) {
	//setup the preview session
	async function start() {
		if (props.accountId === undefined) {
			throw logger.error("no accountId provided");
		}
		const abortController = new AbortController();
		const { workerAccount, workerContext } = getWorkerAccountAndContext({
			accountId: props.accountId,
			env: props.env,
			legacyEnv: props.legacyEnv,
			zone: props.zone,
			host: props.host,
			routes: props.routes,
			sendMetrics: props.sendMetrics,
		});
		const session = await createPreviewSession(
			workerAccount,
			workerContext,
			abortController.signal
		);
		//use the session to upload the worker, and create a preview

		if (session === undefined) {
			throw logger.error("Failed to start a session");
		}
		if (!props.bundle || !props.format) return;

		const init = await createRemoteWorkerInit({
			bundle: props.bundle,
			modules: props.bundle ? props.bundle.modules : [],
			accountId: props.accountId,
			name: props.name,
			legacyEnv: props.legacyEnv,
			env: props.env,
			isWorkersSite: props.isWorkersSite,
			assetPaths: props.assetPaths,
			format: props.format,
			bindings: props.bindings,
			compatibilityDate: props.compatibilityDate,
			compatibilityFlags: props.compatibilityFlags,
			usageModel: props.usageModel,
		});
		const workerPreviewToken = await createWorkerPreview(
			init,
			workerAccount,
			workerContext,
			session,
			abortController.signal
		);
		return workerPreviewToken;
	}
	return start().catch((err) => {
		if ((err as { code?: string })?.code !== "ABORT_ERR") {
			// instead of logging the raw API error to the user,
			// give them friendly instructions
			// for error 10063 (workers.dev subdomain required)
			if (err?.code === 10063) {
				const errorMessage =
					"Error: You need to register a workers.dev subdomain before running the dev command in remote mode";
				const solutionMessage =
					"You can either enable local mode by pressing l, or register a workers.dev subdomain here:";
				const onboardingLink = `https://dash.cloudflare.com/${props.accountId}/workers/onboarding`;
				logger.error(`${errorMessage}\n${solutionMessage}\n${onboardingLink}`);
			} else if (err?.code === 10049) {
				// code 10049 happens when the preview token expires
				logger.log("Preview token expired, restart server to fetch a new one");
			} else {
				logger.error("Error on remote worker:", err);
			}
		}
	});
}

async function createRemoteWorkerInit(props: {
	bundle: EsbuildBundle;
	modules: CfModule[];
	accountId: string;
	name: string | undefined;
	legacyEnv: boolean | undefined;
	env: string | undefined;
	isWorkersSite: boolean;
	assetPaths: AssetPaths | undefined;
	format: CfScriptFormat;
	bindings: CfWorkerInit["bindings"];
	compatibilityDate: string | undefined;
	compatibilityFlags: string[] | undefined;
	usageModel: "bundled" | "unbound" | undefined;
}) {
	const content = await readFile(props.bundle.path, "utf-8");

	// TODO: For Dev we could show the reporter message in the interactive box.
	void printBundleSize(
		{ name: path.basename(props.bundle.path), content: content },
		props.modules
	);

	const assets = await syncAssets(
		props.accountId,
		// When we're using the newer service environments, we wouldn't
		// have added the env name on to the script name. However, we must
		// include it in the kv namespace name regardless (since there's no
		// concept of service environments for kv namespaces yet).
		props.name + (!props.legacyEnv && props.env ? `-${props.env}` : ""),
		props.isWorkersSite ? props.assetPaths : undefined,
		true,
		false
	); // TODO: cancellable?

	const init: CfWorkerInit = {
		name: props.name,
		main: {
			name: path.basename(props.bundle.path),
			type: props.format === "modules" ? "esm" : "commonjs",
			content,
		},
		modules: props.modules.concat(
			assets.manifest
				? {
						name: "__STATIC_CONTENT_MANIFEST",
						content: JSON.stringify(assets.manifest),
						type: "text",
				  }
				: []
		),
		bindings: {
			...props.bindings,
			kv_namespaces: (props.bindings.kv_namespaces || []).concat(
				assets.namespace
					? { binding: "__STATIC_CONTENT", id: assets.namespace }
					: []
			),
			text_blobs: {
				...props.bindings.text_blobs,
				...(assets.manifest &&
					props.format === "service-worker" && {
						__STATIC_CONTENT_MANIFEST: "__STATIC_CONTENT_MANIFEST",
					}),
			},
		},
		migrations: undefined, // no migrations in dev
		compatibility_date: props.compatibilityDate,
		compatibility_flags: props.compatibilityFlags,
		usage_model: props.usageModel,
		keepVars: true,
		logpush: false,
	};

	return init;
}

function getWorkerAccountAndContext(props: {
	accountId: string;
	env?: string;
	legacyEnv?: boolean;
	zone?: string;
	host?: string;
	routes: Route[] | undefined;
	sendMetrics?: boolean;
}): { workerAccount: CfAccount; workerContext: CfWorkerContext } {
	const workerAccount: CfAccount = {
		accountId: props.accountId,
		apiToken: requireApiToken(),
	};

	const workerContext: CfWorkerContext = {
		env: props.env,
		legacyEnv: props.legacyEnv,
		zone: props.zone,
		host: props.host,
		routes: props.routes,
		sendMetrics: props.sendMetrics,
	};

	return { workerAccount, workerContext };
}
