import { ZodStringDef } from "zod";
import { ErrorMessages } from "../errorMessages.js";
import { Refs } from "../Refs.js";
/**
 * Generated from the .source property of regular expressins found here:
 * https://github.com/colinhacks/zod/blob/master/src/types.ts.
 *
 * Escapes have been doubled, and expressions with /i flag have been changed accordingly
 */
export declare const zodPatterns: {
    /**
     * `c` was changed to `[cC]` to replicate /i flag
     */
    readonly cuid: "^[cC][^\\s-]{8,}$";
    readonly cuid2: "^[a-z][a-z0-9]*$";
    readonly ulid: "^[0-9A-HJKMNP-TV-Z]{26}$";
    /**
     * `a-z` was added to replicate /i flag
     */
    readonly email: "^(?!\\.)(?!.*\\.\\.)([a-zA-Z0-9_+-\\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\\-]*\\.)+[a-zA-Z]{2,}$";
    readonly emoji: "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
    /**
     * Unused
     */
    readonly uuid: "^[0-9a-fA-F]{8}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{12}$";
    /**
     * Unused
     */
    readonly ipv4: "^(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))$";
    /**
     * Unused
     */
    readonly ipv6: "^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$";
};
export type JsonSchema7StringType = {
    type: "string";
    minLength?: number;
    maxLength?: number;
    format?: "email" | "idn-email" | "uri" | "uuid" | "date-time" | "ipv4" | "ipv6";
    pattern?: string;
    allOf?: {
        pattern: string;
        errorMessage?: ErrorMessages<{
            pattern: string;
        }>;
    }[];
    anyOf?: {
        format: string;
        errorMessage?: ErrorMessages<{
            format: string;
        }>;
    }[];
    errorMessage?: ErrorMessages<JsonSchema7StringType>;
};
export declare function parseStringDef(def: ZodStringDef, refs: Refs): JsonSchema7StringType;
