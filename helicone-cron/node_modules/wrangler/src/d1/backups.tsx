import fs from "node:fs/promises";
import * as path from "path";
import { render } from "ink";
import Table from "ink-table";
import React from "react";
import { fetchResult } from "../cfetch";
import { performApiFetch } from "../cfetch/internal";
import { withConfig } from "../config";
import { logger } from "../logger";
import { requireAuth } from "../user";
import { formatBytes, formatTimeAgo } from "./formatTimeAgo";
import { Name } from "./options";
import { d1BetaWarning, getDatabaseByNameOrBinding } from "./utils";
import type { Backup, Database } from "./types";
import type { Response } from "undici";
import type { Argv } from "yargs";

type BackupListArgs = { config?: string; name: string };

export function ListOptions(yargs: Argv): Argv<BackupListArgs> {
	return Name(yargs);
}

export const ListHandler = withConfig<BackupListArgs>(
	async ({ config, name }): Promise<void> => {
		const accountId = await requireAuth({});
		logger.log(d1BetaWarning);
		const db: Database = await getDatabaseByNameOrBinding(
			config,
			accountId,
			name
		);

		const backups: Backup[] = await listBackups(accountId, db.uuid);
		render(
			<Table
				data={backups}
				columns={["created_at", "id", "num_tables", "size"]}
			></Table>
		);
	}
);

export const listBackups = async (
	accountId: string,
	uuid: string
): Promise<Array<Backup>> => {
	const json: Backup[] = await fetchResult(
		`/accounts/${accountId}/d1/database/${uuid}/backup`,
		{}
	);
	const results: Record<string, Backup> = {};

	json
		// First, convert created_at to a Date
		.map((backup) => ({
			...backup,
			created_at: new Date(backup.created_at),
		}))
		// Then, sort descending based on created_at
		.sort((a, b) => +b.created_at - +a.created_at)
		// then group_by their human-readable timestamp i.e. "2 days ago"
		// (storing only the first of each group)
		// and replace the Date version with this new human-readable one
		.forEach((backup) => {
			const timeAgo = formatTimeAgo(backup.created_at);
			if (!results[timeAgo]) {
				results[timeAgo] = {
					...backup,
					created_at: timeAgo,
					size: formatBytes(backup.file_size),
				};
			}
		});

	// Take advantage of JS objects' sorting to return the newest backup of a certain age
	return Object.values(results);
};

type BackupCreateArgs = BackupListArgs;

export function CreateOptions(yargs: Argv): Argv<BackupCreateArgs> {
	return ListOptions(yargs);
}

export const CreateHandler = withConfig<BackupCreateArgs>(
	async ({ config, name }): Promise<void> => {
		const accountId = await requireAuth({});
		logger.log(d1BetaWarning);
		const db: Database = await getDatabaseByNameOrBinding(
			config,
			accountId,
			name
		);

		const backup: Backup = await createBackup(accountId, db.uuid);
		render(
			<Table
				data={[backup]}
				columns={["created_at", "id", "num_tables", "size", "state"]}
			></Table>
		);
	}
);

export const createBackup = async (
	accountId: string,
	uuid: string
): Promise<Backup> => {
	const backup: Backup = await fetchResult(
		`/accounts/${accountId}/d1/database/${uuid}/backup`,
		{
			method: "POST",
		}
	);
	return {
		...backup,
		size: formatBytes(backup.file_size),
	};
};

type BackupRestoreArgs = BackupListArgs & {
	"backup-id": string;
};

export function RestoreOptions(yargs: Argv): Argv<BackupRestoreArgs> {
	return ListOptions(yargs).positional("backup-id", {
		describe: "The Backup ID to restore",
		type: "string",
		demandOption: true,
	});
}

export const RestoreHandler = withConfig<BackupRestoreArgs>(
	async ({ config, name, backupId }): Promise<void> => {
		const accountId = await requireAuth({});
		logger.log(d1BetaWarning);
		const db: Database = await getDatabaseByNameOrBinding(
			config,
			accountId,
			name
		);

		logger.log(`Restoring ${name} from backup ${backupId}....`);
		await restoreBackup(accountId, db.uuid, backupId);
		logger.log(`Done!`);
	}
);

export const restoreBackup = async (
	accountId: string,
	uuid: string,
	backupId: string
): Promise<void> => {
	await fetchResult(
		`/accounts/${accountId}/d1/database/${uuid}/backup/${backupId}/restore`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		}
	);
};

type BackupDownloadArgs = BackupRestoreArgs & {
	output?: string;
};

export function DownloadOptions(yargs: Argv): Argv<BackupDownloadArgs> {
	return ListOptions(yargs)
		.positional("backup-id", {
			describe: "The Backup ID to download",
			type: "string",
			demandOption: true,
		})
		.option("output", {
			describe:
				"The .sqlite3 file to write to (defaults to '<db-name>.<short-backup-id>.sqlite3'",
			type: "string",
		});
}

export const DownloadHandler = withConfig<BackupDownloadArgs>(
	async ({ name, backupId, output, config }): Promise<void> => {
		const accountId = await requireAuth({});
		logger.log(d1BetaWarning);
		const db: Database = await getDatabaseByNameOrBinding(
			config,
			accountId,
			name
		);
		const filename =
			output ||
			path.join(
				process.env.INIT_CWD as string,
				`${name}.${backupId.slice(0, 8)}.sqlite3`
			);

		logger.log(`🌀 Downloading backup ${backupId} from '${name}'`);
		const response = await getBackupResponse(accountId, db.uuid, backupId);
		if (!response.ok) {
			throw new Error(
				`Failed to download backup ${backupId} from '${name}' - got ${response.status} from the API`
			);
		}
		logger.log(`🌀 Saving to ${filename}`);
		// TODO: stream this once we upgrade to Node18 and can use Writable.fromWeb
		const buffer = await response.arrayBuffer();
		await fs.writeFile(filename, new Buffer(buffer));
		logger.log(`🌀 Done!`);
	}
);

export const getBackupResponse = async (
	accountId: string,
	uuid: string,
	backupId: string
): Promise<Response> => {
	return await performApiFetch(
		`/accounts/${accountId}/d1/database/${uuid}/backup/${backupId}/download`
	);
};
