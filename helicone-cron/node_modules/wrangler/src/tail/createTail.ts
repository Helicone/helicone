import WebSocket from "ws";
import { version as packageVersion } from "../../package.json";
import { fetchResult } from "../cfetch";
import type { TailFilterMessage, Outcome } from "./filters";
export type { TailCLIFilters } from "./filters";
export { translateCLICommandToFilterMessage } from "./filters";
export { jsonPrintLogs, prettyPrintLogs } from "./printing";
import type { Request } from "undici";

const TRACE_VERSION = "trace-v1";

/**
 * When creating a Tail, the response from the API contains
 * - an ID used for identifying the tail
 * - a URL to a WebSocket connection available for the tail to connect to
 * - an expiration date when the tail is no longer guaranteed to be valid
 */
type TailCreationApiResponse = {
	id: string;
	url: string;
	expires_at: Date;
};

/**
 * Generate a URL that, when `cfetch`ed, creates a tail.
 *
 * https://api.cloudflare.com/#worker-tail-logs-start-tail
 *
 * @param accountId the account ID associated with the worker to tail
 * @param workerName the name of the worker to tail
 * @returns a `cfetch`-ready URL for creating a new tail
 */
function makeCreateTailUrl(
	accountId: string,
	workerName: string,
	env: string | undefined
): string {
	return env
		? `/accounts/${accountId}/workers/services/${workerName}/environments/${env}/tails`
		: `/accounts/${accountId}/workers/scripts/${workerName}/tails`;
}

/**
 * Generate a URL that, when `cfetch`ed, deletes a tail
 *
 * https://api.cloudflare.com/#worker-tail-logs-delete-tail
 *
 * @param accountId the account ID associated with the worker we're tailing
 * @param workerName the name of the worker we're tailing
 * @param tailId the ID of the tail we want to delete
 * @returns a `cfetch`-ready URL for deleting a tail
 */
function makeDeleteTailUrl(
	accountId: string,
	workerName: string,
	tailId: string,
	env: string | undefined
): string {
	return env
		? `/accounts/${accountId}/workers/services/${workerName}/environments/${env}/tails/${tailId}`
		: `/accounts/${accountId}/workers/scripts/${workerName}/tails/${tailId}`;
}

interface CreatePagesTailOptions {
	accountId: string;
	projectName: string;
	deploymentId: string;
	filters: TailFilterMessage;
	debug?: boolean;
}

/**
 * Create and connect to a Pages Function Tail.
 *
 * Under the hood, this function
 * - Registers a new Tail with the API
 * - Connects to the tail worker
 * - Sends any filters over the connection
 *
 * @returns a websocket connection, an expiration, and a function to call to delete the tail
 */
export async function createPagesTail({
	accountId,
	projectName,
	deploymentId,
	filters,
	debug = false,
}: CreatePagesTailOptions) {
	const tailRecord = await fetchResult<TailCreationApiResponse>(
		`/accounts/${accountId}/pages/projects/${projectName}/deployments/${deploymentId}/tails`,
		{
			method: "POST",
			body: JSON.stringify(filters),
		}
	);

	const deleteTail = async () =>
		fetchResult(
			`/accounts/${accountId}/pages/projects/${projectName}/deployments/${deploymentId}/tails/${tailRecord.id}`,
			{ method: "DELETE" }
		);

	const tail = new WebSocket(tailRecord.url, TRACE_VERSION, {
		headers: {
			"Sec-WebSocket-Protocol": TRACE_VERSION, // needs to be `trace-v1` to be accepted
			"User-Agent": `wrangler-js/${packageVersion}`,
		},
	});

	// send filters when we open up
	tail.on("open", () => {
		tail.send(
			JSON.stringify({ debug: debug }),
			{ binary: false, compress: false, mask: false, fin: true },
			(err) => {
				if (err) {
					throw err;
				}
			}
		);
	});

	return { tail, deleteTail, expiration: tailRecord.expires_at };
}

/**
 * Create and connect to a tail.
 *
 * Under the hood, this function
 * - Registers a new Tail with the API
 * - Connects to the tail worker
 * - Sends any filters over the connection
 *
 * @param accountId the account ID associated with the worker to tail
 * @param workerName the name of the worker to tail
 * @param filters A list of `TailAPIFilters` given to the tail
 * @param debug Flag to run tail in debug mode
 * @returns a websocket connection, an expiration, and a function to call to delete the tail
 */
export async function createTail(
	accountId: string,
	workerName: string,
	filters: TailFilterMessage,
	debug: boolean,
	env: string | undefined
): Promise<{
	tail: WebSocket;
	expiration: Date;
	deleteTail: () => Promise<void>;
}> {
	// create the tail
	const createTailUrl = makeCreateTailUrl(accountId, workerName, env);
	const {
		id: tailId,
		url: websocketUrl,
		expires_at: expiration,
	} = await fetchResult<TailCreationApiResponse>(createTailUrl, {
		method: "POST",
		body: JSON.stringify(filters),
	});

	// delete the tail (not yet!)
	const deleteUrl = makeDeleteTailUrl(accountId, workerName, tailId, env);
	async function deleteTail() {
		await fetchResult(deleteUrl, { method: "DELETE" });
	}

	// connect to the tail
	const tail = new WebSocket(websocketUrl, TRACE_VERSION, {
		headers: {
			"Sec-WebSocket-Protocol": TRACE_VERSION, // needs to be `trace-v1` to be accepted
			"User-Agent": `wrangler-js/${packageVersion}`,
		},
	});

	// send filters when we open up
	tail.on("open", function () {
		tail.send(
			JSON.stringify({ debug: debug }),
			{ binary: false, compress: false, mask: false, fin: true },
			(err) => {
				if (err) {
					throw err;
				}
			}
		);
	});

	return { tail, expiration, deleteTail };
}

/**
 * Everything captured by the trace worker and sent to us via
 * `wrangler tail` is structured JSON that deserializes to this type.
 */
export type TailEventMessage = {
	/**
	 * Whether the execution of this worker succeeded or failed
	 */
	outcome: Outcome;

	/**
	 * The name of the script we're tailing
	 */
	scriptName?: string;

	/**
	 * Any exceptions raised by the worker
	 */
	exceptions: {
		/**
		 * The name of the exception.
		 */
		name: string;

		/**
		 * The error message
		 */
		message: unknown;

		/**
		 * When the exception was raised/thrown
		 */
		timestamp: number;
	}[];

	/**
	 * Any logs sent out by the worker
	 */
	logs: {
		message: unknown[];
		level: string; // TODO: make this a union of possible values
		timestamp: number;
	}[];

	/**
	 * When the event was triggered
	 */
	eventTimestamp: number;

	/**
	 * The event that triggered the worker. In the case of an HTTP request,
	 * this will be a RequestEvent. If it's a cron trigger, it'll be a
	 * ScheduledEvent. If it's a durable object alarm, it's an AlarmEvent.
	 *
	 * Until workers-types exposes individual types for export, we'll have
	 * to just re-define these types ourselves.
	 */
	event: RequestEvent | ScheduledEvent | AlarmEvent | undefined | null;
};

/**
 * A request that triggered worker execution
 */

export type RequestEvent = {
	request: Pick<Request, "url" | "method" | "headers"> & {
		/**
		 * Cloudflare-specific properties
		 * https://developers.cloudflare.com/workers/runtime-apis/request#incomingrequestcfproperties
		 */
		cf: {
			/**
			 * How long (in ms) it took for the client's TCP connection to make a
			 * round trip to the worker and back. For all my gamers out there,
			 * this is the request's ping
			 */
			clientTcpRtt?: number;

			/**
			 * Longitude and Latitude of where the request originated from
			 */
			longitude?: string;
			latitude?: string;

			/**
			 * What cipher was used to establish the TLS connection
			 */
			tlsCipher: string;

			/**
			 * Which continent the request came from.
			 */
			continent?: "NA";

			/**
			 * ASN of the incoming request
			 */
			asn: number;

			/**
			 * The country the incoming request is coming from
			 */
			country?: string;

			/**
			 * The TLS version the connection used
			 */
			tlsVersion: string;

			/**
			 * The colo that processed the request (i.e. the airport code
			 * of the closest city to the server that spun up the worker)
			 */
			colo: string;

			/**
			 * The timezone where the request came from
			 */
			timezone?: string;

			/**
			 * The city where the request came from
			 */
			city?: string;

			/**
			 * The browser-requested prioritization information in the request object
			 */
			requestPriority?: string;

			/**
			 * Which version of HTTP the request came over e.g. "HTTP/2"
			 */
			httpProtocol: string;

			/**
			 * The region where the request originated from
			 */
			region?: string;
			regionCode?: string;

			/**
			 * The organization which owns the ASN of the incoming request, for example, Google Cloud.
			 */
			asOrganization: string;

			/**
			 * Metro code (DMA) of the incoming request, for example, "635".
			 */
			metroCode?: string;

			/**
			 * Postal code of the incoming request, for example, "78701".
			 */
			postalCode?: string;
		};
	};
};

/**
 * An event that was triggered at a certain time
 */
export type ScheduledEvent = {
	/**
	 * The cron pattern that matched when this event fired
	 */
	cron: string;

	/**
	 * The time this worker was scheduled to run.
	 * For some reason, this doesn't...work correctly when we
	 * do it directly as a Date. So parse it later on your own.
	 */
	scheduledTime: number;
};

/**
 * A event that was triggered from a durable object alarm
 */
export type AlarmEvent = {
	/**
	 * The datetime the alarm was scheduled for.
	 *
	 * This is sent as an ISO timestamp string (different than ScheduledEvent.scheduledTime),
	 * you should parse it later on on your own.
	 */
	scheduledTime: string;
};
