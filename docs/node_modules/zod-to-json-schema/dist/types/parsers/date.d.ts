import { ZodDateDef } from "zod";
import { Refs } from "../Refs.js";
import { ErrorMessages } from "../errorMessages.js";
import { JsonSchema7NumberType } from "./number.js";
export type JsonSchema7DateType = {
    type: "integer" | "string";
    format: "unix-time" | "date-time";
    minimum?: number;
    maximum?: number;
    errorMessage?: ErrorMessages<JsonSchema7NumberType>;
};
export declare function parseDateDef(def: ZodDateDef, refs: Refs): JsonSchema7DateType;
