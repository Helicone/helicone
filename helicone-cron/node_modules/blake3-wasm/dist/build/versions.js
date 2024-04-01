"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minNodeVersion = 10;
/**
 * @hidden
 */
exports.parseVersion = (version) => {
    const [, major, minor, patch] = /^v([0-9]+)\.([0-9]+)\.([0-9]+)/.exec(version) || [];
    return { major: Number(major), minor: Number(minor), patch: Number(patch) };
};
exports.compareVersion = (a, b) => a.major - b.major || a.minor - b.minor || a.patch - b.patch;
//# sourceMappingURL=versions.js.map