import * as fs from "fs";
import TOML from "@iarna/toml";
import type { RawConfig } from "../../config";

/** Write a mock wrangler.toml file to disk. */
export default function writeWranglerToml(config: RawConfig = {}) {
	fs.writeFileSync(
		"./wrangler.toml",
		TOML.stringify({
			compatibility_date: "2022-01-12",
			name: "test-name",
			...(config as TOML.JsonMap),
		}),

		"utf-8"
	);
}
