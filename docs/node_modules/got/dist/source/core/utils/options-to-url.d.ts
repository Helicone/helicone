/// <reference types="node" resolution-mode="require"/>
export type URLOptions = {
    href?: string;
    protocol?: string;
    host?: string;
    hostname?: string;
    port?: string | number;
    pathname?: string;
    search?: string;
    searchParams?: unknown;
    path?: string;
};
export default function optionsToUrl(origin: string, options: URLOptions): URL;
