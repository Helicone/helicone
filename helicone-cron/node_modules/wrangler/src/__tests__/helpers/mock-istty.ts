const ORIGINAL_STDOUT = process.stdout;
const ORIGINAL_STDIN = process.stdin;

/**
 * Mock `process.stdout.isTTY`
 */
export function useMockIsTTY() {
	/**
	 * Explicitly set `process.stdout.isTTY` to a given value (or to a getter function).
	 */
	const setIsTTY = (
		isTTY:
			| boolean
			| { stdin: boolean | (() => boolean); stdout: boolean | (() => boolean) }
	) => {
		mockStdStream("stdout", ORIGINAL_STDOUT, isTTY);
		mockStdStream("stdin", ORIGINAL_STDIN, isTTY);
	};

	beforeEach(() => {
		Object.defineProperty(process, "stdout", { value: ORIGINAL_STDOUT });
		Object.defineProperty(process, "stdin", { value: ORIGINAL_STDIN });
	});

	afterEach(() => {
		Object.defineProperty(process, "stdout", { value: ORIGINAL_STDOUT });
		Object.defineProperty(process, "stdin", { value: ORIGINAL_STDIN });
	});

	return { setIsTTY };
}

/**
 * Create a mock version of the specified stream which overrides `isTTY`
 * with the given mock responses.
 *
 * @param streamName the property name on `process` for the stream to be mocked.
 * @param originalStream the original stream object from the `process` object to be overridden.
 * @param isTTY the mock behaviour for the `isTTY` property:
 *  - boolean or `{ [streamName]: boolean } - use this value for isTTY;
 *  - { [streamName]: () => boolean } - use this function as a getter for isTTY.
 */
function mockStdStream<T extends object>(
	streamName: "stdout" | "stdin",
	originalStream: T,
	isTTY:
		| boolean
		| { stdin: boolean | (() => boolean); stdout: boolean | (() => boolean) }
) {
	Object.defineProperty(process, streamName, {
		value: createStdProxy(
			originalStream,
			typeof isTTY === "boolean" ? isTTY : isTTY[streamName]
		),
	});
}

/**
 * Create a proxy wrapper around the given `stream` object that overrides the `isTTY` property.
 */
function createStdProxy<T extends object>(
	stream: T,
	isTTY: boolean | (() => boolean)
): T {
	return new Proxy(stream, {
		get(target, prop) {
			return prop === "isTTY"
				? typeof isTTY === "boolean"
					? isTTY
					: isTTY()
				: target[prop as keyof typeof target];
		},
	});
}
