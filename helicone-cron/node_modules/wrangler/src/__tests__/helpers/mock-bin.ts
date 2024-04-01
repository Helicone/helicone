import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import cmdShim from "cmd-shim";

const nodeShebang = "#!/usr/bin/env node";

/**
 * Create a binary file in a temp directory and make it available on the PATH.
 */
export async function mockBinary(
	binaryName: string,
	code: string
): Promise<() => void> {
	// Ensure there is a directory to put the mock binary in.
	const tmpDir = resolve(mkdtempSync(".mock-binary-"));

	// Use a fake extension on Windows because we will create a cmd-shim to run the binary.
	const extension = process.platform === "win32" ? ".x-mock-bin" : "";
	const filePath = resolve(tmpDir, `${binaryName}${extension}`);
	writeFileSync(filePath, nodeShebang + "\n" + code);
	chmodSync(filePath, 0o777);

	if (process.platform === "win32") {
		await cmdShim(filePath, basename(filePath, ".x-mock-bin"));
	}

	// Update PATH using the appropriate separator for the platform.
	const oldPath = process.env.PATH;
	const sep = process.platform === "win32" ? ";" : ":";
	process.env.PATH = tmpDir + sep + oldPath;

	return function unMock() {
		rmSync(tmpDir, { recursive: true });
		process.env.PATH = process.env.PATH?.replace(tmpDir + sep, "");
	};
}
