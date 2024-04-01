import type { DevProps } from "./dev";

export function validateDevProps(props: DevProps) {
	if (
		!props.isWorkersSite &&
		props.assetPaths &&
		props.entry.format === "service-worker"
	) {
		throw new Error(
			"You cannot use the service-worker format with an `assets` directory yet. For information on how to migrate to the module-worker format, see: https://developers.cloudflare.com/workers/learning/migrating-to-module-workers/"
		);
	}

	if (props.bindings.wasm_modules && props.entry.format === "modules") {
		throw new Error(
			"You cannot configure [wasm_modules] with an ES module worker. Instead, import the .wasm module directly in your code"
		);
	}

	if (props.bindings.text_blobs && props.entry.format === "modules") {
		throw new Error(
			"You cannot configure [text_blobs] with an ES module worker. Instead, import the file directly in your code, and optionally configure `[rules]` in your wrangler.toml"
		);
	}

	if (props.bindings.data_blobs && props.entry.format === "modules") {
		throw new Error(
			"You cannot configure [data_blobs] with an ES module worker. Instead, import the file directly in your code, and optionally configure `[rules]` in your wrangler.toml"
		);
	}
}
