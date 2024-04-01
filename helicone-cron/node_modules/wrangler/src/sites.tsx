import assert from "node:assert";
import { readdir, readFile, stat } from "node:fs/promises";
import * as path from "node:path";
import ignore from "ignore";
import xxhash from "xxhash-wasm";
import {
	createKVNamespace,
	listKVNamespaceKeys,
	listKVNamespaces,
	putKVBulkKeyValue,
	deleteKVBulkKeyValue,
} from "./kv/helpers";
import { logger } from "./logger";
import type { Config } from "./config";
import type { KeyValue } from "./kv/helpers";
import type { XXHashAPI } from "xxhash-wasm";

/** Paths to always ignore. */
const ALWAYS_IGNORE = new Set(["node_modules"]);
const HIDDEN_FILES_TO_INCLUDE = new Set([
	".well-known", // See https://datatracker.ietf.org/doc/html/rfc8615
]);

async function* getFilesInFolder(dirPath: string): AsyncIterable<string> {
	const files = await readdir(dirPath, { withFileTypes: true });
	for (const file of files) {
		// Skip files that we never want to process.
		if (ALWAYS_IGNORE.has(file.name)) {
			continue;
		}
		// Skip hidden files (starting with .) except for some special ones
		if (file.name.startsWith(".") && !HIDDEN_FILES_TO_INCLUDE.has(file.name)) {
			continue;
		}
		// TODO: follow symlinks??
		if (file.isDirectory()) {
			yield* await getFilesInFolder(path.join(dirPath, file.name));
		} else {
			yield path.join(dirPath, file.name);
		}
	}
}

/**
 * Create a hash key for the given content using the xxhash algorithm.
 *
 * Note we only return the first 10 characters, since we will also include the file name in the asset manifest key
 * the most important thing here is to detect changes of a single file to invalidate the cache and
 * it's impossible to serve two different files with the same name
 */
function hashFileContent(hasher: XXHashAPI, content: string): string {
	return hasher.h64ToString(content).substring(0, 10);
}

/**
 * Create a hashed asset key for the given asset.
 *
 * The key will change if the file path or content of the asset changes.
 * The algorithm used here matches that of Wrangler 1.
 */
function hashAsset(
	hasher: XXHashAPI,
	filePath: string,
	content: string
): string {
	const extName = path.extname(filePath) || "";
	const baseName = path.basename(filePath, extName);
	const directory = path.dirname(filePath);
	const hash = hashFileContent(hasher, content);
	return urlSafe(path.join(directory, `${baseName}.${hash}${extName}`));
}

async function createKVNamespaceIfNotAlreadyExisting(
	title: string,
	accountId: string
) {
	// check if it already exists
	// TODO: this is super inefficient, should be made better
	const namespaces = await listKVNamespaces(accountId);
	const found = namespaces.find((ns) => ns.title === title);
	if (found) {
		return { created: false, id: found.id };
	}

	// else we make the namespace
	const id = await createKVNamespace(accountId, title);
	logger.log(`🌀 Created namespace for Workers Site "${title}"`);

	return {
		created: true,
		id,
	};
}

/**
 * Upload the assets found within the `dirPath` directory to the sites assets KV namespace for
 * the worker given by `scriptName`.
 *
 * @param accountId the account to upload to.
 * @param scriptName the name of the worker whose assets we are uploading.
 * @param siteAssets an objects describing what assets to upload, or undefined if there are no assets to upload.
 * @param preview if true then upload to a "preview" KV namespace.
 * @returns a promise for an object mapping the relative paths of the assets to the key of that
 * asset in the KV namespace.
 */
export async function syncAssets(
	accountId: string | undefined,
	scriptName: string,
	siteAssets: AssetPaths | undefined,
	preview: boolean,
	dryRun: boolean | undefined
): Promise<{
	manifest: { [filePath: string]: string } | undefined;
	namespace: string | undefined;
}> {
	if (siteAssets === undefined) {
		return { manifest: undefined, namespace: undefined };
	}

	if (dryRun) {
		logger.log("(Note: doing a dry run, not uploading or deleting anything.)");
		return { manifest: undefined, namespace: undefined };
	}
	assert(accountId, "Missing accountId");

	const title = `__${scriptName}-workers_sites_assets${
		preview ? "_preview" : ""
	}`;

	const { id: namespace } = await createKVNamespaceIfNotAlreadyExisting(
		title,
		accountId
	);

	// let's get all the keys in this namespace
	const namespaceKeysResponse = await listKVNamespaceKeys(accountId, namespace);
	const namespaceKeys = new Set(namespaceKeysResponse.map((x) => x.name));

	const manifest: Record<string, string> = {};

	// A batch of uploads where each bucket has to be less than 98mb
	const uploadBuckets: KeyValue[][] = [];
	// The "live" bucket that we'll keep filling until it's just below 98mb
	let uploadBucket: KeyValue[] = [];
	// A size counter for the live bucket
	let uploadBucketSize = 0;

	const include = createPatternMatcher(siteAssets.includePatterns, false);
	const exclude = createPatternMatcher(siteAssets.excludePatterns, true);
	const hasher = await xxhash();

	const assetDirectory = path.join(
		siteAssets.baseDirectory,
		siteAssets.assetDirectory
	);
	for await (const absAssetFile of getFilesInFolder(assetDirectory)) {
		const assetFile = path.relative(assetDirectory, absAssetFile);
		if (!include(assetFile)) {
			continue;
		}
		if (exclude(assetFile)) {
			continue;
		}

		logger.log(`Reading ${assetFile}...`);
		const content = await readFile(absAssetFile, "base64");
		await validateAssetSize(absAssetFile, assetFile);
		// while KV accepts files that are 25 MiB **before** b64 encoding
		// the overall bucket size must be below 100 MB **after** b64 encoding
		const assetSize = Buffer.from(content).length;
		const assetKey = hashAsset(hasher, assetFile, content);
		validateAssetKey(assetKey);

		// now put each of the files into kv
		if (!namespaceKeys.has(assetKey)) {
			logger.log(`Uploading as ${assetKey}...`);

			// Check if adding this asset to the bucket would
			// push it over the 98 MiB limit KV bulk API limit
			if (uploadBucketSize + assetSize > 98 * 1000 * 1000) {
				// If so, move the current bucket into the batch,
				// and reset the counter/bucket
				uploadBuckets.push(uploadBucket);
				uploadBucketSize = 0;
				uploadBucket = [];
			}

			// Update the bucket and the size counter
			uploadBucketSize += assetSize;
			uploadBucket.push({
				key: assetKey,
				value: content,
				base64: true,
			});
		} else {
			logger.log(`Skipping - already uploaded.`);
		}

		// Remove the key from the set so we know what we've already uploaded
		namespaceKeys.delete(assetKey);

		// Prevent different manifest keys on windows
		const manifestKey = urlSafe(path.relative(assetDirectory, absAssetFile));
		manifest[manifestKey] = assetKey;
	}

	// Add the last (potentially only) bucket to the batch
	uploadBuckets.push(uploadBucket);

	// keys now contains all the files we're deleting
	for (const key of namespaceKeys) {
		logger.log(`Deleting ${key} from the asset store...`);
	}

	// upload each bucket in parallel
	const bucketsToPut = [];
	for (const bucket of uploadBuckets) {
		bucketsToPut.push(putKVBulkKeyValue(accountId, namespace, bucket));
	}
	await Promise.all(bucketsToPut);

	// then delete all the assets that aren't used anymore
	await deleteKVBulkKeyValue(accountId, namespace, Array.from(namespaceKeys));

	logger.log("↗️  Done syncing assets");

	return { manifest, namespace };
}

function createPatternMatcher(
	patterns: string[],
	exclude: boolean
): (filePath: string) => boolean {
	if (patterns.length === 0) {
		return (_filePath) => !exclude;
	} else {
		const ignorer = ignore().add(patterns);
		return (filePath) => ignorer.test(filePath).ignored;
	}
}

/**
 * validate that the passed-in file is below 25 MiB
 * **PRIOR** to base64 encoding. 25 MiB is a KV limit
 * @param absFilePath
 * @param relativeFilePath
 */
async function validateAssetSize(
	absFilePath: string,
	relativeFilePath: string
): Promise<void> {
	const { size } = await stat(absFilePath);
	if (size > 25 * 1024 * 1024) {
		throw new Error(
			`File ${relativeFilePath} is too big, it should be under 25 MiB. See https://developers.cloudflare.com/workers/platform/limits#kv-limits`
		);
	}
}

function validateAssetKey(assetKey: string) {
	if (assetKey.length > 512) {
		throw new Error(
			`The asset path key "${assetKey}" exceeds the maximum key size limit of 512. See https://developers.cloudflare.com/workers/platform/limits#kv-limits",`
		);
	}
}

/**
 * Convert a filePath to be safe to use as a relative URL.
 *
 * Primarily this involves converting Windows backslashes to forward slashes.
 */
function urlSafe(filePath: string): string {
	return filePath.replace(/\\/g, "/");
}

/**
 * Information about the assets that should be uploaded
 */
export interface AssetPaths {
	/**
	 * Absolute path to the root of the project.
	 *
	 * This is the directory containing wrangler.toml or cwd if no config.
	 */
	baseDirectory: string;
	/**
	 * The path to the assets directory, relative to the `baseDirectory`.
	 */
	assetDirectory: string;
	/**
	 * An array of patterns that match files that should be uploaded.
	 */
	includePatterns: string[];
	/**
	 * An array of patterns that match files that should not be uploaded.
	 */
	excludePatterns: string[];
}

/**
 * Get an object that describes what assets to upload, if any.
 *
 * Uses the args (passed from the command line) if available,
 * falling back to those defined in the config.
 *
 * (This function corresponds to --assets/config.assets)
 *
 */
export function getAssetPaths(
	config: Config,
	assetDirectory: string | undefined
): AssetPaths | undefined {
	const baseDirectory = assetDirectory
		? process.cwd()
		: path.resolve(path.dirname(config.configPath ?? "wrangler.toml"));

	assetDirectory ??=
		typeof config.assets === "string"
			? config.assets
			: config.assets !== undefined
			? config.assets.bucket
			: undefined;

	const includePatterns =
		(typeof config.assets !== "string" && config.assets?.include) || [];

	const excludePatterns =
		(typeof config.assets !== "string" && config.assets?.exclude) || [];

	return assetDirectory
		? {
				baseDirectory,
				assetDirectory,
				includePatterns,
				excludePatterns,
		  }
		: undefined;
}

/**
 * Get an object that describes what site assets to upload, if any.
 *
 * Uses the args (passed from the command line) if available,
 * falling back to those defined in the config.
 *
 * (This function corresponds to --site/config.site)
 *
 */
export function getSiteAssetPaths(
	config: Config,
	assetDirectory?: string,
	includePatterns = config.site?.include ?? [],
	excludePatterns = config.site?.exclude ?? []
): AssetPaths | undefined {
	const baseDirectory = assetDirectory
		? process.cwd()
		: path.resolve(path.dirname(config.configPath ?? "wrangler.toml"));

	assetDirectory ??= config.site?.bucket;

	if (assetDirectory) {
		return {
			baseDirectory,
			assetDirectory,
			includePatterns,
			excludePatterns,
		};
	} else {
		return undefined;
	}
}
