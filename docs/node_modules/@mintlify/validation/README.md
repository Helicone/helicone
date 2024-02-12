# @mintlify/validation

`@mintlify/validation` is a small package to validate `mint.json` files.

# Installation

```
npm install @mintlify/validation
```

# Usage

```
import mintValidation from "@mintlify/validation"

const configObject = { name: "Site Name", navigation: [] }

mintValidation.validateMintConfig(configObject)
```

This package assumes you have already loaded a config object into a JavaScript object.

## Return Values

The package returns an object with the properties `status`, `warnings`, and `errors`.

`status` can be one of: `"success"`, `"error"`.

`warnings` is a string array with warnings the user should know but are not expected to break the site.

`errors` is a string array of errors that will likely break the site.

When `status === "error"` you should stop trying to build `mint`, your `mint.json` file is invalid and the site will crash when building.

## Return Value Example

```
{
    "status": "error",
    "warnings": ["Navigation is an empty array, no pages will be shown"],
    "errors": ["Mintlify does not support .ico favicons, use .svg or .png instead."]
}
```

## Documentation

Additional documentation on `mint.json` is available on [Mintlify's website](https://mintlify.com/docs/settings/global).

# Community

Join our Discord community if you have questions or just want to chat:

[![](https://dcbadge.vercel.app/api/server/ACREKdwjG5)](https://discord.gg/ACREKdwjG5)

_Built with 💚 by the Mintlify community._
