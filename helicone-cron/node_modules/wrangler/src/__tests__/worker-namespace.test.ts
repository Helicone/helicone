import { rest } from "msw";
import { mockAccountId, mockApiToken } from "./helpers/mock-account-id";
import { mockConsoleMethods } from "./helpers/mock-console";
import { msw, mswSuccessNamespacesHandlers } from "./helpers/msw";
import { runInTempDir } from "./helpers/run-in-tmp";
import { runWrangler } from "./helpers/run-wrangler";

describe("dispatch-namespace", () => {
	const std = mockConsoleMethods();
	beforeEach(() => msw.use(...mswSuccessNamespacesHandlers));

	runInTempDir();
	mockAccountId();
	mockApiToken();

	it("should should display a list of available subcommands, for dispatch-namespace with no subcommand", async () => {
		await runWrangler("dispatch-namespace");

		// wait a tick for the help menu to be printed
		await new Promise((resolve) => setImmediate(resolve));

		expect(std).toMatchInlineSnapshot(`
		Object {
		  "debug": "",
		  "err": "",
		  "out": "wrangler dispatch-namespace

		📦 Interact with a dispatch namespace

		Commands:
		  wrangler dispatch-namespace list                          List all dispatch namespaces
		  wrangler dispatch-namespace get <name>                    Get information about a dispatch namespace
		  wrangler dispatch-namespace create <name>                 Create a dispatch namespace
		  wrangler dispatch-namespace delete <name>                 Delete a dispatch namespace
		  wrangler dispatch-namespace rename <old-name> <new-name>  Rename a dispatch namespace

		Flags:
		  -c, --config   Path to .toml configuration file  [string]
		  -e, --env      Environment to use for operations and .env files  [string]
		  -h, --help     Show help  [boolean]
		  -v, --version  Show version number  [boolean]",
		  "warn": "",
		}
	`);
	});

	describe("create namespace", () => {
		const namespaceName = "my-namespace";
		let counter = 0;
		msw.use(
			rest.post(
				"/accounts/:accountId/workers/dispatch/namespaces/:namespaceNameParam",
				(req, res, cxt) => {
					counter++;
					const { namespaceNameParam } = req.params;
					expect(counter).toBe(1);
					expect(namespaceNameParam).toBe(namespaceName);
					return res.once(
						cxt.status(200),
						cxt.json({
							namespace_id: "some-namespace-id",
							namespace_name: "namespace-name",
							created_on: "2022-06-29T14:30:08.16152Z",
							created_by: "1fc1df98cc4420fe00367c3ab68c1639",
							modified_on: "2022-06-29T14:30:08.16152Z",
							modified_by: "1fc1df98cc4420fe00367c3ab68c1639",
						})
					);
				}
			)
		);

		it("should display help for create", async () => {
			await expect(
				runWrangler("dispatch-namespace create")
			).rejects.toThrowErrorMatchingInlineSnapshot(
				`"Not enough non-option arguments: got 0, need at least 1"`
			);

			expect(std.out).toMatchInlineSnapshot(`
			"
			wrangler dispatch-namespace create <name>

			Create a dispatch namespace

			Positionals:
			  name  Name of the dispatch namespace  [string] [required]

			Flags:
			  -c, --config   Path to .toml configuration file  [string]
			  -e, --env      Environment to use for operations and .env files  [string]
			  -h, --help     Show help  [boolean]
			  -v, --version  Show version number  [boolean]"
		`);
		});

		it("should attempt to create the given namespace", async () => {
			await runWrangler(`dispatch-namespace create ${namespaceName}`);

			expect(std.out).toMatchInlineSnapshot(
				`"Created dispatch namespace \\"my-namespace\\" with ID \\"some-namespace-id\\""`
			);
		});
	});

	describe("delete namespace", () => {
		const namespaceName = "my-namespace";
		let counter = 0;
		msw.use(
			rest.delete(
				"/accounts/:accountId/workers/dispatch/namespaces/:namespaceNameParam",
				(req, res, cxt) => {
					counter++;
					const { namespaceNameParam } = req.params;
					expect(counter).toBe(1);
					expect(namespaceNameParam).toBe(namespaceName);
					return res.once(cxt.status(200), cxt.json(null));
				}
			)
		);

		it("should display help for delete", async () => {
			await expect(
				runWrangler("dispatch-namespace create")
			).rejects.toThrowErrorMatchingInlineSnapshot(
				`"Not enough non-option arguments: got 0, need at least 1"`
			);

			expect(std.out).toMatchInlineSnapshot(`
			"
			wrangler dispatch-namespace create <name>

			Create a dispatch namespace

			Positionals:
			  name  Name of the dispatch namespace  [string] [required]

			Flags:
			  -c, --config   Path to .toml configuration file  [string]
			  -e, --env      Environment to use for operations and .env files  [string]
			  -h, --help     Show help  [boolean]
			  -v, --version  Show version number  [boolean]"
		`);
		});

		it("should try to delete the given namespace", async () => {
			await runWrangler(`dispatch-namespace delete ${namespaceName}`);

			expect(std.out).toMatchInlineSnapshot(
				`"Deleted dispatch namespace \\"my-namespace\\""`
			);
		});
	});

	describe("get namespace", () => {
		const namespaceName = "my-namespace";
		let counter = 0;
		msw.use(
			rest.get(
				"/accounts/:accountId/workers/dispatch/namespaces/:namespaceNameParam",
				(req, res, cxt) => {
					counter++;
					const { namespaceNameParam } = req.params;
					expect(counter).toBe(1);
					expect(namespaceNameParam).toBe(namespaceName);
					return res.once(
						cxt.status(200),
						cxt.json({
							namespace_id: "some-namespace-id",
							namespace_name: "namespace-name",
							created_on: "2022-06-29T14:30:08.16152Z",
							created_by: "1fc1df98cc4420fe00367c3ab68c1639",
							modified_on: "2022-06-29T14:30:08.16152Z",
							modified_by: "1fc1df98cc4420fe00367c3ab68c1639",
						})
					);
				}
			)
		);

		it("should display help for get", async () => {
			await expect(
				runWrangler("dispatch-namespace get")
			).rejects.toThrowErrorMatchingInlineSnapshot(
				`"Not enough non-option arguments: got 0, need at least 1"`
			);

			expect(std.out).toMatchInlineSnapshot(`
			"
			wrangler dispatch-namespace get <name>

			Get information about a dispatch namespace

			Positionals:
			  name  Name of the dispatch namespace  [string] [required]

			Flags:
			  -c, --config   Path to .toml configuration file  [string]
			  -e, --env      Environment to use for operations and .env files  [string]
			  -h, --help     Show help  [boolean]
			  -v, --version  Show version number  [boolean]"
		`);
		});

		it("should attempt to get info for the given namespace", async () => {
			await runWrangler(`dispatch-namespace get ${namespaceName}`);

			expect(std.out).toMatchInlineSnapshot(`
			"{
			  namespace_id: 'some-namespace-id',
			  namespace_name: 'namespace-name',
			  created_on: '2022-06-29T14:30:08.16152Z',
			  created_by: '1fc1df98cc4420fe00367c3ab68c1639',
			  modified_on: '2022-06-29T14:30:08.16152Z',
			  modified_by: '1fc1df98cc4420fe00367c3ab68c1639'
			}"
		`);
		});
	});

	describe("list namespaces", () => {
		const namespaceName = "my-namespace";
		let counter = 0;
		msw.use(
			rest.get(
				"/accounts/:accountId/workers/dispatch/namespaces/:namespaceNameParam",
				(req, res, cxt) => {
					counter++;
					const { namespaceNameParam } = req.params;
					expect(counter).toBe(1);
					expect(namespaceNameParam).toBe(namespaceName);
					return res.once(
						cxt.status(200),
						cxt.json({
							namespace_id: "some-namespace-id",
							namespace_name: "namespace-name",
							created_on: "2022-06-29T14:30:08.16152Z",
							created_by: "1fc1df98cc4420fe00367c3ab68c1639",
							modified_on: "2022-06-29T14:30:08.16152Z",
							modified_by: "1fc1df98cc4420fe00367c3ab68c1639",
						})
					);
				}
			)
		);

		it("should list all namespaces", async () => {
			await runWrangler("dispatch-namespace list");
			expect(std.out).toMatchInlineSnapshot(`
			"[
			  {
			    namespace_id: 'some-namespace-id',
			    namespace_name: 'namespace-name',
			    created_on: '2022-06-29T14:30:08.16152Z',
			    created_by: '1fc1df98cc4420fe00367c3ab68c1639',
			    modified_on: '2022-06-29T14:30:08.16152Z',
			    modified_by: '1fc1df98cc4420fe00367c3ab68c1639'
			  }
			]"
		`);
		});
	});

	describe("rename namespace", () => {
		const namespaceName = "my-namespace";
		let counter = 0;
		msw.use(
			rest.put(
				"/accounts/:accountId/workers/dispatch/namespaces/:namespaceNameParam",
				(req, res, cxt) => {
					counter++;
					const { namespaceNameParam } = req.params;
					expect(counter).toBe(1);
					expect(namespaceNameParam).toBe(namespaceName);
					return res.once(
						cxt.status(200),
						cxt.json({
							namespace_id: "some-namespace-id",
							namespace_name: "namespace-name",
							created_on: "2022-06-29T14:30:08.16152Z",
							created_by: "1fc1df98cc4420fe00367c3ab68c1639",
							modified_on: "2022-06-29T14:30:08.16152Z",
							modified_by: "1fc1df98cc4420fe00367c3ab68c1639",
						})
					);
				}
			)
		);

		it("should display help for rename", async () => {
			await expect(
				runWrangler("dispatch-namespace rename")
			).rejects.toThrowErrorMatchingInlineSnapshot(
				`"Not enough non-option arguments: got 0, need at least 2"`
			);

			expect(std.out).toMatchInlineSnapshot(`
			"
			wrangler dispatch-namespace rename <old-name> <new-name>

			Rename a dispatch namespace

			Positionals:
			  old-name  Name of the dispatch namespace  [string] [required]
			  new-name  New name of the dispatch namespace  [string] [required]

			Flags:
			  -c, --config   Path to .toml configuration file  [string]
			  -e, --env      Environment to use for operations and .env files  [string]
			  -h, --help     Show help  [boolean]
			  -v, --version  Show version number  [boolean]"
		`);
		});

		it("should attempt to rename the given namespace", async () => {
			const newName = "new-namespace";
			await runWrangler(
				`dispatch-namespace rename ${namespaceName} ${newName}`
			);

			expect(std.out).toMatchInlineSnapshot(
				`"Renamed dispatch namespace \\"my-namespace\\" to \\"new-namespace\\""`
			);
		});
	});
});
