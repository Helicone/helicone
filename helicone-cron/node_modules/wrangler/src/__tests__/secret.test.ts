import * as fs from "node:fs";
import { writeFileSync } from "node:fs";
import * as TOML from "@iarna/toml";
import { mockAccountId, mockApiToken } from "./helpers/mock-account-id";
import { setMockResponse, unsetAllMocks } from "./helpers/mock-cfetch";
import { mockConsoleMethods } from "./helpers/mock-console";
import {
	mockConfirm,
	mockPrompt,
	clearConfirmMocks,
	clearPromptMocks,
} from "./helpers/mock-dialogs";
import {
	mockGetMemberships,
	mockGetMembershipsFail,
} from "./helpers/mock-oauth-flow";
import { useMockStdin } from "./helpers/mock-stdin";
import { runInTempDir } from "./helpers/run-in-tmp";
import { runWrangler } from "./helpers/run-wrangler";

describe("wrangler secret", () => {
	const std = mockConsoleMethods();

	runInTempDir();
	mockAccountId();
	mockApiToken();

	afterEach(() => {
		unsetAllMocks();
		clearConfirmMocks();
		clearPromptMocks();
	});

	describe("put", () => {
		function mockPutRequest(
			input: { name: string; text: string },
			env?: string,
			legacyEnv = false
		) {
			const servicesOrScripts = env && !legacyEnv ? "services" : "scripts";
			const environment = env && !legacyEnv ? "/environments/:envName" : "";
			setMockResponse(
				`/accounts/:accountId/workers/${servicesOrScripts}/:scriptName${environment}/secrets`,
				"PUT",
				([_url, accountId, scriptName, envName], { body }) => {
					expect(accountId).toEqual("some-account-id");
					expect(scriptName).toEqual(
						legacyEnv && env ? `script-name-${env}` : "script-name"
					);
					if (!legacyEnv) {
						expect(envName).toEqual(env);
					}
					const { name, text, type } = JSON.parse(body as string);
					expect(type).toEqual("secret_text");
					expect(name).toEqual(input.name);
					expect(text).toEqual(input.text);

					return { name, type };
				}
			);
		}

		describe("interactive", () => {
			useMockStdin({ isTTY: true });

			it("should trim stdin secret value", async () => {
				mockPrompt({
					text: "Enter a secret value:",
					type: "password",
					result: `hunter2
          `,
				});

				mockPutRequest({ name: `secret-name`, text: `hunter2` });
				await runWrangler("secret put secret-name --name script-name");
				expect(std.out).toMatchInlineSnapshot(`
			"🌀 Creating the secret for the Worker \\"script-name\\"
			✨ Success! Uploaded secret secret-name"
		`);
			});

			it("should create a secret", async () => {
				mockPrompt({
					text: "Enter a secret value:",
					type: "password",
					result: "the-secret",
				});

				mockPutRequest({ name: "the-key", text: "the-secret" });
				await runWrangler("secret put the-key --name script-name");

				expect(std.out).toMatchInlineSnapshot(`
			"🌀 Creating the secret for the Worker \\"script-name\\"
			✨ Success! Uploaded secret the-key"
		`);
				expect(std.err).toMatchInlineSnapshot(`""`);
			});

			it("should create secret:bulk", async () => {
				writeFileSync(
					"secret.json",
					JSON.stringify({
						"secret-name-1": "secret_text",
						"secret-name-2": "secret_text",
					})
				);

				// User counter to pass different secrets to the request mock
				let counter = 0;
				setMockResponse(
					`/accounts/:accountId/workers/scripts/:scriptName/secrets`,
					"PUT",
					([_url, accountId]) => {
						expect(accountId).toEqual("some-account-id");
						counter++;

						return { name: `secret-name-${counter}`, type: "secret_text" };
					}
				);

				await runWrangler("secret:bulk ./secret.json --name script-name");

				expect(std.out).toMatchInlineSnapshot(`
			"🌀 Creating the secrets for the Worker \\"script-name\\"
			✨ Successfully created secret for key: secret-name-1
			✨ Successfully created secret for key: secret-name-2

			Finished processing secrets JSON file:
			✨ 2 secrets successfully uploaded"
		`);
				expect(std.err).toMatchInlineSnapshot(`""`);
			});

			it("should handle failed secret:bulk", async () => {
				writeFileSync(
					"secret.json",
					JSON.stringify({
						"secret-name-1": "secret_text",
						"secret-name-2": "secret_text",
					})
				);

				// User counter to pass different secrets to the request mock
				let counter = 0;
				setMockResponse(
					`/accounts/:accountId/workers/scripts/:scriptName/secrets`,
					"PUT",
					([_url, accountId]) => {
						expect(accountId).toEqual("some-account-id");
						counter++;

						return Promise.reject(
							new Error(`Failed to create secret ${counter}`)
						);
					}
				);

				await runWrangler("secret:bulk ./secret.json --name script-name");

				expect(std.out).toMatchInlineSnapshot(`
			"🌀 Creating the secrets for the Worker \\"script-name\\"

			Finished processing secrets JSON file:
			✨ 0 secrets successfully uploaded
			🚨 2 secrets failed to upload"
		`);
				expect(std.err).toMatchInlineSnapshot(`
			"[31mX [41;31m[[41;97mERROR[41;31m][0m [1m🚨 Error uploading secret for key: secret-name-1:[0m

			                  Failed to create secret 1


			[31mX [41;31m[[41;97mERROR[41;31m][0m [1m🚨 Error uploading secret for key: secret-name-2:[0m

			                  Failed to create secret 2

			"
		`);
			});

			it("should count success and failed secret:bulk", async () => {
				writeFileSync(
					"secret.json",
					JSON.stringify({
						"secret-name-1": "secret_text",
						"secret-name-2": "secret_text",
						"secret-name-3": "secret_text",
						"secret-name-4": "secret_text",
						"secret-name-5": "secret_text",
						"secret-name-6": "secret_text",
						"secret-name-7": "secret_text",
					})
				);

				// User counter to pass different secrets to the request mock
				let counter = 0;
				setMockResponse(
					`/accounts/:accountId/workers/scripts/:scriptName/secrets`,
					"PUT",
					([_url, accountId]) => {
						expect(accountId).toEqual("some-account-id");
						counter++;

						if (counter % 2 === 0) {
							return { name: `secret-name-${counter}`, type: "secret_text" };
						} else {
							return Promise.reject(
								new Error(`Failed to create secret ${counter}`)
							);
						}
					}
				);

				await runWrangler("secret:bulk ./secret.json --name script-name");

				expect(std.out).toMatchInlineSnapshot(`
			"🌀 Creating the secrets for the Worker \\"script-name\\"
			✨ Successfully created secret for key: secret-name-2
			✨ Successfully created secret for key: secret-name-4
			✨ Successfully created secret for key: secret-name-6

			Finished processing secrets JSON file:
			✨ 3 secrets successfully uploaded
			🚨 4 secrets failed to upload"
		`);
				expect(std.err).toMatchInlineSnapshot(`
			"[31mX [41;31m[[41;97mERROR[41;31m][0m [1m🚨 Error uploading secret for key: secret-name-1:[0m

			                  Failed to create secret 1


			[31mX [41;31m[[41;97mERROR[41;31m][0m [1m🚨 Error uploading secret for key: secret-name-3:[0m

			                  Failed to create secret 3


			[31mX [41;31m[[41;97mERROR[41;31m][0m [1m🚨 Error uploading secret for key: secret-name-5:[0m

			                  Failed to create secret 5


			[31mX [41;31m[[41;97mERROR[41;31m][0m [1m🚨 Error uploading secret for key: secret-name-7:[0m

			                  Failed to create secret 7

			"
		`);
			});

			it("should create a secret: legacy envs", async () => {
				mockPrompt({
					text: "Enter a secret value:",
					type: "password",
					result: "the-secret",
				});

				mockPutRequest(
					{ name: "the-key", text: "the-secret" },
					"some-env",
					true
				);
				await runWrangler(
					"secret put the-key --name script-name --env some-env --legacy-env"
				);

				expect(std.out).toMatchInlineSnapshot(`
			"🌀 Creating the secret for the Worker \\"script-name-some-env\\"
			✨ Success! Uploaded secret the-key"
		`);
				expect(std.err).toMatchInlineSnapshot(`""`);
			});

			it("should create a secret: service envs", async () => {
				mockPrompt({
					text: "Enter a secret value:",
					type: "password",
					result: "the-secret",
				});

				mockPutRequest(
					{ name: "the-key", text: "the-secret" },
					"some-env",
					false
				);
				await runWrangler(
					"secret put the-key --name script-name --env some-env --legacy-env false"
				);

				expect(std.out).toMatchInlineSnapshot(`
			"🌀 Creating the secret for the Worker \\"script-name\\" (some-env)
			✨ Success! Uploaded secret the-key"
		`);
				expect(std.err).toMatchInlineSnapshot(`""`);
			});

			it("should error without a script name", async () => {
				let error: Error | undefined;
				try {
					await runWrangler("secret put the-key");
				} catch (e) {
					error = e as Error;
				}
				expect(std.out).toMatchInlineSnapshot(`
			          "
			          [32mIf you think this is a bug then please create an issue at https://github.com/cloudflare/wrangler2/issues/new/choose[0m"
		        `);
				expect(std.err).toMatchInlineSnapshot(`
			"[31mX [41;31m[[41;97mERROR[41;31m][0m [1mRequired Worker name missing. Please specify the Worker name in wrangler.toml, or pass it as an argument with \`--name <worker-name>\`[0m

			"
		`);
				expect(error).toMatchInlineSnapshot(
					`[Error: Required Worker name missing. Please specify the Worker name in wrangler.toml, or pass it as an argument with \`--name <worker-name>\`]`
				);
			});
		});

		describe("non-interactive", () => {
			const mockStdIn = useMockStdin({ isTTY: false });

			it("should trim stdin secret value, from piped input", async () => {
				mockPutRequest({ name: "the-key", text: "the-secret" });
				// Pipe the secret in as three chunks to test that we reconstitute it correctly.
				mockStdIn.send(
					`the`,
					`-`,
					`secret
          ` // whitespace & newline being removed
				);
				await runWrangler("secret put the-key --name script-name");

				expect(std.out).toMatchInlineSnapshot(`
			"🌀 Creating the secret for the Worker \\"script-name\\"
			✨ Success! Uploaded secret the-key"
		`);
				expect(std.warn).toMatchInlineSnapshot(`""`);
				expect(std.err).toMatchInlineSnapshot(`""`);
			});

			it("should create a secret, from piped input", async () => {
				mockPutRequest({ name: "the-key", text: "the-secret" });
				// Pipe the secret in as three chunks to test that we reconstitute it correctly.
				mockStdIn.send("the", "-", "secret");
				await runWrangler("secret put the-key --name script-name");

				expect(std.out).toMatchInlineSnapshot(`
			"🌀 Creating the secret for the Worker \\"script-name\\"
			✨ Success! Uploaded secret the-key"
		`);
				expect(std.warn).toMatchInlineSnapshot(`""`);
				expect(std.err).toMatchInlineSnapshot(`""`);
			});

			it("should error if the piped input fails", async () => {
				mockPutRequest({ name: "the-key", text: "the-secret" });
				mockStdIn.throwError(new Error("Error in stdin stream"));
				await expect(
					runWrangler("secret put the-key --name script-name")
				).rejects.toThrowErrorMatchingInlineSnapshot(`"Error in stdin stream"`);

				expect(std.out).toMatchInlineSnapshot(`
			          "
			          [32mIf you think this is a bug then please create an issue at https://github.com/cloudflare/wrangler2/issues/new/choose[0m"
		        `);
				expect(std.warn).toMatchInlineSnapshot(`""`);
			});

			describe("with accountId", () => {
				mockAccountId({ accountId: null });

				it("should error if request for memberships fails", async () => {
					mockGetMembershipsFail();
					await expect(
						runWrangler("secret put the-key --name script-name")
					).rejects.toThrowErrorMatchingInlineSnapshot(
						`"A request to the Cloudflare API (/memberships) failed."`
					);
				});

				it("should error if a user has no account", async () => {
					mockGetMemberships([]);
					await expect(runWrangler("secret put the-key --name script-name"))
						.rejects.toThrowErrorMatchingInlineSnapshot(`
                  "Failed to automatically retrieve account IDs for the logged in user.
                  In a non-interactive environment, it is mandatory to specify an account ID, either by assigning its value to CLOUDFLARE_ACCOUNT_ID, or as \`account_id\` in your \`wrangler.toml\` file."
                `);
				});

				it("should use the account from wrangler.toml", async () => {
					fs.writeFileSync(
						"wrangler.toml",
						TOML.stringify({
							account_id: "some-account-id",
						}),
						"utf-8"
					);
					mockStdIn.send("the-secret");
					mockPutRequest({ name: "the-key", text: "the-secret" });
					await runWrangler("secret put the-key --name script-name");
					expect(std.out).toMatchInlineSnapshot(`
				"🌀 Creating the secret for the Worker \\"script-name\\"
				✨ Success! Uploaded secret the-key"
			`);
					expect(std.warn).toMatchInlineSnapshot(`""`);
					expect(std.err).toMatchInlineSnapshot(`""`);
				});

				it("should error if a user has multiple accounts, and has not specified an account in wrangler.toml", async () => {
					mockGetMemberships([
						{
							id: "1",
							account: { id: "account-id-1", name: "account-name-1" },
						},
						{
							id: "2",
							account: { id: "account-id-2", name: "account-name-2" },
						},
						{
							id: "3",
							account: { id: "account-id-3", name: "account-name-3" },
						},
					]);

					await expect(runWrangler("secret put the-key --name script-name"))
						.rejects.toThrowErrorMatchingInlineSnapshot(`
                  "More than one account available but unable to select one in non-interactive mode.
                  Please set the appropriate \`account_id\` in your \`wrangler.toml\` file.
                  Available accounts are (\\"<name>\\" - \\"<id>\\"):
                    \\"account-name-1\\" - \\"account-id-1\\")
                    \\"account-name-2\\" - \\"account-id-2\\")
                    \\"account-name-3\\" - \\"account-id-3\\")"
                `);
				});
			});
		});
	});

	describe("delete", () => {
		function mockDeleteRequest(
			input: {
				scriptName: string;
				secretName: string;
			},
			env?: string,
			legacyEnv = false
		) {
			const servicesOrScripts = env && !legacyEnv ? "services" : "scripts";
			const environment = env && !legacyEnv ? "/environments/:envName" : "";
			setMockResponse(
				`/accounts/:accountId/workers/${servicesOrScripts}/:scriptName${environment}/secrets/:secretName`,
				"DELETE",
				([_url, accountId, scriptName, envOrSecretName, secretName]) => {
					expect(accountId).toEqual("some-account-id");
					expect(scriptName).toEqual(
						legacyEnv && env ? `script-name-${env}` : "script-name"
					);
					if (!legacyEnv) {
						if (env) {
							expect(envOrSecretName).toEqual(env);
							expect(secretName).toEqual(input.secretName);
						} else {
							expect(envOrSecretName).toEqual(input.secretName);
						}
					} else {
						expect(envOrSecretName).toEqual(input.secretName);
					}
					return null;
				}
			);
		}
		it("should delete a secret", async () => {
			mockDeleteRequest({ scriptName: "script-name", secretName: "the-key" });
			mockConfirm({
				text: "Are you sure you want to permanently delete the secret the-key on the Worker script-name?",
				result: true,
			});
			await runWrangler("secret delete the-key --name script-name");
			expect(std.out).toMatchInlineSnapshot(`
			"🌀 Deleting the secret the-key on the Worker script-name
			✨ Success! Deleted secret the-key"
		`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should delete a secret: legacy envs", async () => {
			mockDeleteRequest(
				{ scriptName: "script-name", secretName: "the-key" },
				"some-env",
				true
			);
			mockConfirm({
				text: "Are you sure you want to permanently delete the secret the-key on the Worker script-name-some-env?",
				result: true,
			});
			await runWrangler(
				"secret delete the-key --name script-name --env some-env --legacy-env"
			);
			expect(std.out).toMatchInlineSnapshot(`
			"🌀 Deleting the secret the-key on the Worker script-name-some-env
			✨ Success! Deleted secret the-key"
		`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should delete a secret: service envs", async () => {
			mockDeleteRequest(
				{ scriptName: "script-name", secretName: "the-key" },
				"some-env"
			);
			mockConfirm({
				text: "Are you sure you want to permanently delete the secret the-key on the Worker script-name (some-env)?",
				result: true,
			});
			await runWrangler(
				"secret delete the-key --name script-name --env some-env --legacy-env false"
			);
			expect(std.out).toMatchInlineSnapshot(`
			"🌀 Deleting the secret the-key on the Worker script-name (some-env)
			✨ Success! Deleted secret the-key"
		`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should error without a script name", async () => {
			let error: Error | undefined;

			try {
				await runWrangler("secret delete the-key");
			} catch (e) {
				error = e as Error;
			}
			expect(std.out).toMatchInlineSnapshot(`
			        "
			        [32mIf you think this is a bug then please create an issue at https://github.com/cloudflare/wrangler2/issues/new/choose[0m"
		      `);
			expect(std.err).toMatchInlineSnapshot(`
			"[31mX [41;31m[[41;97mERROR[41;31m][0m [1mRequired Worker name missing. Please specify the Worker name in wrangler.toml, or pass it as an argument with \`--name <worker-name>\`[0m

			"
		`);
			expect(error).toMatchInlineSnapshot(
				`[Error: Required Worker name missing. Please specify the Worker name in wrangler.toml, or pass it as an argument with \`--name <worker-name>\`]`
			);
		});
	});

	describe("list", () => {
		function mockListRequest(
			input: { scriptName: string },
			env?: string,
			legacyEnv = false
		) {
			const servicesOrScripts = env && !legacyEnv ? "services" : "scripts";
			const environment = env && !legacyEnv ? "/environments/:envName" : "";
			setMockResponse(
				`/accounts/:accountId/workers/${servicesOrScripts}/:scriptName${environment}/secrets`,
				"GET",
				([_url, accountId, scriptName, envName]) => {
					expect(accountId).toEqual("some-account-id");
					expect(scriptName).toEqual(
						legacyEnv && env ? `script-name-${env}` : "script-name"
					);
					if (!legacyEnv) {
						expect(envName).toEqual(env);
					}

					return [
						{
							name: "the-secret-name",
							type: "secret_text",
						},
					];
				}
			);
		}

		it("should list secrets", async () => {
			mockListRequest({ scriptName: "script-name" });
			await runWrangler("secret list --name script-name");
			expect(std.out).toMatchInlineSnapshot(`
			        "[
			          {
			            \\"name\\": \\"the-secret-name\\",
			            \\"type\\": \\"secret_text\\"
			          }
			        ]"
		      `);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should list secrets: legacy envs", async () => {
			mockListRequest({ scriptName: "script-name" }, "some-env", true);
			await runWrangler(
				"secret list --name script-name --env some-env --legacy-env"
			);
			expect(std.out).toMatchInlineSnapshot(`
			        "[
			          {
			            \\"name\\": \\"the-secret-name\\",
			            \\"type\\": \\"secret_text\\"
			          }
			        ]"
		      `);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should list secrets: service envs", async () => {
			mockListRequest({ scriptName: "script-name" }, "some-env");
			await runWrangler(
				"secret list --name script-name --env some-env --legacy-env false"
			);
			expect(std.out).toMatchInlineSnapshot(`
			        "[
			          {
			            \\"name\\": \\"the-secret-name\\",
			            \\"type\\": \\"secret_text\\"
			          }
			        ]"
		      `);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});

		it("should error without a script name", async () => {
			let error: Error | undefined;
			try {
				await runWrangler("secret list");
			} catch (e) {
				error = e as Error;
			}
			expect(std.out).toMatchInlineSnapshot(`
			        "
			        [32mIf you think this is a bug then please create an issue at https://github.com/cloudflare/wrangler2/issues/new/choose[0m"
		      `);
			expect(std.err).toMatchInlineSnapshot(`
			"[31mX [41;31m[[41;97mERROR[41;31m][0m [1mRequired Worker name missing. Please specify the Worker name in wrangler.toml, or pass it as an argument with \`--name <worker-name>\`[0m

			"
		`);
			expect(error).toMatchInlineSnapshot(
				`[Error: Required Worker name missing. Please specify the Worker name in wrangler.toml, or pass it as an argument with \`--name <worker-name>\`]`
			);
		});
	});
});
