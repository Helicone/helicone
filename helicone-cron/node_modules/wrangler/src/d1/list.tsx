import { render } from "ink";
import Table from "ink-table";
import React from "react";
import { fetchResult } from "../cfetch";
import { logger } from "../logger";
import { requireAuth } from "../user";
import { d1BetaWarning } from "./utils";
import type { Database } from "./types";
import type { ArgumentsCamelCase, Argv } from "yargs";

type ListArgs = Record<string, never>;

export function Options(d1ListYargs: Argv): Argv<ListArgs> {
	return d1ListYargs.epilogue(d1BetaWarning);
}

export async function Handler(_: ArgumentsCamelCase<ListArgs>): Promise<void> {
	const accountId = await requireAuth({});
	logger.log(d1BetaWarning);

	const dbs: Array<Database> = await listDatabases(accountId);

	render(<Table data={dbs}></Table>);
}

export const listDatabases = async (
	accountId: string
): Promise<Array<Database>> => {
	const pageSize = 10;
	let page = 1;
	const results = [];
	while (results.length % pageSize === 0) {
		const json: Array<Database> = await fetchResult(
			`/accounts/${accountId}/d1/database`,
			{},
			new URLSearchParams({
				per_page: pageSize.toString(),
				page: page.toString(),
			})
		);
		page++;
		results.push(...json);
		if (json.length < pageSize) {
			break;
		}
	}
	return results;
};
