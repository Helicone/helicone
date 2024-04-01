import { Blob } from "node:buffer";
import { gzipSync } from "node:zlib";
import { logger } from "./logger";
import type { CfModule } from "./worker";
import type { Metafile } from "esbuild";

const ONE_KIB_BYTES = 1024;
const ONE_MIB_BYTES = ONE_KIB_BYTES * 1024;

async function getSize(modules: CfModule[]) {
	const gzipSize = gzipSync(
		await new Blob(modules.map((file) => file.content)).arrayBuffer()
	).byteLength;
	const aggregateSize = new Blob(modules.map((file) => file.content)).size;

	return { size: aggregateSize, gzipSize };
}

export async function printBundleSize(
	main: {
		name: string;
		content: string;
	},
	modules: CfModule[]
) {
	const { size, gzipSize } = await getSize([...modules, main]);

	const bundleReport = `${(size / ONE_KIB_BYTES).toFixed(2)} KiB / gzip: ${(
		gzipSize / ONE_KIB_BYTES
	).toFixed(2)} KiB`;

	logger.log(`Total Upload: ${bundleReport}`);

	if (gzipSize > ONE_MIB_BYTES && !process.env.NO_SCRIPT_SIZE_WARNING) {
		logger.warn(
			"We recommend keeping your script less than 1MiB (1024 KiB) after gzip. Exceeding past this can affect cold start time"
		);
	}
}

export function printOffendingDependencies(
	dependencies: Metafile["outputs"][string]["inputs"]
) {
	const warning: string[] = [];

	const dependenciesSorted = Object.entries(dependencies);
	dependenciesSorted.sort(
		([_adep, aData], [_bdep, bData]) =>
			bData.bytesInOutput - aData.bytesInOutput
	);
	const topLargest = dependenciesSorted.slice(0, 5);

	if (topLargest.length > 0) {
		warning.push(
			`Here are the ${topLargest.length} largest dependencies included in your script:`
		);

		for (const [dep, data] of topLargest) {
			warning.push(
				`- ${dep} - ${(data.bytesInOutput / ONE_KIB_BYTES).toFixed(2)} KiB`
			);
		}

		warning.push("If these are unnecessary, consider removing them");

		logger.warn(warning.join("\n"));
	}
}
