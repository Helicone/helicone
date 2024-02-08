import { Transform, TransformCallback } from 'stream';

type PlatformName = "android" | "appleIcon" | "appleStartup" | "favicons" | "windows" | "yandex";

interface IconSize {
    readonly width: number;
    readonly height: number;
}
interface IconOptions {
    readonly sizes: IconSize[];
    readonly offset?: number;
    readonly background?: string | boolean;
    readonly transparent: boolean;
    readonly rotate: boolean;
    readonly purpose?: string;
    readonly pixelArt?: boolean;
}
interface FileOptions {
    readonly manifestFileName?: string;
}
interface ShortcutOptions {
    readonly name: string;
    readonly short_name?: string;
    readonly description?: string;
    readonly url: string;
    readonly icon?: string | Buffer | (string | Buffer)[];
}
interface Application {
    readonly platform?: string;
    readonly url?: string;
    readonly id?: string;
}
interface OutputOptions {
    readonly images?: boolean;
    readonly files?: boolean;
    readonly html?: boolean;
}
interface FaviconOptions {
    readonly path?: string;
    readonly appName?: string;
    readonly appShortName?: string;
    readonly appDescription?: string;
    readonly developerName?: string;
    readonly developerURL?: string;
    readonly cacheBustingQueryParam?: string | null;
    readonly dir?: string;
    readonly lang?: string;
    readonly background?: string;
    readonly theme_color?: string;
    readonly appleStatusBarStyle?: string;
    readonly display?: string;
    readonly orientation?: string;
    readonly scope?: string;
    readonly start_url?: string;
    readonly version?: string;
    readonly pixel_art?: boolean;
    readonly loadManifestWithCredentials?: boolean;
    readonly manifestRelativePaths?: boolean;
    readonly manifestMaskable?: boolean | string | Buffer | (string | Buffer)[];
    readonly preferRelatedApplications?: boolean;
    readonly relatedApplications?: Application[];
    readonly icons?: Record<PlatformName, IconOptions | boolean | string[]>;
    readonly files?: Record<PlatformName, FileOptions>;
    readonly shortcuts?: ShortcutOptions[];
    readonly output?: OutputOptions;
}

interface FaviconImage {
    readonly name: string;
    readonly contents: Buffer;
}
interface FaviconFile {
    readonly name: string;
    readonly contents: string;
}
declare const config: {
    defaults: FaviconOptions;
};
type FaviconHtmlElement = string;
interface FaviconResponse {
    readonly images: FaviconImage[];
    readonly files: FaviconFile[];
    readonly html: FaviconHtmlElement[];
}
declare function favicons(source: string | Buffer | (string | Buffer)[], options?: FaviconOptions): Promise<FaviconResponse>;

interface FaviconStreamOptions extends FaviconOptions {
    readonly html?: string;
    readonly pipeHTML?: boolean;
    readonly emitBuffers?: boolean;
}
type HandleHTML = (html: FaviconHtmlElement[]) => void;
declare class FaviconStream extends Transform {
    #private;
    constructor(options: FaviconStreamOptions, handleHTML: HandleHTML);
    _transform(file: any, // eslint-disable-line @typescript-eslint/no-explicit-any -- superclass uses any
    _encoding: BufferEncoding, callback: TransformCallback): void;
}
declare function stream(options: FaviconStreamOptions, handleHTML: HandleHTML): FaviconStream;

export { type FaviconFile, type FaviconHtmlElement, type FaviconImage, type FaviconOptions, type FaviconResponse, type FaviconStreamOptions, type HandleHTML, config, favicons as default, favicons, stream };
