import { type Argv } from "yargs";
import { readConfig } from "../../../../config";
import { logger } from "../../../../logger";
import { deleteConsumer } from "../../../client";
import type { CommonYargsOptions } from "../../../../yargs-types";

type Args = CommonYargsOptions & {
	config?: string;
	["queue-name"]: string;
	["script-name"]: string;
};

export function options(yargs: Argv<CommonYargsOptions>): Argv<Args> {
	return yargs
		.positional("queue-name", {
			type: "string",
			demandOption: true,
			description: "Name of the queue to configure",
		})
		.positional("script-name", {
			type: "string",
			demandOption: true,
			description: "Name of the consumer script",
		});
}

export async function handler(args: Args) {
	const config = readConfig(args.config, args);

	logger.log(`Removing consumer from queue ${args["queue-name"]}.`);
	await deleteConsumer(
		config,
		args["queue-name"],
		args["script-name"],
		args.env
	);
	logger.log(`Removed consumer from queue ${args["queue-name"]}.`);
}
