import { getConfigCache, saveToConfigCache } from "../config-cache";
import { mockConsoleMethods } from "./helpers/mock-console";
import { runInTempDir } from "./helpers/run-in-tmp";

interface PagesConfigCache {
	account_id: string;
	pages_project_name: string;
}

describe("config cache", () => {
	runInTempDir();
	mockConsoleMethods();
	// In this set of tests, we don't create a node_modules folder
	const pagesConfigCacheFilename = "pages-config-cache.json";

	it("should return an empty config if no file exists", () => {
		expect(
			getConfigCache<PagesConfigCache>(pagesConfigCacheFilename)
		).toMatchInlineSnapshot(`Object {}`);
	});

	it("should ignore attempts to cache values ", () => {
		saveToConfigCache<PagesConfigCache>(pagesConfigCacheFilename, {
			account_id: "some-account-id",
			pages_project_name: "foo",
		});
		expect(getConfigCache<PagesConfigCache>(pagesConfigCacheFilename)).toEqual(
			{}
		);

		saveToConfigCache<PagesConfigCache>(pagesConfigCacheFilename, {
			pages_project_name: "bar",
		});
		expect(getConfigCache<PagesConfigCache>(pagesConfigCacheFilename)).toEqual(
			{}
		);
	});
});
