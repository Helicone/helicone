import { fetchResult } from "../cfetch";
import { withConfig } from "../config";
import { confirm } from "../dialogs";
import { logger } from "../logger";
import { requireAuth } from "../user";
import { Name } from "./options";
import { d1BetaWarning, getDatabaseByNameOrBinding } from "./utils";
import type { Database } from "./types";
import type { Argv } from "yargs";

type CreateArgs = {
	config?: string;
	name: string;
	"skip-confirmation": boolean;
};

export function Options(d1ListYargs: Argv): Argv<CreateArgs> {
	return Name(d1ListYargs)
		.option("skip-confirmation", {
			describe: "Skip confirmation",
			type: "boolean",
			alias: "y",
			default: false,
		})
		.epilogue(d1BetaWarning);
}

export const Handler = withConfig<CreateArgs>(
	async ({ name, skipConfirmation, config }): Promise<void> => {
		const accountId = await requireAuth({});
		logger.log(d1BetaWarning);

		const db: Database = await getDatabaseByNameOrBinding(
			config,
			accountId,
			name
		);

		logger.log(`About to delete DB '${name}' (${db.uuid}).`);
		if (!skipConfirmation) {
			const response = await confirm(`Ok to proceed?`);
			if (!response) {
				logger.log(`Not deleting.`);
				return;
			}
		}

		logger.log("Deleting...");

		await fetchResult(`/accounts/${accountId}/d1/database/${db.uuid}`, {
			method: "DELETE",
		});

		logger.log(`Deleted '${name}' successfully.`);
	}
);
