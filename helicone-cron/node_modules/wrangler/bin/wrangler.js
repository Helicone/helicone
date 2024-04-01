#!/usr/bin/env node
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const MIN_NODE_VERSION = "16.13.0";
const debug =
	process.env["WRANGLER_LOG"] === "debug"
		? (...args) => console.log(...args)
		: () => {};

let wranglerProcess;

/**
 * Executes ../wrangler-dist/cli.js
 */
function runWrangler() {
	if (semiver(process.versions.node, MIN_NODE_VERSION) < 0) {
		// Note Volta and nvm are also recommended in the official docs:
		// https://developers.cloudflare.com/workers/get-started/guide#2-install-the-workers-cli
		console.error(
			`Wrangler requires at least node.js v${MIN_NODE_VERSION}. You are using v${process.versions.node}. Please update your version of node.js.

Consider using a Node.js version manager such as https://volta.sh/ or https://github.com/nvm-sh/nvm.`
		);
		process.exitCode = 1;
		return;
	}

	let pathToCACerts = process.env.NODE_EXTRA_CA_CERTS;
	if (pathToCACerts) {
		// TODO:
		// - should we log a warning here?
		// - maybe we can generate a certificate that concatenates with ours?
		//
		//  I do think it'll be rare that someone wants to add a cert AND
		//  use Cloudflare WARP, but let's wait till the situation actually
		//  arises before we do anything about it
	} else {
		const osTempDir = os.tmpdir();
		const certDir = path.join(osTempDir, "wrangler-cert");
		const certPath = path.join(certDir, "Cloudflare_CA.pem");
		// copy cert to the system temp dir if needed
		if (!fs.existsSync(certPath)) {
			fs.mkdirSync(certDir, { recursive: true });
			fs.writeFileSync(
				certPath,
				fs.readFileSync(path.join(__dirname, "../Cloudflare_CA.pem"), "utf-8")
			);
		}
		pathToCACerts = certPath;
	}

	return spawn(
		process.execPath,
		[
			"--no-warnings",
			"--experimental-vm-modules",
			...process.execArgv,
			path.join(__dirname, "../wrangler-dist/cli.js"),
			...process.argv.slice(2),
		],
		{
			stdio: ["inherit", "inherit", "inherit", "ipc"],
			env: {
				...process.env,
				NODE_EXTRA_CA_CERTS: pathToCACerts,
			},
		}
	)
		.on("exit", (code) =>
			process.exit(code === undefined || code === null ? 0 : code)
		)
		.on("message", (message) => {
			if (process.send) {
				process.send(message);
			}
		});
}

/**
 * Runs a locally-installed version of wrangler, delegating from this version.
 * @throws {MODULE_NOT_FOUND} if there isn't a locally installed version of wrangler.
 */
function runDelegatedWrangler() {
	const packageJsonPath = require.resolve("wrangler/package.json", {
		paths: [process.cwd()],
	});
	const {
		bin: { wrangler: binaryPath },
		version,
	} = JSON.parse(fs.readFileSync(packageJsonPath));
	const resolvedBinaryPath = path.resolve(packageJsonPath, "..", binaryPath);

	debug(`Delegating to locally-installed version of wrangler @ v${version}`);

	// this call to `spawn` is simpler because the delegated version will do all
	// of the other work.
	return spawn(
		process.execPath,
		[resolvedBinaryPath, ...process.argv.slice(2)],
		{
			stdio: ["inherit", "inherit", "inherit", "ipc"],
		}
	)
		.on("exit", (code) =>
			process.exit(code === undefined || code === null ? 0 : code)
		)
		.on("message", (message) => {
			if (process.send) {
				process.send(message);
			}
		});
}

/**
 * Indicates if this invocation of `wrangler` should delegate
 * to a locally-installed version.
 */
function shouldDelegate() {
	try {
		// `require.resolve` will throw if it can't find
		// a locally-installed version of `wrangler`
		const delegatedPackageJson = require.resolve("wrangler/package.json", {
			paths: [process.cwd()],
		});
		const thisPackageJson = path.resolve(__dirname, "..", "package.json");
		// if it's the same path, then we're already a local install -- no need to delegate
		return thisPackageJson !== delegatedPackageJson;
	} catch (e) {
		// there's no local version to delegate to -- `require.resolve` threw
		return false;
	}
}

async function main() {
	wranglerProcess = shouldDelegate() ? runDelegatedWrangler() : runWrangler();
}

process.on("SIGINT", () => {
	wranglerProcess && wranglerProcess.kill();
});
process.on("SIGTERM", () => {
	wranglerProcess && wranglerProcess.kill();
});

// semiver implementation via https://github.com/lukeed/semiver/blob/ae7eebe6053c96be63032b14fb0b68e2553fcac4/src/index.js

/**
MIT License

Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

var fn = new Intl.Collator(0, { numeric: 1 }).compare;

function semiver(a, b, bool) {
	a = a.split(".");
	b = b.split(".");

	return (
		fn(a[0], b[0]) ||
		fn(a[1], b[1]) ||
		((b[2] = b.slice(2).join(".")),
		(bool = /[.-]/.test((a[2] = a.slice(2).join(".")))),
		bool == /[.-]/.test(b[2]) ? fn(a[2], b[2]) : bool ? -1 : 1)
	);
}

// end semiver implementation

void main();
