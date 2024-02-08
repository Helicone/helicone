# OpenAPI Specification Schemas

[![Cross-Platform Compatibility](https://apitools.dev/img/badges/os-badges.svg)](https://github.com/APIDevTools/openapi-schemas/actions)
[![Build Status](https://github.com/APIDevTools/openapi-schemas/workflows/CI-CD/badge.svg?branch=master)](https://github.com/APIDevTools/openapi-schemas/actions)

[![Coverage Status](https://coveralls.io/repos/github/APIDevTools/openapi-schemas/badge.svg?branch=master)](https://coveralls.io/github/APIDevTools/openapi-schemas)
[![Dependencies](https://david-dm.org/APIDevTools/openapi-schemas.svg)](https://david-dm.org/APIDevTools/openapi-schemas)

[![npm](https://img.shields.io/npm/v/@apidevtools/openapi-schemas.svg)](https://www.npmjs.com/package/@apidevtools/openapi-schemas)
[![License](https://img.shields.io/npm/l/@apidevtools/openapi-schemas.svg)](LICENSE)
[![Buy us a tree](https://img.shields.io/badge/Treeware-%F0%9F%8C%B3-lightgreen)](https://plant.treeware.earth/APIDevTools/openapi-schemas)



This package contains [**the official JSON Schemas**](https://github.com/OAI/OpenAPI-Specification/tree/master/schemas) for every version of Swagger/OpenAPI Specification:

| Version | Schema | Docs
|---------|--------|-------
| Swagger 1.2   | [v1.2 schema](https://github.com/OAI/OpenAPI-Specification/tree/master/schemas/v1.2)               | [v1.2 docs](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/1.2.md)
| Swagger 2.0   | [v2.0 schema](https://github.com/OAI/OpenAPI-Specification/blob/master/schemas/v2.0/schema.json)   | [v2.0 docs](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md)
| OpenAPI 3.0.x | [v3.0.x schema](https://github.com/OAI/OpenAPI-Specification/blob/master/schemas/v3.0/schema.json) | [v3.0.3 docs](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.3.md)
| OpenAPI 3.1.x | [v3.1.x schema](https://github.com/OAI/OpenAPI-Specification/blob/master/schemas/v3.1/schema.json) | [v3.1.0 docs](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.1.0.md)


All schemas are kept up-to-date with the latest official definitions via an automated CI/CD job. 🤖📦



Installation
--------------------------
You can install OpenAPI Schemas via [npm](https://docs.npmjs.com/about-npm/).

```bash
npm install @apidevtools/openapi-schemas
```



Usage
--------------------------

The default export contains all OpenAPI Specification versions:

```javascript
const openapi = require("@apidevtools/openapi-schemas");

console.log(openapi.v1);    // { $schema, id, properties, definitions, ... }
console.log(openapi.v2);    // { $schema, id, properties, definitions, ... }
console.log(openapi.v3);    // { $schema, id, properties, definitions, ... }
console.log(openapi.v31);    // { $schema, id, properties, definitions, ... }
```

Or you can import the specific version(s) that you need:

```javascript
const { openapiV1, openapiV2, openapiV3, openapiV31 } = require("@apidevtools/openapi-schemas");

console.log(openapiV1);    // { $schema, id, properties, definitions, ... }
console.log(openapiV2);    // { $schema, id, properties, definitions, ... }
console.log(openapiV3);    // { $schema, id, properties, definitions, ... }
console.log(openapiV31);    // { $schema, id, properties, definitions, ... }
```

You can use a JSON Schema validator such as [Z-Schema](https://www.npmjs.com/package/z-schema) or [AJV](https://www.npmjs.com/package/ajv) to validate OpenAPI definitions against the specification.

```javascript
const { openapiV31 } = require("@apidevtools/openapi-schemas");
const ZSchema = require("z-schema");

// Create a ZSchema validator
let validator = new ZSchema();

// Validate an OpenAPI definition against the OpenAPI v3.0 specification
validator.validate(openapiDefinition, openapiV31);
```



Contributing
--------------------------
Contributions, enhancements, and bug-fixes are welcome!  [Open an issue](https://github.com/APIDevTools/openapi-schemas/issues) on GitHub and [submit a pull request](https://github.com/APIDevTools/openapi-schemas/pulls).

#### Building
To build the project locally on your computer:

1. __Clone this repo__<br>
`git clone https://github.com/APIDevTools/openapi-schemas.git`

2. __Install dependencies__<br>
`npm install`

3. __Build the code__<br>
`npm run build`

4. __Run the tests__<br>
`npm test`



License
--------------------------
OpenAPI Schemas is 100% free and open-source, under the [MIT license](LICENSE). Use it however you want.

This package is [Treeware](http://treeware.earth). If you use it in production, then we ask that you [**buy the world a tree**](https://plant.treeware.earth/APIDevTools/openapi-schemas) to thank us for our work. By contributing to the Treeware forest you’ll be creating employment for local families and restoring wildlife habitats.



Big Thanks To
--------------------------
Thanks to these awesome companies for their support of Open Source developers ❤

[![GitHub](https://apitools.dev/img/badges/github.svg)](https://github.com/open-source)
[![NPM](https://apitools.dev/img/badges/npm.svg)](https://www.npmjs.com/)
[![Coveralls](https://apitools.dev/img/badges/coveralls.svg)](https://coveralls.io)
[![Travis CI](https://apitools.dev/img/badges/travis-ci.svg)](https://travis-ci.com)
[![SauceLabs](https://apitools.dev/img/badges/sauce-labs.svg)](https://saucelabs.com)
