"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultOptions = exports.defaultOptions = void 0;
exports.defaultOptions = {
    name: undefined,
    $refStrategy: "root",
    basePath: ["#"],
    effectStrategy: "input",
    pipeStrategy: "all",
    dateStrategy: "string",
    mapStrategy: "entries",
    definitionPath: "definitions",
    target: "jsonSchema7",
    strictUnions: false,
    definitions: {},
    errorMessages: false,
    markdownDescription: false,
    patternStrategy: "escape",
    emailStrategy: "format:email",
};
const getDefaultOptions = (options) => (typeof options === "string"
    ? {
        ...exports.defaultOptions,
        name: options,
    }
    : {
        ...exports.defaultOptions,
        ...options,
    });
exports.getDefaultOptions = getDefaultOptions;
