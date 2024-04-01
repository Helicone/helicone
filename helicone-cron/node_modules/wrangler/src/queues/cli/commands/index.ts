import { type BuilderCallback } from "yargs";
import { type CommonYargsOptions } from "../../../yargs-types";
import { HandleUnauthorizedError } from "../../utils";
import { consumers } from "./consumer";

import { options as createOptions, handler as createHandler } from "./create";
import { options as deleteOptions, handler as deleteHandler } from "./delete";
import { options as listOptions, handler as listHandler } from "./list";

export const queues: BuilderCallback<CommonYargsOptions, unknown> = (yargs) => {
	yargs.command("list", "List Queues", listOptions, listHandler);

	yargs.command(
		"create <name>",
		"Create a Queue",
		createOptions,
		createHandler
	);

	yargs.command(
		"delete <name>",
		"Delete a Queue",
		deleteOptions,
		deleteHandler
	);

	yargs.command(
		"consumer",
		"Configure Queue Consumers",
		async (consumersYargs) => {
			await consumers(consumersYargs);
		}
	);

	yargs.fail(HandleUnauthorizedError);
};
