import { mockAccountId, mockApiToken } from "./helpers/mock-account-id";
import { setMockResponse, unsetAllMocks } from "./helpers/mock-cfetch";
import { mockConsoleMethods } from "./helpers/mock-console";
import { runInTempDir } from "./helpers/run-in-tmp";
import { runWrangler } from "./helpers/run-wrangler";
import type {
	PubSubNamespace,
	PubSubBroker,
	PubSubBrokerUpdate,
	PubSubBrokerOnPublish,
} from "../pubsub";

describe("wrangler", () => {
	mockAccountId();
	mockApiToken();
	runInTempDir();
	const std = mockConsoleMethods();

	afterEach(() => {
		unsetAllMocks();
	});

	describe("pubsub", () => {
		describe("help menu", () => {
			it("shows usage details", async () => {
				await runWrangler("pubsub --help");
				expect(std).toMatchInlineSnapshot(`
			Object {
			  "debug": "",
			  "err": "",
			  "out": "wrangler pubsub

			📮 Interact and manage Pub/Sub Brokers

			Commands:
			  wrangler pubsub namespace  Manage your Pub/Sub Namespaces
			  wrangler pubsub broker     Interact with your Pub/Sub Brokers

			Flags:
			  -c, --config   Path to .toml configuration file  [string]
			  -e, --env      Environment to use for operations and .env files  [string]
			  -h, --help     Show help  [boolean]
			  -v, --version  Show version number  [boolean]

			👷🏽 'wrangler pubsub ...' commands are currently in private beta. If your account isn't authorized, commands will fail. Visit the Pub/Sub docs for more info: https://developers.cloudflare.com/pub-sub/",
			  "warn": "",
			}
		`);
			});
		});

		describe("namespaces", () => {
			describe("help menu", () => {
				it("shows usage details", async () => {
					await runWrangler("pubsub namespace --help");
					expect(std).toMatchInlineSnapshot(`
				Object {
				  "debug": "",
				  "err": "",
				  "out": "wrangler pubsub namespace

				Manage your Pub/Sub Namespaces

				Commands:
				  wrangler pubsub namespace create <name>    Create a new Pub/Sub Namespace
				  wrangler pubsub namespace list             List your existing Pub/Sub Namespaces
				  wrangler pubsub namespace delete <name>    Delete a Pub/Sub Namespace
				  wrangler pubsub namespace describe <name>  Describe a Pub/Sub Namespace

				Flags:
				  -c, --config   Path to .toml configuration file  [string]
				  -e, --env      Environment to use for operations and .env files  [string]
				  -h, --help     Show help  [boolean]
				  -v, --version  Show version number  [boolean]

				👷🏽 'wrangler pubsub ...' commands are currently in private beta. If your account isn't authorized, commands will fail. Visit the Pub/Sub docs for more info: https://developers.cloudflare.com/pub-sub/",
				  "warn": "",
				}
			`);
				});
			});

			describe("create", () => {
				function mockCreateRequest(expectedNamespaceName: string) {
					const requests = { count: 0 };
					setMockResponse(
						"/accounts/:accountId/pubsub/namespaces",
						"POST",
						([_url, accountId], { body }) => {
							expect(accountId).toEqual("some-account-id");
							const namespaceName = JSON.parse(body as string).name;
							expect(namespaceName).toEqual(expectedNamespaceName);
							requests.count += 1;
						}
					);
					return requests;
				}

				it("should create a namespace", async () => {
					const requests = mockCreateRequest("my-namespace");
					await runWrangler("pubsub namespace create my-namespace");
					// TODO: check returned object
					expect(requests.count).toEqual(1);
				});
			});

			describe("list", () => {
				function mockListRequest(namespaces: PubSubNamespace[]) {
					const requests = { count: 0 };
					setMockResponse(
						"/accounts/:accountId/pubsub/namespaces",
						([_url, accountId], init) => {
							requests.count++;
							expect(accountId).toEqual("some-account-id");
							expect(init).toEqual({});
							return { namespaces };
						}
					);
					return requests;
				}

				it("should list namespaces", async () => {
					const expectedNamespaces: PubSubNamespace[] = [
						{ name: "namespace-1", created_on: "01-01-2001" },
						{ name: "namespace-2", created_on: "01-01-2001" },
					];
					const requests = mockListRequest(expectedNamespaces);
					await runWrangler("pubsub namespace list");

					expect(std.err).toMatchInlineSnapshot(`""`);
					// TODO(elithrar): check returned object
					expect(requests.count).toEqual(1);
				});
			});
		});

		describe("brokers", () => {
			describe("help menu", () => {
				it("shows usage details", async () => {
					await runWrangler("pubsub broker --help");
					expect(std).toMatchInlineSnapshot(`
				Object {
				  "debug": "",
				  "err": "",
				  "out": "wrangler pubsub broker

				Interact with your Pub/Sub Brokers

				Commands:
				  wrangler pubsub broker create <name>            Create a new Pub/Sub Broker
				  wrangler pubsub broker update <name>            Update an existing Pub/Sub Broker's configuration.
				  wrangler pubsub broker list                     List the Pub/Sub Brokers within a Namespace
				  wrangler pubsub broker delete <name>            Delete an existing Pub/Sub Broker
				  wrangler pubsub broker describe <name>          Describe an existing Pub/Sub Broker.
				  wrangler pubsub broker issue <name>             Issue new client credentials for a specific Pub/Sub Broker.
				  wrangler pubsub broker revoke <name>            Revoke a set of active client credentials associated with the given Broker
				  wrangler pubsub broker unrevoke <name>          Restore access to a set of previously revoked client credentials.
				  wrangler pubsub broker show-revocations <name>  Show all previously revoked client credentials.
				  wrangler pubsub broker public-keys <name>       Show the public keys used for verifying on-publish hooks and credentials for a Broker.

				Flags:
				  -c, --config   Path to .toml configuration file  [string]
				  -e, --env      Environment to use for operations and .env files  [string]
				  -h, --help     Show help  [boolean]
				  -v, --version  Show version number  [boolean]

				👷🏽 'wrangler pubsub ...' commands are currently in private beta. If your account isn't authorized, commands will fail. Visit the Pub/Sub docs for more info: https://developers.cloudflare.com/pub-sub/",
				  "warn": "",
				}
			`);
				});
			});

			describe("create", () => {
				function mockCreateRequest(expectedBrokerName: string) {
					const requests = { count: 0 };
					setMockResponse(
						"/accounts/:accountId/pubsub/namespaces/:namespaceName/brokers",
						"POST",
						([_url, accountId, namespaceName], { body }) => {
							expect(accountId).toEqual("some-account-id");
							expect(namespaceName).toEqual("some-namespace");
							const brokerName = JSON.parse(body as string).name;
							expect(brokerName).toEqual(expectedBrokerName);
							requests.count += 1;
						}
					);
					return requests;
				}

				it("should create a broker", async () => {
					const requests = mockCreateRequest("my-broker");
					await runWrangler(
						"pubsub broker create my-broker --namespace=some-namespace"
					);

					// TODO: check returned object
					expect(requests.count).toEqual(1);
				});

				it("fail to create broker when no namespace is set", async () => {
					await expect(
						runWrangler("pubsub broker create my-broker")
					).rejects.toThrowErrorMatchingInlineSnapshot(
						`"Missing required argument: namespace"`
					);
				});
			});

			describe("update", () => {
				function mockUpdateRequest(
					expectedBrokerName: string,
					expectedExpiration: number,
					expectedDescription: string,
					expectedOnPublishConfig: PubSubBrokerOnPublish
				) {
					const requests = { count: 0 };
					setMockResponse(
						"/accounts/:accountId/pubsub/namespaces/:namespaceName/brokers/:brokerName",
						"PATCH",
						([_url, accountId, namespaceName, brokerName], { body }) => {
							expect(accountId).toEqual("some-account-id");
							expect(namespaceName).toEqual("some-namespace");
							expect(brokerName).toEqual(expectedBrokerName);

							const patchBody: PubSubBrokerUpdate = JSON.parse(body as string);
							expect(patchBody.expiration).toEqual(expectedExpiration);
							expect(patchBody.description).toEqual(expectedDescription);
							expect(patchBody.on_publish).toEqual(expectedOnPublishConfig);

							requests.count += 1;
						}
					);
					return requests;
				}

				it("should update a broker's properties", async () => {
					const expectedOnPublish: PubSubBrokerOnPublish = {
						url: "https://foo.bar.example.com",
					};
					const requests = mockUpdateRequest(
						"my-broker",
						86400,
						"hello",
						expectedOnPublish
					);
					await runWrangler(
						"pubsub broker update my-broker --namespace=some-namespace --expiration=24h --description='hello' --on-publish-url='https://foo.bar.example.com'"
					);

					expect(std.err).toMatchInlineSnapshot(`""`);
					// TODO(elithrar): check returned object
					expect(requests.count).toEqual(1);
				});
			});

			describe("list", () => {
				function mockListRequest(brokers: PubSubBroker[]) {
					const requests = { count: 0 };
					setMockResponse(
						"/accounts/:accountId/pubsub/namespaces/:namespaceName/brokers",
						([_url, accountId, namespaceName], init) => {
							requests.count++;
							expect(accountId).toEqual("some-account-id");
							expect(namespaceName).toEqual("some-namespace");
							expect(init).toEqual({});
							return { brokers };
						}
					);
					return requests;
				}

				it("should list brokers", async () => {
					const expectedBrokers: PubSubBroker[] = [
						{ name: "broker-1", created_on: "01-01-2001" },
						{ name: "broker-2", created_on: "01-01-2001" },
					];
					const requests = mockListRequest(expectedBrokers);
					await runWrangler("pubsub broker list --namespace=some-namespace");

					expect(std.err).toMatchInlineSnapshot(`""`);
					// TODO(elithrar): check returned object
					expect(requests.count).toEqual(1);
				});
			});

			describe("describe", () => {
				function mockGetRequest(broker: PubSubBroker) {
					const requests = { count: 0 };
					setMockResponse(
						"/accounts/:accountId/pubsub/namespaces/:namespaceName/brokers/:brokerName",
						([_url, accountId, namespaceName, brokerName]) => {
							requests.count++;
							expect(accountId).toEqual("some-account-id");
							expect(namespaceName).toEqual("some-namespace");
							expect(brokerName).toEqual(broker.name);
							return { result: broker };
						}
					);
					return requests;
				}

				it("should describe a single broker", async () => {
					const requests = mockGetRequest({ id: "1234", name: "my-broker" });
					await runWrangler(
						"pubsub broker describe my-broker --namespace=some-namespace"
					);

					expect(std.err).toMatchInlineSnapshot(`""`);
					// TODO(elithrar): check returned object
					expect(requests.count).toEqual(1);
				});
			});

			describe("issue", () => {
				function mockIssueRequest(expectedBrokerName: string) {
					const requests = { count: 0 };
					setMockResponse(
						"/accounts/:accountId/pubsub/namespaces/:namespaceName/brokers/:brokerName/credentials",
						([_url, accountId, namespaceName, brokerName]) => {
							expect(accountId).toEqual("some-account-id");
							expect(namespaceName).toEqual("some-namespace");
							expect(brokerName).toEqual(expectedBrokerName);
							requests.count += 1;
						}
					);
					return requests;
				}

				it("should issue a token for the broker", async () => {
					const requests = mockIssueRequest("my-broker");
					await runWrangler(
						"pubsub broker issue my-broker --namespace=some-namespace"
					);

					expect(std.err).toMatchInlineSnapshot(`""`);
					// TODO(elithrar): check returned object
					expect(requests.count).toEqual(1);
				});
			});

			describe("public-keys", () => {
				function mockIssueRequest(expectedBrokerName: string) {
					const requests = { count: 0 };
					setMockResponse(
						"/accounts/:accountId/pubsub/namespaces/:namespaceName/brokers/:brokerName/publickeys",
						([_url, accountId, namespaceName, brokerName]) => {
							expect(accountId).toEqual("some-account-id");
							expect(namespaceName).toEqual("some-namespace");
							expect(brokerName).toEqual(expectedBrokerName);
							requests.count += 1;
						}
					);
					return requests;
				}

				it("should return the public keys for a broker", async () => {
					const requests = mockIssueRequest("my-broker");
					await runWrangler(
						"pubsub broker public-keys my-broker --namespace=some-namespace"
					);

					expect(std.err).toMatchInlineSnapshot(`""`);
					// TODO(elithrar): check returned object
					expect(requests.count).toEqual(1);
				});
			});
		});
	});
});
