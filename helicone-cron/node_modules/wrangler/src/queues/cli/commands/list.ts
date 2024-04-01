import { type Argv } from "yargs";
import { readConfig } from "../../../config";
import { logger } from "../../../logger";
import { listQueues } from "../../client";

interface Args {
	config?: string;
	page?: number;
}

export function options(yargs: Argv): Argv<Args> {
	return yargs.options({
		page: {
			type: "number",
			describe: "Page number for pagination",
		},
	});
}

export async function handler(args: Args) {
	const config = readConfig(args.config, args);

	const queues = await listQueues(config, args.page);
	logger.log(JSON.stringify(queues));
}
