import { MiniflareError } from '@miniflare/shared';
import { Options } from '@miniflare/shared';
import { PluginSignatures } from '@miniflare/shared';

export declare function buildHelp<Plugins extends PluginSignatures>(plugins: Plugins, exec: string, columns?: number): string;

export declare function parseArgv<Plugins extends PluginSignatures>(plugins: Plugins, argv: string[]): Options<Plugins>;

export declare class ParseError extends MiniflareError<ParseErrorCode> {
}

export declare type ParseErrorCode = "ERR_HELP" | "ERR_VERSION" | "ERR_OPTION" | "ERR_VALUE";

/* Excluded from this release type: _wrapLines */

export { }
