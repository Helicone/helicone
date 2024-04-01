import * as fs from "node:fs";
import os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";
import { getGlobalWranglerConfigPath } from "./global-wrangler-config-path";
import { logger } from "./logger";
import type { Attributes, Options } from "selfsigned";

// Most of this file has been borrowed from the implementation in Miniflare.
// See https://github.com/cloudflare/miniflare/blob/870b401ef5/packages/http-server/src/plugin.ts#L313-L397
// Thanks @mrbbot.
const CERT_EXPIRY_DAYS = 30;
const ONE_DAY_IN_MS = 86400000;

/**
 * Get the options (i.e. SSL certificates) for running an HTTPS server.
 *
 * The certificates are self-signed and generated locally, and cached in the `CERT_ROOT` directory.
 */
export async function getHttpsOptions() {
	const certDirectory = path.join(getGlobalWranglerConfigPath(), "local-cert");
	const keyPath = path.join(certDirectory, "key.pem");
	const certPath = path.join(certDirectory, "cert.pem");

	const regenerate =
		!fs.existsSync(keyPath) ||
		!fs.existsSync(certPath) ||
		hasCertificateExpired(keyPath, certPath);

	if (regenerate) {
		logger.log("Generating new self-signed certificate...");
		const { key, cert } = await generateCertificate();
		try {
			// Write certificate files so we can reuse them later.
			fs.mkdirSync(certDirectory, { recursive: true });
			fs.writeFileSync(keyPath, key, "utf8");
			fs.writeFileSync(certPath, cert, "utf8");
		} catch (e) {
			const message = e instanceof Error ? e.message : `${e}`;
			logger.warn(
				`Unable to cache generated self-signed certificate in ${path.relative(
					process.cwd(),
					certDirectory
				)}.\n${message}`
			);
		}
		return { key, cert };
	} else {
		return {
			key: fs.readFileSync(keyPath, "utf8"),
			cert: fs.readFileSync(certPath, "utf8"),
		};
	}
}

/**
 * Determine if the certificate defined in `keyPath` and `certPath` files
 * have expired based on the date when they were last modified.
 */
function hasCertificateExpired(keyPath: string, certPath: string): boolean {
	const keyStat = fs.statSync(keyPath);
	const certStat = fs.statSync(certPath);
	const created = Math.max(keyStat.mtimeMs, certStat.mtimeMs);
	return Date.now() - created > (CERT_EXPIRY_DAYS - 2) * ONE_DAY_IN_MS;
}

/**
 * Generate a new self-signed certificate and cache it in `CERT_ROOT` directory.
 */
async function generateCertificate() {
	// `selfsigned` imports `node-forge`, which is a pretty big library.
	// To reduce startup time, only load this dynamically when needed.
	// eslint-disable-next-line @typescript-eslint/consistent-type-imports
	const generate: typeof import("selfsigned").generate = promisify(
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		require("selfsigned").generate
	);

	const certAttrs: Attributes = [{ name: "commonName", value: "localhost" }];

	const certOptions: Options = {
		algorithm: "sha256",
		days: CERT_EXPIRY_DAYS,
		keySize: 2048,
		extensions: [
			{ name: "basicConstraints", cA: true },
			{
				name: "keyUsage",
				keyCertSign: true,
				digitalSignature: true,
				nonRepudiation: true,
				keyEncipherment: true,
				dataEncipherment: true,
			},
			{
				name: "extKeyUsage",
				serverAuth: true,
				clientAuth: true,
				codeSigning: true,
				timeStamping: true,
			},
			{
				name: "subjectAltName",
				altNames: [
					{ type: 2, value: "localhost" },
					...getAccessibleHosts().map((ip) => ({ type: 7, ip })),
				],
			},
		],
	};

	const { private: key, cert } = await generate(certAttrs, certOptions);
	return { key, cert };
}

/**
 * Ask the OS for the addresses of locally accessible hosts.
 */
function getAccessibleHosts(ipv4 = false): string[] {
	const hosts: string[] = [];
	Object.values(os.networkInterfaces()).forEach((net) =>
		net?.forEach(({ family, address }) => {
			if (!ipv4 || family === "IPv4") hosts.push(address);
		})
	);
	return hosts;
}
