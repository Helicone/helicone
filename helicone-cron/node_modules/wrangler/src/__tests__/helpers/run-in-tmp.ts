import * as fs from "node:fs";
import os from "node:os";
import * as path from "node:path";
import { reinitialiseAuthTokens } from "../../user";

const originalCwd = process.cwd();

export function runInTempDir({ homedir } = { homedir: "./home" }) {
	let tmpDir: string;

	beforeEach(() => {
		// Use realpath because the temporary path can point to a symlink rather than the actual path.
		tmpDir = fs.realpathSync(
			fs.mkdtempSync(path.join(os.tmpdir(), "wrangler-tests"))
		);

		process.chdir(tmpDir);
		// The path that is returned from `homedir()` should be absolute.
		const absHomedir = path.resolve(tmpDir, homedir);
		// Override where the home directory is so that we can write our own user config,
		// without destroying the real thing.
		fs.mkdirSync(absHomedir, { recursive: true });
		// Note it is very important that we use the "default" value from "node:os" (e.g. `import os from "node:os";`)
		// rather than an alias to the module (e.g. `import * as os from "node:os";`).
		// This is because the module gets transpiled so that the "method" `homedir()` gets converted to a
		// getter that is not configurable (and so cannot be spied upon).
		jest.spyOn(os, "homedir")?.mockReturnValue(absHomedir);
		// Now that we have changed the home directory location, we must reinitialize the user auth state
		reinitialiseAuthTokens();
	});

	afterEach(() => {
		if (fs.existsSync(tmpDir)) {
			process.chdir(originalCwd);
			fs.rmSync(tmpDir, { recursive: true });
		}
	});
}
