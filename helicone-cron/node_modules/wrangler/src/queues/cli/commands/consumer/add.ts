import { type Argv } from "yargs";
import { readConfig } from "../../../../config";
import { logger } from "../../../../logger";
import { postConsumer } from "../../../client";
import type { CommonYargsOptions } from "../../../../yargs-types";
import type { PostConsumerBody } from "../../../client";

type Args = CommonYargsOptions & {
	config?: string;
	["queue-name"]: string;
	["script-name"]: string;
	["batch-size"]?: number;
	["batch-timeout"]?: number;
	["message-retries"]?: number;
	["dead-letter-queue"]?: string;
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
		})
		.options({
			"batch-size": {
				type: "number",
				describe: "Maximum number of messages per batch",
			},
			"batch-timeout": {
				type: "number",
				describe:
					"Maximum number of seconds to wait to fill a batch with messages",
			},
			"message-retries": {
				type: "number",
				describe: "Maximum number of retries for each message",
			},
			"dead-letter-queue": {
				type: "string",
				describe: "Queue to send messages that failed to be consumed",
			},
		});
}

export async function handler(args: Args) {
	const config = readConfig(args.config, args);

	const body: PostConsumerBody = {
		script_name: args["script-name"],
		// TODO(soon) is this still the correct usage of the environment?
		environment_name: args.env || "", // API expects empty string as default
		settings: {
			batch_size: args["batch-size"],
			max_retries: args["message-retries"],
			max_wait_time_ms: args["batch-timeout"] // API expects milliseconds
				? 1000 * args["batch-timeout"]
				: undefined,
		},
		dead_letter_queue: args["dead-letter-queue"],
	};

	logger.log(`Adding consumer to queue ${args["queue-name"]}.`);
	await postConsumer(config, args["queue-name"], body);
	logger.log(`Added consumer to queue ${args["queue-name"]}.`);
}
