import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { render, Text } from "ink";
import Spinner from "ink-spinner";
import { getType } from "mime";
import { Minimatch } from "minimatch";
import PQueue from "p-queue";
import prettyBytes from "pretty-bytes";
import React from "react";
import { fetchResult } from "../cfetch";
import { FatalError } from "../errors";
import isInteractive from "../is-interactive";
import { logger } from "../logger";
import {
	MAX_ASSET_COUNT,
	MAX_ASSET_SIZE,
	BULK_UPLOAD_CONCURRENCY,
	MAX_BUCKET_FILE_COUNT,
	MAX_BUCKET_SIZE,
	MAX_CHECK_MISSING_ATTEMPTS,
	MAX_UPLOAD_ATTEMPTS,
} from "./constants";
import { hashFile } from "./hash";
import { pagesBetaWarning } from "./utils";
import type { YargsOptionsToInterface } from "../yargs-types";
import type { UploadPayloadFile } from "./types";
import type { Argv } from "yargs";

type UploadArgs = YargsOptionsToInterface<typeof Options>;

export function Options(yargs: Argv) {
	return yargs
		.positional("directory", {
			type: "string",
			demandOption: true,
			description: "The directory of static files to upload",
		})
		.options({
			"output-manifest-path": {
				type: "string",
				description: "The name of the project you want to deploy to",
			},
		})
		.epilogue(pagesBetaWarning);
}

export const Handler = async ({
	directory,
	outputManifestPath,
}: UploadArgs) => {
	if (!directory) {
		throw new FatalError("Must specify a directory.", 1);
	}

	if (!process.env.CF_PAGES_UPLOAD_JWT) {
		throw new FatalError("No JWT given.", 1);
	}

	const manifest = await upload({
		directory,
		jwt: process.env.CF_PAGES_UPLOAD_JWT,
	});

	if (outputManifestPath) {
		await mkdir(dirname(outputManifestPath), { recursive: true });
		await writeFile(outputManifestPath, JSON.stringify(manifest));
	}

	logger.log(`✨ Upload complete!`);
};

export const upload = async (
	args:
		| {
				directory: string;
				jwt: string;
		  }
		| { directory: string; accountId: string; projectName: string }
) => {
	async function fetchJwt(): Promise<string> {
		if ("jwt" in args) {
			return args.jwt;
		} else {
			return (
				await fetchResult<{ jwt: string }>(
					`/accounts/${args.accountId}/pages/projects/${args.projectName}/upload-token`
				)
			).jwt;
		}
	}

	type FileContainer = {
		path: string;
		contentType: string;
		sizeInBytes: number;
		hash: string;
	};

	const IGNORE_LIST = [
		"_worker.js",
		"_redirects",
		"_headers",
		"_routes.json",
		"functions",
		"**/.DS_Store",
		"**/node_modules",
		"**/.git",
	].map((pattern) => new Minimatch(pattern));

	const directory = resolve(args.directory);

	// TODO(future): Use this to more efficiently load files in and speed up uploading
	// Limit memory to 1 GB unless more is specified
	// let maxMemory = 1_000_000_000;
	// if (process.env.NODE_OPTIONS && (process.env.NODE_OPTIONS.includes('--max-old-space-size=') || process.env.NODE_OPTIONS.includes('--max_old_space_size='))) {
	// 	const parsed = parser(process.env.NODE_OPTIONS);
	// 	maxMemory = (parsed['max-old-space-size'] ? parsed['max-old-space-size'] : parsed['max_old_space_size']) * 1000 * 1000; // Turn MB into bytes
	// }

	const walk = async (
		dir: string,
		fileMap: Map<string, FileContainer> = new Map(),
		startingDir: string = dir
	) => {
		const files = await readdir(dir);

		await Promise.all(
			files.map(async (file) => {
				const filepath = join(dir, file);
				const relativeFilepath = relative(startingDir, filepath);
				const filestat = await stat(filepath);

				for (const minimatch of IGNORE_LIST) {
					if (minimatch.match(relativeFilepath)) {
						return;
					}
				}

				if (filestat.isSymbolicLink()) {
					return;
				}

				if (filestat.isDirectory()) {
					fileMap = await walk(filepath, fileMap, startingDir);
				} else {
					const name = relativeFilepath.split(sep).join("/");

					if (filestat.size > MAX_ASSET_SIZE) {
						throw new FatalError(
							`Error: Pages only supports files up to ${prettyBytes(
								MAX_ASSET_SIZE
							)} in size\n${name} is ${prettyBytes(filestat.size)} in size`,
							1
						);
					}

					// We don't want to hold the content in memory. We instead only want to read it when it's needed
					fileMap.set(name, {
						path: filepath,
						contentType: getType(name) || "application/octet-stream",
						sizeInBytes: filestat.size,
						hash: hashFile(filepath),
					});
				}
			})
		);

		return fileMap;
	};

	const fileMap = await walk(directory);

	if (fileMap.size > MAX_ASSET_COUNT) {
		throw new FatalError(
			`Error: Pages only supports up to ${MAX_ASSET_COUNT.toLocaleString()} files in a deployment. Ensure you have specified your build output directory correctly.`,
			1
		);
	}

	const files = [...fileMap.values()];

	let jwt = await fetchJwt();

	const start = Date.now();

	let attempts = 0;
	const getMissingHashes = async (): Promise<string[]> => {
		try {
			return await fetchResult<string[]>(`/pages/assets/check-missing`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${jwt}`,
				},
				body: JSON.stringify({
					hashes: files.map(({ hash }) => hash),
				}),
			});
		} catch (e) {
			if (attempts < MAX_CHECK_MISSING_ATTEMPTS) {
				// Exponential backoff, 1 second first time, then 2 second, then 4 second etc.
				await new Promise((resolvePromise) =>
					setTimeout(resolvePromise, Math.pow(2, attempts++) * 1000)
				);

				if ((e as { code: number }).code === 8000013) {
					// Looks like the JWT expired, fetch another one
					jwt = await fetchJwt();
				}
				return getMissingHashes();
			} else {
				throw e;
			}
		}
	};
	const missingHashes = await getMissingHashes();

	const sortedFiles = files
		.filter((file) => missingHashes.includes(file.hash))
		.sort((a, b) => b.sizeInBytes - a.sizeInBytes);

	// Start with a few buckets so small projects still get
	// the benefit of multiple upload streams
	const buckets: {
		files: FileContainer[];
		remainingSize: number;
	}[] = new Array(BULK_UPLOAD_CONCURRENCY).fill(null).map(() => ({
		files: [],
		remainingSize: MAX_BUCKET_SIZE,
	}));

	let bucketOffset = 0;
	for (const file of sortedFiles) {
		let inserted = false;

		for (let i = 0; i < buckets.length; i++) {
			// Start at a different bucket for each new file
			const bucket = buckets[(i + bucketOffset) % buckets.length];
			if (
				bucket.remainingSize >= file.sizeInBytes &&
				bucket.files.length < MAX_BUCKET_FILE_COUNT
			) {
				bucket.files.push(file);
				bucket.remainingSize -= file.sizeInBytes;
				inserted = true;
				break;
			}
		}

		if (!inserted) {
			buckets.push({
				files: [file],
				remainingSize: MAX_BUCKET_SIZE - file.sizeInBytes,
			});
		}
		bucketOffset++;
	}

	let counter = fileMap.size - sortedFiles.length;
	const { rerender, unmount } = render(
		<Progress done={counter} total={fileMap.size} />
	);

	const queue = new PQueue({ concurrency: BULK_UPLOAD_CONCURRENCY });

	for (const bucket of buckets) {
		// Don't upload empty buckets (can happen for tiny projects)
		if (bucket.files.length === 0) continue;

		attempts = 0;
		const doUpload = async (): Promise<void> => {
			// Populate the payload only when actually uploading (this is limited to 3 concurrent uploads at 50 MiB per bucket meaning we'd only load in a max of ~150 MiB)
			// This is so we don't run out of memory trying to upload the files.
			const payload: UploadPayloadFile[] = await Promise.all(
				bucket.files.map(async (file) => ({
					key: file.hash,
					value: (await readFile(file.path)).toString("base64"),
					metadata: {
						contentType: file.contentType,
					},
					base64: true,
				}))
			);

			try {
				return await fetchResult(`/pages/assets/upload`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${jwt}`,
					},
					body: JSON.stringify(payload),
				});
			} catch (e) {
				if (attempts < MAX_UPLOAD_ATTEMPTS) {
					// Exponential backoff, 1 second first time, then 2 second, then 4 second etc.
					await new Promise((resolvePromise) =>
						setTimeout(resolvePromise, Math.pow(2, attempts++) * 1000)
					);

					if ((e as { code: number }).code === 8000013 || isJwtExpired(jwt)) {
						// Looks like the JWT expired, fetch another one
						jwt = await fetchJwt();
					}
					return doUpload();
				} else {
					throw e;
				}
			}
		};

		queue.add(() =>
			doUpload().then(
				() => {
					counter += bucket.files.length;
					rerender(<Progress done={counter} total={fileMap.size} />);
				},
				(error) => {
					return Promise.reject(
						new FatalError(
							`Failed to upload files. Please try again. Error: ${JSON.stringify(
								error
							)})`,
							error.code || 1
						)
					);
				}
			)
		);
	}

	await queue.onIdle();

	unmount();

	const uploadMs = Date.now() - start;

	const skipped = fileMap.size - missingHashes.length;
	const skippedMessage = skipped > 0 ? `(${skipped} already uploaded) ` : "";

	logger.log(
		`✨ Success! Uploaded ${
			sortedFiles.length
		} files ${skippedMessage}${formatTime(uploadMs)}\n`
	);

	const doUpsertHashes = async (): Promise<void> => {
		try {
			return await fetchResult(`/pages/assets/upsert-hashes`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${jwt}`,
				},
				body: JSON.stringify({
					hashes: files.map(({ hash }) => hash),
				}),
			});
		} catch (e) {
			await new Promise((resolvePromise) => setTimeout(resolvePromise, 1000));

			if ((e as { code: number }).code === 8000013 || isJwtExpired(jwt)) {
				// Looks like the JWT expired, fetch another one
				jwt = await fetchJwt();
			}

			return await fetchResult(`/pages/assets/upsert-hashes`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${jwt}`,
				},
				body: JSON.stringify({
					hashes: files.map(({ hash }) => hash),
				}),
			});
		}
	};

	try {
		await doUpsertHashes();
	} catch {
		logger.warn(
			"Failed to update file hashes. Every upload appeared to succeed for this deployment, but you might need to re-upload for future deployments. This shouldn't have any impact other than slowing the upload speed of your next deployment."
		);
	}

	return Object.fromEntries(
		[...fileMap.entries()].map(([fileName, file]) => [
			`/${fileName}`,
			file.hash,
		])
	);
};

// Decode and check that the current JWT has not expired
function isJwtExpired(token: string): boolean | undefined {
	try {
		const decodedJwt = JSON.parse(
			Buffer.from(token.split(".")[1], "base64").toString()
		);

		const dateNow = new Date().getTime() / 1000;

		return decodedJwt.exp <= dateNow;
	} catch (e) {
		if (e instanceof Error) {
			throw new Error(`Invalid token: ${e.message}`);
		}
	}
}

function formatTime(duration: number) {
	return `(${(duration / 1000).toFixed(2)} sec)`;
}

function Progress({ done, total }: { done: number; total: number }) {
	return (
		<>
			<Text>
				{isInteractive() ? <Spinner type="earth" /> : null}
				{` Uploading... (${done}/${total})\n`}
			</Text>
		</>
	);
}
