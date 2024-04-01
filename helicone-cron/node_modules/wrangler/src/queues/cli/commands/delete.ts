import { type Argv } from "yargs";
import { readConfig } from "../../../config";
import { logger } from "../../../logger";
import { deleteQueue } from "../../client";

interface Args {
	config?: string;
	name: string;
}

export function options(yargs: Argv): Argv<Args> {
	// TODO(soon) --force option
	return yargs.positional("name", {
		type: "string",
		demandOption: true,
		description: "The name of the queue",
	});
}

export async function handler(args: Args) {
	const config = readConfig(args.config, args);

	logger.log(`Deleting queue ${args.name}.`);
	await deleteQueue(config, args.name);
	logger.log(`Deleted queue ${args.name}.`);
}
