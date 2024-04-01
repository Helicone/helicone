import * as fs from "node:fs";
import { rest } from "msw";
import prettyBytes from "pretty-bytes";
import { MAX_UPLOAD_SIZE } from "../r2/constants";
import { mockAccountId, mockApiToken } from "./helpers/mock-account-id";
import { mockConsoleMethods } from "./helpers/mock-console";
import { msw, mswSuccessR2handlers } from "./helpers/msw";
import { runInTempDir } from "./helpers/run-in-tmp";
import { runWrangler } from "./helpers/run-wrangler";
import type { R2BucketInfo } from "../r2/helpers";

describe("r2", () => {
	const std = mockConsoleMethods();
	beforeEach(() => msw.use(...mswSuccessR2handlers));

	mockAccountId();
	mockApiToken();
	runInTempDir();

	describe("bucket", () => {
		it("should show the correct help when an invalid command is passed", async () => {
			await expect(() =>
				runWrangler("r2 bucket foo")
			).rejects.toThrowErrorMatchingInlineSnapshot(`"Unknown argument: foo"`);
			expect(std.err).toMatchInlineSnapshot(`
			          "[31mX [41;31m[[41;97mERROR[41;31m][0m [1mUnknown argument: foo[0m

			          "
		        `);
			expect(std.out).toMatchInlineSnapshot(`
			"
			wrangler r2 bucket

			Manage R2 buckets

			Commands:
			  wrangler r2 bucket create <name>  Create a new R2 bucket
			  wrangler r2 bucket list           List R2 buckets
			  wrangler r2 bucket delete <name>  Delete an R2 bucket

			Flags:
			  -c, --config   Path to .toml configuration file  [string]
			  -e, --env      Environment to use for operations and .env files  [string]
			  -h, --help     Show help  [boolean]
			  -v, --version  Show version number  [boolean]"
		`);
		});

		describe("list", () => {
			it("should list buckets & check request inputs", async () => {
				const expectedBuckets: R2BucketInfo[] = [
					{ name: "bucket-1-local-once", creation_date: "01-01-2001" },
					{ name: "bucket-2-local-once", creation_date: "01-01-2001" },
				];
				msw.use(
					rest.get(
						"*/accounts/:accountId/r2/buckets",
						async (request, response, context) => {
							const { accountId } = request.params;
							expect(accountId).toEqual("some-account-id");
							expect(await request.text()).toEqual("");
							return response.once(
								context.status(200),
								context.json({
									success: true,
									errors: [],
									messages: [],
									result: {
										buckets: [
											{
												name: "bucket-1-local-once",
												creation_date: "01-01-2001",
											},
											{
												name: "bucket-2-local-once",
												creation_date: "01-01-2001",
											},
										],
									},
								})
							);
						}
					)
				);
				await runWrangler("r2 bucket list");

				expect(std.err).toMatchInlineSnapshot(`""`);
				const buckets = JSON.parse(std.out);
				expect(buckets).toEqual(expectedBuckets);
			});
		});

		describe("create", () => {
			it("should error if no bucket name is given", async () => {
				await expect(
					runWrangler("r2 bucket create")
				).rejects.toThrowErrorMatchingInlineSnapshot(
					`"Not enough non-option arguments: got 0, need at least 1"`
				);
				expect(std.out).toMatchInlineSnapshot(`
			"
			wrangler r2 bucket create <name>

			Create a new R2 bucket

			Positionals:
			  name  The name of the new bucket  [string] [required]

			Flags:
			  -c, --config   Path to .toml configuration file  [string]
			  -e, --env      Environment to use for operations and .env files  [string]
			  -h, --help     Show help  [boolean]
			  -v, --version  Show version number  [boolean]"
		`);
				expect(std.err).toMatchInlineSnapshot(`
				            "[31mX [41;31m[[41;97mERROR[41;31m][0m [1mNot enough non-option arguments: got 0, need at least 1[0m

				            "
			          `);
			});

			it("should error if the bucket to create contains spaces", async () => {
				await expect(
					runWrangler("r2 bucket create abc def ghi")
				).rejects.toThrowErrorMatchingInlineSnapshot(
					`"Unknown arguments: def, ghi"`
				);
				expect(std.out).toMatchInlineSnapshot(`
			"
			wrangler r2 bucket create <name>

			Create a new R2 bucket

			Positionals:
			  name  The name of the new bucket  [string] [required]

			Flags:
			  -c, --config   Path to .toml configuration file  [string]
			  -e, --env      Environment to use for operations and .env files  [string]
			  -h, --help     Show help  [boolean]
			  -v, --version  Show version number  [boolean]"
		`);
				expect(std.err).toMatchInlineSnapshot(`
				            "[31mX [41;31m[[41;97mERROR[41;31m][0m [1mUnknown arguments: def, ghi[0m

				            "
			          `);
			});

			it("should create a bucket & check request inputs", async () => {
				msw.use(
					rest.post(
						"*/accounts/:accountId/r2/buckets",
						async (request, response, context) => {
							const { accountId } = request.params;
							expect(accountId).toEqual("some-account-id");
							expect(await request.json()).toEqual({ name: "testBucket" });
							response.once(
								context.status(200),
								context.json({
									success: true,
									errors: [],
									messages: [],
									result: {},
								})
							);
						}
					)
				);
				await runWrangler("r2 bucket create testBucket");
				expect(std.out).toMatchInlineSnapshot(`
				            "Creating bucket testBucket.
				            Created bucket testBucket."
			          `);
			});
		});

		describe("delete", () => {
			it("should error if no bucket name is given", async () => {
				await expect(
					runWrangler("r2 bucket delete")
				).rejects.toThrowErrorMatchingInlineSnapshot(
					`"Not enough non-option arguments: got 0, need at least 1"`
				);
				expect(std.out).toMatchInlineSnapshot(`
			"
			wrangler r2 bucket delete <name>

			Delete an R2 bucket

			Positionals:
			  name  The name of the bucket to delete  [string] [required]

			Flags:
			  -c, --config   Path to .toml configuration file  [string]
			  -e, --env      Environment to use for operations and .env files  [string]
			  -h, --help     Show help  [boolean]
			  -v, --version  Show version number  [boolean]"
		`);
				expect(std.err).toMatchInlineSnapshot(`
				            "[31mX [41;31m[[41;97mERROR[41;31m][0m [1mNot enough non-option arguments: got 0, need at least 1[0m

				            "
			          `);
			});

			it("should error if the bucket name to delete contains spaces", async () => {
				await expect(
					runWrangler("r2 bucket delete abc def ghi")
				).rejects.toThrowErrorMatchingInlineSnapshot(
					`"Unknown arguments: def, ghi"`
				);
				expect(std.out).toMatchInlineSnapshot(`
			"
			wrangler r2 bucket delete <name>

			Delete an R2 bucket

			Positionals:
			  name  The name of the bucket to delete  [string] [required]

			Flags:
			  -c, --config   Path to .toml configuration file  [string]
			  -e, --env      Environment to use for operations and .env files  [string]
			  -h, --help     Show help  [boolean]
			  -v, --version  Show version number  [boolean]"
		`);
				expect(std.err).toMatchInlineSnapshot(`
				            "[31mX [41;31m[[41;97mERROR[41;31m][0m [1mUnknown arguments: def, ghi[0m

				            "
			          `);
			});

			it("should delete a bucket specified by name & check requests inputs", async () => {
				msw.use(
					rest.delete(
						"*/accounts/:accountId/r2/buckets/:bucketName",
						async (request, response, context) => {
							const { accountId, bucketName } = request.params;
							expect(accountId).toEqual("some-account-id");
							expect(bucketName).toEqual("some-bucket");
							expect(await request.text()).toEqual("");
							expect(request.headers.get("authorization")).toEqual(
								"Bearer some-api-token"
							);

							return response.once(
								context.status(200),
								context.json({
									success: true,
									errors: [],
									messages: [],
									result: null,
								})
							);
						}
					)
				);
				await runWrangler(`r2 bucket delete some-bucket`);
				expect(std.out).toMatchInlineSnapshot(`
				"Deleting bucket some-bucket.
				Deleted bucket some-bucket."
			`);
			});
		});
	});

	describe("r2 object", () => {
		it("should download R2 object from bucket", async () => {
			await runWrangler(
				`r2 object get bucketName-object-test/wormhole-img.png --file ./wormhole-img.png`
			);

			expect(std.out).toMatchInlineSnapshot(`
			"Downloading \\"wormhole-img.png\\" from \\"bucketName-object-test\\".
			Download complete."
		`);
		});

		it("should upload R2 object to bucket", async () => {
			fs.writeFileSync("wormhole-img.png", "passageway");
			await runWrangler(
				`r2 object put bucketName-object-test/wormhole-img.png --file ./wormhole-img.png`
			);

			expect(std.out).toMatchInlineSnapshot(`
			"Creating object \\"wormhole-img.png\\" in bucket \\"bucketName-object-test\\".
			Upload complete."
		`);
		});

		it("should fail to upload R2 object to bucket if too large", async () => {
			const TOO_BIG_FILE_SIZE = MAX_UPLOAD_SIZE + 1024 * 1024;
			fs.writeFileSync("wormhole-img.png", Buffer.alloc(TOO_BIG_FILE_SIZE));
			await expect(
				runWrangler(
					`r2 object put bucketName-object-test/wormhole-img.png --file ./wormhole-img.png`
				)
			).rejects.toThrowErrorMatchingInlineSnapshot(`
			"Error: Wrangler only supports uploading files up to ${prettyBytes(
				MAX_UPLOAD_SIZE
			)} in size
			wormhole-img.png is ${prettyBytes(TOO_BIG_FILE_SIZE)} in size"
		`);
		});

		it("should pass all fetch option flags into requestInit & check request inputs", async () => {
			msw.use(
				rest.put(
					"*/accounts/:accountId/r2/buckets/:bucketName/objects/:objectName",
					(request, response, context) => {
						const { accountId, bucketName, objectName } = request.params;
						expect(accountId).toEqual("some-account-id");
						expect(bucketName).toEqual("bucketName-object-test");
						expect(objectName).toEqual("wormhole-img.png");
						const headersObject = request.headers.all();
						delete headersObject["user-agent"];
						expect(headersObject).toMatchInlineSnapshot(`
					Object {
					  "accept": "*/*",
					  "accept-encoding": "gzip,deflate",
					  "authorization": "Bearer some-api-token",
					  "cache-control": "cache-control-mock",
					  "connection": "close",
					  "content-disposition": "content-disposition-mock",
					  "content-encoding": "content-encoding-mock",
					  "content-language": "content-lang-mock",
					  "content-length": "10",
					  "content-type": "content-type-mock",
					  "expires": "expire-time-mock",
					  "host": "api.cloudflare.com",
					}
				`);
						response.once(
							context.status(200),
							context.json({
								success: true,
								errors: [],
								messages: [],
								result: {
									accountId: "some-account-id",
									bucketName: "bucketName-object-test",
									objectName: "wormhole-img.png",
								},
							})
						);
					}
				)
			);
			fs.writeFileSync("wormhole-img.png", "passageway");
			const flags =
				"--ct content-type-mock --cd content-disposition-mock --ce content-encoding-mock --cl content-lang-mock --cc cache-control-mock --e expire-time-mock";

			await runWrangler(
				`r2 object put bucketName-object-test/wormhole-img.png ${flags} --file wormhole-img.png`
			);

			expect(std.out).toMatchInlineSnapshot(`
			"Creating object \\"wormhole-img.png\\" in bucket \\"bucketName-object-test\\".
			Upload complete."
		`);
		});

		it("should delete R2 object from bucket", async () => {
			await runWrangler(
				`r2 object delete bucketName-object-test/wormhole-img.png`
			);

			expect(std.out).toMatchInlineSnapshot(`
			"Deleting object \\"wormhole-img.png\\" from bucket \\"bucketName-object-test\\".
			Delete complete."
		`);
		});

		it("should not allow `--pipe` & `--file` to run together", async () => {
			fs.writeFileSync("wormhole-img.png", "passageway");
			await expect(
				runWrangler(
					`r2 object put bucketName-object-test/wormhole-img.png --pipe --file wormhole-img.png`
				)
			).rejects.toThrowErrorMatchingInlineSnapshot(
				`"Arguments pipe and file are mutually exclusive"`
			);

			expect(std.err).toMatchInlineSnapshot(`
			"[31mX [41;31m[[41;97mERROR[41;31m][0m [1mArguments pipe and file are mutually exclusive[0m

			"
		`);
		});
	});
});
