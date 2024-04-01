import { DEFAULT_MIGRATION_PATH, DEFAULT_MIGRATION_TABLE } from "./constants";
import { listDatabases } from "./list";
import type { Config } from "../config";
import type { Database } from "./types";

export function getDatabaseInfoFromConfig(
	config: Config,
	name: string
): Database | null {
	for (const d1Database of config.d1_databases) {
		if (
			d1Database.database_id &&
			(name === d1Database.database_name || name === d1Database.binding)
		) {
			return {
				uuid: d1Database.database_id,
				binding: d1Database.binding,
				name: d1Database.database_name,
				migrationsTableName:
					d1Database.migrations_table || DEFAULT_MIGRATION_TABLE,
				migrationsFolderPath:
					d1Database.migrations_dir || DEFAULT_MIGRATION_PATH,
				internal_env: d1Database.database_internal_env,
			};
		}
	}
	return null;
}

export const getDatabaseByNameOrBinding = async (
	config: Config,
	accountId: string,
	name: string
): Promise<Database> => {
	const dbFromConfig = getDatabaseInfoFromConfig(config, name);
	if (dbFromConfig) return dbFromConfig;

	const allDBs = await listDatabases(accountId);
	const matchingDB = allDBs.find((db) => db.name === name);
	if (!matchingDB) {
		throw new Error(`Couldn't find DB with name '${name}'`);
	}
	return matchingDB;
};

export const d1BetaWarning = process.env.NO_D1_WARNING
	? ""
	: "🚧 D1 is currently in open alpha and is not recommended for production data and traffic.\nPlease report any bugs to https://github.com/cloudflare/wrangler2/issues/new/choose.\nTo request features, visit https://community.cloudflare.com/c/developers/d1.\nTo give feedback, visit https://discord.gg/cloudflaredev";
