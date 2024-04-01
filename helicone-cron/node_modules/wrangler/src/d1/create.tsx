import { render, Text, Box } from "ink";
import React from "react";
import { fetchResult } from "../cfetch";
import { logger } from "../logger";
import { requireAuth } from "../user";
import { d1BetaWarning } from "./utils";
import type { Database } from "./types";
import type { ArgumentsCamelCase, Argv } from "yargs";

type CreateArgs = { name: string };

export function Options(yargs: Argv): Argv<CreateArgs> {
	return yargs
		.positional("name", {
			describe: "The name of the new DB",
			type: "string",
			demandOption: true,
		})
		.epilogue(d1BetaWarning);
}

export async function Handler({
	name,
}: ArgumentsCamelCase<CreateArgs>): Promise<void> {
	const accountId = await requireAuth({});

	logger.log(d1BetaWarning);

	let db: Database;
	try {
		db = await fetchResult(`/accounts/${accountId}/d1/database`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				name,
			}),
		});
	} catch (e) {
		if ((e as { code: number }).code === 7502) {
			throw new Error("A database with that name already exists");
		}
		throw e;
	}

	render(
		<Box flexDirection="column">
			<Text>✅ Successfully created DB &apos;{db.name}&apos;!</Text>
			<Text>&nbsp;</Text>
			<Text>
				Add the following to your wrangler.toml to connect to it from a Worker:
			</Text>
			<Text>&nbsp;</Text>
			<Text>[[ d1_databases ]]</Text>
			<Text>
				binding = &quot;DB&quot; # i.e. available in your Worker on env.DB
			</Text>
			<Text>database_name = &quot;{db.name}&quot;</Text>
			<Text>database_id = &quot;{db.uuid}&quot;</Text>
		</Box>
	);
}
