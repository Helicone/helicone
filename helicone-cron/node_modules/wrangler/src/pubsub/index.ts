import { fetchResult } from "../cfetch";

export const pubSubBetaWarning =
	"👷🏽 'wrangler pubsub ...' commands are currently in private beta. If your account isn't authorized, commands will fail. Visit the Pub/Sub docs for more info: https://developers.cloudflare.com/pub-sub/";

/**
 * Namespaces represent a collection of Pub/Sub Brokers.
 */
export interface PubSubNamespace {
	id?: string;
	name: string;
	description?: string;
	created_on?: string;
	modified_on?: string;
}

/**
 * A Pub/Sub Broker's on-publish hook configuration.
 */
export interface PubSubBrokerOnPublish {
	url: string;
}
/**
 * PubSubBroker represents a single Broker configuration and endpoint.
 */
export interface PubSubBroker {
	id?: string;
	name: string;
	description?: string;
	auth_type?: string;
	expiration?: number;
	created_on?: string;
	modified_on?: string;
	on_publish?: PubSubBrokerOnPublish;
}

/**
 * PubSubBrokerUpdate is the set of values that can be updated on an existing Broker.
 */
export interface PubSubBrokerUpdate {
	description?: string;
	expiration?: number;
	on_publish?: PubSubBrokerOnPublish;
}

/**
 * Fetch a list of all the Namespaces under the given `accountId`.
 */
export async function listPubSubNamespaces(
	accountId: string
): Promise<PubSubNamespace[]> {
	return await fetchResult<PubSubNamespace[]>(
		`/accounts/${accountId}/pubsub/namespaces`
	);
}

/**
 *
 * Create a Namespace with the given `namespace` within the account given by `accountId`.
 *
 * A HTTP 400 (Bad Request) is returned if this Namespace already exists, as
 * Namespaces are globally unique.
 */
export async function createPubSubNamespace(
	accountId: string,
	namespace: PubSubNamespace
): Promise<void> {
	return await fetchResult<void>(`/accounts/${accountId}/pubsub/namespaces`, {
		method: "POST",
		body: JSON.stringify(namespace),
	});
}

/**
 * Delete a Pub/Sub Namespace with the given `namespace` name.
 *
 * Deleting a namespace is destructive and should be done with care.
 */
export async function deletePubSubNamespace(
	accountId: string,
	namespace: string
): Promise<void> {
	return await fetchResult<void>(
		`/accounts/${accountId}/pubsub/namespaces/${namespace}`,
		{ method: "DELETE" }
	);
}

/**
 * Describe a single Pub/Sub Namespace by its `namespace` name.
 */
export async function describePubSubNamespace(
	accountId: string,
	namespace: string
): Promise<void> {
	return await fetchResult<void>(
		`/accounts/${accountId}/pubsub/namespaces/${namespace}`,
		{ method: "GET" }
	);
}

/**
 * Delete a Pub/Sub Broker with the given `broker` name within the associated `namespace`.
 *
 * Deleting a Broker is destructive and will immediately break all existing
 * connections to the Broker.
 */
export async function deletePubSubBroker(
	accountId: string,
	namespace: string,
	broker: string
): Promise<void> {
	return await fetchResult<void>(
		`/accounts/${accountId}/pubsub/namespaces/${namespace}/brokers/${broker}`,
		{ method: "DELETE" }
	);
}

/**
 * Describe a single Pub/Sub Broker for the given `broker` name within the associated `namespace`.
 */
export async function describePubSubBroker(
	accountId: string,
	namespace: string,
	broker: string
): Promise<void> {
	return await fetchResult<void>(
		`/accounts/${accountId}/pubsub/namespaces/${namespace}/brokers/${broker}`,
		{ method: "GET" }
	);
}

/**
 * Fetch a list of all the Pub/Sub Brokers under the given `namespace`.
 */
export async function listPubSubBrokers(
	accountId: string,
	namespace: string
): Promise<PubSubBroker[]> {
	return await fetchResult<PubSubBroker[]>(
		`/accounts/${accountId}/pubsub/namespaces/${namespace}/brokers`
	);
}

/**
 * Create a Pub/Sub Broker within given `namespace`.
 */
export async function createPubSubBroker(
	accountId: string,
	namespace: string,
	broker: PubSubBroker
): Promise<void> {
	return await fetchResult<void>(
		`/accounts/${accountId}/pubsub/namespaces/${namespace}/brokers`,
		{ method: "POST", body: JSON.stringify(broker) }
	);
}

/**
 * Update a Pub/Sub Broker configuration.
 */
export async function updatePubSubBroker(
	accountId: string,
	namespace: string,
	broker: string,
	update: PubSubBrokerUpdate
): Promise<void> {
	return await fetchResult<void>(
		`/accounts/${accountId}/pubsub/namespaces/${namespace}/brokers/${broker}`,
		{ method: "PATCH", body: JSON.stringify(update) }
	);
}

/**
 * Get the public keys uniquely associated with a Pub/Sub Broker.
 *
 * These keys can be used for verifying Pub/Sub on-publish hooks over HTTPS.
 */
export async function getPubSubBrokerPublicKeys(
	accountId: string,
	namespace: string,
	broker: string
): Promise<Record<string, string>> {
	return await fetchResult<Record<string, string>>(
		`/accounts/${accountId}/pubsub/namespaces/${namespace}/brokers/${broker}/publickeys`
	);
}

/**
 * Issue client credentials for the given `broker`.
 *
 * Multiple credentials can be generated at once by providing a `number`.
 */
export async function issuePubSubBrokerTokens(
	accountId: string,
	namespace: string,
	broker: string,
	number: number,
	type: string,
	clientIds?: string[],
	expiration?: number
): Promise<Record<string, string>> {
	let url = `/accounts/${accountId}/pubsub/namespaces/${namespace}/brokers/${broker}/credentials`;

	const params = new URLSearchParams();
	params.append("number", `${number}`);
	params.append("type", type);

	if (clientIds) {
		for (const id of clientIds) {
			params.append("clientid", id);
		}
	}

	if (expiration) {
		params.append("expiration", `${expiration}`);
	}

	// We have to concat these as the URL class requires a base URL, which we
	// don't know within the scope of this function.
	url = url + `?${params.toString()}`;

	return await fetchResult<Record<string, string>>(url);
}

/**
 * Revoke client credentials for the given `broker`.
 *
 * Credentials are revoked based on the JTI (a unique ID for each token).
 * Multiple credentials can be revoked at once.
 */
export async function revokePubSubBrokerTokens(
	accountId: string,
	namespace: string,
	broker: string,
	jti: string[]
): Promise<void> {
	let url = `/accounts/${accountId}/pubsub/namespaces/${namespace}/brokers/${broker}/revocations`;

	const params = new URLSearchParams();
	for (const j of jti) {
		params.append("jti", j);
	}

	url = url + `?${params.toString()}`;
	return await fetchResult<void>(url, { method: "POST", body: "" });
}

/**
 *
 * Unrevoke client credentials for the given `broker`.
 *
 * This deletes an existing revocation, allowing the credentials to be used again.
 * Credentials that have expired may be unrevoked, but will no longer be valid.
 */
export async function unrevokePubSubBrokerTokens(
	accountId: string,
	namespace: string,
	broker: string,
	jti: string[]
): Promise<void> {
	let url = `/accounts/${accountId}/pubsub/namespaces/${namespace}/brokers/${broker}/revocations`;
	const params = new URLSearchParams();
	for (const j of jti) {
		params.append("jti", j);
	}

	url = url + `?${params.toString()}`;
	return await fetchResult<void>(url, { method: "DELETE" });
}

/**
 *
 * List revoked client credentials for the given `broker`.
 *
 * This shows all existing revocations against a Broker.
 */
export async function listRevokedPubSubBrokerTokens(
	accountId: string,
	namespace: string,
	broker: string
): Promise<void> {
	return await fetchResult<void>(
		`/accounts/${accountId}/pubsub/namespaces/${namespace}/brokers/${broker}/revocations`
	);
}
