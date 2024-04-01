import { validateDevProps } from "../dev/validate-dev-props";
import type { DevProps } from "../dev/dev";

describe("validateDevProps", () => {
	it("should throw if the user tries to use the service-worker format with an `assets` directory", () => {
		const props = {
			isWorkersSite: false,
			assetPaths: ["assets"],
			entry: { format: "service-worker" },
			bindings: {},
		};

		expect(() => validateDevProps(props as unknown as DevProps)).toThrowError(
			"You cannot use the service-worker format with an `assets` directory yet. For information on how to migrate to the module-worker format, see: https://developers.cloudflare.com/workers/learning/migrating-to-module-workers/"
		);
	});

	it("should throw if the user tries to configure [wasm_modules] with an ES module worker", () => {
		const props = {
			isWorkersSite: false,
			assetPaths: [],
			entry: { format: "modules" },
			bindings: { wasm_modules: true },
		};

		expect(() => validateDevProps(props as unknown as DevProps)).toThrowError(
			"You cannot configure [wasm_modules] with an ES module worker. Instead, import the .wasm module directly in your code"
		);
	});

	it("should throw if the user tries to configure [text_blobs] with an ES module worker", () => {
		const props = {
			isWorkersSite: false,
			assetPaths: [],
			entry: { format: "modules" },
			bindings: { text_blobs: true },
		};

		expect(() => validateDevProps(props as unknown as DevProps)).toThrowError(
			"You cannot configure [text_blobs] with an ES module worker. Instead, import the file directly in your code, and optionally configure `[rules]` in your wrangler.toml"
		);
	});

	it("should throw if the user tries to configure [data_blobs] with an ES module worker", () => {
		const props = {
			isWorkersSite: false,
			assetPaths: [],
			entry: { format: "modules" },
			bindings: { data_blobs: true },
		};

		expect(() => validateDevProps(props as unknown as DevProps)).toThrowError(
			"You cannot configure [data_blobs] with an ES module worker. Instead, import the file directly in your code, and optionally configure `[rules]` in your wrangler.toml"
		);
	});
});
