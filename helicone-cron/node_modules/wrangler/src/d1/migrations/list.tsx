import path from "path";
import { Box, render, Text } from "ink";
import Table from "ink-table";
import React from "react";
import { withConfig } from "../../config";
import { logger } from "../../logger";
import { requireAuth } from "../../user";
import { d1BetaWarning, getDatabaseInfoFromConfig } from "../utils";
import {
	getMigrationsPath,
	getUnappliedMigrations,
	initMigrationsTable,
} from "./helpers";
import { DatabaseWithLocal } from "./options";
import type { BaseSqlExecuteArgs } from "../execute";
import type { Argv } from "yargs";

export function ListOptions(yargs: Argv): Argv<BaseSqlExecuteArgs> {
	return DatabaseWithLocal(yargs);
}

export const ListHandler = withConfig<BaseSqlExecuteArgs>(
	async ({ config, database, local, persistTo }): Promise<void> => {
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
		const { migrationsTableName, migrationsFolderPath } = databaseInfo;

		const migrationsPath = await getMigrationsPath(
			path.dirname(config.configPath),
			migrationsFolderPath,
			false
		);
		await initMigrationsTable(
			migrationsTableName,
			local,
			config,
			database,
			persistTo
		);

		const unappliedMigrations = (
			await getUnappliedMigrations(
				migrationsTableName,
				migrationsPath,
				local,
				config,
				database,
				persistTo
			)
		).map((migration) => {
			return {
				Name: migration,
			};
		});

		if (unappliedMigrations.length === 0) {
			render(<Text>✅ No migrations to apply!</Text>);
			return;
		}

		render(
			<Box flexDirection="column">
				<Text>Migrations to be applied:</Text>
				<Table data={unappliedMigrations} columns={["Name"]}></Table>
			</Box>
		);
	}
);
