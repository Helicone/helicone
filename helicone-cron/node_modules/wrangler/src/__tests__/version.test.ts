import { version } from "./../../package.json";
import { mockConsoleMethods } from "./helpers/mock-console";
import { useMockIsTTY } from "./helpers/mock-istty";
import { runWrangler } from "./helpers/run-wrangler";

describe("version", () => {
	const std = mockConsoleMethods();
	const { setIsTTY } = useMockIsTTY();

	// We cannot test output of version banner,
	// as it is disabled in jest environments

	// it("should output version banner", async () => {
	// 	await runWrangler("-v");
	// 	expect(std.out).toMatchInlineSnapshot(`
	// 	" ⛅️ wrangler 2.0.22
	// 	[38;5;214m--------------------[39m"
	// `);
	// });

	it("should output current version if !isTTY calling -v", async () => {
		setIsTTY(false);

		await runWrangler("-v");
		expect(std.out).toMatch(version);
	});

	// This run separately as command handling is different
	it("should output current version if !isTTY calling --version", async () => {
		setIsTTY(false);

		await runWrangler("--version");
		expect(std.out).toMatch(version);
	});
});
