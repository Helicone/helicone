import { getMetricsConfig } from "./metrics-config";

/**
 * Add an additional header to publish requests if the user has opted into sending usage metrics.
 *
 * This allows us to estimate the number of instances of Wrangler that have opted-in
 * without breaking our agreement not to send stuff if you have not opted-in.
 */
export async function getMetricsUsageHeaders(
	sendMetrics: boolean | undefined
): Promise<Record<string, string> | undefined> {
	const metricsEnabled = (
		await getMetricsConfig({
			sendMetrics,
		})
	).enabled;
	if (metricsEnabled) {
		return {
			metricsEnabled: "true",
		};
	} else {
		return undefined;
	}
}
