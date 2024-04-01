// this test has to be run with a version of node.js older than 16.13 to pass

const { spawn } = require("child_process");
const path = require("path");

const assert = require("assert");

const wranglerProcess = spawn(
	"node",
	[path.join(__dirname, "../../bin/wrangler.js")],
	{ stdio: "pipe" }
);

const messageToMatch = "Wrangler requires at least node.js v16.13.0";

wranglerProcess.once("exit", (code) => {
	try {
		const errorMessage = wranglerProcess.stderr.read().toString();

		assert(code === 1, "Expected exit code 1");
		assert(
			errorMessage.includes(messageToMatch),
			`Expected error message to include "${messageToMatch}"`
		);
	} catch (err) {
		console.error("Error:", err);
		throw new Error(
			"This test has to be run with a version of node.js under 16.13 to pass"
		);
	}
});
