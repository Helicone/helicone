jest.unmock("../dialogs");
import { fromDashMessagePrompt } from "../dialogs";
import { CI } from "../is-ci";

describe("fromDashMessagePrompt", () => {
	it("should return undefined in CI when last deployed from api", async () => {
		//in CI
		jest.spyOn(CI, "isCI").mockReturnValue(true);
		const result = await fromDashMessagePrompt("api");
		expect(result).toBe(undefined);
	});

	it("should return undefined in CI when last deployed from wrangler", async () => {
		//in CI
		jest.spyOn(CI, "isCI").mockReturnValue(true);
		const result = await fromDashMessagePrompt("wrangler");
		expect(result).toBe(undefined);
	});

	it("should return true in CI when last deployed from dash", async () => {
		//in CI
		jest.spyOn(CI, "isCI").mockReturnValue(true);
		const result = await fromDashMessagePrompt("dash");
		expect(result).toBe(true);
	});

	it("should return undefined when last deployed from api", async () => {
		//not in CI
		jest.spyOn(CI, "isCI").mockReturnValue(false);
		const result = await fromDashMessagePrompt("api");
		expect(result).toBe(undefined);
	});

	it("should return undefined when last deployed from wrangler", async () => {
		//not in CI
		jest.spyOn(CI, "isCI").mockReturnValue(false);
		const result = await fromDashMessagePrompt("wrangler");
		expect(result).toBe(undefined);
	});
});
