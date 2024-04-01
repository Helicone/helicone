import { createFetchResult, setMockRawResponse } from "./mock-cfetch";
import type { NamespaceKeyInfo } from "../../kv/helpers";

export function mockKeyListRequest(
	expectedNamespaceId: string,
	expectedKeys: NamespaceKeyInfo[],
	keysPerRequest = 1000,
	blankCursorValue: "" | undefined | null = undefined
) {
	const requests = { count: 0 };
	// See https://api.cloudflare.com/#workers-kv-namespace-list-a-namespace-s-keys

	setMockRawResponse(
		"/accounts/:accountId/storage/kv/namespaces/:namespaceId/keys",
		"GET",
		([_url, accountId, namespaceId], _init, query) => {
			requests.count++;
			expect(accountId).toEqual("some-account-id");
			expect(namespaceId).toEqual(expectedNamespaceId);
			if (expectedKeys.length <= keysPerRequest) {
				return createFetchResult(expectedKeys);
			} else {
				const start = parseInt(query.get("cursor") ?? "0") || 0;
				const end = start + keysPerRequest;
				const cursor = end < expectedKeys.length ? end : blankCursorValue;
				return createFetchResult(expectedKeys.slice(start, end), true, [], [], {
					cursor,
				});
			}
		}
	);
	return requests;
}
