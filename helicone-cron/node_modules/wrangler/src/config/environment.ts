/**
 * The `Environment` interface declares all the configuration fields that
 * can be specified for an environment.
 *
 * This could be the top-level default environment, or a specific named environment.
 */
export interface Environment
	extends EnvironmentInheritable,
		EnvironmentNonInheritable {}

export type SimpleRoute = string;
export type ZoneIdRoute = {
	pattern: string;
	zone_id: string;
	custom_domain?: boolean;
};
export type ZoneNameRoute = {
	pattern: string;
	zone_name: string;
	custom_domain?: boolean;
};
export type CustomDomainRoute = { pattern: string; custom_domain: boolean };
export type Route =
	| SimpleRoute
	| ZoneIdRoute
	| ZoneNameRoute
	| CustomDomainRoute;

/**
 * The `EnvironmentInheritable` interface declares all the configuration fields for an environment
 * that can be inherited (and overridden) from the top-level environment.
 */
interface EnvironmentInheritable {
	/**
	 * The name of your worker. Alphanumeric + dashes only.
	 *
	 * @inheritable
	 */
	name: string | undefined;

	/**
	 * This is the ID of the account associated with your zone.
	 * You might have more than one account, so make sure to use
	 * the ID of the account associated with the zone/route you
	 * provide, if you provide one. It can also be specified through
	 * the CLOUDFLARE_ACCOUNT_ID environment variable.
	 *
	 * @inheritable
	 */
	account_id: string | undefined;

	/**
	 * A date in the form yyyy-mm-dd, which will be used to determine
	 * which version of the Workers runtime is used.
	 *
	 * More details at https://developers.cloudflare.com/workers/platform/compatibility-dates
	 *
	 * @inheritable
	 */
	compatibility_date: string | undefined;

	/**
	 * A list of flags that enable features from upcoming features of
	 * the Workers runtime, usually used together with compatibility_flags.
	 *
	 * More details at https://developers.cloudflare.com/workers/platform/compatibility-dates
	 *
	 * @inheritable
	 */
	compatibility_flags: string[];

	/**
	 * The entrypoint/path to the JavaScript file that will be executed.
	 */
	main: string | undefined;

	/**
	 * Whether we use <name>.<subdomain>.workers.dev to
	 * test and deploy your worker.
	 *
	 * @default `true` (This is a breaking change from wrangler 1)
	 * @breaking
	 * @inheritable
	 */
	workers_dev: boolean | undefined;

	/**
	 * A list of routes that your worker should be published to.
	 * Only one of `routes` or `route` is required.
	 *
	 * Only required when workers_dev is false, and there's no scheduled worker (see `triggers`)
	 *
	 * @inheritable
	 */
	routes: Route[] | undefined;

	/**
	 * A route that your worker should be published to. Literally
	 * the same as routes, but only one.
	 * Only one of `routes` or `route` is required.
	 *
	 * Only required when workers_dev is false, and there's no scheduled worker
	 *
	 * @inheritable
	 */
	route: Route | undefined;

	/**
	 * Path to a custom tsconfig
	 */
	tsconfig: string | undefined;

	/**
	 * The function to use to replace jsx syntax.
	 *
	 * @default `"React.createElement"`
	 * @inheritable
	 */
	jsx_factory: string;

	/**
	 * The function to use to replace jsx fragment syntax.
	 *
	 * @default `"React.Fragment"`
	 * @inheritable
	 */
	jsx_fragment: string;

	/**
	 * "Cron" definitions to trigger a worker's "scheduled" function.
	 *
	 * Lets you call workers periodically, much like a cron job.
	 *
	 * More details here https://developers.cloudflare.com/workers/platform/cron-triggers
	 *
	 * @default `{crons:[]}`
	 * @inheritable
	 */
	triggers: { crons: string[] };

	/**
	 * Specifies the Usage Model for your Worker. There are two options -
	 * [bundled](https://developers.cloudflare.com/workers/platform/limits#bundled-usage-model) and
	 * [unbound](https://developers.cloudflare.com/workers/platform/limits#unbound-usage-model).
	 * For newly created Workers, if the Usage Model is omitted
	 * it will be set to the [default Usage Model set on the account](https://dash.cloudflare.com/?account=workers/default-usage-model).
	 * For existing Workers, if the Usage Model is omitted, it will be
	 * set to the Usage Model configured in the dashboard for that Worker.
	 *
	 * @inheritable
	 */
	usage_model: "bundled" | "unbound" | undefined;

	/**
	 * An ordered list of rules that define which modules to import,
	 * and what type to import them as. You will need to specify rules
	 * to use Text, Data, and CompiledWasm modules, or when you wish to
	 * have a .js file be treated as an ESModule instead of CommonJS.
	 *
	 * @inheritable
	 */
	rules: Rule[];

	/**
	 * Configures a custom build step to be run by Wrangler when building your Worker.
	 *
	 * Refer to the [custom builds documentation](https://developers.cloudflare.com/workers/cli-wrangler/configuration#build)
	 * for more details.
	 *
	 * @default {}
	 */
	build: {
		/** The command used to build your Worker. On Linux and macOS, the command is executed in the `sh` shell and the `cmd` shell for Windows. The `&&` and `||` shell operators may be used. */
		command?: string;
		/** The directory in which the command is executed. */
		cwd?: string;
		/** The directory to watch for changes while using wrangler dev, defaults to the current working directory */
		watch_dir?: string | string[];
		/**
		 * Deprecated field previously used to configure the build and upload of the script.
		 * @deprecated
		 */
		upload?: DeprecatedUpload;
	};

	/**
	 * Skip internal build steps and directly publish script
	 * @inheritable
	 */
	no_bundle: boolean | undefined;

	/**
	 * Minify the script before uploading.
	 * @inheritable
	 */
	minify: boolean | undefined;

	/**
	 * Add polyfills for node builtin modules and globals
	 * @inheritable
	 */
	node_compat: boolean | undefined;

	/**
	 * Specifies namespace bindings that are bound to this Worker environment.
	 *
	 * NOTE: This field is not automatically inherited from the top level environment,
	 * and so must be specified in every named environment.
	 *
	 * @default `[]`
	 * @nonInheritable
	 */
	dispatch_namespaces: {
		/** The binding name used to refer to the bound service. */
		binding: string;
		/** The namespace to bind to. */
		namespace: string;
	}[];

	/**
	 *	Designates this worker as an internal-only "first-party" worker.
	 */
	first_party_worker: boolean | undefined;

	/**
	 * TODO: remove this as it has been deprecated.
	 *
	 * This is just here for now because the `route` commands use it.
	 * So we need to include it in this type so it is available.
	 */
	zone_id?: string;

	/**
	 * Specify a compiled capnp schema to use
	 * Then add a binding per field in the top level message that you will send to logfwdr
	 *
	 * @default `{schema:undefined,bindings:[]}`
	 * @inheritable
	 */
	logfwdr: {
		/** capnp schema filename */
		schema: string | undefined;
		bindings: {
			/** The binding name used to refer to logfwdr */
			name: string;
			/** The destination for this logged message */
			destination: string;
		}[];
	};

	/**
	 * Send Trace Events from this worker to Workers Logpush.
	 *
	 * This will not configure a corresponding Logpush job automatically.
	 *
	 * For more information about Workers Logpush, see:
	 * https://blog.cloudflare.com/logpush-for-workers/
	 *
	 * @inheritable
	 */
	logpush: boolean | undefined;
}

/**
 * The `EnvironmentNonInheritable` interface declares all the configuration fields for an environment
 * that cannot be inherited from the top-level environment, and must be defined specifically.
 *
 * If any of these fields are defined at the top-level then they should also be specifically defined
 * for each named environment.
 */
interface EnvironmentNonInheritable {
	/**
	 * A map of values to substitute when deploying your worker.
	 *
	 * NOTE: This field is not automatically inherited from the top level environment,
	 * and so must be specified in every named environment.
	 *
	 * @default `{}`
	 * @nonInheritable
	 */
	define: Record<string, string>;
	/**
	 * A map of environment variables to set when deploying your worker.
	 *
	 * NOTE: This field is not automatically inherited from the top level environment,
	 * and so must be specified in every named environment.
	 *
	 * @default `{}`
	 * @nonInheritable
	 */
	vars: { [key: string]: unknown };

	/**
	 * A list of durable objects that your worker should be bound to.
	 *
	 * For more information about Durable Objects, see the documentation at
	 * https://developers.cloudflare.com/workers/learning/using-durable-objects
	 *
	 * NOTE: This field is not automatically inherited from the top level environment,
	 * and so must be specified in every named environment.
	 *
	 * @default `{bindings:[]}`
	 * @nonInheritable
	 */
	durable_objects: {
		bindings: {
			/** The name of the binding used to refer to the Durable Object */
			name: string;
			/** The exported class name of the Durable Object */
			class_name: string;
			/** The script where the Durable Object is defined (if it's external to this worker) */
			script_name?: string;
			/** The service environment of the script_name to bind to */
			environment?: string;
		}[];
	};

	/**
	 * These specify any Workers KV Namespaces you want to
	 * access from inside your Worker.
	 *
	 * To learn more about KV Namespaces,
	 * see the documentation at https://developers.cloudflare.com/workers/learning/how-kv-works
	 *
	 * NOTE: This field is not automatically inherited from the top level environment,
	 * and so must be specified in every named environment.
	 *
	 * @default `[]`
	 * @nonInheritable
	 */
	kv_namespaces: {
		/** The binding name used to refer to the KV Namespace */
		binding: string;
		/** The ID of the KV namespace */
		id: string;
		/** The ID of the KV namespace used during `wrangler dev` */
		preview_id?: string;
	}[];

	/**
	 * Specifies Queues that are bound to this Worker environment.
	 *
	 * NOTE: This field is not automatically inherited from the top level environment,
	 * and so must be specified in every named environment.
	 *
	 * @default `{}`
	 * @nonInheritable
	 */
	queues: {
		/** Producer bindings */
		producers?: {
			/** The binding name used to refer to the Queue in the worker. */
			binding: string;

			/** The name of this Queue. */
			queue: string;
		}[];

		/** Consumer configuration */
		consumers?: {
			/** The name of the queue from which this script should consume. */
			queue: string;

			/** The maximum number of messages per batch */
			max_batch_size?: number;

			/** The maximum number of seconds to wait to fill a batch with messages. */
			max_batch_timeout?: number;

			/** The maximum number of retries for each message. */
			max_retries?: number;

			/** The queue to send messages that failed to be consumed. */
			dead_letter_queue?: string;
		}[];
	};

	/**
	 * Specifies R2 buckets that are bound to this Worker environment.
	 *
	 * NOTE: This field is not automatically inherited from the top level environment,
	 * and so must be specified in every named environment.
	 *
	 * @default `[]`
	 * @nonInheritable
	 */
	r2_buckets: {
		/** The binding name used to refer to the R2 bucket in the worker. */
		binding: string;
		/** The name of this R2 bucket at the edge. */
		bucket_name: string;
		/** The preview name of this R2 bucket at the edge. */
		preview_bucket_name?: string;
	}[];

	/**
	 * Specifies D1 databases that are bound to this Worker environment.
	 *
	 * NOTE: This field is not automatically inherited from the top level environment,
	 * and so must be specified in every named environment.
	 *
	 * @default `[]`
	 * @nonInheritable
	 */
	d1_databases: {
		/** The binding name used to refer to the D1 database in the worker. */
		binding: string;
		/** The name of this D1 database. */
		database_name: string;
		/** The UUID of this D1 database (not required). */
		database_id: string;
		/** The UUID of this D1 database for Wrangler Dev (if specified). */
		preview_database_id?: string;
		/** The name of the migrations table for this D1 database (defaults to 'd1_migrations'). */
		migrations_table?: string;
		/** The path to the directory of migrations for this D1 database (defaults to './migrations'). */
		migrations_dir?: string;
		/** Internal use only. */
		database_internal_env?: string;
	}[];

	/**
	 * Specifies service bindings (worker-to-worker) that are bound to this Worker environment.
	 *
	 * NOTE: This field is not automatically inherited from the top level environment,
	 * and so must be specified in every named environment.
	 *
	 * @default `[]`
	 * @nonInheritable
	 */
	services:
		| {
				/** The binding name used to refer to the bound service. */
				binding: string;
				/** The name of the service. */
				service: string;
				/** The environment of the service (e.g. production, staging, etc). */
				environment?: string;
		  }[]
		| undefined;

	/**
	 * "Unsafe" tables for features that aren't directly supported by wrangler.
	 *
	 * NOTE: This field is not automatically inherited from the top level environment,
	 * and so must be specified in every named environment.
	 *
	 * @default `{ bindings: [] }`
	 * @nonInheritable
	 */
	unsafe: {
		/**
		 * A set of bindings that should be put into a Worker's upload metadata without changes. These
		 * can be used to implement bindings for features that haven't released and aren't supported
		 * directly by wrangler or miniflare.
		 *
		 * @default []
		 */
		bindings: {
			name: string;
			type: string;
			[key: string]: unknown;
		}[];
	};
}

/**
 * The environment configuration properties that have been deprecated.
 */
interface EnvironmentDeprecated {
	/**
	 * The zone ID of the zone you want to deploy to. You can find this
	 * in your domain page on the dashboard.
	 *
	 * @deprecated This is unnecessary since we can deduce this from routes directly.
	 */
	zone_id?: string;

	/**
	 * Legacy way of defining KVNamespaces that is no longer supported.
	 *
	 * @deprecated DO NOT USE. This was a legacy bug from wrangler 1, that we do not want to support.
	 */
	"kv-namespaces"?: string;

	/**
	 * A list of services that your worker should be bound to.
	 *
	 * @default `[]`
	 * @deprecated DO NOT USE. We'd added this to test the new service binding system, but the proper way to test experimental features is to use `unsafe.bindings` configuration.
	 */
	experimental_services?: {
		/** The binding name used to refer to the Service */
		name: string;
		/** The name of the Service being bound */
		service: string;
		/** The Service's environment */
		environment: string;
	}[];
}

/**
 * Deprecated upload configuration.
 */
export interface DeprecatedUpload {
	/**
	 * The format of the Worker script.
	 *
	 * @deprecated We infer the format automatically now.
	 */
	format?: "modules" | "service-worker";

	/**
	 * The directory you wish to upload your worker from,
	 * relative to the wrangler.toml file.
	 *
	 * Defaults to the directory containing the wrangler.toml file.
	 *
	 * @deprecated
	 */
	dir?: string;

	/**
	 * The path to the Worker script, relative to `upload.dir`.
	 *
	 * @deprecated This will be replaced by a command line argument.
	 */
	main?: string;

	/**
	 * @deprecated This is now defined at the top level `rules` field.
	 */
	rules?: Environment["rules"];
}

/**
 * The raw environment configuration that we read from the config file.
 *
 * All the properties are optional, and will be replaced with defaults in the configuration that
 * is used in the rest of the codebase.
 */
export type RawEnvironment = Partial<Environment> & EnvironmentDeprecated;

/**
 * A bundling resolver rule, defining the modules type for paths that match the specified globs.
 */
export type Rule = {
	type: ConfigModuleRuleType;
	globs: string[];
	fallthrough?: boolean;
};

/**
 * The possible types for a `Rule`.
 */
export type ConfigModuleRuleType =
	| "ESModule"
	| "CommonJS"
	| "CompiledWasm"
	| "Text"
	| "Data";
