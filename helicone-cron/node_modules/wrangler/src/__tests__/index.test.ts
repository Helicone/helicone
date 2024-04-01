import { getPackageManager } from "../package-manager";
import { mockConsoleMethods } from "./helpers/mock-console";
import { runInTempDir } from "./helpers/run-in-tmp";
import { runWrangler } from "./helpers/run-wrangler";
import { writeWorkerSource } from "./helpers/write-worker-source";
import writeWranglerToml from "./helpers/write-wrangler-toml";
import type { PackageManager } from "../package-manager";

describe("wrangler", () => {
	let mockPackageManager: PackageManager;
	runInTempDir();

	beforeEach(() => {
		mockPackageManager = {
			cwd: process.cwd(),
			// @ts-expect-error we're making a fake package manager here
			type: "mockpm",
			addDevDeps: jest.fn(),
			install: jest.fn(),
		};
		(getPackageManager as jest.Mock).mockResolvedValue(mockPackageManager);
	});

	const std = mockConsoleMethods();

	describe("no command", () => {
		it("should display a list of available commands", async () => {
			await runWrangler();

			expect(std.out).toMatchInlineSnapshot(`
			"wrangler

			Commands:
			  wrangler init [name]         📥 Create a wrangler.toml configuration file
			  wrangler dev [script]        👂 Start a local server for developing your worker
			  wrangler publish [script]    🆙 Publish your Worker to Cloudflare.
			  wrangler delete [script]     🗑  Delete your Worker from Cloudflare.
			  wrangler tail [worker]       🦚 Starts a log tailing session for a published Worker.
			  wrangler secret              🤫 Generate a secret that can be referenced in a Worker
			  wrangler secret:bulk <json>  🗄️  Bulk upload secrets for a Worker
			  wrangler kv:namespace        🗂️  Interact with your Workers KV Namespaces
			  wrangler kv:key              🔑 Individually manage Workers KV key-value pairs
			  wrangler kv:bulk             💪 Interact with multiple Workers KV key-value pairs at once
			  wrangler pages               ⚡️ Configure Cloudflare Pages
			  wrangler queues              🇶 Configure Workers Queues
			  wrangler r2                  📦 Interact with an R2 store
			  wrangler dispatch-namespace  📦 Interact with a dispatch namespace
			  wrangler d1                  🗄  Interact with a D1 database
			  wrangler pubsub              📮 Interact and manage Pub/Sub Brokers
			  wrangler login               🔓 Login to Cloudflare
			  wrangler logout              🚪 Logout from Cloudflare
			  wrangler whoami              🕵️  Retrieve your user info and test your auth config
			  wrangler types               📝 Generate types from bindings & module rules in config
			  wrangler deployments         🚢 Displays the 10 most recent deployments for a worker

			Flags:
			  -c, --config   Path to .toml configuration file  [string]
			  -e, --env      Environment to use for operations and .env files  [string]
			  -h, --help     Show help  [boolean]
			  -v, --version  Show version number  [boolean]"
		`);

			expect(std.err).toMatchInlineSnapshot(`""`);
		});
	});

	describe("invalid command", () => {
		it("should display an error", async () => {
			await expect(
				runWrangler("invalid-command")
			).rejects.toThrowErrorMatchingInlineSnapshot(
				`"Unknown argument: invalid-command"`
			);

			expect(std.out).toMatchInlineSnapshot(`
			"
			wrangler

			Commands:
			  wrangler init [name]         📥 Create a wrangler.toml configuration file
			  wrangler dev [script]        👂 Start a local server for developing your worker
			  wrangler publish [script]    🆙 Publish your Worker to Cloudflare.
			  wrangler delete [script]     🗑  Delete your Worker from Cloudflare.
			  wrangler tail [worker]       🦚 Starts a log tailing session for a published Worker.
			  wrangler secret              🤫 Generate a secret that can be referenced in a Worker
			  wrangler secret:bulk <json>  🗄️  Bulk upload secrets for a Worker
			  wrangler kv:namespace        🗂️  Interact with your Workers KV Namespaces
			  wrangler kv:key              🔑 Individually manage Workers KV key-value pairs
			  wrangler kv:bulk             💪 Interact with multiple Workers KV key-value pairs at once
			  wrangler pages               ⚡️ Configure Cloudflare Pages
			  wrangler queues              🇶 Configure Workers Queues
			  wrangler r2                  📦 Interact with an R2 store
			  wrangler dispatch-namespace  📦 Interact with a dispatch namespace
			  wrangler d1                  🗄  Interact with a D1 database
			  wrangler pubsub              📮 Interact and manage Pub/Sub Brokers
			  wrangler login               🔓 Login to Cloudflare
			  wrangler logout              🚪 Logout from Cloudflare
			  wrangler whoami              🕵️  Retrieve your user info and test your auth config
			  wrangler types               📝 Generate types from bindings & module rules in config
			  wrangler deployments         🚢 Displays the 10 most recent deployments for a worker

			Flags:
			  -c, --config   Path to .toml configuration file  [string]
			  -e, --env      Environment to use for operations and .env files  [string]
			  -h, --help     Show help  [boolean]
			  -v, --version  Show version number  [boolean]"
		`);
			expect(std.err).toMatchInlineSnapshot(`
			        "[31mX [41;31m[[41;97mERROR[41;31m][0m [1mUnknown argument: invalid-command[0m

			        "
		      `);
		});
	});

	describe("preview", () => {
		it("should throw an error if the deprecated command is used with positional arguments", async () => {
			await expect(runWrangler("preview GET")).rejects
				.toThrowErrorMatchingInlineSnapshot(`
              "Deprecation:
              The \`wrangler preview\` command has been deprecated.
              Try using \`wrangler dev\` to to try out a worker during development.
              "
            `);
			await expect(runWrangler(`preview GET "SomeBody"`)).rejects
				.toThrowErrorMatchingInlineSnapshot(`
              "Deprecation:
              The \`wrangler preview\` command has been deprecated.
              Try using \`wrangler dev\` to to try out a worker during development.
              "
            `);
		});
	});

	describe("subcommand implicit help ran on incomplete command execution", () => {
		it("no subcommand for 'secret' should display a list of available subcommands", async () => {
			await runWrangler("secret");
			await endEventLoop();
			expect(std.out).toMatchInlineSnapshot(`
			"wrangler secret

			🤫 Generate a secret that can be referenced in a Worker

			Commands:
			  wrangler secret put <key>     Create or update a secret variable for a Worker
			  wrangler secret delete <key>  Delete a secret variable from a Worker
			  wrangler secret list          List all secrets for a Worker

			Flags:
			  -c, --config   Path to .toml configuration file  [string]
			  -e, --env      Environment to use for operations and .env files  [string]
			  -h, --help     Show help  [boolean]
			  -v, --version  Show version number  [boolean]"
		`);
		});

		it("no subcommand 'kv:namespace' should display a list of available subcommands", async () => {
			await runWrangler("kv:namespace");
			await endEventLoop();
			expect(std.out).toMatchInlineSnapshot(`
			"wrangler kv:namespace

			🗂️  Interact with your Workers KV Namespaces

			Commands:
			  wrangler kv:namespace create <namespace>  Create a new namespace
			  wrangler kv:namespace list                Outputs a list of all KV namespaces associated with your account id.
			  wrangler kv:namespace delete              Deletes a given namespace.

			Flags:
			  -c, --config   Path to .toml configuration file  [string]
			  -e, --env      Environment to use for operations and .env files  [string]
			  -h, --help     Show help  [boolean]
			  -v, --version  Show version number  [boolean]"
		`);
		});

		it("no subcommand 'kv:key' should display a list of available subcommands", async () => {
			await runWrangler("kv:key");
			await endEventLoop();
			expect(std.out).toMatchInlineSnapshot(`
			"wrangler kv:key

			🔑 Individually manage Workers KV key-value pairs

			Commands:
			  wrangler kv:key put <key> [value]  Writes a single key/value pair to the given namespace.
			  wrangler kv:key list               Outputs a list of all keys in a given namespace.
			  wrangler kv:key get <key>          Reads a single value by key from the given namespace.
			  wrangler kv:key delete <key>       Removes a single key value pair from the given namespace.

			Flags:
			  -c, --config   Path to .toml configuration file  [string]
			  -e, --env      Environment to use for operations and .env files  [string]
			  -h, --help     Show help  [boolean]
			  -v, --version  Show version number  [boolean]"
		`);
		});

		it("no subcommand 'kv:bulk' should display a list of available subcommands", async () => {
			await runWrangler("kv:bulk");
			await endEventLoop();
			expect(std.out).toMatchInlineSnapshot(`
			"wrangler kv:bulk

			💪 Interact with multiple Workers KV key-value pairs at once

			Commands:
			  wrangler kv:bulk put <filename>     Upload multiple key-value pairs to a namespace
			  wrangler kv:bulk delete <filename>  Delete multiple key-value pairs from a namespace

			Flags:
			  -c, --config   Path to .toml configuration file  [string]
			  -e, --env      Environment to use for operations and .env files  [string]
			  -h, --help     Show help  [boolean]
			  -v, --version  Show version number  [boolean]"
		`);
		});

		it("no subcommand 'r2' should display a list of available subcommands", async () => {
			await runWrangler("r2");
			await endEventLoop();
			expect(std.out).toMatchInlineSnapshot(`
			"wrangler r2

			📦 Interact with an R2 store

			Commands:
			  wrangler r2 object  Manage R2 objects
			  wrangler r2 bucket  Manage R2 buckets

			Flags:
			  -c, --config   Path to .toml configuration file  [string]
			  -e, --env      Environment to use for operations and .env files  [string]
			  -h, --help     Show help  [boolean]
			  -v, --version  Show version number  [boolean]"
		`);
		});
	});

	it("should print a deprecation message for 'build' and then try to run `publish --dry-run --outdir`", async () => {
		writeWranglerToml({
			main: "index.js",
		});
		writeWorkerSource();
		await runWrangler("build");
		await endEventLoop();
		expect(std.out).toMatchInlineSnapshot(`
		"[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mDeprecation: \`wrangler build\` has been deprecated.[0m

		  Please refer to [4mhttps://developers.cloudflare.com/workers/wrangler/migration/deprecations/#build[0m
		  for more information.
		  Attempting to run \`wrangler publish --dry-run --outdir=dist\` for you instead:


		Total Upload: xx KiB / gzip: xx KiB
		--dry-run: exiting now."
	`);
	});
});

function endEventLoop() {
	return new Promise((resolve) => setImmediate(resolve));
}
