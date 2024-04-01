import { setMockResponse } from "./mock-cfetch";

export function mockCollectKnownRoutesRequest(
	routes: { pattern: string; script: string }[]
) {
	setMockResponse(`/zones/:zoneId/workers/routes`, "GET", () => routes);
}
