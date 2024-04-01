import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getGlobalWranglerConfigPath } from "../global-wrangler-config-path";
import { getHttpsOptions } from "../https-options";
import { mockConsoleMethods } from "./helpers/mock-console";
import { runInTempDir } from "./helpers/run-in-tmp";

describe("getHttpsOptions()", () => {
	runInTempDir();
	const std = mockConsoleMethods();

	it("should use cached values if they have not expired", async () => {
		fs.mkdirSync(path.resolve(getGlobalWranglerConfigPath(), "local-cert"), {
			recursive: true,
		});
		fs.writeFileSync(
			path.resolve(getGlobalWranglerConfigPath(), "local-cert/key.pem"),
			"PRIVATE KEY"
		);
		fs.writeFileSync(
			path.resolve(getGlobalWranglerConfigPath(), "local-cert/cert.pem"),
			"PUBLIC KEY"
		);
		const result = await getHttpsOptions();
		expect(result.key).toEqual("PRIVATE KEY");
		expect(result.cert).toEqual("PUBLIC KEY");
		expect(std.out).toMatchInlineSnapshot(`""`);
		expect(std.warn).toMatchInlineSnapshot(`""`);
		expect(std.err).toMatchInlineSnapshot(`""`);
	});

	it("should generate and cache new keys if none are cached", async () => {
		const result = await getHttpsOptions();
		const key = fs.readFileSync(
			path.resolve(getGlobalWranglerConfigPath(), "local-cert/key.pem"),
			"utf8"
		);
		const cert = fs.readFileSync(
			path.resolve(getGlobalWranglerConfigPath(), "local-cert/cert.pem"),
			"utf8"
		);
		expect(result.key).toEqual(key);
		expect(result.cert).toEqual(cert);
		expect(std.out).toMatchInlineSnapshot(
			`"Generating new self-signed certificate..."`
		);
		expect(std.warn).toMatchInlineSnapshot(`""`);
		expect(std.err).toMatchInlineSnapshot(`""`);
	});

	it("should generate and cache new keys if cached files have expired", async () => {
		fs.mkdirSync(path.resolve(getGlobalWranglerConfigPath(), "local-cert"), {
			recursive: true,
		});
		const ORIGINAL_KEY = "EXPIRED PRIVATE KEY";
		const ORIGINAL_CERT = "EXPIRED PUBLIC KEY";
		fs.writeFileSync(
			path.resolve(getGlobalWranglerConfigPath(), "local-cert/key.pem"),
			ORIGINAL_KEY
		);
		fs.writeFileSync(
			path.resolve(getGlobalWranglerConfigPath(), "local-cert/cert.pem"),
			ORIGINAL_CERT
		);
		mockStatSync(/\.pem$/, { mtimeMs: new Date(2000).valueOf() });

		const result = await getHttpsOptions();
		const key = fs.readFileSync(
			path.resolve(getGlobalWranglerConfigPath(), "local-cert/key.pem"),
			"utf8"
		);
		const cert = fs.readFileSync(
			path.resolve(getGlobalWranglerConfigPath(), "local-cert/cert.pem"),
			"utf8"
		);
		expect(key).not.toEqual(ORIGINAL_KEY);
		expect(cert).not.toEqual(ORIGINAL_CERT);
		expect(result.key).toEqual(key);
		expect(result.cert).toEqual(cert);
		expect(std.out).toMatchInlineSnapshot(
			`"Generating new self-signed certificate..."`
		);
		expect(std.warn).toMatchInlineSnapshot(`""`);
		expect(std.err).toMatchInlineSnapshot(`""`);
	});

	it("should warn if not able to write to the cache (legacy config path)", async () => {
		fs.mkdirSync(path.join(os.homedir(), ".wrangler"));
		mockWriteFileSyncThrow(/\.pem$/);
		await getHttpsOptions();
		expect(
			fs.existsSync(
				path.resolve(getGlobalWranglerConfigPath(), "local-cert/key.pem")
			)
		).toBe(false);
		expect(
			fs.existsSync(
				path.resolve(getGlobalWranglerConfigPath(), "local-cert/cert.pem")
			)
		).toBe(false);
		expect(std.out).toMatchInlineSnapshot(
			`"Generating new self-signed certificate..."`
		);
		expect(std.warn).toMatchInlineSnapshot(`
		      "[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mUnable to cache generated self-signed certificate in home/.wrangler/local-cert.[0m

		        ERROR: Cannot write file

		      "
	    `);
		expect(std.err).toMatchInlineSnapshot(`""`);
		fs.rmSync(path.join(os.homedir(), ".wrangler"), { recursive: true });
	});

	it("should warn if not able to write to the cache", async () => {
		mockWriteFileSyncThrow(/\.pem$/);
		await getHttpsOptions();
		expect(
			fs.existsSync(
				path.resolve(getGlobalWranglerConfigPath(), "local-cert/key.pem")
			)
		).toBe(false);
		expect(
			fs.existsSync(
				path.resolve(getGlobalWranglerConfigPath(), "local-cert/cert.pem")
			)
		).toBe(false);
		expect(std.out).toMatchInlineSnapshot(
			`"Generating new self-signed certificate..."`
		);
		expect(std.warn).toMatchInlineSnapshot(`
		"[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mUnable to cache generated self-signed certificate in test-xdg-config/local-cert.[0m

		  ERROR: Cannot write file

		"
	`);
		expect(std.err).toMatchInlineSnapshot(`""`);
	});
});

function mockStatSync(matcher: RegExp, stats: Partial<fs.Stats>) {
	const originalStatSync = jest.requireActual("node:fs").statSync;
	jest.spyOn(fs, "statSync").mockImplementation((statPath, options) => {
		return matcher.test(statPath.toString())
			? (stats as fs.Stats)
			: originalStatSync(statPath, options);
	});
}

function mockWriteFileSyncThrow(matcher: RegExp) {
	const originalWriteFileSync = jest.requireActual("node:fs").writeFileSync;
	jest
		.spyOn(fs, "writeFileSync")
		.mockImplementation((filePath, data, options) => {
			if (matcher.test(filePath.toString())) {
				throw new Error("ERROR: Cannot write file");
			} else {
				return originalWriteFileSync(filePath, data, options);
			}
		});
}
