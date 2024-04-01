const ORIGINAL_STDIN = process.stdin;

/**
 * Mock process.stdin so that we can pipe in text for non-interactive mode tests.
 */
export function useMockStdin({ isTTY }: { isTTY: boolean }) {
	const mockStdin = new MockStdIn(isTTY);

	beforeEach(() => {
		mockStdin.reset();
		Object.defineProperty(process, "stdin", {
			value: mockStdin,
			configurable: true,
			writable: false,
		});
	});

	afterEach(() => {
		Object.defineProperty(process, "stdin", {
			value: ORIGINAL_STDIN,
			configurable: true,
			writable: false,
		});
	});

	return mockStdin;
}

const failCallback: (value: unknown) => void = () => {
	throw new Error(
		"TEST FAILURE: stdin callback called before being initialized."
	);
};

/**
 * A mock version of `process.std`, which can be used to simulate piping data
 * into the wrangler process in non-interactive mode.
 */
class MockStdIn {
	private endCallback = failCallback;
	private errorCallback = failCallback;
	private chunks: string[] = [];
	private error: Error | undefined;

	/**
	 * Set this to true if you want the stdin stream to error.
	 */
	throwError(error: Error) {
		this.error = error;
	}

	/**
	 * Call this to clean out the chunks that are queued for sending.
	 */
	reset() {
		this.chunks.length = 0;
		this.error = undefined;
	}

	/**
	 * Queue up some chunks to be sent.
	 */
	send(...chunks: string[]) {
		this.chunks.push(...chunks);
	}

	constructor(
		/**
		 * Used by wrangler to check whether stdin is interactive.
		 */
		readonly isTTY: boolean
	) {}

	/**
	 * Used by wrangler to add event listeners.
	 */
	on(eventName: string, callback: () => void) {
		switch (eventName) {
			case "readable":
				setImmediate(callback);
				break;
			case "end":
				this.endCallback = callback;
				break;
			case "error":
				this.errorCallback = callback;
				break;
		}
	}

	/**
	 * Used by wrangler to get the next chunk of data in the stream.
	 */
	read() {
		if (this.error) {
			setImmediate(() => this.errorCallback(this.error));
		}
		if (this.chunks.length === 0) {
			setImmediate(this.endCallback);
		}
		return this.chunks.shift() ?? null;
	}

	/**
	 * Used by Ink.js to set the encoding of the stdout.
	 */
	setEncoding() {}
}
