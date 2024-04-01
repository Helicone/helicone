import { rest } from "msw";

export const mswSuccessOauthHandlers = [
	rest.all("*/oauth/callback", (_, response, context) => {
		return response.once(
			context.status(200),
			context.json({
				success: true,
				errors: [],
				messages: [],
				code: "test-oauth-code",
			})
		);
	}),
	// revoke access token
	rest.post("*/oauth2/revoke", (_, response, context) =>
		response.once(context.status(200), context.text(""))
	),
	// exchange (auth code | refresh token) for access token
	rest.post("*/oauth2/token", (_, response, context) => {
		return response.once(
			context.status(200),
			context.json({
				access_token: "test-access-token",
				expires_in: 100000,
				refresh_token: "test-refresh-token",
				scope: "account:read",
			})
		);
	}),
];
