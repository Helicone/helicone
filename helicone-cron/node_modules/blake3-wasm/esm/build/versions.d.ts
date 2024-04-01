export declare const minNodeVersion = 10;
/**
 * @hidden
 */
export interface IVersion {
    major: number;
    minor: number;
    patch: number;
}
/**
 * @hidden
 */
export declare const parseVersion: (version: string) => IVersion;
export declare const compareVersion: (a: IVersion, b: IVersion) => number;
