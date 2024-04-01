export class DeprecationError extends Error {
	constructor(message: string) {
		super(`Deprecation:\n${message}`);
	}
}

export class FatalError extends Error {
	constructor(message?: string, readonly code?: number) {
		super(message);
	}
}
