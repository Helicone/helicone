import type { ArgumentsCamelCase, Argv } from "yargs";

/**
 * Yargs options included in every wrangler command.
 */
export interface CommonYargsOptions {
	v: boolean | undefined;
	config: string | undefined;
	env: string | undefined;
}

export type YargvToInterface<T> = T extends Argv<infer P>
	? ArgumentsCamelCase<P>
	: never;

/**
 * Given some Yargs Options function factory, extract the interface
 * that corresponds to the yargs arguments
 */
export type YargsOptionsToInterface<
	T extends (yargs: Argv<CommonYargsOptions>) => Argv
> = T extends (yargs: Argv<CommonYargsOptions>) => Argv<infer P>
	? ArgumentsCamelCase<P>
	: never;
