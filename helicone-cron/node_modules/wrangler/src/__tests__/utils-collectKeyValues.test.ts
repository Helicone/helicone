import { collectKeyValues } from "../utils/collectKeyValues";

describe("collectKeyValues()", () => {
	it("should return an empty object when passed undefined", () => {
		expect(collectKeyValues(undefined)).toEqual({});
	});

	it("should return an empty object when passed an empty array", () => {
		expect(collectKeyValues([])).toEqual({});
	});

	it("should parse a key:value string with no value by returning an empty string for the value", () => {
		expect(collectKeyValues(["some-string-with-no-colon"])).toEqual({
			"some-string-with-no-colon": "",
		});
	});

	it("should return an object with a single key/value pair when passed an array with a single string", () => {
		expect(collectKeyValues(["some-key:some-value"])).toEqual({
			"some-key": "some-value",
		});
	});

	it("should return an object with multiple key/value pairs when passed an array with multiple strings", () => {
		expect(
			collectKeyValues([
				"some-key:some-value",
				"some-other-key:some-other-value",
			])
		).toEqual({
			"some-key": "some-value",
			"some-other-key": "some-other-value",
		});
	});

	it("should return an object with multiple key/value pairs when passed an array with multiple strings with multiple colons", () => {
		expect(
			collectKeyValues([
				"some-key:https://some-value.com",
				"some-other-key:https://some-other-value.com",
			])
		).toEqual({
			"some-key": "https://some-value.com",
			"some-other-key": "https://some-other-value.com",
		});
	});
});
