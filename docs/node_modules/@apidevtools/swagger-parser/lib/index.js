/* eslint-disable no-unused-vars */
"use strict";

const validateSchema = require("./validators/schema");
const validateSpec = require("./validators/spec");
const normalizeArgs = require("@apidevtools/json-schema-ref-parser/lib/normalize-args");
const util = require("./util");
const Options = require("./options");
const maybe = require("call-me-maybe");
const { ono } = require("@jsdevtools/ono");
const $RefParser = require("@apidevtools/json-schema-ref-parser");
const dereference = require("@apidevtools/json-schema-ref-parser/lib/dereference");

module.exports = SwaggerParser;

/**
 * This class parses a Swagger 2.0 or 3.0 API, resolves its JSON references and their resolved values,
 * and provides methods for traversing, dereferencing, and validating the API.
 *
 * @class
 * @augments $RefParser
 */
function SwaggerParser () {
  $RefParser.apply(this, arguments);
}

util.inherits(SwaggerParser, $RefParser);
SwaggerParser.parse = $RefParser.parse;
SwaggerParser.resolve = $RefParser.resolve;
SwaggerParser.bundle = $RefParser.bundle;
SwaggerParser.dereference = $RefParser.dereference;

/**
 * Alias {@link $RefParser#schema} as {@link SwaggerParser#api}
 */
Object.defineProperty(SwaggerParser.prototype, "api", {
  configurable: true,
  enumerable: true,
  get () {
    return this.schema;
  }
});

/**
 * Parses the given Swagger API.
 * This method does not resolve any JSON references.
 * It just reads a single file in JSON or YAML format, and parse it as a JavaScript object.
 *
 * @param {string} [path] - The file path or URL of the JSON schema
 * @param {object} [api] - The Swagger API object. This object will be used instead of reading from `path`.
 * @param {ParserOptions} [options] - Options that determine how the API is parsed
 * @param {Function} [callback] - An error-first callback. The second parameter is the parsed API object.
 * @returns {Promise} - The returned promise resolves with the parsed API object.
 */
SwaggerParser.prototype.parse = async function (path, api, options, callback) {
  let args = normalizeArgs(arguments);
  args.options = new Options(args.options);

  try {
    let schema = await $RefParser.prototype.parse.call(this, args.path, args.schema, args.options);

    if (schema.swagger) {
      // Verify that the parsed object is a Swagger API
      if (schema.swagger === undefined || schema.info === undefined || schema.paths === undefined) {
        throw ono.syntax(`${args.path || args.schema} is not a valid Swagger API definition`);
      }
      else if (typeof schema.swagger === "number") {
        // This is a very common mistake, so give a helpful error message
        throw ono.syntax('Swagger version number must be a string (e.g. "2.0") not a number.');
      }
      else if (typeof schema.info.version === "number") {
        // This is a very common mistake, so give a helpful error message
        throw ono.syntax('API version number must be a string (e.g. "1.0.0") not a number.');
      }
      else if (schema.swagger !== "2.0") {
        throw ono.syntax(`Unrecognized Swagger version: ${schema.swagger}. Expected 2.0`);
      }
    }
    else {
      let supportedVersions = ["3.0.0", "3.0.1", "3.0.2", "3.0.3", "3.1.0"];

      // Verify that the parsed object is a Openapi API
      if (schema.openapi === undefined || schema.info === undefined) {
        throw ono.syntax(`${args.path || args.schema} is not a valid Openapi API definition`);
      }
      else if (schema.paths === undefined) {
        if (schema.openapi === "3.1.0") {
          if (schema.webhooks === undefined) {
            throw ono.syntax(`${args.path || args.schema} is not a valid Openapi API definition`);
          }
        }
        else {
          throw ono.syntax(`${args.path || args.schema} is not a valid Openapi API definition`);
        }
      }
      else if (typeof schema.openapi === "number") {
        // This is a very common mistake, so give a helpful error message
        throw ono.syntax('Openapi version number must be a string (e.g. "3.0.0") not a number.');
      }
      else if (typeof schema.info.version === "number") {
        // This is a very common mistake, so give a helpful error message
        throw ono.syntax('API version number must be a string (e.g. "1.0.0") not a number.');
      }
      else if (supportedVersions.indexOf(schema.openapi) === -1) {
        throw ono.syntax(
          `Unsupported OpenAPI version: ${schema.openapi}. ` +
          `Swagger Parser only supports versions ${supportedVersions.join(", ")}`
        );
      }

      // This is an OpenAPI v3 schema, check if the "servers" have any relative paths and
      // fix them if the content was pulled from a web resource
      util.fixOasRelativeServers(schema, args.path);
    }

    // Looks good!
    return maybe(args.callback, Promise.resolve(schema));
  }
  catch (err) {
    return maybe(args.callback, Promise.reject(err));
  }
};

/**
 * Parses, dereferences, and validates the given Swagger API.
 * Depending on the options, validation can include JSON Schema validation and/or Swagger Spec validation.
 *
 * @param {string} [path] - The file path or URL of the JSON schema
 * @param {object} [api] - The Swagger API object. This object will be used instead of reading from `path`.
 * @param {ParserOptions} [options] - Options that determine how the API is parsed, dereferenced, and validated
 * @param {Function} [callback] - An error-first callback. The second parameter is the parsed API object.
 * @returns {Promise} - The returned promise resolves with the parsed API object.
 */
SwaggerParser.validate = function (path, api, options, callback) {
  let Class = this; // eslint-disable-line consistent-this
  let instance = new Class();
  return instance.validate.apply(instance, arguments);
};

/**
 * Parses, dereferences, and validates the given Swagger API.
 * Depending on the options, validation can include JSON Schema validation and/or Swagger Spec validation.
 *
 * @param {string} [path] - The file path or URL of the JSON schema
 * @param {object} [api] - The Swagger API object. This object will be used instead of reading from `path`.
 * @param {ParserOptions} [options] - Options that determine how the API is parsed, dereferenced, and validated
 * @param {Function} [callback] - An error-first callback. The second parameter is the parsed API object.
 * @returns {Promise} - The returned promise resolves with the parsed API object.
 */
SwaggerParser.prototype.validate = async function (path, api, options, callback) {
  let me = this;
  let args = normalizeArgs(arguments);
  args.options = new Options(args.options);

  // ZSchema doesn't support circular objects, so don't dereference circular $refs yet
  // (see https://github.com/zaggino/z-schema/issues/137)
  let circular$RefOption = args.options.dereference.circular;
  args.options.validate.schema && (args.options.dereference.circular = "ignore");

  try {
    await this.dereference(args.path, args.schema, args.options);

    // Restore the original options, now that we're done dereferencing
    args.options.dereference.circular = circular$RefOption;

    if (args.options.validate.schema) {
      // Validate the API against the Swagger schema
      // NOTE: This is safe to do, because we haven't dereferenced circular $refs yet
      validateSchema(me.api);

      if (me.$refs.circular) {
        if (circular$RefOption === true) {
          // The API has circular references,
          // so we need to do a second-pass to fully-dereference it
          dereference(me, args.options);
        }
        else if (circular$RefOption === false) {
          // The API has circular references, and they're not allowed, so throw an error
          throw ono.reference("The API contains circular references");
        }
      }
    }

    if (args.options.validate.spec) {
      // Validate the API against the Swagger spec
      validateSpec(me.api);
    }

    return maybe(args.callback, Promise.resolve(me.schema));
  }
  catch (err) {
    return maybe(args.callback, Promise.reject(err));
  }
};

/**
 * The Swagger object
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#swagger-object
 *
 * @typedef {{swagger: string, info: {}, paths: {}}} SwaggerObject
 */
