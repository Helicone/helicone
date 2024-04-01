import { Request } from "undici";
import { parseRequestInput } from "../api/dev";

describe("parseRequestInput for fetch on unstable dev", () => {
	it("should allow no input to be passed in", () => {
		const [input, _] = parseRequestInput("0.0.0.0", 8080);

		expect(input).toMatchInlineSnapshot(`"http://0.0.0.0:8080"`);
	});

	it("should allow string of pathname to be passed in", () => {
		const [input, _] = parseRequestInput("0.0.0.0", 8080, "/test");

		expect(input).toMatchInlineSnapshot(`"http://0.0.0.0:8080/test"`);
	});

	it("should allow full url to be passed in as string and stripped", () => {
		const [input, _] = parseRequestInput(
			"0.0.0.0",
			8080,
			"http://cloudflare.com/test"
		);

		expect(input).toMatchInlineSnapshot(`"http://0.0.0.0:8080/test"`);
	});

	it("should allow URL object without pathname to be passed in and stripped", () => {
		const [input, _] = parseRequestInput(
			"0.0.0.0",
			8080,
			new URL("http://cloudflare.com")
		);

		expect(input).toMatchInlineSnapshot(`"http://0.0.0.0:8080/"`);
	});

	it("should allow URL object with pathname to be passed in and stripped", () => {
		const [input, _] = parseRequestInput(
			"0.0.0.0",
			8080,
			new URL("http://cloudflare.com/test")
		);

		expect(input).toMatchInlineSnapshot(`"http://0.0.0.0:8080/test"`);
	});

	it("should allow request object to be passed in", () => {
		const [input, init] = parseRequestInput(
			"0.0.0.0",
			8080,
			new Request("http://cloudflare.com/test", { method: "POST" })
		);

		expect(init).toBeUndefined();
		expect(input).toBeInstanceOf(Request);
		// We don't expect the request to be modified
		expect((input as Request).url).toMatchInlineSnapshot(
			`"http://cloudflare.com/test"`
		);
		expect((input as Request).method).toMatchInlineSnapshot(`"POST"`);
	});

	it("should parse to give https url with localProtocol = https", () => {
		const [input, _] = parseRequestInput("0.0.0.0", 8080, "/test", {}, "https");

		expect(input).toMatchInlineSnapshot(`"https://0.0.0.0:8080/test"`);
	});

	it("should parse to give http url with localProtocol = http", () => {
		const [input, _] = parseRequestInput("0.0.0.0", 8080, "/test", {}, "http");

		expect(input).toMatchInlineSnapshot(`"http://0.0.0.0:8080/test"`);
	});

	it("should parse to give http url with localProtocol not set", () => {
		const [input, _] = parseRequestInput("0.0.0.0", 8080, "/test", {});

		expect(input).toMatchInlineSnapshot(`"http://0.0.0.0:8080/test"`);
	});
});
