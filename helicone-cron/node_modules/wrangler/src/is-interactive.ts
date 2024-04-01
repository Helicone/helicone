/**
 * Test whether the process is "interactive".
 * Reasons it may not be interactive: it could be running in CI,
 * or you're piping values from / to another process, etc
 */
export default function isInteractive(): boolean {
	if (process.env.CF_PAGES === "1") {
		return false;
	}

	try {
		return Boolean(process.stdin.isTTY && process.stdout.isTTY);
	} catch {
		return false;
	}
}
