export const minNodeVersion = 10;
/**
 * @hidden
 */
export const parseVersion = (version) => {
    const [, major, minor, patch] = /^v([0-9]+)\.([0-9]+)\.([0-9]+)/.exec(version) || [];
    return { major: Number(major), minor: Number(minor), patch: Number(patch) };
};
export const compareVersion = (a, b) => a.major - b.major || a.minor - b.minor || a.patch - b.patch;
//# sourceMappingURL=versions.js.map