import { setMockResponse } from "./mock-cfetch";

export function mockGetZoneFromHostRequest(host: string, zone?: string) {
	setMockResponse("/zones", (_uri, _init, queryParams) => {
		expect(queryParams.get("name")).toEqual(host);
		return zone ? [{ id: zone }] : [];
	});
}
