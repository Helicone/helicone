/* Based heavily on code from https://github.com/BitySA/oauth2-auth-code-pkce */

/*

                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright [yyyy] [name of copyright owner]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
  */

import assert from "node:assert";
import { webcrypto as crypto } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import url from "node:url";
import { TextEncoder } from "node:util";
import TOML from "@iarna/toml";
import { HostURL } from "@webcontainer/env";
import { render } from "ink";
import Table from "ink-table";
import React from "react";
import { fetch } from "undici";
import {
	getConfigCache,
	purgeConfigCaches,
	saveToConfigCache,
} from "../config-cache";
import { getGlobalWranglerConfigPath } from "../global-wrangler-config-path";
import { CI } from "../is-ci";
import isInteractive from "../is-interactive";
import { logger } from "../logger";
import openInBrowser from "../open-in-browser";
import { parseTOML, readFileSync } from "../parse";
import { ChooseAccount, getAccountChoices } from "./choose-account";
import { getAuthFromEnv } from "./env-vars";
import { generateAuthUrl } from "./generate-auth-url";
import { generateRandomState } from "./generate-random-state";
import type { ApiCredentials } from "./env-vars";
import type { ParsedUrlQuery } from "node:querystring";

/**
 * An implementation of rfc6749#section-4.1 and rfc7636.
 */

interface PKCECodes {
	codeChallenge: string;
	codeVerifier: string;
}

/**
 * The module level state of the authentication flow.
 */
interface State extends AuthTokens {
	authorizationCode?: string;
	codeChallenge?: string;
	codeVerifier?: string;
	hasAuthCodeBeenExchangedForAccessToken?: boolean;
	stateQueryParam?: string;
	scopes?: Scope[];
}

/**
 * The tokens related to authentication.
 */
interface AuthTokens {
	accessToken?: AccessToken;
	refreshToken?: RefreshToken;
	scopes?: Scope[];
	/** @deprecated - this field was only provided by the deprecated `wrangler1 config` command. */
	apiToken?: string;
}

/**
 * The path to the config file that holds user authentication data,
 * relative to the user's home directory.
 */
export const USER_AUTH_CONFIG_FILE = "config/default.toml";

/**
 * The data that may be read from the `USER_CONFIG_FILE`.
 */
export interface UserAuthConfig {
	oauth_token?: string;
	refresh_token?: string;
	expiration_time?: string;
	scopes?: string[];
	/** @deprecated - this field was only provided by the deprecated `wrangler1 config` command. */
	api_token?: string;
}

interface RefreshToken {
	value: string;
}

interface AccessToken {
	value: string;
	expiry: string;
}

const Scopes = {
	"account:read":
		"See your account info such as account details, analytics, and memberships.",
	"user:read":
		"See your user info such as name, email address, and account memberships.",
	"workers:write":
		"See and change Cloudflare Workers data such as zones, KV storage, namespaces, scripts, and routes.",
	"workers_kv:write":
		"See and change Cloudflare Workers KV Storage data such as keys and namespaces.",
	"workers_routes:write":
		"See and change Cloudflare Workers data such as filters and routes.",
	"workers_scripts:write":
		"See and change Cloudflare Workers scripts, durable objects, subdomains, triggers, and tail data.",
	"workers_tail:read": "See Cloudflare Workers tail and script data.",
	"d1:write": "See and change D1 Databases.",
	"pages:write":
		"See and change Cloudflare Pages projects, settings and deployments.",
	"zone:read": "Grants read level access to account zone.",
} as const;

/**
 * The possible keys for a Scope.
 *
 * "offline_access" is automatically included.
 */
type Scope = keyof typeof Scopes;

const ScopeKeys = Object.keys(Scopes) as Scope[];

export function validateScopeKeys(
	scopes: string[]
): scopes is typeof ScopeKeys {
	return scopes.every((scope) => scope in Scopes);
}

const CLIENT_ID = "54d11594-84e4-41aa-b438-e81b8fa78ee7";
const AUTH_URL = "https://dash.cloudflare.com/oauth2/auth";
const TOKEN_URL = "https://dash.cloudflare.com/oauth2/token";
const REVOKE_URL = "https://dash.cloudflare.com/oauth2/revoke";

/**
 * To allow OAuth callbacks in environments such as WebContainer we need to
 * create a host URL which only resolves `localhost` to a WebContainer
 * hostname if the process is running in a WebContainer. On local this will
 * be a no-op and it leaves the URL unmodified.
 *
 * @see https://www.npmjs.com/package/@webcontainer/env
 */
const CALLBACK_URL = HostURL.parse("http://localhost:8976/oauth/callback").href;

let LocalState: State = {
	...getAuthTokens(),
};

/**
 * Compute the current auth tokens.
 */
function getAuthTokens(config?: UserAuthConfig): AuthTokens | undefined {
	// get refreshToken/accessToken from fs if exists
	try {
		// if the environment variable is available, we don't need to do anything here
		if (getAuthFromEnv()) return;

		// otherwise try loading from the user auth config file.
		const { oauth_token, refresh_token, expiration_time, scopes, api_token } =
			config || readAuthConfigFile();

		if (oauth_token) {
			return {
				accessToken: {
					value: oauth_token,
					// If there is no `expiration_time` field then set it to an old date, to cause it to expire immediately.
					expiry: expiration_time ?? "2000-01-01:00:00:00+00:00",
				},
				refreshToken: { value: refresh_token ?? "" },
				scopes: scopes as Scope[],
			};
		} else if (api_token) {
			logger.warn(
				"It looks like you have used Wrangler 1's `config` command to login with an API token.\n" +
					"This is no longer supported in the current version of Wrangler.\n" +
					"If you wish to authenticate via an API token then please set the `CLOUDFLARE_API_TOKEN` environment variable."
			);
			return { apiToken: api_token };
		}
	} catch {
		return undefined;
	}
}

/**
 * Run the initialisation of the auth state, in the case that something changed.
 *
 * This runs automatically whenever `writeAuthConfigFile` is run, so generally
 * you won't need to call it yourself.
 */
export function reinitialiseAuthTokens(): void;

/**
 * Reinitialise auth state from an in-memory config, skipping
 * over the part where we write a file and then read it back into memory
 */
export function reinitialiseAuthTokens(config: UserAuthConfig): void;

export function reinitialiseAuthTokens(config?: UserAuthConfig): void {
	LocalState = {
		...getAuthTokens(config),
	};
}

export function getAPIToken(): ApiCredentials | undefined {
	if (LocalState.apiToken) {
		return { apiToken: LocalState.apiToken };
	}

	const localAPIToken = getAuthFromEnv();
	if (localAPIToken) return localAPIToken;

	const storedAccessToken = LocalState.accessToken?.value;
	if (storedAccessToken) return { apiToken: storedAccessToken };

	return undefined;
}

interface AccessContext {
	token?: AccessToken;
	scopes?: Scope[];
	refreshToken?: RefreshToken;
}

/**
 * A list of OAuth2AuthCodePKCE errors.
 */
// To "namespace" all errors.
class ErrorOAuth2 extends Error {
	toString(): string {
		return "ErrorOAuth2";
	}
}

// For really unknown errors.
class ErrorUnknown extends ErrorOAuth2 {
	toString(): string {
		return "ErrorUnknown";
	}
}

// Some generic, internal errors that can happen.
class ErrorNoAuthCode extends ErrorOAuth2 {
	toString(): string {
		return "ErrorNoAuthCode";
	}
}
class ErrorInvalidReturnedStateParam extends ErrorOAuth2 {
	toString(): string {
		return "ErrorInvalidReturnedStateParam";
	}
}
class ErrorInvalidJson extends ErrorOAuth2 {
	toString(): string {
		return "ErrorInvalidJson";
	}
}

// Errors that occur across many endpoints
class ErrorInvalidScope extends ErrorOAuth2 {
	toString(): string {
		return "ErrorInvalidScope";
	}
}
class ErrorInvalidRequest extends ErrorOAuth2 {
	toString(): string {
		return "ErrorInvalidRequest";
	}
}
class ErrorInvalidToken extends ErrorOAuth2 {
	toString(): string {
		return "ErrorInvalidToken";
	}
}

/**
 * Possible authorization grant errors given by the redirection from the
 * authorization server.
 */
class ErrorAuthenticationGrant extends ErrorOAuth2 {
	toString(): string {
		return "ErrorAuthenticationGrant";
	}
}
class ErrorUnauthorizedClient extends ErrorAuthenticationGrant {
	toString(): string {
		return "ErrorUnauthorizedClient";
	}
}
class ErrorAccessDenied extends ErrorAuthenticationGrant {
	toString(): string {
		return "ErrorAccessDenied";
	}
}
class ErrorUnsupportedResponseType extends ErrorAuthenticationGrant {
	toString(): string {
		return "ErrorUnsupportedResponseType";
	}
}
class ErrorServerError extends ErrorAuthenticationGrant {
	toString(): string {
		return "ErrorServerError";
	}
}
class ErrorTemporarilyUnavailable extends ErrorAuthenticationGrant {
	toString(): string {
		return "ErrorTemporarilyUnavailable";
	}
}

/**
 * A list of possible access token response errors.
 */
class ErrorAccessTokenResponse extends ErrorOAuth2 {
	toString(): string {
		return "ErrorAccessTokenResponse";
	}
}
class ErrorInvalidClient extends ErrorAccessTokenResponse {
	toString(): string {
		return "ErrorInvalidClient";
	}
}
class ErrorInvalidGrant extends ErrorAccessTokenResponse {
	toString(): string {
		return "ErrorInvalidGrant";
	}
}
class ErrorUnsupportedGrantType extends ErrorAccessTokenResponse {
	toString(): string {
		return "ErrorUnsupportedGrantType";
	}
}

const RawErrorToErrorClassMap: { [_: string]: typeof ErrorOAuth2 } = {
	invalid_request: ErrorInvalidRequest,
	invalid_grant: ErrorInvalidGrant,
	unauthorized_client: ErrorUnauthorizedClient,
	access_denied: ErrorAccessDenied,
	unsupported_response_type: ErrorUnsupportedResponseType,
	invalid_scope: ErrorInvalidScope,
	server_error: ErrorServerError,
	temporarily_unavailable: ErrorTemporarilyUnavailable,
	invalid_client: ErrorInvalidClient,
	unsupported_grant_type: ErrorUnsupportedGrantType,
	invalid_json: ErrorInvalidJson,
	invalid_token: ErrorInvalidToken,
};

/**
 * Translate the raw error strings returned from the server into error classes.
 */
function toErrorClass(rawError: string): ErrorOAuth2 {
	return new (RawErrorToErrorClassMap[rawError] || ErrorUnknown)();
}

/**
 * The maximum length for a code verifier for the best security we can offer.
 * Please note the NOTE section of RFC 7636 § 4.1 - the length must be >= 43,
 * but <= 128, **after** base64 url encoding. This means 32 code verifier bytes
 * encoded will be 43 bytes, or 96 bytes encoded will be 128 bytes. So 96 bytes
 * is the highest valid value that can be used.
 */
const RECOMMENDED_CODE_VERIFIER_LENGTH = 96;

/**
 * A sensible length for the state's length, for anti-csrf.
 */
const RECOMMENDED_STATE_LENGTH = 32;

/**
 * Character set to generate code verifier defined in rfc7636.
 */
export const PKCE_CHARSET =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

/**
 * OAuth 2.0 client that ONLY supports authorization code flow, with PKCE.
 */

/**
 * If there is an error, it will be passed back as a rejected Promise.
 * If there is no code, the user should be redirected via
 * [fetchAuthorizationCode].
 */
function isReturningFromAuthServer(query: ParsedUrlQuery): boolean {
	if (query.error) {
		if (Array.isArray(query.error)) {
			throw toErrorClass(query.error[0]);
		}
		throw toErrorClass(query.error);
	}

	const code = query.code;
	if (!code) {
		return false;
	}

	const state = LocalState;

	const stateQueryParam = query.state;
	if (stateQueryParam !== state.stateQueryParam) {
		logger.warn(
			"Received query string parameter doesn't match the one sent! Possible malicious activity somewhere."
		);
		throw new ErrorInvalidReturnedStateParam();
	}
	assert(!Array.isArray(code));
	state.authorizationCode = code;
	state.hasAuthCodeBeenExchangedForAccessToken = false;
	return true;
}

export async function getAuthURL(scopes = ScopeKeys): Promise<string> {
	const { codeChallenge, codeVerifier } = await generatePKCECodes();
	const stateQueryParam = generateRandomState(RECOMMENDED_STATE_LENGTH);

	Object.assign(LocalState, {
		codeChallenge,
		codeVerifier,
		stateQueryParam,
	});

	return generateAuthUrl({
		authUrl: AUTH_URL,
		clientId: CLIENT_ID,
		callbackUrl: CALLBACK_URL,
		scopes,
		stateQueryParam,
		codeChallenge,
	});
}

type TokenResponse =
	| {
			access_token: string;
			expires_in: number;
			refresh_token: string;
			scope: string;
	  }
	| {
			error: string;
	  };

/**
 * Refresh an access token from the remote service.
 */
async function exchangeRefreshTokenForAccessToken(): Promise<AccessContext> {
	if (!LocalState.refreshToken) {
		logger.warn("No refresh token is present.");
	}

	const body =
		`grant_type=refresh_token&` +
		`refresh_token=${LocalState.refreshToken?.value}&` +
		`client_id=${CLIENT_ID}`;

	const response = await fetch(TOKEN_URL, {
		method: "POST",
		body,
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
	});

	if (response.status >= 400) {
		let tokenExchangeResErr = undefined;

		try {
			tokenExchangeResErr = await response.text();
			tokenExchangeResErr = JSON.parse(tokenExchangeResErr);
		} catch (e) {
			// If it can't parse to JSON ignore the error
		}

		if (tokenExchangeResErr !== undefined) {
			// We will throw the parsed error if it parsed correctly, otherwise we throw an unknown error.
			throw typeof tokenExchangeResErr === "string"
				? new Error(tokenExchangeResErr)
				: tokenExchangeResErr;
		} else {
			throw new ErrorUnknown(
				"Failed to parse Error from exchangeRefreshTokenForAccessToken"
			);
		}
	} else {
		try {
			const json = (await response.json()) as TokenResponse;
			if ("error" in json) {
				throw json.error;
			}

			const { access_token, expires_in, refresh_token, scope } = json;
			let scopes: Scope[] = [];

			const accessToken: AccessToken = {
				value: access_token,
				expiry: new Date(Date.now() + expires_in * 1000).toISOString(),
			};
			LocalState.accessToken = accessToken;

			if (refresh_token) {
				LocalState.refreshToken = {
					value: refresh_token,
				};
			}

			if (scope) {
				// Multiple scopes are passed and delimited by spaces,
				// despite using the singular name "scope".
				scopes = scope.split(" ") as Scope[];
				LocalState.scopes = scopes;
			}

			const accessContext: AccessContext = {
				token: accessToken,
				scopes,
				refreshToken: LocalState.refreshToken,
			};
			return accessContext;
		} catch (error) {
			if (typeof error === "string") {
				throw toErrorClass(error);
			} else {
				throw error;
			}
		}
	}
}

/**
 * Fetch an access token from the remote service.
 */
async function exchangeAuthCodeForAccessToken(): Promise<AccessContext> {
	const { authorizationCode, codeVerifier = "" } = LocalState;

	if (!codeVerifier) {
		logger.warn("No code verifier is being sent.");
	} else if (!authorizationCode) {
		logger.warn("No authorization grant code is being passed.");
	}

	const body =
		`grant_type=authorization_code&` +
		`code=${encodeURIComponent(authorizationCode || "")}&` +
		`redirect_uri=${encodeURIComponent(CALLBACK_URL)}&` +
		`client_id=${encodeURIComponent(CLIENT_ID)}&` +
		`code_verifier=${codeVerifier}`;

	const response = await fetch(TOKEN_URL, {
		method: "POST",
		body,
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
	});
	if (!response.ok) {
		const { error } = (await response.json()) as { error: string };
		// .catch((_) => ({ error: "invalid_json" }));
		if (error === "invalid_grant") {
			logger.log("Expired! Auth code or refresh token needs to be renewed.");
			// alert("Redirecting to auth server to obtain a new auth grant code.");
			// TODO: return refreshAuthCodeOrRefreshToken();
		}
		throw toErrorClass(error);
	}
	const json = (await response.json()) as TokenResponse;
	if ("error" in json) {
		throw new Error(json.error);
	}
	const { access_token, expires_in, refresh_token, scope } = json;
	let scopes: Scope[] = [];
	LocalState.hasAuthCodeBeenExchangedForAccessToken = true;

	const expiryDate = new Date(Date.now() + expires_in * 1000);
	const accessToken: AccessToken = {
		value: access_token,
		expiry: expiryDate.toISOString(),
	};
	LocalState.accessToken = accessToken;

	if (refresh_token) {
		LocalState.refreshToken = {
			value: refresh_token,
		};
	}

	if (scope) {
		// Multiple scopes are passed and delimited by spaces,
		// despite using the singular name "scope".
		scopes = scope.split(" ") as Scope[];
		LocalState.scopes = scopes;
	}

	const accessContext: AccessContext = {
		token: accessToken,
		scopes,
		refreshToken: LocalState.refreshToken,
	};
	return accessContext;
}

/**
 * Implements *base64url-encode* (RFC 4648 § 5) without padding, which is NOT
 * the same as regular base64 encoding.
 */
function base64urlEncode(value: string): string {
	let base64 = btoa(value);
	base64 = base64.replace(/\+/g, "-");
	base64 = base64.replace(/\//g, "_");
	base64 = base64.replace(/=/g, "");
	return base64;
}

/**
 * Generates a code_verifier and code_challenge, as specified in rfc7636.
 */

async function generatePKCECodes(): Promise<PKCECodes> {
	const output = new Uint32Array(RECOMMENDED_CODE_VERIFIER_LENGTH);
	// @ts-expect-error crypto's types aren't there yet
	crypto.getRandomValues(output);
	const codeVerifier = base64urlEncode(
		Array.from(output)
			.map((num: number) => PKCE_CHARSET[num % PKCE_CHARSET.length])
			.join("")
	);
	// @ts-expect-error crypto's types aren't there yet
	const buffer = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(codeVerifier)
	);
	const hash = new Uint8Array(buffer);
	let binary = "";
	const hashLength = hash.byteLength;
	for (let i = 0; i < hashLength; i++) {
		binary += String.fromCharCode(hash[i]);
	}
	const codeChallenge = base64urlEncode(binary);
	return { codeChallenge, codeVerifier };
}

/**
 * Writes a a wrangler config file (auth credentials) to disk,
 * and updates the user auth state with the new credentials.
 */
export function writeAuthConfigFile(config: UserAuthConfig) {
	const authConfigFilePath = path.join(
		getGlobalWranglerConfigPath(),
		USER_AUTH_CONFIG_FILE
	);
	mkdirSync(path.dirname(authConfigFilePath), {
		recursive: true,
	});
	writeFileSync(
		path.join(authConfigFilePath),
		TOML.stringify(config as TOML.JsonMap),
		{ encoding: "utf-8" }
	);

	reinitialiseAuthTokens();
}

export function readAuthConfigFile(): UserAuthConfig {
	const authConfigFilePath = path.join(
		getGlobalWranglerConfigPath(),
		USER_AUTH_CONFIG_FILE
	);
	const toml = parseTOML(readFileSync(authConfigFilePath));
	return toml;
}

type LoginProps = {
	scopes?: Scope[];
	browser: boolean;
};

export async function loginOrRefreshIfRequired(): Promise<boolean> {
	// TODO: if there already is a token, then try refreshing
	// TODO: ask permission before opening browser
	const { isCI } = CI;
	if (!getAPIToken()) {
		// Not logged in.
		// If we are not interactive, we cannot ask the user to login
		return isInteractive() && !isCI() && (await login());
	} else if (isAccessTokenExpired()) {
		// We're logged in, but the refresh token seems to have expired,
		// so let's try to refresh it
		const didRefresh = await refreshToken();
		if (didRefresh) {
			// The token was refreshed, so we're done here
			return true;
		} else {
			// If the refresh token isn't valid, then we ask the user to login again
			return isInteractive() && !isCI() && (await login());
		}
	} else {
		return true;
	}
}

export async function login(
	props: LoginProps = { browser: true }
): Promise<boolean> {
	logger.log("Attempting to login via OAuth...");
	const urlToOpen = await getAuthURL(props?.scopes);
	let server: http.Server;
	let loginTimeoutHandle: NodeJS.Timeout;
	const timerPromise = new Promise<boolean>((resolve) => {
		loginTimeoutHandle = setTimeout(() => {
			logger.error(
				"Timed out waiting for authorization code, please try again."
			);
			server.close();
			clearTimeout(loginTimeoutHandle);
			resolve(false);
		}, 120000); // wait for 120 seconds for the user to authorize
	});

	const loginPromise = new Promise<boolean>((resolve, reject) => {
		server = http.createServer(async (req, res) => {
			function finish(status: boolean, error?: Error) {
				clearTimeout(loginTimeoutHandle);
				server.close((closeErr?: Error) => {
					if (error || closeErr) {
						reject(error || closeErr);
					} else resolve(status);
				});
			}

			assert(req.url, "This request doesn't have a URL"); // This should never happen
			const { pathname, query } = url.parse(req.url, true);
			switch (pathname) {
				case "/oauth/callback": {
					let hasAuthCode = false;
					try {
						hasAuthCode = isReturningFromAuthServer(query);
					} catch (err: unknown) {
						if (err instanceof ErrorAccessDenied) {
							res.writeHead(307, {
								Location:
									"https://welcome.developers.workers.dev/wrangler-oauth-consent-denied",
							});
							res.end(() => {
								finish(false);
							});
							logger.error(
								"Error: Consent denied. You must grant consent to Wrangler in order to login.\n" +
									"If you don't want to do this consider passing an API token via the `CLOUDFLARE_API_TOKEN` environment variable"
							);

							return;
						} else {
							finish(false, err as Error);
							return;
						}
					}
					if (!hasAuthCode) {
						// render an error page here
						finish(false, new ErrorNoAuthCode());
						return;
					} else {
						const exchange = await exchangeAuthCodeForAccessToken();
						writeAuthConfigFile({
							oauth_token: exchange.token?.value ?? "",
							expiration_time: exchange.token?.expiry,
							refresh_token: exchange.refreshToken?.value,
							scopes: exchange.scopes,
						});
						res.writeHead(307, {
							Location:
								"https://welcome.developers.workers.dev/wrangler-oauth-consent-granted",
						});
						res.end(() => {
							finish(true);
						});
						logger.log(`Successfully logged in.`);

						purgeConfigCaches();

						return;
					}
				}
			}
		});

		server.listen(8976);
	});
	if (props?.browser) {
		logger.log(`Opening a link in your default browser: ${urlToOpen}`);
		await openInBrowser(urlToOpen);
	} else {
		logger.log(`Visit this link to authenticate: ${urlToOpen}`);
	}

	return Promise.race([timerPromise, loginPromise]);
}

/**
 * Checks to see if the access token has expired.
 */
function isAccessTokenExpired(): boolean {
	const { accessToken } = LocalState;
	return Boolean(accessToken && new Date() >= new Date(accessToken.expiry));
}

async function refreshToken(): Promise<boolean> {
	// refresh
	try {
		const {
			token: { value: oauth_token, expiry: expiration_time } = {
				value: "",
				expiry: "",
			},
			refreshToken: { value: refresh_token } = {},
			scopes,
		} = await exchangeRefreshTokenForAccessToken();
		writeAuthConfigFile({
			oauth_token,
			expiration_time,
			refresh_token,
			scopes,
		});
		return true;
	} catch (err) {
		return false;
	}
}

export async function logout(): Promise<void> {
	if (!LocalState.accessToken) {
		if (!LocalState.refreshToken) {
			logger.log("Not logged in, exiting...");
			return;
		}

		const body =
			`client_id=${encodeURIComponent(CLIENT_ID)}&` +
			`token_type_hint=refresh_token&` +
			`token=${encodeURIComponent(LocalState.refreshToken?.value || "")}`;

		const response = await fetch(REVOKE_URL, {
			method: "POST",
			body,
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});
		await response.text(); // blank text? would be nice if it was something meaningful
		logger.log(
			"💁  Wrangler is configured with an OAuth token. The token has been successfully revoked"
		);
	}
	const body =
		`client_id=${encodeURIComponent(CLIENT_ID)}&` +
		`token_type_hint=refresh_token&` +
		`token=${encodeURIComponent(LocalState.refreshToken?.value || "")}`;

	const response = await fetch(REVOKE_URL, {
		method: "POST",
		body,
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
	});
	await response.text(); // blank text? would be nice if it was something meaningful
	rmSync(path.join(getGlobalWranglerConfigPath(), USER_AUTH_CONFIG_FILE));
	logger.log(`Successfully logged out.`);
}

export function listScopes(message = "💁 Available scopes:"): void {
	logger.log(message);
	const data = ScopeKeys.map((scope: Scope) => ({
		Scope: scope,
		Description: Scopes[scope],
	}));
	const { unmount } = render(<Table data={data} />);
	unmount();
	// TODO: maybe a good idea to show usage here
}

export async function getAccountId(): Promise<string | undefined> {
	const apiToken = getAPIToken();
	if (!apiToken) return;

	// check if we have a cached value
	const cachedAccount = getAccountFromCache();
	if (cachedAccount) {
		return cachedAccount.id;
	}
	const accounts = await getAccountChoices();
	if (accounts.length === 1) {
		saveAccountToCache({ id: accounts[0].id, name: accounts[0].name });
		return accounts[0].id;
	}

	if (isInteractive() && !CI.isCI()) {
		const account = await new Promise<{ id: string; name: string }>(
			(resolve, reject) => {
				const { unmount } = render(
					<ChooseAccount
						accounts={accounts}
						onSelect={async (selected) => {
							saveAccountToCache(selected);
							resolve(selected);
							unmount();
						}}
						onError={(err) => {
							reject(err);
							unmount();
						}}
					/>
				);
			}
		);
		return account.id;
	}

	throw new Error(
		"More than one account available but unable to select one in non-interactive mode.\n" +
			`Please set the appropriate \`account_id\` in your \`wrangler.toml\` file.\n` +
			`Available accounts are ("<name>" - "<id>"):\n` +
			accounts
				.map((account) => `  "${account.name}" - "${account.id}")`)
				.join("\n")
	);
}

/**
 * Ensure that a user is logged in, and a valid account_id is available.
 */
export async function requireAuth(config: {
	account_id?: string;
}): Promise<string> {
	const loggedIn = await loginOrRefreshIfRequired();
	if (!loggedIn) {
		if (!isInteractive() || CI.isCI()) {
			throw new Error(
				"In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN environment variable for wrangler to work. Please go to https://developers.cloudflare.com/api/tokens/create/ for instructions on how to create an api token, and assign its value to CLOUDFLARE_API_TOKEN."
			);
		} else {
			// didn't login, let's just quit
			throw new Error("Did not login, quitting...");
		}
	}
	const accountId = config.account_id || (await getAccountId());
	if (!accountId) {
		throw new Error("No account id found, quitting...");
	}

	return accountId;
}

/**
 * Throw an error if there is no API token available.
 */
export function requireApiToken(): ApiCredentials {
	const credentials = getAPIToken();
	if (!credentials) {
		throw new Error("No API token found.");
	}
	return credentials;
}

/**
 * Save the given account details to a cache
 */
export function saveAccountToCache(account: {
	id: string;
	name: string;
}): void {
	saveToConfigCache<{ account: { id: string; name: string } }>(
		"wrangler-account.json",
		{ account }
	);
}

/**
 * Fetch the given account details from a cache if available
 */
export function getAccountFromCache():
	| undefined
	| { id: string; name: string } {
	return getConfigCache<{ account: { id: string; name: string } }>(
		"wrangler-account.json"
	).account;
}

/**
 * Get the scopes of the following token, will only return scopes
 * if the token is an OAuth token.
 */
export function getScopes(): Scope[] | undefined {
	return LocalState.scopes;
}
