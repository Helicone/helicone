"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openapi = exports.openapiV31 = exports.openapiV3 = exports.openapiV2 = exports.openapiV1 = void 0;
/**
 * JSON Schema for OpenAPI Specification v1.2
 */
exports.openapiV1 = require("../schemas/v1.2/apiDeclaration.json");
/**
 * JSON Schema for OpenAPI Specification v2.0
 */
exports.openapiV2 = require("../schemas/v2.0/schema.json");
/**
 * JSON Schema for OpenAPI Specification v3.0
 */
exports.openapiV3 = require("../schemas/v3.0/schema.json");
/**
 * JSON Schema for OpenAPI Specification v3.1
 */
exports.openapiV31 = require("../schemas/v3.1/schema.json");
/**
 * JSON Schemas for every version of the OpenAPI Specification
 */
exports.openapi = {
    v1: exports.openapiV1,
    v2: exports.openapiV2,
    v3: exports.openapiV3,
    v31: exports.openapiV31,
};
// Export `openapi` as the default export
exports.default = exports.openapi;
// CommonJS default export hack
/* eslint-env commonjs */
if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = Object.assign(module.exports.default, module.exports);
}
//# sourceMappingURL=index.js.map