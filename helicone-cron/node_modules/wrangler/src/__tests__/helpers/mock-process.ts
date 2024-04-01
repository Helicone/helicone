/**
 * We use this module to mock process methods (write only for now),
 * and optionally assert on the values they're called with in our tests.
 */

let writeSpy: jest.SpyInstance;

function captureLastWriteCall(spy: jest.SpyInstance): Buffer {
	const calls = spy.mock.calls;
	if (calls.length > 1) {
		throw new Error(
			"Unexpected calls to `stdout.write()`: " + JSON.stringify(calls)
		);
	}
	const buffer = calls[0]?.[0] ?? Buffer.alloc(0);
	if (buffer instanceof Buffer) {
		return buffer;
	} else {
		throw new Error(
			`Unexpected non-Buffer passed to \`stdout.write()\`: "${JSON.stringify(
				buffer
			)}"`
		);
	}
}

export function mockProcess() {
	beforeEach(() => {
		writeSpy = jest.spyOn(process.stdout, "write").mockImplementation();
	});
	afterEach(() => {
		writeSpy.mockRestore();
	});
	return {
		get write() {
			return captureLastWriteCall(writeSpy);
		},
	};
}
