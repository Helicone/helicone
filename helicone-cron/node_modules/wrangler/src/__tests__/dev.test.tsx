import * as fs from "node:fs";
import getPort from "get-port";
import patchConsole from "patch-console";
import dedent from "ts-dedent";
import Dev from "../dev/dev";
import { mockAccountId, mockApiToken } from "./helpers/mock-account-id";
import { setMockResponse, unsetAllMocks } from "./helpers/mock-cfetch";
import { mockConsoleMethods } from "./helpers/mock-console";
import {
	msw,
	mswSuccessOauthHandlers,
	mswSuccessUserHandlers,
	mswZoneHandlers,
} from "./helpers/msw";
import { runInTempDir } from "./helpers/run-in-tmp";
import { runWrangler } from "./helpers/run-wrangler";
import writeWranglerToml from "./helpers/write-wrangler-toml";

describe("wrangler dev", () => {
	beforeEach(() => {
		msw.use(
			...mswZoneHandlers,
			...mswSuccessOauthHandlers,
			...mswSuccessUserHandlers
		);
	});

	runInTempDir();
	mockAccountId();
	mockApiToken();
	const std = mockConsoleMethods();
	afterEach(() => {
		(Dev as jest.Mock).mockClear();
		patchConsole(() => {});
		unsetAllMocks();
	});

	describe("compatibility-date", () => {
		it("should not warn if there is no wrangler.toml and no compatibility-date specified", async () => {
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev index.js");
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should warn if there is a wrangler.toml but no compatibility-date", async () => {
			writeWranglerToml({
				main: "index.js",
				compatibility_date: undefined,
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev");
			const currentDate = new Date().toISOString().substring(0, 10);
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn.replaceAll(currentDate, "<current-date>"))
				.toMatchInlineSnapshot(`
			        "[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mNo compatibility_date was specified. Using today's date: <current-date>.[0m

			          Add one to your wrangler.toml file:
			          \`\`\`
			          compatibility_date = \\"<current-date>\\"
			          \`\`\`
			          or pass it in your terminal:
			          \`\`\`
			          --compatibility-date=<current-date>
			          \`\`\`
			          See [4mhttps://developers.cloudflare.com/workers/platform/compatibility-dates/[0m for more information.

			        "
		      `);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should not warn if there is a wrangler.toml but compatibility-date is specified at the command line", async () => {
			writeWranglerToml({
				main: "index.js",
				compatibility_date: undefined,
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev --compatibility-date=2020-01-01");
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});
	});

	describe("usage-model", () => {
		it("should read wrangler.toml's usage_model", async () => {
			writeWranglerToml({
				main: "index.js",
				usage_model: "unbound",
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0].usageModel).toEqual("unbound");
		});

		it("should read wrangler.toml's usage_model in local mode", async () => {
			writeWranglerToml({
				main: "index.js",
				usage_model: "unbound",
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev --local");
			expect((Dev as jest.Mock).mock.calls[0][0].usageModel).toEqual("unbound");
		});
	});

	describe("entry-points", () => {
		it("should error if there is no entry-point specified", async () => {
			writeWranglerToml();

			await expect(
				runWrangler("dev")
			).rejects.toThrowErrorMatchingInlineSnapshot(
				`"Missing entry-point: The entry-point should be specified via the command line (e.g. \`wrangler dev path/to/script\`) or the \`main\` config field."`
			);

			expect(std.out).toMatchInlineSnapshot(`
			        "
			        [32mIf you think this is a bug then please create an issue at https://github.com/cloudflare/wrangler2/issues/new/choose[0m"
		      `);
			expect(std.err).toMatchInlineSnapshot(`
			        "[31mX [41;31m[[41;97mERROR[41;31m][0m [1mMissing entry-point: The entry-point should be specified via the command line (e.g. \`wrangler dev path/to/script\`) or the \`main\` config field.[0m

			        "
		      `);
		});

		it("should use `main` from the top-level environment", async () => {
			writeWranglerToml({
				main: "index.js",
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0].entry.file).toMatch(
				/index\.js$/
			);
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should use `main` from a named environment", async () => {
			writeWranglerToml({
				env: {
					ENV1: {
						main: "index.js",
					},
				},
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev --env=ENV1");
			expect((Dev as jest.Mock).mock.calls[0][0].entry.file).toMatch(
				/index\.js$/
			);
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should use `main` from a named environment, rather than the top-level", async () => {
			writeWranglerToml({
				main: "other.js",
				env: {
					ENV1: {
						main: "index.js",
					},
				},
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev --env=ENV1");
			expect((Dev as jest.Mock).mock.calls[0][0].entry.file).toMatch(
				/index\.js$/
			);
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});
	});

	describe("routes", () => {
		it("should pass routes to <Dev/>", async () => {
			fs.writeFileSync("index.js", `export default {};`);

			// config.routes
			mockGetZones("5.some-host.com", [{ id: "some-zone-id-5" }]);
			writeWranglerToml({
				main: "index.js",
				routes: ["http://5.some-host.com/some/path/*"],
			});
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0]).toEqual(
				expect.objectContaining({
					host: "5.some-host.com",
					zone: "some-zone-id-5",
					routes: ["http://5.some-host.com/some/path/*"],
				})
			);
		});
	});
	describe("host", () => {
		it("should resolve a host to its zone", async () => {
			writeWranglerToml({
				main: "index.js",
			});
			fs.writeFileSync("index.js", `export default {};`);
			mockGetZones("some-host.com", [{ id: "some-zone-id" }]);
			await runWrangler("dev --host some-host.com");
			expect((Dev as jest.Mock).mock.calls[0][0]).toEqual(
				expect.objectContaining({
					host: "some-host.com",
					zone: "some-zone-id",
				})
			);
		});

		it("should read wrangler.toml's dev.host", async () => {
			writeWranglerToml({
				main: "index.js",
				dev: {
					host: "some-host.com",
				},
			});
			fs.writeFileSync("index.js", `export default {};`);
			mockGetZones("some-host.com", [{ id: "some-zone-id" }]);
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0].host).toEqual("some-host.com");
		});

		it("should read --route", async () => {
			writeWranglerToml({
				main: "index.js",
			});
			fs.writeFileSync("index.js", `export default {};`);
			mockGetZones("some-host.com", [{ id: "some-zone-id" }]);
			await runWrangler("dev --route http://some-host.com/some/path/*");
			expect((Dev as jest.Mock).mock.calls[0][0].host).toEqual("some-host.com");
		});

		it("should read wrangler.toml's routes", async () => {
			writeWranglerToml({
				main: "index.js",
				routes: [
					"http://some-host.com/some/path/*",
					"http://some-other-host.com/path/*",
				],
			});
			fs.writeFileSync("index.js", `export default {};`);
			mockGetZones("some-host.com", [{ id: "some-zone-id" }]);
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0].host).toEqual("some-host.com");
		});

		it("should read wrangler.toml's environment specific routes", async () => {
			writeWranglerToml({
				main: "index.js",
				routes: [
					"http://a-host.com/some/path/*",
					"http://another-host.com/path/*",
				],
				env: {
					staging: {
						routes: [
							"http://some-host.com/some/path/*",
							"http://some-other-host.com/path/*",
						],
					},
				},
			});
			fs.writeFileSync("index.js", `export default {};`);
			mockGetZones("some-host.com", [{ id: "some-zone-id" }]);
			await runWrangler("dev --env staging");
			expect((Dev as jest.Mock).mock.calls[0][0].host).toEqual("some-host.com");
		});

		it("should strip leading `*` from given host when deducing a zone id", async () => {
			writeWranglerToml({
				main: "index.js",
				route: "*some-host.com/some/path/*",
			});
			fs.writeFileSync("index.js", `export default {};`);
			mockGetZones("some-host.com", [{ id: "some-zone-id" }]);
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0].host).toEqual("some-host.com");
		});

		it("should strip leading `*.` from given host when deducing a zone id", async () => {
			writeWranglerToml({
				main: "index.js",
				route: "*.some-host.com/some/path/*",
			});
			fs.writeFileSync("index.js", `export default {};`);
			mockGetZones("some-host.com", [{ id: "some-zone-id" }]);
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0].host).toEqual("some-host.com");
		});

		it("should, when provided, use a configured zone_id", async () => {
			writeWranglerToml({
				main: "index.js",
				routes: [
					{ pattern: "https://some-domain.com/*", zone_id: "some-zone-id" },
				],
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0]).toEqual(
				expect.objectContaining({
					host: "some-domain.com",
					zone: "some-zone-id",
				})
			);
		});

		it("should, when provided, use a zone_name to get a zone_id", async () => {
			writeWranglerToml({
				main: "index.js",
				routes: [
					{
						pattern: "https://some-zone.com/*",
						zone_name: "some-zone.com",
					},
				],
			});
			fs.writeFileSync("index.js", `export default {};`);
			mockGetZones("some-zone.com", [{ id: "a-zone-id" }]);
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0]).toEqual(
				expect.objectContaining({
					// note that it uses the provided zone_name as a host too
					host: "some-zone.com",
					zone: "a-zone-id",
				})
			);
		});

		it("should find the host from the given pattern, not zone_name", async () => {
			writeWranglerToml({
				main: "index.js",
				routes: [
					{
						pattern: "https://subdomain.exists.com/*",
						zone_name: "does-not-exist.com",
					},
				],
			});
			await fs.promises.writeFile("index.js", `export default {};`);
			await runWrangler("dev");
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should fail for non-existing zones", async () => {
			writeWranglerToml({
				main: "index.js",
				routes: [
					{
						pattern: "https://subdomain.does-not-exist.com/*",
						zone_name: "exists.com",
					},
				],
			});
			await fs.promises.writeFile("index.js", `export default {};`);
			await expect(runWrangler("dev")).rejects.toEqual(
				new Error("Could not find zone for subdomain.does-not-exist.com")
			);
		});

		it("should fail for non-existing zones, when falling back from */*", async () => {
			writeWranglerToml({
				main: "index.js",
				routes: [
					{
						pattern: "*/*",
						zone_name: "does-not-exist.com",
					},
				],
			});
			await fs.promises.writeFile("index.js", `export default {};`);
			await expect(runWrangler("dev")).rejects.toEqual(
				new Error("Could not find zone for does-not-exist.com")
			);
		});

		it("should fallback to zone_name when given the pattern */*", async () => {
			writeWranglerToml({
				main: "index.js",
				routes: [
					{
						pattern: "*/*",
						zone_name: "exists.com",
					},
				],
			});
			await fs.promises.writeFile("index.js", `export default {};`);
			await runWrangler("dev");
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});
		it("fails when given the pattern */* and no zone_name", async () => {
			writeWranglerToml({
				main: "index.js",
				routes: [
					{
						pattern: "*/*",
						zone_id: "exists-com",
					},
				],
			});
			await fs.promises.writeFile("index.js", `export default {};`);
			const err = new TypeError() as unknown as { code: string; input: string };
			err.code = "ERR_INVALID_URL";
			err.input = "http:///";

			await expect(runWrangler("dev")).rejects.toEqual(err);
		});

		it("given a long host, it should use the longest subdomain that resolves to a zone", async () => {
			writeWranglerToml({
				main: "index.js",
			});
			fs.writeFileSync("index.js", `export default {};`);
			mockGetZones("111.222.333.some-host.com", []);
			mockGetZones("222.333.some-host.com", []);
			mockGetZones("333.some-host.com", [{ id: "some-zone-id" }]);
			await runWrangler("dev --host 111.222.333.some-host.com");
			expect((Dev as jest.Mock).mock.calls[0][0]).toEqual(
				expect.objectContaining({
					host: "111.222.333.some-host.com",
					zone: "some-zone-id",
				})
			);
		});

		it("should, in order, use args.host/config.dev.host/args.routes/(config.route|config.routes)", async () => {
			// This test might seem like it's testing implementation details, but let's be specific and consider it a spec

			fs.writeFileSync("index.js", `export default {};`);

			// config.routes
			mockGetZones("5.some-host.com", [{ id: "some-zone-id-5" }]);
			writeWranglerToml({
				main: "index.js",
				routes: ["http://5.some-host.com/some/path/*"],
			});
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0]).toEqual(
				expect.objectContaining({
					host: "5.some-host.com",
					zone: "some-zone-id-5",
				})
			);
			(Dev as jest.Mock).mockClear();

			// config.route
			mockGetZones("4.some-host.com", [{ id: "some-zone-id-4" }]);
			writeWranglerToml({
				main: "index.js",
				route: "https://4.some-host.com/some/path/*",
			});
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0]).toEqual(
				expect.objectContaining({
					host: "4.some-host.com",
					zone: "some-zone-id-4",
				})
			);
			(Dev as jest.Mock).mockClear();

			// --routes
			mockGetZones("3.some-host.com", [{ id: "some-zone-id-3" }]);
			writeWranglerToml({
				main: "index.js",
				route: "https://4.some-host.com/some/path/*",
			});
			await runWrangler("dev --routes http://3.some-host.com/some/path/*");
			expect((Dev as jest.Mock).mock.calls[0][0]).toEqual(
				expect.objectContaining({
					host: "3.some-host.com",
					zone: "some-zone-id-3",
				})
			);
			(Dev as jest.Mock).mockClear();

			// config.dev.host
			mockGetZones("2.some-host.com", [{ id: "some-zone-id-2" }]);
			writeWranglerToml({
				main: "index.js",
				dev: {
					host: `2.some-host.com`,
				},
				route: "4.some-host.com/some/path/*",
			});
			await runWrangler("dev --routes http://3.some-host.com/some/path/*");
			expect((Dev as jest.Mock).mock.calls[0][0]).toEqual(
				expect.objectContaining({
					host: "2.some-host.com",
					zone: "some-zone-id-2",
				})
			);
			(Dev as jest.Mock).mockClear();

			// --host
			mockGetZones("1.some-host.com", [{ id: "some-zone-id-1" }]);
			writeWranglerToml({
				main: "index.js",
				dev: {
					host: `2.some-host.com`,
				},
				route: "4.some-host.com/some/path/*",
			});
			await runWrangler(
				"dev --routes http://3.some-host.com/some/path/* --host 1.some-host.com"
			);
			expect((Dev as jest.Mock).mock.calls[0][0]).toEqual(
				expect.objectContaining({
					host: "1.some-host.com",
					zone: "some-zone-id-1",
				})
			);
			(Dev as jest.Mock).mockClear();
		});

		it("should error if a host can't resolve to a zone", async () => {
			writeWranglerToml({
				main: "index.js",
			});
			fs.writeFileSync("index.js", `export default {};`);
			mockGetZones("some-host.com", []);
			await expect(
				runWrangler("dev --host some-host.com")
			).rejects.toThrowErrorMatchingInlineSnapshot(
				`"Could not find zone for some-host.com"`
			);
		});

		it("should not try to resolve a zone when starting in local mode", async () => {
			writeWranglerToml({
				main: "index.js",
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev --host some-host.com --local");
			expect((Dev as jest.Mock).mock.calls[0][0].zone).toEqual(undefined);
		});
	});

	describe("local upstream", () => {
		it("should use dev.host from toml by default", async () => {
			writeWranglerToml({
				main: "index.js",
				dev: {
					host: `2.some-host.com`,
				},
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev --local");
			expect((Dev as jest.Mock).mock.calls[0][0].localUpstream).toEqual(
				"2.some-host.com"
			);
		});

		it("should use route from toml by default", async () => {
			writeWranglerToml({
				main: "index.js",
				route: "https://4.some-host.com/some/path/*",
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev --local");
			expect((Dev as jest.Mock).mock.calls[0][0].host).toEqual(
				"4.some-host.com"
			);
		});

		it("should respect the option when provided", async () => {
			writeWranglerToml({
				main: "index.js",
				route: `2.some-host.com`,
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev --local-upstream some-host.com --local");
			expect((Dev as jest.Mock).mock.calls[0][0].localUpstream).toEqual(
				"some-host.com"
			);
		});
	});

	describe("custom builds", () => {
		it("should run a custom build before starting `dev`", async () => {
			writeWranglerToml({
				build: {
					command: `node -e "console.log('custom build'); require('fs').writeFileSync('index.js', 'export default { fetch(){ return new Response(123) } }')"`,
				},
			});

			await runWrangler("dev index.js");

			expect(fs.readFileSync("index.js", "utf-8")).toMatchInlineSnapshot(
				`"export default { fetch(){ return new Response(123) } }"`
			);

			// and the command would pass through
			expect((Dev as jest.Mock).mock.calls[0][0].build).toEqual({
				command:
					"node -e \"console.log('custom build'); require('fs').writeFileSync('index.js', 'export default { fetch(){ return new Response(123) } }')\"",
				cwd: undefined,
				watch_dir: "src",
			});
			expect(std.out).toMatchInlineSnapshot(
				`"Running custom build: node -e \\"console.log('custom build'); require('fs').writeFileSync('index.js', 'export default { fetch(){ return new Response(123) } }')\\""`
			);
			expect(std.err).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
		});

		if (process.platform !== "win32") {
			it("should run a custom build of multiple steps combined by && before starting `dev`", async () => {
				writeWranglerToml({
					build: {
						command: `echo "custom build" && echo "export default { fetch(){ return new Response(123) } }" > index.js`,
					},
				});

				await runWrangler("dev index.js");

				expect(fs.readFileSync("index.js", "utf-8")).toMatchInlineSnapshot(`
			          "export default { fetch(){ return new Response(123) } }
			          "
		        `);

				expect(std.out).toMatchInlineSnapshot(
					`"Running custom build: echo \\"custom build\\" && echo \\"export default { fetch(){ return new Response(123) } }\\" > index.js"`
				);
				expect(std.err).toMatchInlineSnapshot(`""`);
				expect(std.warn).toMatchInlineSnapshot(`""`);
			});
		}

		it("should throw an error if the entry doesn't exist after the build finishes", async () => {
			writeWranglerToml({
				main: "index.js",
				build: {
					command: `node -e "console.log('custom build');"`,
				},
			});

			await expect(runWrangler("dev")).rejects
				.toThrowErrorMatchingInlineSnapshot(`
						              "The expected output file at \\"index.js\\" was not found after running custom build: node -e \\"console.log('custom build');\\".
						              The \`main\` property in wrangler.toml should point to the file generated by the custom build."
					            `);
			expect(std.out).toMatchInlineSnapshot(`
			        "Running custom build: node -e \\"console.log('custom build');\\"

			        [32mIf you think this is a bug then please create an issue at https://github.com/cloudflare/wrangler2/issues/new/choose[0m"
		      `);
			expect(std.err).toMatchInlineSnapshot(`
			        "[31mX [41;31m[[41;97mERROR[41;31m][0m [1mThe expected output file at \\"index.js\\" was not found after running custom build: node -e \\"console.log('custom build');\\".[0m

			          The \`main\` property in wrangler.toml should point to the file generated by the custom build.

			        "
		      `);
			expect(std.warn).toMatchInlineSnapshot(`""`);
		});

		describe(".env", () => {
			beforeEach(() => {
				fs.writeFileSync(".env", "CUSTOM_BUILD_VAR=default");
				fs.writeFileSync(".env.custom", "CUSTOM_BUILD_VAR=custom");
				fs.writeFileSync("index.js", `export default {};`);
				writeWranglerToml({
					main: "index.js",
					env: { custom: {} },
					build: {
						// Ideally, we'd just log the var here and match it in `std.out`,
						// but stdout from custom builds is piped directly to
						// `process.stdout` which we don't capture.
						command: `node -e "require('fs').writeFileSync('var.txt', process.env.CUSTOM_BUILD_VAR)"`,
					},
				});

				// We won't overwrite existing process.env keys with .env values (to
				// allow .env overrides to specified on then shell), so make sure this
				// key definitely doesn't exist.
				delete process.env.CUSTOM_BUILD_VAR;
			});

			it("should load environment variables from `.env`", async () => {
				await runWrangler("dev");
				const output = fs.readFileSync("var.txt", "utf8");
				expect(output).toMatch("default");
			});
			it("should prefer to load environment variables from `.env.<environment>` if `--env <environment>` is set", async () => {
				await runWrangler("dev --env custom");
				const output = fs.readFileSync("var.txt", "utf8");
				expect(output).toMatch("custom");
			});
		});
	});

	describe("upstream-protocol", () => {
		it("should default upstream-protocol to `https`", async () => {
			writeWranglerToml({
				main: "index.js",
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0].upstreamProtocol).toEqual(
				"https"
			);
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should warn if `--upstream-protocol=http` is used", async () => {
			writeWranglerToml({
				main: "index.js",
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev --upstream-protocol=http");
			expect((Dev as jest.Mock).mock.calls[0][0].upstreamProtocol).toEqual(
				"http"
			);
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`
			        "[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mSetting upstream-protocol to http is not currently implemented.[0m

			          If this is required in your project, please add your use case to the following issue:
			          [4mhttps://github.com/cloudflare/wrangler2/issues/583[0m.

			        "
		      `);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});
	});

	describe("local-protocol", () => {
		it("should default local-protocol to `http`", async () => {
			writeWranglerToml({
				main: "index.js",
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0].localProtocol).toEqual("http");
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should use `local_protocol` from `wrangler.toml`, if available", async () => {
			writeWranglerToml({
				main: "index.js",
				dev: {
					local_protocol: "https",
				},
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0].localProtocol).toEqual(
				"https"
			);
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should use --local-protocol command line arg, if provided", async () => {
			// Here we show that the command line overrides the wrangler.toml by
			// setting the config to https, and then setting it back to http on the command line.
			writeWranglerToml({
				main: "index.js",
				dev: {
					local_protocol: "https",
				},
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev --local-protocol=http");
			expect((Dev as jest.Mock).mock.calls[0][0].localProtocol).toEqual("http");
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});
	});

	describe("ip", () => {
		it("should default ip to 0.0.0.0", async () => {
			writeWranglerToml({
				main: "index.js",
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0].initialIp).toEqual("0.0.0.0");
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should use to `ip` from `wrangler.toml`, if available", async () => {
			writeWranglerToml({
				main: "index.js",
				dev: {
					ip: "1.2.3.4",
				},
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0].initialIp).toEqual("1.2.3.4");
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should use --ip command line arg, if provided", async () => {
			writeWranglerToml({
				main: "index.js",
				dev: {
					ip: "1.2.3.4",
				},
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev --ip=5.6.7.8");
			expect((Dev as jest.Mock).mock.calls[0][0].initialIp).toEqual("5.6.7.8");
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});
	});

	describe("inspector port", () => {
		it("should connect WebSocket server with --experimental-local", async () => {
			writeWranglerToml({
				main: "./index.js",
			});
			fs.writeFileSync(
				"index.js",
				`export default {
					async fetch(request, env, ctx ){
						console.log('Hello World LOGGING');
					},
			};`
			);
			await runWrangler("dev --experimental-local");

			expect((Dev as jest.Mock).mock.calls[0][0].inspectorPort).toEqual(9229);
			expect(std).toMatchInlineSnapshot(`
			Object {
			  "debug": "",
			  "err": "",
			  "out": "",
			  "warn": "",
			}
		`);
		});

		it("should use 9229 as the default port", async () => {
			writeWranglerToml({
				main: "index.js",
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0].inspectorPort).toEqual(9229);
			expect(std).toMatchInlineSnapshot(`
			Object {
			  "debug": "",
			  "err": "",
			  "out": "",
			  "warn": "",
			}
		`);
		});

		it("should read --inspector-port", async () => {
			writeWranglerToml({
				main: "index.js",
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev --inspector-port=9999");
			expect((Dev as jest.Mock).mock.calls[0][0].inspectorPort).toEqual(9999);
			expect(std).toMatchInlineSnapshot(`
			Object {
			  "debug": "",
			  "err": "",
			  "out": "",
			  "warn": "",
			}
		`);
		});

		it("should read dev.inspector_port from wrangler.toml", async () => {
			writeWranglerToml({
				main: "index.js",
				dev: {
					inspector_port: 9999,
				},
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0].inspectorPort).toEqual(9999);
			expect(std).toMatchInlineSnapshot(`
			Object {
			  "debug": "",
			  "err": "",
			  "out": "",
			  "warn": "",
			}
		`);
		});

		it("should error if a bad dev.inspector_port config is provided", async () => {
			writeWranglerToml({
				main: "index.js",
				dev: {
					// @ts-expect-error intentionally bad port
					inspector_port: "some string",
				},
			});
			fs.writeFileSync("index.js", `export default {};`);
			await expect(runWrangler("dev")).rejects
				.toThrowErrorMatchingInlineSnapshot(`
						"Processing wrangler.toml configuration:
						  - Expected \\"dev.inspector_port\\" to be of type number but got \\"some string\\"."
					`);
		});
	});

	describe("port", () => {
		it("should default port to 8787 if it is not in use", async () => {
			writeWranglerToml({
				main: "index.js",
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0].initialPort).toEqual(8787);
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should use `port` from `wrangler.toml`, if available", async () => {
			writeWranglerToml({
				main: "index.js",
				dev: {
					port: 8888,
				},
			});
			fs.writeFileSync("index.js", `export default {};`);
			// Mock `getPort()` to resolve to a completely different port.
			(getPort as jest.Mock).mockResolvedValue(98765);

			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0].initialPort).toEqual(8888);
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should error if a bad dev.port config is provided", async () => {
			writeWranglerToml({
				main: "index.js",
				dev: {
					// @ts-expect-error intentionally bad port
					port: "some string",
				},
			});
			fs.writeFileSync("index.js", `export default {};`);
			await expect(runWrangler("dev")).rejects
				.toThrowErrorMatchingInlineSnapshot(`
						"Processing wrangler.toml configuration:
						  - Expected \\"dev.port\\" to be of type number but got \\"some string\\"."
					`);
		});

		it("should use --port command line arg, if provided", async () => {
			writeWranglerToml({
				main: "index.js",
				dev: {
					port: 8888,
				},
			});
			fs.writeFileSync("index.js", `export default {};`);
			// Mock `getPort()` to resolve to a completely different port.
			(getPort as jest.Mock).mockResolvedValue(98765);

			await runWrangler("dev --port=9999");
			expect((Dev as jest.Mock).mock.calls[0][0].initialPort).toEqual(9999);
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should use a different port to the default if it is in use", async () => {
			writeWranglerToml({
				main: "index.js",
			});
			fs.writeFileSync("index.js", `export default {};`);
			// Mock `getPort()` to resolve to a completely different port.
			(getPort as jest.Mock).mockResolvedValue(98765);

			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0].initialPort).toEqual(98765);
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});
	});

	describe("durable_objects", () => {
		it("should warn if there are remote Durable Objects, or missing migrations for local Durable Objects", async () => {
			writeWranglerToml({
				main: "index.js",
				durable_objects: {
					bindings: [
						{ name: "NAME_1", class_name: "CLASS_1" },
						{
							name: "NAME_2",
							class_name: "CLASS_2",
							script_name: "SCRIPT_A",
						},
						{ name: "NAME_3", class_name: "CLASS_3" },
						{
							name: "NAME_4",
							class_name: "CLASS_4",
							script_name: "SCRIPT_B",
						},
					],
				},
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0].initialIp).toEqual("0.0.0.0");
			expect(std.out).toMatchInlineSnapshot(`
			        "Your worker has access to the following bindings:
			        - Durable Objects:
			          - NAME_1: CLASS_1
			          - NAME_2: CLASS_2 (defined in SCRIPT_A)
			          - NAME_3: CLASS_3
			          - NAME_4: CLASS_4 (defined in SCRIPT_B)"
		      `);
			expect(std.warn).toMatchInlineSnapshot(`
			        "[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mProcessing wrangler.toml configuration:[0m

			            - In wrangler.toml, you have configured [durable_objects] exported by this Worker (CLASS_1,
			          CLASS_3), but no [migrations] for them. This may not work as expected until you add a [migrations]
			          section to your wrangler.toml. Add this configuration to your wrangler.toml:

			                \`\`\`
			                [[migrations]]
			                tag = \\"v1\\" # Should be unique for each entry
			                new_classes = [\\"CLASS_1\\", \\"CLASS_3\\"]
			                \`\`\`

			              Refer to
			          [4mhttps://developers.cloudflare.com/workers/learning/using-durable-objects/#durable-object-migrations-in-wranglertoml[0m
			          for more details.


			        [33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mWARNING: You have Durable Object bindings that are not defined locally in the worker being developed.[0m

			          Be aware that changes to the data stored in these Durable Objects will be permanent and affect the
			          live instances.
			          Remote Durable Objects that are affected:
			          - {\\"name\\":\\"NAME_2\\",\\"class_name\\":\\"CLASS_2\\",\\"script_name\\":\\"SCRIPT_A\\"}
			          - {\\"name\\":\\"NAME_4\\",\\"class_name\\":\\"CLASS_4\\",\\"script_name\\":\\"SCRIPT_B\\"}

			        "
		      `);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});
	});

	describe(".dev.vars", () => {
		it("should override `vars` bindings from `wrangler.toml` with values in `.dev.vars`", async () => {
			fs.writeFileSync("index.js", `export default {};`);

			const localVarsEnvContent = dedent`
      # Preceding comment
      VAR_1="var #1 value" # End of line comment
      VAR_3="var #3 value"
      VAR_MULTI_LINE_1="A: line 1
      line 2"
      VAR_MULTI_LINE_2="B: line 1\\nline 2"
      EMPTY=
      UNQUOTED= unquoted value
      `;
			fs.writeFileSync(".dev.vars", localVarsEnvContent, "utf8");

			writeWranglerToml({
				main: "index.js",
				vars: {
					VAR_1: "original value 1",
					VAR_2: "original value 2", // should not get overridden
					VAR_3: "original value 3",
					VAR_MULTI_LINE_1: "original multi-line 1",
					VAR_MULTI_LINE_2: "original multi-line 2",
					EMPTY: "original empty",
					UNQUOTED: "original unquoted",
				},
			});
			await runWrangler("dev");
			const varBindings: Record<string, unknown> = (Dev as jest.Mock).mock
				.calls[0][0].bindings.vars;

			expect(varBindings).toEqual({
				VAR_1: "var #1 value",
				VAR_2: "original value 2",
				VAR_3: "var #3 value",
				VAR_MULTI_LINE_1: "A: line 1\nline 2",
				VAR_MULTI_LINE_2: "B: line 1\nline 2",
				EMPTY: "",
				UNQUOTED: "unquoted value", // Note that whitespace is trimmed
			});
			expect(std.out).toMatchInlineSnapshot(`
			        "Using vars defined in .dev.vars
			        Your worker has access to the following bindings:
			        - Vars:
			          - VAR_1: \\"(hidden)\\"
			          - VAR_2: \\"original value 2\\"
			          - VAR_3: \\"(hidden)\\"
			          - VAR_MULTI_LINE_1: \\"(hidden)\\"
			          - VAR_MULTI_LINE_2: \\"(hidden)\\"
			          - EMPTY: \\"(hidden)\\"
			          - UNQUOTED: \\"(hidden)\\""
		      `);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should prefer `.dev.vars.<environment>` if `--env <environment> set`", async () => {
			fs.writeFileSync("index.js", `export default {};`);
			fs.writeFileSync(".dev.vars", "DEFAULT_VAR=default");
			fs.writeFileSync(".dev.vars.custom", "CUSTOM_VAR=custom");

			writeWranglerToml({ main: "index.js", env: { custom: {} } });
			await runWrangler("dev --env custom");
			const varBindings: Record<string, unknown> = (Dev as jest.Mock).mock
				.calls[0][0].bindings.vars;

			expect(varBindings).toEqual({ CUSTOM_VAR: "custom" });
			expect(std.out).toMatchInlineSnapshot(`
			        "Using vars defined in .dev.vars.custom
			        Your worker has access to the following bindings:
			        - Vars:
			          - CUSTOM_VAR: \\"(hidden)\\""
		      `);
			expect(std.warn).toMatchInlineSnapshot(`""`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});
	});

	describe("serve static assets", () => {
		it("should error if --site is used with no value", async () => {
			await expect(
				runWrangler("dev --site")
			).rejects.toThrowErrorMatchingInlineSnapshot(
				`"Not enough arguments following: site"`
			);

			expect(std).toMatchInlineSnapshot(`
			Object {
			  "debug": "",
			  "err": "[31mX [41;31m[[41;97mERROR[41;31m][0m [1mNot enough arguments following: site[0m

			",
			  "out": "
			wrangler dev [script]

			👂 Start a local server for developing your worker

			Positionals:
			  script  The path to an entry point for your worker  [string]

			Flags:
			  -c, --config   Path to .toml configuration file  [string]
			  -e, --env      Environment to use for operations and .env files  [string]
			  -h, --help     Show help  [boolean]
			  -v, --version  Show version number  [boolean]

			Options:
			      --name                                       Name of the worker  [string]
			      --no-bundle                                  Skip internal build steps and directly publish script  [boolean] [default: false]
			      --compatibility-date                         Date to use for compatibility checks  [string]
			      --compatibility-flags, --compatibility-flag  Flags to use for compatibility checks  [array]
			      --latest                                     Use the latest version of the worker runtime  [boolean] [default: true]
			      --ip                                         IP address to listen on  [string]
			      --port                                       Port to listen on  [number]
			      --inspector-port                             Port for devtools to connect to  [number]
			      --routes, --route                            Routes to upload  [array]
			      --host                                       Host to forward requests to, defaults to the zone of project  [string]
			      --local-protocol                             Protocol to listen to requests on, defaults to http.  [choices: \\"http\\", \\"https\\"]
			      --local-upstream                             Host to act as origin in local mode, defaults to dev.host or route  [string]
			      --assets                                     Static assets to be served  [string]
			      --site                                       Root folder of static assets for Workers Sites  [string]
			      --site-include                               Array of .gitignore-style patterns that match file or directory names from the sites directory. Only matched items will be uploaded.  [array]
			      --site-exclude                               Array of .gitignore-style patterns that match file or directory names from the sites directory. Matched items will not be uploaded.  [array]
			      --upstream-protocol                          Protocol to forward requests to host on, defaults to https.  [choices: \\"http\\", \\"https\\"]
			      --var                                        A key-value pair to be injected into the script as a variable  [array]
			      --define                                     A key-value pair to be substituted in the script  [array]
			      --jsx-factory                                The function that is called for each JSX element  [string]
			      --jsx-fragment                               The function that is called for each JSX fragment  [string]
			      --tsconfig                                   Path to a custom tsconfig.json file  [string]
			  -l, --local                                      Run on my machine  [boolean] [default: false]
			      --experimental-local                         Run on my machine using the Cloudflare Workers runtime  [boolean] [default: false]
			      --experimental-local-remote-kv               Read/write KV data from/to real namespaces on the Cloudflare network  [boolean] [default: false]
			      --minify                                     Minify the script  [boolean]
			      --node-compat                                Enable node.js compatibility  [boolean]
			      --persist                                    Enable persistence for local mode, using default path: .wrangler/state  [boolean]
			      --persist-to                                 Specify directory to use for local persistence (implies --persist)  [string]
			      --live-reload                                Auto reload HTML pages when change is detected in local mode  [boolean]
			      --test-scheduled                             Test scheduled events by visiting /__scheduled in browser  [boolean] [default: false]
			      --log-level                                  Specify logging level  [choices: \\"debug\\", \\"info\\", \\"log\\", \\"warn\\", \\"error\\", \\"none\\"] [default: \\"log\\"]",
			  "warn": "",
			}
		`);
		});

		it("should error if --assets and --site are used together", async () => {
			writeWranglerToml({
				main: "./index.js",
			});
			fs.writeFileSync("index.js", `export default {};`);
			await expect(
				runWrangler("dev --assets abc --site xyz")
			).rejects.toThrowErrorMatchingInlineSnapshot(
				`"Cannot use Assets and Workers Sites in the same Worker."`
			);
		});

		it("should error if --assets and config.site are used together", async () => {
			writeWranglerToml({
				main: "./index.js",
				site: {
					bucket: "xyz",
				},
			});
			fs.writeFileSync("index.js", `export default {};`);
			await expect(
				runWrangler("dev --assets abc")
			).rejects.toThrowErrorMatchingInlineSnapshot(
				`"Cannot use Assets and Workers Sites in the same Worker."`
			);
		});

		it("should error if config.assets and --site are used together", async () => {
			writeWranglerToml({
				main: "./index.js",
				// @ts-expect-error we allow string inputs here
				assets: "abc",
			});
			fs.writeFileSync("index.js", `export default {};`);
			await expect(
				runWrangler("dev --site xyz")
			).rejects.toThrowErrorMatchingInlineSnapshot(
				`"Cannot use Assets and Workers Sites in the same Worker."`
			);
		});

		it("should error if config.assets and config.site are used together", async () => {
			writeWranglerToml({
				main: "./index.js",
				// @ts-expect-error we allow string inputs here
				assets: "abc",
				site: {
					bucket: "xyz",
				},
			});
			fs.writeFileSync("index.js", `export default {};`);
			await expect(
				runWrangler("dev --assets abc")
			).rejects.toThrowErrorMatchingInlineSnapshot(
				`"Cannot use Assets and Workers Sites in the same Worker."`
			);
		});

		it("should indicate whether Sites is being used", async () => {
			writeWranglerToml({
				main: "index.js",
			});
			fs.writeFileSync("index.js", `export default {};`);

			await runWrangler("dev");
			expect((Dev as jest.Mock).mock.calls[0][0].isWorkersSite).toEqual(false);

			await runWrangler("dev --site abc");
			expect((Dev as jest.Mock).mock.calls[1][0].isWorkersSite).toEqual(true);

			await runWrangler("dev --assets abc");
			expect((Dev as jest.Mock).mock.calls[2][0].isWorkersSite).toEqual(false);
		});
		it("should warn if --assets is used", async () => {
			writeWranglerToml({
				main: "./index.js",
			});
			fs.writeFileSync("index.js", `export default {};`);

			await runWrangler('dev --assets "./assets"');
			expect(std).toMatchInlineSnapshot(`
			        Object {
			          "debug": "",
			          "err": "",
			          "out": "",
			          "warn": "[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mThe --assets argument is experimental and may change or break at any time[0m

			        ",
			        }
		      `);
		});

		it("should warn if config.assets is used", async () => {
			writeWranglerToml({
				main: "./index.js",
				// @ts-expect-error we allow string inputs here
				assets: "./assets",
			});
			fs.writeFileSync("index.js", `export default {};`);

			await runWrangler("dev");
			expect(std).toMatchInlineSnapshot(`
			        Object {
			          "debug": "",
			          "err": "",
			          "out": "",
			          "warn": "[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mProcessing wrangler.toml configuration:[0m

			            - \\"assets\\" fields are experimental and may change or break at any time.

			        ",
			        }
		      `);
		});
	});

	describe("--inspect", () => {
		it("should warn if --inspect is used", async () => {
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev index.js --inspect");
			expect(std).toMatchInlineSnapshot(`
			        Object {
			          "debug": "",
			          "err": "",
			          "out": "",
			          "warn": "[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mPassing --inspect is unnecessary, now you can always connect to devtools.[0m

			        ",
			        }
		      `);
		});

		it("should default to true, without a warning", async () => {
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev index.js");
			expect((Dev as jest.Mock).mock.calls[0][0].inspect).toEqual(true);
			expect(std).toMatchInlineSnapshot(`
			Object {
			  "debug": "",
			  "err": "",
			  "out": "",
			  "warn": "",
			}
		`);
		});

		it("should pass true, with a warning", async () => {
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev index.js --inspect");
			expect((Dev as jest.Mock).mock.calls[0][0].inspect).toEqual(true);
			expect(std).toMatchInlineSnapshot(`
			Object {
			  "debug": "",
			  "err": "",
			  "out": "",
			  "warn": "[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mPassing --inspect is unnecessary, now you can always connect to devtools.[0m

			",
			}
		`);
		});

		it("should pass false, without a warning", async () => {
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev index.js --inspect false");
			expect((Dev as jest.Mock).mock.calls[0][0].inspect).toEqual(false);
			expect(std).toMatchInlineSnapshot(`
			Object {
			  "debug": "",
			  "err": "",
			  "out": "",
			  "warn": "",
			}
		`);
		});
	});

	describe("--log-level", () => {
		it("should not output warnings with log-level 'none'", async () => {
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev index.js --inspect --log-level none");
			expect(std).toMatchInlineSnapshot(`
			Object {
			  "debug": "",
			  "err": "",
			  "out": "",
			  "warn": "",
			}
		`);
		});

		it("should output warnings with log-level 'warn'", async () => {
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev index.js --inspect --log-level warn");
			expect(std).toMatchInlineSnapshot(`
			Object {
			  "debug": "",
			  "err": "",
			  "out": "",
			  "warn": "[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mPassing --inspect is unnecessary, now you can always connect to devtools.[0m

			",
			}
		`);
		});

		it("should not output Errors with log-level error", async () => {
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev index.js --inspect --log-level debug");
			expect(std.debug.length > 1).toBe(true);
		});
	});

	describe("service bindings", () => {
		it("should warn when using service bindings", async () => {
			writeWranglerToml({
				services: [
					{ binding: "WorkerA", service: "A" },
					{ binding: "WorkerB", service: "B", environment: "staging" },
				],
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev index.js");
			expect(std.out).toMatchInlineSnapshot(`
			"Your worker has access to the following bindings:
			- Services:
			  - WorkerA: A
			  - WorkerB: B - staging"
		`);
			expect(std.warn).toMatchInlineSnapshot(`
			"[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mProcessing wrangler.toml configuration:[0m

			    - \\"services\\" fields are experimental and may change or break at any time.


			[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mThis worker is bound to live services: WorkerA (A), WorkerB (B@staging)[0m

			"
		`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});
	});

	describe("print bindings", () => {
		it("should print bindings", async () => {
			writeWranglerToml({
				services: [
					{ binding: "WorkerA", service: "A" },
					{ binding: "WorkerB", service: "B", environment: "staging" },
				],
			});
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev index.js");
			expect(std).toMatchInlineSnapshot(`
			        Object {
			          "debug": "",
			          "err": "",
			          "out": "Your worker has access to the following bindings:
			        - Services:
			          - WorkerA: A
			          - WorkerB: B - staging",
			          "warn": "[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mProcessing wrangler.toml configuration:[0m

			            - \\"services\\" fields are experimental and may change or break at any time.


			        [33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mThis worker is bound to live services: WorkerA (A), WorkerB (B@staging)[0m

			        ",
			        }
		      `);
		});

		it("should mask vars that were overriden in .dev.vars", async () => {
			writeWranglerToml({
				vars: {
					variable: 123,
					overriden: "original values",
				},
			});
			fs.writeFileSync(
				".dev.vars",
				`
        SECRET = "A secret"
        overriden = "overriden value"
      `
			);
			fs.writeFileSync("index.js", `export default {};`);
			await runWrangler("dev index.js");
			expect(std).toMatchInlineSnapshot(`
			Object {
			  "debug": "",
			  "err": "",
			  "out": "Using vars defined in .dev.vars
			Your worker has access to the following bindings:
			- Vars:
			  - variable: 123
			  - overriden: \\"(hidden)\\"
			  - SECRET: \\"(hidden)\\"",
			  "warn": "",
			}
		`);
		});
	});
});

function mockGetZones(domain: string, zones: { id: string }[] = []) {
	const removeMock = setMockResponse(
		"/zones",
		"GET",
		(_urlPieces, _init, queryParams) => {
			expect([...queryParams.entries()]).toEqual([["name", domain]]);
			// Because the API URL `/zones` is the same for each request, we can get into a situation where earlier mocks get triggered for later requests. So, we simply clear the mock on every trigger.
			removeMock();
			return zones;
		}
	);
}
