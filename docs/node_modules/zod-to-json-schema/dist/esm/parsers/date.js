import { setResponseValueAndErrors } from "../errorMessages.js";
export function parseDateDef(def, refs) {
    if (refs.dateStrategy == "integer") {
        return integerDateParser(def, refs);
    }
    else {
        return {
            type: "string",
            format: "date-time",
        };
    }
}
const integerDateParser = (def, refs) => {
    const res = {
        type: "integer",
        format: "unix-time",
    };
    for (const check of def.checks) {
        switch (check.kind) {
            case "min":
                if (refs.target === "jsonSchema7") {
                    setResponseValueAndErrors(res, "minimum", check.value, // This is in milliseconds
                    check.message, refs);
                }
                break;
            case "max":
                if (refs.target === "jsonSchema7") {
                    setResponseValueAndErrors(res, "maximum", check.value, // This is in milliseconds
                    check.message, refs);
                }
                break;
        }
    }
    return res;
};
