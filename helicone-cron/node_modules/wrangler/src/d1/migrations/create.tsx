import fs from "node:fs";
import path from "path";
import { Box, render, Text } from "ink";
import React from "react";
import { withConfig } from "../../config";
import { logger } from "../../logger";
import { requireAuth } from "../../user";
import { Database } from "../options";
import { d1BetaWarning, getDatabaseInfoFromConfig } from "../utils";
import { getMigrationsPath, getNextMigrationNumber } from "./helpers";
import type { Argv } from "yargs";

type MigrationsCreateArgs = {
	config?: string;
	database: string;
	message: string;
};

export function CreateOptions(yargs: Argv): Argv<MigrationsCreateArgs> {
	return Database(yargs).positional("message", {
		describe: "The Migration message",
		type: "string",
		demandOption: true,
	});
}

export const CreateHandler = withConfig<MigrationsCreateArgs>(
	async ({ config, database, message }): Promise<void> => {
		await requireAuth({});
		logger.log(d1BetaWarning);

		const databaseInfo = await getDatabaseInfoFromConfig(config, database);
		if (!databaseInfo) {
			throw new Error(
				`Can't find a DB with name/binding '${database}' in local config. Check info in wrangler.toml...`
			);
		}

		if (!config.configPath) {
			return;
		}

		const migrationsPath = await getMigrationsPath(
			path.dirname(config.configPath),
			databaseInfo.migrationsFolderPath,
			true
		);
		const nextMigrationNumber = pad(getNextMigrationNumber(migrationsPath), 4);
		const migrationName = message.replaceAll(" ", "_");

		const newMigrationName = `${nextMigrationNumber}_${migrationName}.sql`;

		fs.writeFileSync(
			`${migrationsPath}/${newMigrationName}`,
			`-- Migration number: ${nextMigrationNumber} \t ${new Date().toISOString()}\n`
		);

		render(
			<Box flexDirection="column">
				<Text>
					✅ Successfully created Migration &apos;{newMigrationName}&apos;!
				</Text>
				<Text>&nbsp;</Text>
				<Text>The migration is available for editing here</Text>
				<Text>
					{migrationsPath}/{newMigrationName}
				</Text>
			</Box>
		);
	}
);

function pad(num: number, size: number): string {
	let newNum = num.toString();
	while (newNum.length < size) newNum = "0" + newNum;
	return newNum;
}
