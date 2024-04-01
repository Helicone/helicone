/**
 * When tailing logs from a worker, oftentimes you don't want to see _every
 * single event_. That's where filters come in. We can send a set of filters
 * to the tail worker, and it will pre-filter any logs for us so that we
 * only recieve the ones we care about.
 */

/**
 * These are the filters we accept in the CLI. They
 * were copied directly from wrangler 1 in order to
 * maintain compatability, so they aren't actually the exact
 * filters we need to send up to the tail worker. They generally map 1:1,
 * but often require some transformation or
 * renaming to match what it expects.
 *
 * For a full description of each filter, either check the
 * CLI description or see the documentation for `ApiFilter`.
 */
export type TailCLIFilters = {
	status?: ("ok" | "error" | "canceled")[];
	header?: string;
	method?: string[];
	search?: string;
	samplingRate?: number;
	clientIp?: string[];
};

/**
 * These are the filters we send to the tail worker. We
 * actually send a list of filters (an array of objects),
 * so rather than having a single TailAPIFilters type,
 * each kind of filter gets its own type and we define
 * TailAPIFilter to be the union of those types.
 */
export type TailAPIFilter =
	| SamplingRateFilter
	| OutcomeFilter
	| MethodFilter
	| HeaderFilter
	| ClientIPFilter
	| QueryFilter;

/**
 * Filters logs based on a given sampling rate.
 * For example, a `sampling_rate` of 0.25 will let one-quarter of the
 * logs through.
 */
type SamplingRateFilter = {
	sampling_rate: number;
};

/**
 * Filters logs based on the outcome of the worker's event handler.
 */
type OutcomeFilter = {
	outcome: Outcome[];
};

/**
 * There are five possible outcomes we can get, three of which
 * (exception, exceededCpu, exceededMemory, and unknown) are considered errors
 */
export type Outcome =
	| "ok"
	| "canceled"
	| "exception"
	| "exceededCpu"
	| "exceededMemory"
	| "unknown";

/**
 * Filters logs based on the HTTP method used for the request
 * that triggered the worker.
 */
type MethodFilter = {
	method: string[];
};

/**
 * Filters logs based on an HTTP header on the request that
 * triggered the worker.
 */
type HeaderFilter = {
	header: {
		/**
		 * Filters on the header "key", e.g. "X-CLOUDFLARE-HEADER"
		 * or "X-CUSTOM-HEADER"
		 */
		key: string;

		/**
		 * Filters on the header "value", e.g. if this is set to
		 * "filter-for-me" and the "key" is "X-SHOULD-LOG", only
		 * events triggered by requests with the header
		 * "X-SHOULD-LOG:filter-for-me" will be logged.
		 */
		query?: string;
	};
};

/**
 * Filters on the IP address the request came from that triggered
 * the worker. A value of "self" will be replaced with the IP
 * address that is running `wrangler tail`
 */
type ClientIPFilter = {
	client_ip: string[];
};

/**
 * Filters logs by a query string. This means only logs that
 * contain the given string will be sent to wrangler, and any
 * that don't will be discarded by the tail worker.
 */
type QueryFilter = {
	query: string;
};

/**
 * The full message we send to the tail worker includes our
 * filters and a debug flag.
 */
export type TailFilterMessage = {
	filters: TailAPIFilter[];
};

/**
 * Translate the flags passed in via a CLI invokation of wrangler
 * into a message that we can send to the tail worker.
 *
 * @param cliFilters An object containing all the filters passed in from the CLI
 * @returns A filter message ready to be sent to the tail worker
 */
export function translateCLICommandToFilterMessage(
	cliFilters: TailCLIFilters
): TailFilterMessage {
	const apiFilters: TailAPIFilter[] = [];

	if (cliFilters.samplingRate) {
		apiFilters.push(parseSamplingRate(cliFilters.samplingRate));
	}

	if (cliFilters.status) {
		apiFilters.push(parseOutcome(cliFilters.status));
	}

	if (cliFilters.method) {
		apiFilters.push(parseMethod(cliFilters.method));
	}

	if (cliFilters.header) {
		apiFilters.push(parseHeader(cliFilters.header));
	}

	if (cliFilters.clientIp) {
		apiFilters.push(parseIP(cliFilters.clientIp));
	}

	if (cliFilters.search) {
		apiFilters.push(parseQuery(cliFilters.search));
	}

	return {
		filters: apiFilters,
	};
}

/**
 * Parse the sampling rate passed in via command line
 *
 * @param sampling_rate the sampling rate passed in via CLI
 * @throws an Error if the rate doesn't make sense
 * @returns a SamplingRateFilter for use with the API
 */
function parseSamplingRate(sampling_rate: number): SamplingRateFilter {
	if (sampling_rate <= 0 || sampling_rate >= 1) {
		throw new Error(
			"A sampling rate must be between 0 and 1 in order to have any effect.\nFor example, a sampling rate of 0.25 means 25% of events will be logged."
		);
	}

	return { sampling_rate };
}

/**
 * Translate from CLI "status"es to API "outcome"s, including
 * broadening "error" into "exception", "exceededCpu", and "unknown".
 *
 * @param statuses statuses passed in via CLI
 * @returns an OutcomeFilter for use with the API
 */
function parseOutcome(
	statuses: ("ok" | "error" | "canceled")[]
): OutcomeFilter {
	const outcomes = new Set<Outcome>();

	for (const status of statuses) {
		switch (status) {
			case "ok":
				outcomes.add("ok");
				break;

			case "canceled":
				outcomes.add("canceled");
				break;

			case "error":
				outcomes.add("exception");
				outcomes.add("exceededCpu");
				outcomes.add("exceededMemory");
				outcomes.add("unknown");
				break;

			default:
				break;
		}
	}

	return {
		outcome: Array.from(outcomes),
	};
}

/**
 * We just send silly methods through to the API anyway, since they don't
 * cause any harm.
 *
 * @param method an array of HTTP request methods passed in via CLI
 * @returns a MethodFilter for use with the API
 */
function parseMethod(method: string[]): MethodFilter {
	return { method };
}

/**
 * Header filters can contain either just a key ("X-HEADER-KEY") or both
 * a key and a value ("X-HEADER-KEY:some-value"). This function parses
 * a given string according to that pattern.
 *
 * @param header a header string, "X-HEADER-KEY" or "X-HEADER-KEY:some-value"
 * @returns a HeaderFilter for use with the API
 */
function parseHeader(header: string): HeaderFilter {
	const [headerKey, headerQuery] = header.split(":", 2);

	return {
		header: {
			key: headerKey.trim(),
			query: headerQuery?.trim(),
		},
	};
}

/**
 * A list of IPs can be passed in to filter for messages that come from
 * a worker triggered by a request originating from one of those IPs.
 * You can also pass in the string "self" to filter for the IP of the
 * machine running `wrangler tail`.
 *
 * @param client_ip an array of IP addresses to filter
 * @returns a ClientIPFilter for use with the API
 */
function parseIP(client_ip: string[]): ClientIPFilter {
	return { client_ip };
}

/**
 * Users can filter for logs that contain a "search" or a "query string".
 * For example, if `--search findme` is passed to then we will only
 * receive logs that contain the string "findme".
 *
 * @param query a query string to search for
 * @returns a QueryFilter for use with the API
 */
function parseQuery(query: string): QueryFilter {
	return { query };
}
