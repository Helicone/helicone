import type { Environment } from "./config";
import type { Route } from "./config/environment";
import type { ApiCredentials } from "./user";

/**
 * A Cloudflare account.
 */

export interface CfAccount {
	/**
	 * An API token.
	 *
	 * @link https://api.cloudflare.com/#user-api-tokens-properties
	 */
	apiToken: ApiCredentials;
	/**
	 * An account ID.
	 */
	accountId: string;
}

/**
 * The type of Worker
 */
export type CfScriptFormat = "modules" | "service-worker";

/**
 * A module type.
 */
export type CfModuleType =
	| "esm"
	| "commonjs"
	| "compiled-wasm"
	| "text"
	| "buffer";

/**
 * An imported module.
 */
export interface CfModule {
	/**
	 * The module name.
	 *
	 * @example
	 * './src/index.js'
	 */
	name: string;
	/**
	 * The module content, usually JavaScript or WASM code.
	 *
	 * @example
	 * export default {
	 *   async fetch(request) {
	 *     return new Response('Ok')
	 *   }
	 * }
	 */
	content: string | Buffer;
	/**
	 * The module type.
	 *
	 * If absent, will default to the main module's type.
	 */
	type?: CfModuleType;
}

/**
 * A map of variable names to values.
 */
export interface CfVars {
	[key: string]: unknown;
}

/**
 * A KV namespace.
 */
export interface CfKvNamespace {
	binding: string;
	id: string;
}

/**
 * A binding to a wasm module (in service-worker format)
 */

export interface CfWasmModuleBindings {
	[key: string]: string;
}

/**
 * A binding to a text blob (in service-worker format)
 */

export interface CfTextBlobBindings {
	[key: string]: string;
}

/**
 * A binding to a data blob (in service-worker format)
 */

export interface CfDataBlobBindings {
	[key: string]: string;
}

/**
 * A Durable Object.
 */
export interface CfDurableObject {
	name: string;
	class_name: string;
	script_name?: string;
	environment?: string;
}

export interface CfQueue {
	binding: string;
	queue_name: string;
}

export interface CfR2Bucket {
	binding: string;
	bucket_name: string;
}

export const D1_BETA_PREFIX = `__D1_BETA__` as const;
export type D1PrefixedBinding = `${typeof D1_BETA_PREFIX}${string}`;

// TODO: figure out if this is duplicated in packages/wrangler/src/config/environment.ts
export interface CfD1Database {
	// For now, all D1 bindings are alpha
	binding: D1PrefixedBinding;
	database_id: string;
	database_name?: string;
	preview_database_id?: string;
	database_internal_env?: string;
	migrations_table?: string;
	migrations_dir?: string;
}

interface CfService {
	binding: string;
	service: string;
	environment?: string;
}

interface CfDispatchNamespace {
	binding: string;
	namespace: string;
}

interface CfLogfwdr {
	schema: string | undefined;
	bindings: CfLogfwdrBinding[];
}

interface CfLogfwdrBinding {
	name: string;
	destination: string;
}

interface CfUnsafeBinding {
	name: string;
	type: string;
}

export interface CfDurableObjectMigrations {
	old_tag?: string;
	new_tag: string;
	steps: {
		new_classes?: string[];
		renamed_classes?: {
			from: string;
			to: string;
		}[];
		deleted_classes?: string[];
	}[];
}

/**
 * Options for creating a `CfWorker`.
 */
export interface CfWorkerInit {
	/**
	 * The name of the worker.
	 */
	name: string | undefined;
	/**
	 * The entrypoint module.
	 */
	main: CfModule;
	/**
	 * The list of additional modules.
	 */
	modules: CfModule[] | undefined;
	/**
	 * All the bindings
	 */
	bindings: {
		vars: CfVars | undefined;
		kv_namespaces: CfKvNamespace[] | undefined;
		wasm_modules: CfWasmModuleBindings | undefined;
		text_blobs: CfTextBlobBindings | undefined;
		data_blobs: CfDataBlobBindings | undefined;
		durable_objects: { bindings: CfDurableObject[] } | undefined;
		queues: CfQueue[] | undefined;
		r2_buckets: CfR2Bucket[] | undefined;
		d1_databases: CfD1Database[] | undefined;
		services: CfService[] | undefined;
		dispatch_namespaces: CfDispatchNamespace[] | undefined;
		logfwdr: CfLogfwdr | undefined;
		unsafe: CfUnsafeBinding[] | undefined;
	};
	migrations: CfDurableObjectMigrations | undefined;
	compatibility_date: string | undefined;
	compatibility_flags: string[] | undefined;
	usage_model: "bundled" | "unbound" | undefined;
	keepVars: boolean | undefined;
	logpush: boolean | undefined;
}

export interface CfWorkerContext {
	env: string | undefined;
	legacyEnv: boolean | undefined;
	zone: string | undefined;
	host: string | undefined;
	routes: Route[] | undefined;
	sendMetrics: boolean | undefined;
}

// Prefix binding with identifier which will then get picked up by the D1 shim.
// Once the D1 Api is out of beta, this function can be removed.
export function identifyD1BindingsAsBeta(
	dbs: Environment["d1_databases"]
): CfD1Database[] | undefined {
	return dbs?.map((db) => ({
		...db,
		binding: `${D1_BETA_PREFIX}${db.binding}`,
	}));
}

// Remove beta prefix
export function removeD1BetaPrefix(binding: D1PrefixedBinding): string {
	return binding.slice(D1_BETA_PREFIX.length);
}
