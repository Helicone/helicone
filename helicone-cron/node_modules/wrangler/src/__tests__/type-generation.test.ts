import * as fs from "fs";
import * as TOML from "@iarna/toml";
import { mockConsoleMethods } from "./helpers/mock-console";
import { runInTempDir } from "./helpers/run-in-tmp";
import { runWrangler } from "./helpers/run-wrangler";
import type { Config } from "../config";

const bindingsConfigMock: Partial<Config> = {
	kv_namespaces: [{ binding: "TEST_KV_NAMESPACE", id: "1234" }],
	vars: {
		SOMETHING: "asdasdfasdf",
		ANOTHER: "thing",
		OBJECT_VAR: {
			enterprise: "1701-D",
			activeDuty: true,
			captian: "Picard",
		}, // We can assume the objects will be stringified
	},
	queues: {
		producers: [
			{
				binding: "TEST_QUEUE_BINDING",
				queue: "TEST_QUEUE",
			},
		],
		consumers: [
			{
				queue: "my-queue",
				max_batch_size: 10,
				max_batch_timeout: 1,
				max_retries: 3,
			},
		],
	},
	durable_objects: {
		bindings: [
			{ name: "DURABLE_TEST1", class_name: "Durability1" },
			{ name: "DURABLE_TEST2", class_name: "Durability2" },
		],
	},
	r2_buckets: [
		{
			binding: "R2_BUCKET_BINDING",
			bucket_name: "R2BUCKET_NAME_TEST",
		},
	],
	d1_databases: [
		{
			binding: "D1_TESTING_SOMETHING",
			database_name: "D1_BINDING",
			database_id: "1234",
		},
	],
	services: [{ binding: "SERVICE_BINDING", service: "SERVICE_NAME" }],
	dispatch_namespaces: [
		{ binding: "NAMESPACE_BINDING", namespace: "NAMESPACE_ID" },
	],
	logfwdr: {
		schema: "LOGFWDER_SCHEMA",
		bindings: [{ name: "LOGFWDR_BINDING", destination: "LOGFWDR_DESTINATION" }],
	},
	data_blobs: {
		SOME_DATA_BLOB1: "SOME_DATA_BLOB1.bin",
		SOME_DATA_BLOB2: "SOME_DATA_BLOB2.bin",
	},
	text_blobs: {
		SOME_TEXT_BLOB1: "SOME_TEXT_BLOB1.txt",
		SOME_TEXT_BLOB2: "SOME_TEXT_BLOB2.txt",
	},
	wasm_modules: { MODULE1: "module1.wasm", MODULE2: "module2.wasm" },
	unsafe: {
		bindings: [{ name: "testing_unsafe", type: "plain_text" }],
	},
	rules: [
		{
			type: "Text",
			globs: ["**/*.txt"],
			fallthrough: true,
		},
		{
			type: "Data",
			globs: ["**/*.webp"],
			fallthrough: true,
		},
		{ type: "CompiledWasm", globs: ["**/*.wasm"], fallthrough: true },
	],
};

describe("generateTypes()", () => {
	const std = mockConsoleMethods();
	runInTempDir();

	it("should log the interface type generated and declare modules", async () => {
		fs.writeFileSync("./index.ts", "export default { async fetch () {} };");
		fs.writeFileSync(
			"./wrangler.toml",
			TOML.stringify({
				compatibility_date: "2022-01-12",
				name: "test-name",
				main: "./index.ts",
				...bindingsConfigMock,
				unsafe: bindingsConfigMock.unsafe ?? {},
			} as unknown as TOML.JsonMap),
			"utf-8"
		);

		await runWrangler("types");
		expect(std.out).toMatchInlineSnapshot(`
		"interface Env {
			TEST_KV_NAMESPACE: KVNamespace;
			SOMETHING: \\"asdasdfasdf\\";
			ANOTHER: \\"thing\\";
			OBJECT_VAR: {\\"enterprise\\":\\"1701-D\\",\\"activeDuty\\":true,\\"captian\\":\\"Picard\\"};
			DURABLE_TEST1: DurableObjectNamespace;
			DURABLE_TEST2: DurableObjectNamespace;
			R2_BUCKET_BINDING: R2Bucket;
			D1_TESTING_SOMETHING: D1Database;
			SERVICE_BINDING: Fetcher;
			NAMESPACE_BINDING: any;
			LOGFWDR_SCHEMA: any;
			SOME_DATA_BLOB1: ArrayBuffer;
			SOME_DATA_BLOB2: ArrayBuffer;
			SOME_TEXT_BLOB1: string;
			SOME_TEXT_BLOB2: string;
			testing_unsafe: any;
			TEST_QUEUE_BINDING: Queue;
		}
		declare module \\"*.txt\\" {
			const value: string;
			export default value;
		}
		declare module \\"*.webp\\" {
			const value: ArrayBuffer;
			export default value;
		}
		declare module \\"*.wasm\\" {
			const value: WebAssembly.Module;
			export default value;
		}"
	`);
	});

	it("should create a DTS file at the location that the command is executed from", async () => {
		fs.writeFileSync("./index.ts", "export default { async fetch () {} };");
		fs.writeFileSync(
			"./wrangler.toml",
			TOML.stringify({
				compatibility_date: "2022-01-12",
				name: "test-name",
				main: "./index.ts",
				vars: bindingsConfigMock.vars,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any),
			"utf-8"
		);
		await runWrangler("types");
		expect(fs.existsSync("./worker-configuration.d.ts")).toBe(true);
	});

	it("should not create DTS file if there is nothing in the config to generate types from", async () => {
		fs.writeFileSync("./index.ts", "export default { async fetch () {} };");
		fs.writeFileSync(
			"./wrangler.toml",
			TOML.stringify({
				compatibility_date: "2022-01-12",
				name: "test-name",
				main: "./index.ts",
			}),
			"utf-8"
		);

		await runWrangler("types");
		expect(fs.existsSync("./worker-configuration.d.ts")).toBe(false);
		expect(std.out).toMatchInlineSnapshot(`""`);
	});

	it("should create a DTS file at the location that the command is executed from", async () => {
		fs.writeFileSync(
			"./worker-configuration.d.ts",
			"NOT THE CONTENTS OF THE GENERATED FILE"
		);
		fs.writeFileSync("./index.ts", "export default { async fetch () {} };");
		fs.writeFileSync(
			"./wrangler.toml",
			TOML.stringify({
				compatibility_date: "2022-01-12",
				name: "test-name",
				main: "./index.ts",
				vars: bindingsConfigMock.vars,
			} as TOML.JsonMap),
			"utf-8"
		);

		await expect(runWrangler("types")).rejects.toMatchInlineSnapshot(
			`[Error: A non-wrangler worker-configuration.d.ts already exists, please rename and try again.]`
		);
		expect(fs.existsSync("./worker-configuration.d.ts")).toBe(true);
	});

	it("should log the declare global type generated and declare modules", async () => {
		fs.writeFileSync(
			"./index.ts",
			`addEventListener('fetch', event => {  event.respondWith(handleRequest(event.request));
		}); async function handleRequest(request) {  return new Response('Hello worker!', {headers: { 'content-type': 'text/plain' },});}`
		);
		fs.writeFileSync(
			"./wrangler.toml",
			TOML.stringify({
				compatibility_date: "2022-01-12",
				name: "test-name",
				main: "./index.ts",
				unsafe: bindingsConfigMock.unsafe ?? {},
			} as TOML.JsonMap),
			"utf-8"
		);

		await runWrangler("types");
		expect(std.out).toMatchInlineSnapshot(`
		"export {};
		declare global {
			const testing_unsafe: any;
		}
		"
	`);
	});
});
