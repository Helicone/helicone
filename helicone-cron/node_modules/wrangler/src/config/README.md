# Configuration validation

The files in this directory define and validate the configuration that is read from a `wrangler.toml` file.

The configuration for a Worker is complicated since we can define different "environments", and each environment can have its own configuration.
There is a default ("top-level") environment and then named environments that provide environment specific configuration.

This is further complicated by the fact that there are three kinds of environment configuration:

- **non-overridable**: these values are defined once in the top-level configuration, apply to all environments and cannot be overridden by an environment.
- **inheritable**: these values can be defined at the top-level but can also be overridden by environment specific values.
  Named environments do not need to provide their own values, in which case they inherit the value from the top-level.
- **non-inheritable**: these values must be explicitly defined in each environment if they are defined at the top-level.
  Named environments do not inherit such configuration and must provide their own values.

All configuration values in `wrangler.toml` are optional and will receive a default value if not defined.

## Types

### Environment

The fields that can be defined within the `env` containers are defined in the [`Environment`](./environment.ts) type.
This includes the `EnvironmentInheritable` and `EnvironmentNonInheritable` fields.

### Config

The "non-overridable" types are defined in the [`ConfigFields`](./config.ts) type.
The `Config` type is the overall configuration, which consists of the `ConfigFields` and also an `Environment`.
In this case the `Environment`, here, corresponds to the "currently active" environment. This is specified by the `--env` command line argument.
If there is no argument passed then the currently active environment is the "top-level" environment.
The fields in `Config` and `Environment` are not generally optional and so you can expect they have been filled with suitable inherited or default values.
These types should be used when you are working with fields that should be passed to commands.

### RawConfig

The `RawConfig` type is a version of `Config`, where all the fields are optional.
The `RawConfig` type includes `DeprecatedConfigFields` and `EnvironmentMap`.
It also extends the `RawEnvironment` type, which is a version of `Environment` where all the fields are optional.
These optional fields map to the actual fields found in the `wrangler.toml`.
These types should be used when you are working with raw configuration that is read or will be written to a `wrangler.toml`.

## Validation

Validation is triggered by passing a `RawConfig` object, and the active environment name, to the `normalizeAndValidateConfig()` function.
This function will return:

- a `Config` object, where all the fields have suitable valid values
- a `Diagnostics` object, which contains any errors or warnings from the validation process

The field values may have been parsed directly from the `RawConfig`, inherited into a named environment from the top-level environment, or given a default value.
Generally, if there are any warnings they should be presented to the user via `logger.warn()` messages,
and if there are any errors then an `Error` should be thrown describing these errors.

The `Diagnostics` object is hierarchical: each `Diagnostics` instance can contain a collection of child `Diagnostics` instance.
When checking for or rendering warnings and errors, the `Diagnostics` class will automatically traverse down to all its children.

## Usage

The [high level API](./index.ts) for configuration processing consists of the `findWranglerToml()` and `readConfig()` functions.

### readConfig()

The `readConfig()` function will find the nearest `wrangler.toml` file, load and parse it, then validate and normalize the values into a `Config` object.
Note that you should pass the current active environment name in as a parameter. The resulting `Config` object will contain only the fields appropriate to that environment.
If there are validation errors then it will throw a suitable error.

## Changing configuration

### Add a new configuration field

When a new field needs to be added to the `wrangler.toml` configuration you will need to add to the types and validation code in this directory.

Here are some steps that you should consider when doing this:

- add the new field to one of the interface:
  - if the field is not overridable in an environment then add it to the `ConfigFields` interface.
  - if the field can be inherited and overridden in a named environment then add it to the `EnvironmentInheritable` interface.
  - if the field cannot be inherited and must be specified in each named environment then add it to the `EnvironmentNonInheritable` interface.
- if the field is experimental then add a call to the `experimental()` function:
  - if the field is now in the `ConfigDeprecated` interface then add the call to the `normalizeAndValidateConfig()` function.
  - if the field is now in the `EnvironmentDeprecated` interface then add the call to the `normalizeAndValidateEnvironment()` function.
- add validation and normalization to the interface
  - if the field is in `ConfigFields` then add validation calls to `normalizeAndValidateConfig()` and assign the normalized value to the appropriate property in the `config` object.
  - if the field is in `EnvironmentInheritable` then call `inheritable()` in `normalizeAndValidateEnvironment()` and assign the normalized value to the appropriate property in the `environment` object.
  - if the field is in `EnvironmentNonInheritable` then call `notInheritable()` in `normalizeAndValidateEnvironment()` and assign the normalized value to the appropriate property in the `environment` object.
- update the tests in `configuration.test.ts`
  - add to the `"should use defaults for empty configuration"` test to prove the correct default value is assigned
  - if the field is in `ConfigFields` add tests to the `"top-level non-environment configuration"` block to check the validation and normalization of values
  - if the field is in `EnvironmentInheritable` or `EnvironmentNonInheritable`
    - add tests to the `"top-level environment configuration"` block to check the validation and normalization of values
    - add tests to the `"named environment configuration"` block to check the inheritance of values

### Remove a configuration field

We should not just remove a field from use, since users would not know that this field is no longer needed, nor how to migrate to any new usage.
Instead we should first deprecate it, and then then remove it in a future major release.

- move the field to a deprecation interface:
  - if the field was originally in `ConfigFields` then move it to the `ConfigDeprecated` interface.
  - if the field was originally in either `EnvironmentInheritable` or `EnvironmentNonInheritable` then move it to the `EnvironmentDeprecatedInterface`.
- remove the validation for the field
  - the TypeScript compiler should indicate where there is now an unknown field, so that you can remove its validation and normalization from the code base.
- add a deprecation warning by calling `deprecated()`
  - if the field is now in the `ConfigDeprecated` interface then add the call to the `normalizeAndValidateConfig()` function.
  - if the field is now in the `EnvironmentDeprecated` interface then add the call to the `normalizeAndValidateEnvironment()` function.
- update the tests in `configuration.test.ts`
  - Find tests where the field is mentioned and either remove them (e.g. validation) or update to show the deprecation message.
