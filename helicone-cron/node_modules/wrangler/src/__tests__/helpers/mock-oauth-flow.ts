import fetchMock from "jest-fetch-mock";
import { Request } from "undici";
import openInBrowser from "../../open-in-browser";
import {
	createFetchResult,
	setMockRawResponse,
	setMockResponse,
} from "./mock-cfetch";
import { mockHttpServer } from "./mock-http-server";

export function mockGetMemberships(
	accounts: { id: string; account: { id: string; name: string } }[]
) {
	setMockResponse("/memberships", "GET", () => {
		return accounts;
	});
}

export function mockGetMembershipsFail() {
	setMockRawResponse("/memberships", () => {
		return createFetchResult([], false);
	});
}

// the response to send when wrangler wants an oauth grant
let oauthGrantResponse: GrantResponseOptions | "timeout" = {};

/**
 * Functions to help with mocking various parts of the OAuth Flow
 */
export const mockOAuthFlow = () => {
	const fetchHttp = mockHttpServer();

	afterEach(() => {
		fetchMock.resetMocks();
	});

	/**
	 * Mock out the callback from a browser to our HttpServer.
	 *
	 * This function will override `openInBrowser()` so that instead of opening a browser window
	 * at the OAuth URL, it will automatically trigger the callback URL on the mock HttpServer that
	 * we have created as part of the call to `mockOAuthFlow()`.
	 */
	const mockOAuthServerCallback = (
		respondWith?: "timeout" | "success" | "failure" | GrantResponseOptions
	) => {
		(
			openInBrowser as jest.MockedFunction<typeof openInBrowser>
		).mockImplementation(async (url: string) => {
			if (respondWith) mockGrantAuthorization({ respondWith });
			// We don't support the grant response timing out.
			if (oauthGrantResponse === "timeout") {
				throw "unimplemented";
			}

			// Create a fake callback request that would be created by the OAuth server
			const { searchParams } = new URL(url);
			const queryParams = toQueryParams(oauthGrantResponse, searchParams);
			const request = new Request(
				`${searchParams.get("redirect_uri")}?${queryParams}`
			);

			// Trigger the mock HttpServer to handle this fake request to continue the OAuth flow.
			fetchHttp(request).catch((e) => {
				throw new Error(
					"Failed to send OAuth Grant to wrangler, maybe the server was closed?",
					e as Error
				);
			});
		});
	};

	//TODO: this can just handled in `mockOAuthServerCallback`
	const mockGrantAuthorization = ({
		respondWith,
	}: {
		respondWith: "timeout" | "success" | "failure" | GrantResponseOptions;
	}) => {
		if (respondWith === "failure") {
			oauthGrantResponse = {
				error: "access_denied",
			};
		} else if (respondWith === "success") {
			oauthGrantResponse = {
				code: "test-oauth-code",
			};
		} else if (respondWith === "timeout") {
			oauthGrantResponse = "timeout";
		} else {
			oauthGrantResponse = respondWith;
		}
	};

	const mockRevokeAuthorization = () => {
		const outcome = {
			actual: new Request("https://example.org"),
			expected: new Request("https://dash.cloudflare.com/oauth2/revoke", {
				method: "POST",
			}),
		};

		fetchMock.mockIf(outcome.expected.url, async (req) => {
			// TODO: update Miniflare typings to match full undici Request
			outcome.actual = req as unknown as Request;
			return "";
		});

		return outcome;
	};

	const mockGrantAccessToken = ({
		respondWith,
	}: {
		respondWith: MockTokenResponse;
	}) => {
		const outcome = {
			actual: new Request("https://example.org"),
			expected: new Request("https://dash.cloudflare.com/oauth2/token", {
				method: "POST",
			}),
		};

		fetchMock.mockOnceIf(outcome.expected.url, async (req) => {
			// TODO: update Miniflare typings to match full undici Request
			outcome.actual = req as unknown as Request;
			return makeTokenResponse(respondWith);
		});

		return outcome;
	};

	const mockExchangeRefreshTokenForAccessToken = ({
		respondWith,
	}: {
		respondWith: "refreshSuccess" | "refreshError" | "badResponse";
	}) => {
		fetchMock.mockOnceIf(
			"https://dash.cloudflare.com/oauth2/token",
			async () => {
				switch (respondWith) {
					case "refreshSuccess":
						return {
							status: 200,
							body: JSON.stringify({
								access_token: "access_token_success_mock",
								expires_in: 1701,
								refresh_token: "refresh_token_sucess_mock",
								scope: "scope_success_mock",
								token_type: "bearer",
							}),
						};
					case "refreshError":
						return {
							status: 400,
							body: JSON.stringify({
								error: "invalid_request",
								error_description: "error_description_mock",
								error_hint: "error_hint_mock",
								error_verbose: "error_verbose_mock",
								status_code: 400,
							}),
						};
					case "badResponse":
						return {
							status: 400,
							body: `<html> <body> This shouldn't be sent, but should be handled </body> </html>`,
						};

					default:
						return "Not a respondWith option for `mockExchangeRefreshTokenForAccessToken`";
				}
			}
		);
	};

	return {
		mockGrantAccessToken,
		mockGrantAuthorization,
		mockOAuthServerCallback,
		mockRevokeAuthorization,
		mockExchangeRefreshTokenForAccessToken,
	};
};

type GrantResponseOptions = {
	code?: string;
	error?: ErrorType | ErrorType[];
};

const toQueryParams = (
	{ code, error }: GrantResponseOptions,
	wranglerRequestParams: URLSearchParams
): string => {
	const queryParams = [];
	if (code) {
		queryParams.push(`code=${code}`);
	}
	if (error) {
		const stringifiedErr = Array.isArray(error) ? error.join(",") : error;
		queryParams.push(`error=${stringifiedErr}`);
	}

	queryParams.push(`state=${wranglerRequestParams.get("state")}`);

	return queryParams.join("&");
};

type ErrorType =
	| "invalid_request"
	| "invalid_grant"
	| "unauthorized_client"
	| "access_denied"
	| "unsupported_response_type"
	| "invalid_scope"
	| "server_error"
	| "temporarily_unavailable"
	| "invalid_client"
	| "unsupported_grant_type"
	| "invalid_json"
	| "invalid_token"
	| "test-token-grant-error";

type MockTokenResponse =
	| "ok"
	| "error"
	| {
			access_token: string;
			expires_in: number;
			refresh_token: string;
			scope: string;
	  }
	| {
			error: ErrorType;
	  };

const makeTokenResponse = (partialResponse: MockTokenResponse): string => {
	let fullResponse: MockTokenResponse;

	if (partialResponse === "ok") {
		fullResponse = {
			access_token: "test-access-token",
			expires_in: 100000,
			refresh_token: "test-refresh-token",
			scope: "account:read",
		};
	} else if (partialResponse === "error") {
		fullResponse = {
			error: "test-token-grant-error",
		};
	} else {
		fullResponse = partialResponse;
	}

	return JSON.stringify(fullResponse);
};
