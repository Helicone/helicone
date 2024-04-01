import type { RawConfig } from "./config";
import type { Diagnostics } from "./diagnostics";
import type { Environment, RawEnvironment } from "./environment";

/**
 *  Mark a field as deprecated.
 *
 * This function will add a diagnostics warning if the deprecated field is found in the `rawEnv` (or an error if it's also a breaking deprecation)
 * The `fieldPath` is a dot separated property path, e.g. `"build.upload.format"`.
 */
export function deprecated<T extends object>(
	diagnostics: Diagnostics,
	config: T,
	fieldPath: DeepKeyOf<T>,
	message: string,
	remove: boolean,
	title = "Deprecation",
	type: "warning" | "error" = "warning"
): void {
	const BOLD = "\x1b[1m";
	const NORMAL = "\x1b[0m";
	const diagnosticMessage = `${BOLD}${title}${NORMAL}: "${fieldPath}":\n${message}`;
	const result = unwindPropertyPath(config, fieldPath);
	if (result !== undefined && result.field in result.container) {
		diagnostics[`${type}s`].push(diagnosticMessage);
		if (remove) {
			delete (result.container as Record<string, unknown>)[result.field];
		}
	}
}

/**
 *  Mark a field as experimental.
 *
 * This function will add a diagnostics warning if the experimental field is found in the `rawEnv`.
 * The `fieldPath` is a dot separated property path, e.g. `"build.upload.format"`.
 */
export function experimental<T extends object>(
	diagnostics: Diagnostics,
	config: T,
	fieldPath: DeepKeyOf<T>
): void {
	const result = unwindPropertyPath(config, fieldPath);
	if (result !== undefined && result.field in result.container) {
		diagnostics.warnings.push(
			`"${fieldPath}" fields are experimental and may change or break at any time.`
		);
	}
}

/**
 * Get an inheritable environment field, after computing and validating its value.
 *
 * If the field is not defined in the given environment, then fallback to the value from the top-level config,
 * and then the `defaultValue`.
 */
export function inheritable<K extends keyof Environment>(
	diagnostics: Diagnostics,
	topLevelEnv: Environment | undefined,
	rawEnv: RawEnvironment,
	field: K,
	validate: ValidatorFn,
	defaultValue: Environment[K],
	transformFn: TransformFn<Environment[K]> = (v) => v
): Environment[K] {
	validate(diagnostics, field, rawEnv[field], topLevelEnv);
	return (
		(rawEnv[field] as Environment[K]) ??
		transformFn(topLevelEnv?.[field]) ??
		defaultValue
	);
}

/**
 * Get an inheritable environment field, but only if we are in legacy environments
 */
export function inheritableInLegacyEnvironments<K extends keyof Environment>(
	diagnostics: Diagnostics,
	isLegacyEnv: boolean | undefined,
	topLevelEnv: Environment | undefined,
	rawEnv: RawEnvironment,
	field: K,
	validate: ValidatorFn,
	transformFn: TransformFn<Environment[K]> = (v) => v,
	defaultValue: Environment[K]
): Environment[K] {
	return topLevelEnv === undefined || isLegacyEnv === true
		? inheritable(
				diagnostics,
				topLevelEnv,
				rawEnv,
				field,
				validate,
				defaultValue,
				transformFn
		  )
		: notAllowedInNamedServiceEnvironment(
				diagnostics,
				topLevelEnv,
				rawEnv,
				field
		  );
}

/**
 * Type of function that is used to transform an inheritable environment field.
 */
type TransformFn<T> = (fieldValue: T | undefined) => T | undefined;

/**
 * Transform an environment field by appending current environment name to it.
 */
export const appendEnvName =
	(envName: string): TransformFn<string | undefined> =>
	(fieldValue) =>
		fieldValue ? `${fieldValue}-${envName}` : undefined;

/**
 * Log an error if this named environment is trying to override the value in the top-level
 * environment, which is not allow for this field.
 */
function notAllowedInNamedServiceEnvironment<K extends keyof Environment>(
	diagnostics: Diagnostics,
	topLevelEnv: Environment,
	rawEnv: RawEnvironment,
	field: K
): Environment[K] {
	if (field in rawEnv) {
		diagnostics.errors.push(
			`The "${field}" field is not allowed in named service environments.\n` +
				`Please remove the field from this environment.`
		);
	}
	return topLevelEnv[field];
}

/**
 * Get a not inheritable environment field, after computing and validating its value.
 *
 * If the field is not defined in the given environment but it is defined in the top-level config,
 * then log a warning and return the `defaultValue`.
 */
export function notInheritable<K extends keyof Environment>(
	diagnostics: Diagnostics,
	topLevelEnv: Environment | undefined,
	rawConfig: RawConfig | undefined,
	rawEnv: RawEnvironment,
	envName: string,
	field: K,
	validate: ValidatorFn,
	defaultValue: Environment[K]
): Environment[K] {
	if (rawEnv[field] !== undefined) {
		validate(diagnostics, field, rawEnv[field], topLevelEnv);
	} else {
		if (rawConfig?.[field] !== undefined) {
			diagnostics.warnings.push(
				`"${field}" exists at the top level, but not on "env.${envName}".\n` +
					`This is not what you probably want, since "${field}" is not inherited by environments.\n` +
					`Please add "${field}" to "env.${envName}".`
			);
		}
	}
	return (rawEnv[field] as Environment[K]) ?? defaultValue;
}

// Idea taken from https://stackoverflow.com/a/66661477
type DeepKeyOf<T> = (
	T extends object
		? {
				[K in Exclude<keyof T, symbol>]: `${K}${DotPrefix<DeepKeyOf<T[K]>>}`;
		  }[Exclude<keyof T, symbol>]
		: ""
) extends infer D
	? Extract<D, string>
	: never;

type DotPrefix<T extends string> = T extends "" ? "" : `.${T}`;

/**
 * Return a container object and field name for the last property in a given property path.
 *
 * For example, given a path of `"build.upload.format"`) and a starting `root` object
 * this will return:
 *
 * ```
 * { container: root.build.upload, field: "format" }
 * ```
 */
function unwindPropertyPath<T extends object>(
	root: T,
	path: DeepKeyOf<T>
): { container: object; field: string } | undefined {
	let container: object = root;
	const parts = (path as string).split(".");
	for (let i = 0; i < parts.length - 1; i++) {
		if (!hasProperty(container, parts[i])) {
			return;
		}
		container = container[parts[i]];
	}
	return { container, field: parts[parts.length - 1] };
}

/**
 * The type of a function that can be used to validate a configuration field.
 */
export type ValidatorFn = (
	diagnostics: Diagnostics,
	field: string,
	value: unknown,
	topLevelEnv: Environment | undefined
) => boolean;

/**
 * Validate that the field is a string.
 */
export const isString: ValidatorFn = (diagnostics, field, value) => {
	if (value !== undefined && typeof value !== "string") {
		diagnostics.errors.push(
			`Expected "${field}" to be of type string but got ${JSON.stringify(
				value
			)}.`
		);
		return false;
	}
	return true;
};

/**
 * Validate that the `name` field is compliant with EWC constraints.
 */
export const isValidName: ValidatorFn = (diagnostics, field, value) => {
	if (
		(typeof value === "string" && /^$|^[a-z0-9_ ][a-z0-9-_ ]*$/.test(value)) ||
		value === undefined
	) {
		return true;
	} else {
		diagnostics.errors.push(
			`Expected "${field}" to be of type string, alphanumeric and lowercase with dashes only but got ${JSON.stringify(
				value
			)}.`
		);
		return false;
	}
};

/**
 * Validate that the field is an array of strings.
 */
export const isStringArray: ValidatorFn = (diagnostics, field, value) => {
	if (
		value !== undefined &&
		(!Array.isArray(value) || value.some((item) => typeof item !== "string"))
	) {
		diagnostics.errors.push(
			`Expected "${field}" to be of type string array but got ${JSON.stringify(
				value
			)}.`
		);
		return false;
	}
	return true;
};

/**
 * Validate that the field is an object containing the given properties.
 */
export const isObjectWith =
	(...properties: string[]): ValidatorFn =>
	(diagnostics, field, value) => {
		if (
			value !== undefined &&
			(typeof value !== "object" ||
				value === null ||
				!properties.every((prop) => prop in value))
		) {
			diagnostics.errors.push(
				`Expected "${field}" to be of type object, containing only properties ${properties}, but got ${JSON.stringify(
					value
				)}.`
			);
			return false;
		}
		// it's an object with the field as desired,
		// but let's also check for unexpected fields
		if (value !== undefined) {
			const restFields = Object.keys(value).filter(
				(key) => !properties.includes(key)
			);
			validateAdditionalProperties(diagnostics, field, restFields, []);
		}

		return true;
	};

/**
 * Validate that the field value is one of the given choices.
 */
export const isOneOf =
	(...choices: unknown[]): ValidatorFn =>
	(diagnostics, field, value) => {
		if (value !== undefined && !choices.some((choice) => value === choice)) {
			diagnostics.errors.push(
				`Expected "${field}" field to be one of ${JSON.stringify(
					choices
				)} but got ${JSON.stringify(value)}.`
			);
			return false;
		}
		return true;
	};

/**
 * Aggregate multiple validator functions
 */
export const all = (...validations: ValidatorFn[]): ValidatorFn => {
	return (diagnostics, field, value, config) => {
		let passedValidations = true;

		for (const validate of validations) {
			if (!validate(diagnostics, field, value, config)) {
				passedValidations = false;
			}
		}

		return passedValidations;
	};
};

/**
 * Check that the field is mutually exclusive with a list of other fields.
 *
 * @param container the container of the fields to check against.
 * @param fields the names of the fields to check against.
 */
export const isMutuallyExclusiveWith = <T extends RawEnvironment | RawConfig>(
	container: T,
	...fields: (keyof T)[]
): ValidatorFn => {
	return (diagnostics, field, value) => {
		if (value === undefined) {
			return true;
		}

		for (const exclusiveWith of fields) {
			if (container[exclusiveWith] !== undefined) {
				diagnostics.errors.push(
					`Expected exactly one of the following fields ${JSON.stringify([
						field,
						...fields,
					])}.`
				);
				return false;
			}
		}

		return true;
	};
};

/**
 * Validate that the field is a boolean.
 */
export const isBoolean: ValidatorFn = (diagnostics, field, value) => {
	if (value !== undefined && typeof value !== "boolean") {
		diagnostics.errors.push(
			`Expected "${field}" to be of type boolean but got ${JSON.stringify(
				value
			)}.`
		);
		return false;
	}
	return true;
};

/**
 * Validate that the required field exists and has the expected type.
 */
export const validateRequiredProperty = (
	diagnostics: Diagnostics,
	container: string,
	key: string,
	value: unknown,
	type: TypeofType,
	choices?: unknown[]
): boolean => {
	if (container) {
		container += ".";
	}
	if (value === undefined) {
		diagnostics.errors.push(`"${container}${key}" is a required field.`);
		return false;
	} else if (typeof value !== type) {
		diagnostics.errors.push(
			`Expected "${container}${key}" to be of type ${type} but got ${JSON.stringify(
				value
			)}.`
		);
		return false;
	} else if (choices) {
		if (
			!isOneOf(...choices)(diagnostics, `${container}${key}`, value, undefined)
		) {
			return false;
		}
	}
	return true;
};

/**
 * Validate that, if the optional field exists, then it has the expected type.
 */
export const validateOptionalProperty = (
	diagnostics: Diagnostics,
	container: string,
	key: string,
	value: unknown,
	type: TypeofType,
	choices?: unknown[]
): boolean => {
	if (value !== undefined) {
		return validateRequiredProperty(
			diagnostics,
			container,
			key,
			value,
			type,
			choices
		);
	}
	return true;
};

/**
 * Validate that the field is an array of elements of the given type.
 */
export const validateTypedArray = (
	diagnostics: Diagnostics,
	container: string,
	value: unknown,
	type: TypeofType
): boolean => {
	let isValid = true;
	if (!Array.isArray(value)) {
		diagnostics.errors.push(
			`Expected "${container}" to be an array of ${type}s but got ${JSON.stringify(
				value
			)}`
		);
		isValid = false;
	} else {
		for (let i = 0; i < value.length; i++) {
			isValid =
				validateRequiredProperty(
					diagnostics,
					container,
					`[${i}]`,
					value[i],
					type
				) && isValid;
		}
	}
	return isValid;
};

/**
 * Validate that, if the optional field exists, it is an array of elements of the given type.
 */
export const validateOptionalTypedArray = (
	diagnostics: Diagnostics,
	container: string,
	value: unknown,
	type: TypeofType
) => {
	if (value !== undefined) {
		return validateTypedArray(diagnostics, container, value, type);
	}
	return true;
};

/**
 * Test to see if `obj` has the required property `prop` of type `type`.
 */
export const isRequiredProperty = <T extends object>(
	obj: object,
	prop: keyof T,
	type: TypeofType,
	choices?: unknown[]
): obj is T =>
	hasProperty<T>(obj, prop) &&
	typeof obj[prop] === type &&
	(choices === undefined || choices.includes(obj[prop]));

/**
 * Test to see if `obj` has the optional property `prop` of type `type`.
 */
export const isOptionalProperty = <T extends object>(
	obj: object,
	prop: keyof T,
	type: TypeofType
): obj is T => !hasProperty<T>(obj, prop) || typeof obj[prop] === type;

/**
 * Test to see if `obj` has the property `prop`.
 */
export const hasProperty = <T extends object>(
	obj: object,
	property: keyof T
): obj is T => property in obj;

/**
 * Add warning messages about any properties in the given field that are not expected to be there.
 */
export const validateAdditionalProperties = (
	diagnostics: Diagnostics,
	fieldPath: string,
	restProps: Iterable<string>,
	knownProps: Iterable<string>
): boolean => {
	const restPropSet = new Set(restProps);
	for (const knownProp of knownProps) {
		restPropSet.delete(knownProp);
	}
	if (restPropSet.size > 0) {
		const fields = Array.from(restPropSet.keys()).map((field) => `"${field}"`);
		diagnostics.warnings.push(
			`Unexpected fields found in ${fieldPath} field: ${fields}`
		);
		return false;
	}
	return true;
};

/**
 * Get the names of the bindings collection in `value`.
 *
 * Will return an empty array if it doesn't understand the value
 * passed in, so another form of validation should be
 * performed externally.
 */
export const getBindingNames = (value: unknown): string[] => {
	if (typeof value !== "object" || value === null) {
		return [];
	}

	if (isBindingList(value)) {
		return value.bindings.map(({ name }) => name);
	} else if (isNamespaceList(value)) {
		return value.map(({ binding }) => binding);
	} else if (isRecord(value)) {
		return Object.keys(value);
	} else {
		return [];
	}
};

const isBindingList = (
	value: unknown
): value is {
	bindings: {
		name: string;
	}[];
} =>
	isRecord(value) &&
	"bindings" in value &&
	Array.isArray(value.bindings) &&
	value.bindings.every(
		(binding) =>
			isRecord(binding) && "name" in binding && typeof binding.name === "string"
	);

const isNamespaceList = (value: unknown): value is { binding: string }[] =>
	Array.isArray(value) &&
	value.every(
		(entry) =>
			isRecord(entry) && "binding" in entry && typeof entry.binding === "string"
	);

const isRecord = (
	value: unknown
): value is Record<string | number | symbol, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * JavaScript `typeof` operator return values.
 */
type TypeofType =
	| "string"
	| "number"
	| "bigint"
	| "boolean"
	| "symbol"
	| "undefined"
	| "object"
	| "function";
