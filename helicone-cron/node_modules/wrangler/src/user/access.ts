import { spawnSync } from "child_process";
import { fetch } from "undici";
import { logger } from "../logger";

const cache: Record<string, string> = {};

const usesAccessCache = new Map();

export async function domainUsesAccess(domain: string): Promise<boolean> {
	logger.debug("Checking if domain has Access enabled:", domain);

	if (usesAccessCache.has(domain)) {
		logger.debug(
			"Using cached Access switch for:",
			domain,
			usesAccessCache.get(domain)
		);
		return usesAccessCache.get(domain);
	}
	logger.debug("Access switch not cached for:", domain);
	try {
		const controller = new AbortController();
		const cancel = setTimeout(() => {
			logger.debug("Timed out");
			controller.abort();
		}, 1000);

		const output = await fetch(`https://${domain}`, {
			redirect: "manual",
			signal: controller.signal,
		});
		clearTimeout(cancel);
		const usesAccess = !!(
			output.status === 302 &&
			output.headers.get("location")?.includes("cloudflareaccess.com")
		);
		logger.debug("Caching access switch for:", domain);

		usesAccessCache.set(domain, usesAccess);
		return usesAccess;
	} catch (e) {
		usesAccessCache.set(domain, false);
		return false;
	}
}
export async function getAccessToken(
	domain: string
): Promise<string | undefined> {
	if (!(await domainUsesAccess(domain))) {
		return undefined;
	}
	if (cache[domain]) {
		return cache[domain];
	}
	const output = await spawnSync("cloudflared", ["access", "login", domain]);
	if (output.error) {
		// The cloudflared binary is not installed
		throw new Error(
			"To use Wrangler with Cloudflare Access, please install `cloudflared` from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation"
		);
	}
	const stringOutput = output.stdout.toString();
	const matches = stringOutput.match(/fetched your token:\n\n(.*)/m);
	if (matches && matches.length >= 2) {
		cache[domain] = matches[1];
		return matches[1];
	}
	throw new Error("Failed to authenticate with Cloudflare Access");
}
