import { Text } from "ink";
import SelectInput from "ink-select-input";
import React from "react";
import { fetchListResult } from "../cfetch";
import { logger } from "../logger";
import { getCloudflareAccountIdFromEnv } from "./env-vars";

export type ChooseAccountItem = {
	id: string;
	name: string;
};

/**
 * A component that allows the user to select from a list of available accounts.
 */
export function ChooseAccount(props: {
	accounts: ChooseAccountItem[];
	onSelect: (account: { name: string; id: string }) => void;
	onError: (error: Error) => void;
}) {
	return (
		<>
			<Text bold>Select an account from below:</Text>
			<SelectInput
				items={props.accounts.map((item) => ({
					key: item.id,
					label: item.name,
					value: item,
				}))}
				onSelect={(item) => {
					logger.log(`Using account: "${item.value.name} - ${item.value.id}"`);
					props.onSelect({ id: item.value.id, name: item.value.name });
				}}
			/>
		</>
	);
}

/**
 * Infer a list of available accounts for the current user.
 */
export async function getAccountChoices(): Promise<ChooseAccountItem[]> {
	const accountIdFromEnv = getCloudflareAccountIdFromEnv();
	if (accountIdFromEnv) {
		return [{ id: accountIdFromEnv, name: "" }];
	} else {
		try {
			const response = await fetchListResult<{
				account: ChooseAccountItem;
			}>(`/memberships`);
			const accounts = response.map((r) => r.account);
			if (accounts.length === 0) {
				throw new Error(
					"Failed to automatically retrieve account IDs for the logged in user.\n" +
						"In a non-interactive environment, it is mandatory to specify an account ID, either by assigning its value to CLOUDFLARE_ACCOUNT_ID, or as `account_id` in your `wrangler.toml` file."
				);
			} else {
				return accounts;
			}
		} catch (err) {
			if ((err as { code: number }).code === 9109) {
				throw new Error(
					`Failed to automatically retrieve account IDs for the logged in user.
You may have incorrect permissions on your API token. You can skip this account check by adding an \`account_id\` in your \`wrangler.toml\`, or by setting the value of CLOUDFLARE_ACCOUNT_ID"`
				);
			} else throw err;
		}
	}
}
