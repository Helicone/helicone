import path from "node:path";

export function getLocalPersistencePath(
	persistTo: string | undefined,
	doPersist: true,
	configPath: string | undefined
): string;

export function getLocalPersistencePath(
	persistTo: string | undefined,
	doPersist: boolean,
	configPath: string | undefined
): string | null;

export function getLocalPersistencePath(
	persistTo: string | undefined,
	doPersist: boolean,
	configPath: string | undefined
) {
	return persistTo
		? // If path specified, always treat it as relative to cwd()
		  path.resolve(process.cwd(), persistTo)
		: doPersist
		? // If just flagged on, treat it as relative to wrangler.toml,
		  // if one can be found, otherwise cwd()
		  path.resolve(
				configPath ? path.dirname(configPath) : process.cwd(),
				".wrangler/state"
		  )
		: null;
}
