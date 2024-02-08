/**
 * A JSON Schema 4.0 definition for an OpenAPI Specification
 */
export interface JsonSchemaDraft4 {
    id?: string;
    $schema?: string;
    title?: string;
    description?: string;
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: boolean;
    minimum?: number;
    exclusiveMinimum?: boolean;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    additionalItems?: boolean | JsonSchemaDraft4;
    items?: JsonSchemaDraft4 | JsonSchemaDraft4[];
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    additionalProperties?: boolean | JsonSchemaDraft4;
    definitions?: {
        [name: string]: JsonSchemaDraft4;
    };
    properties?: {
        [name: string]: JsonSchemaDraft4;
    };
    patternProperties?: {
        [name: string]: JsonSchemaDraft4;
    };
    dependencies?: {
        [name: string]: JsonSchemaDraft4 | string[];
    };
    enum?: string[];
    type?: string | string[];
    allOf?: JsonSchemaDraft4[];
    anyOf?: JsonSchemaDraft4[];
    oneOf?: JsonSchemaDraft4[];
    not?: JsonSchemaDraft4;
}
/**
 * A JSON Schema 2020-12 definition for an OpenAPI Specification
 */
export interface JsonSchemaDraft202012 {
    $id?: string;
    $schema?: string;
    title?: string;
    description?: string;
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: boolean;
    minimum?: number;
    exclusiveMinimum?: boolean;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    additionalItems?: boolean | JsonSchemaDraft202012;
    items?: JsonSchemaDraft202012 | JsonSchemaDraft202012[];
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    additionalProperties?: boolean | JsonSchemaDraft202012;
    $defs?: {
        [name: string]: JsonSchemaDraft202012;
    };
    properties?: {
        [name: string]: JsonSchemaDraft202012;
    };
    patternProperties?: {
        [name: string]: JsonSchemaDraft202012;
    };
    dependencies?: {
        [name: string]: JsonSchemaDraft202012 | string[];
    };
    enum?: string[];
    type?: string | string[];
    allOf?: JsonSchemaDraft202012[];
    anyOf?: JsonSchemaDraft202012[];
    oneOf?: JsonSchemaDraft202012[];
    not?: JsonSchemaDraft202012;
}
