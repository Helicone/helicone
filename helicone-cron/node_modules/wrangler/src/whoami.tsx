import { Text, render } from "ink";
import Table from "ink-table";
import React, { Fragment } from "react";
import { fetchListResult, fetchResult } from "./cfetch";
import { logger } from "./logger";
import { getAPIToken, getAuthFromEnv, getScopes } from "./user";

export async function whoami() {
	logger.log("Getting User settings...");
	const user = await getUserInfo();
	const { unmount } = render(<WhoAmI user={user}></WhoAmI>);
	unmount();
}

export function WhoAmI({ user }: { user: UserInfo | undefined }) {
	return user ? (
		<>
			<Email tokenType={user.authType} email={user.email}></Email>
			<Accounts accounts={user.accounts}></Accounts>
			<Permissions
				tokenType={user.authType}
				tokenPermissions={user.tokenPermissions}
			/>
		</>
	) : (
		<Text>You are not authenticated. Please run `wrangler login`.</Text>
	);
}

function Email(props: { tokenType: string; email: string | undefined }) {
	return props.email === undefined ? (
		<Text>
			👋 You are logged in with an {props.tokenType}. Unable to retrieve email
			for this user. Are you missing the `User-&gt;User Details-&gt;Read`
			permission?
		</Text>
	) : (
		<Text>
			👋 You are logged in with an {props.tokenType}, associated with the email
			&apos;{props.email}&apos;!
		</Text>
	);
}

function Accounts(props: { accounts: AccountInfo[] }) {
	const accounts = props.accounts.map((account) => ({
		"Account Name": account.name,
		"Account ID": account.id,
	}));
	return <Table data={accounts}></Table>;
}

function Permissions(props: {
	tokenPermissions: string[] | undefined;
	tokenType: string;
}) {
	const permissions =
		props.tokenPermissions?.map((scope) => scope.split(":")) || [];
	return props.tokenType === "OAuth Token" ? (
		props.tokenPermissions ? (
			<>
				<Text>
					🔓 Token Permissions: If scopes are missing, you may need to logout
					and re-login.
				</Text>
				<Text>Scope (Access)</Text>
				{permissions.map(([scope, access], index) => (
					<Fragment key={`${scope}${index}`}>
						<Text>
							- {scope} {access && `(${access})`}
						</Text>
					</Fragment>
				))}
			</>
		) : null
	) : (
		<Text>
			🔓 To see token permissions visit
			https://dash.cloudflare.com/profile/api-tokens
		</Text>
	);
}

export interface UserInfo {
	apiToken: string;
	authType: string;
	email: string | undefined;
	accounts: AccountInfo[];
	tokenPermissions: string[] | undefined;
}

export async function getUserInfo(): Promise<UserInfo | undefined> {
	const apiToken = getAPIToken();
	if (!apiToken) return;

	const tokenPermissions = await getTokenPermissions();

	const usingEnvAuth = !!getAuthFromEnv();
	const usingGlobalAuthKey = "authKey" in apiToken;
	return {
		apiToken: usingGlobalAuthKey ? apiToken.authKey : apiToken.apiToken,
		authType: usingGlobalAuthKey
			? "Global API Key"
			: usingEnvAuth
			? "API Token"
			: "OAuth Token",
		email: "authEmail" in apiToken ? apiToken.authEmail : await getEmail(),
		accounts: await getAccounts(),
		tokenPermissions,
	};
}

async function getEmail(): Promise<string | undefined> {
	try {
		const { email } = await fetchResult<{ email: string }>("/user");
		return email;
	} catch (e) {
		if ((e as { code?: number }).code === 9109) {
			return undefined;
		} else {
			throw e;
		}
	}
}

type AccountInfo = { name: string; id: string };

async function getAccounts(): Promise<AccountInfo[]> {
	return await fetchListResult<AccountInfo>("/accounts");
}

async function getTokenPermissions(): Promise<string[] | undefined> {
	// Tokens can either be API tokens or Oauth tokens.
	// Here we only extract permissions from OAuth tokens.

	return getScopes() as string[];

	// In future we may be able to get the token permissions on an API token,
	// but currently we cannot as that permission is not able to be added to
	// an API token.

	// try {
	// 	// First we get the token identifier (only returned on API tokens)
	// 	const { id } = await fetchResult<{ id: string }>("/user/tokens/verify");

	// 	// Get the token permissions for the current token
	// 	const { policies } = await fetchResult<{
	// 		policies: { id: string; name: string }[];
	// 	}>(`/user/tokens/${id}`);

	// 	return policies.map((p) => p.name);
	// } catch (e) {
	// 	if ((e as { code?: number }).code === 1000) {
	// 		// Invalid token - Oauth token

	// 		// Get scopes
	// 		const scopes = getScopes() as string[];
	// 		// We may not get scopes back if they are not currently cached,
	// 		// however next time an access token is requested,
	// 		// the scopes will be added to the cache.
	// 		return scopes;
	// 	} else if ((e as { code?: number }).code === 9109) {
	// 		// Token cannot view its permissions
	// 		return undefined;
	// 	} else {
	// 		throw e;
	// 	}
	// }
}
