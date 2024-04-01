import fs from "node:fs";
import path from "path";
import { Box, render, Text } from "ink";
import Table from "ink-table";
import React from "react";
import { withConfig } from "../../config";
import { confirm } from "../../dialogs";
import { CI } from "../../is-ci";
import isInteractive from "../../is-interactive";
import { logger } from "../../logger";
import { requireAuth } from "../../user";
import { createBackup } from "../backups";
import { executeSql } from "../execute";
import { d1BetaWarning, getDatabaseInfoFromConfig } from "../utils";
import {
	getMigrationsPath,
	getUnappliedMigrations,
	initMigrationsTable,
} from "./helpers";
import { DatabaseWithLocal } from "./options";
import type { ParseError } from "../../parse";
import type { BaseSqlExecuteArgs } from "../execute";
import type { Argv } from "yargs";

export function ApplyOptions(yargs: Argv): Argv<BaseSqlExecuteArgs> {
	return DatabaseWithLocal(yargs);
}

export const ApplyHandler = withConfig<BaseSqlExecuteArgs>(
	async ({ config, database, local, persistTo }): Promise<void> => {
		const accountId = await requireAuth({});
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
			false
		);
		await initMigrationsTable(
			databaseInfo.migrationsTableName,
			local,
			config,
			database,
			persistTo
		);

		const unappliedMigrations = (
			await getUnappliedMigrations(
				databaseInfo.migrationsTableName,
				migrationsPath,
				local,
				config,
				database,
				persistTo
			)
		)
			.map((migration) => {
				return {
					Name: migration,
					Status: "🕒️",
				};
			})
			.sort((a, b) => {
				const migrationNumberA = parseInt(a.Name.split("_")[0]);
				const migrationNumberB = parseInt(b.Name.split("_")[0]);
				if (migrationNumberA < migrationNumberB) {
					return -1;
				}
				if (migrationNumberA > migrationNumberB) {
					return 1;
				}

				// numbers must be equal
				return 0;
			});

		if (unappliedMigrations.length === 0) {
			render(<Text>✅ No migrations to apply!</Text>);
			return;
		}

		if (isInteractive() && !CI.isCI()) {
			const ok = await confirm(
				`About to apply ${unappliedMigrations.length} migration(s)\n` +
					"Your database may not be available to serve requests during the migration, continue?",
				<Box flexDirection="column">
					<Text>Migrations to be applied:</Text>
					<Table data={unappliedMigrations} columns={["Name"]}></Table>
				</Box>
			);
			if (!ok) return;
		}

		render(<Text>🕒 Creating backup...</Text>);
		await createBackup(accountId, databaseInfo.uuid);

		for (const migration of unappliedMigrations) {
			let query = fs.readFileSync(
				`${migrationsPath}/${migration.Name}`,
				"utf8"
			);
			query += `
								INSERT INTO ${databaseInfo.migrationsTableName} (name)
								values ('${migration.Name}');
						`;

			let success = true;
			let errorNotes: Array<string> = [];
			try {
				const response = await executeSql(
					local,
					config,
					database,
					isInteractive() && !CI.isCI(),
					persistTo,
					undefined,
					query
				);

				if (response === null) {
					// TODO:  return error
					return;
				}

				for (const result of response) {
					// When executing more than 1 statement, response turns into an array of QueryResult
					if (Array.isArray(result)) {
						for (const subResult of result) {
							if (!subResult.success) {
								success = false;
							}
						}
					} else {
						if (!result.success) {
							success = false;
						}
					}
				}
			} catch (e) {
				const err = e as ParseError;

				success = false;
				errorNotes = err.notes.map((msg) => msg.text);
			}

			migration.Status = success ? "✅" : "❌";

			render(
				<Box flexDirection="column">
					<Table
						data={unappliedMigrations}
						columns={["Name", "Status"]}
					></Table>
					{errorNotes.length > 0 && (
						<Box flexDirection="column">
							<Text>&nbsp;</Text>
							<Text>
								❌ Migration {migration.Name} failed with following Errors
							</Text>
							<Table
								data={errorNotes.map((err) => {
									return { Error: err };
								})}
							></Table>
						</Box>
					)}
				</Box>
			);

			if (errorNotes.length > 0) return;
		}
	}
);
