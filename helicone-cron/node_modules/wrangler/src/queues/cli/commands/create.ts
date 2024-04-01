import { type Argv } from "yargs";
import { readConfig } from "../../../config";
import { logger } from "../../../logger";
import { createQueue } from "../../client";

interface Args {
	config?: string;
	name: string;
}

export function options(yargs: Argv): Argv<Args> {
	return yargs.positional("name", {
		type: "string",
		demandOption: true,
		description: "The name of the queue",
	});
}

export async function handler(args: Args) {
	const config = readConfig(args.config, args);

	logger.log(`Creating queue ${args.name}.`);
	await createQueue(config, { queue_name: args.name });
	logger.log(`Created queue ${args.name}.`);
}
