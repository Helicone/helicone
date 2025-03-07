export function sanitizeObject(obj: any): any {
  if (typeof obj === "string") {
    // Remove null characters
    let sanitized = obj.replace(/\u0000/g, "");

    // Convert the string to an array of code points
    const chars = [...sanitized];

    // Filter out problematic lone surrogates
    let filteredChars = [];
    for (let i = 0; i < chars.length; i++) {
      const charCode = chars[i].charCodeAt(0);

      // Check for high surrogate
      if (charCode >= 0xd800 && charCode <= 0xdbff) {
        // Look ahead for a low surrogate
        if (i + 1 < chars.length) {
          const nextCharCode = chars[i + 1].charCodeAt(0);
          if (nextCharCode >= 0xdc00 && nextCharCode <= 0xdfff) {
            // Valid surrogate pair, keep both
            filteredChars.push(chars[i]);
            filteredChars.push(chars[i + 1]);
            i++; // Skip the next char since we already added it
          }
          // Else skip this lone high surrogate
        }
        // Else skip this lone high surrogate at the end
      }
      // Check for low surrogate without a preceding high surrogate
      else if (charCode >= 0xdc00 && charCode <= 0xdfff) {
        // Skip this lone low surrogate
      }
      // Normal character or valid pair
      else {
        // Skip other problematic Unicode characters
        if (
          !(charCode >= 0xfdd0 && charCode <= 0xfdef) &&
          charCode !== 0xfffe &&
          charCode !== 0xffff
        ) {
          filteredChars.push(chars[i]);
        }
      }
    }

    return filteredChars.join("");
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }
  if (typeof obj === "object" && obj !== null) {
    const sanitizedObj: { [key: string]: any } = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitizedObj[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitizedObj;
  }
  return obj;
}

// Alternative stringification function that handles JSON escaping more safely
export function safeJSONStringify(obj: any): string {
  try {
    return JSON.stringify(sanitizeObject(obj));
  } catch (e) {
    console.error("Error in safeJSONStringify:", e);

    // Fallback to a more aggressive approach if normal stringify fails
    return JSON.stringify(
      typeof obj === "object"
        ? Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [
              k,
              typeof v === "string" ? v.replace(/[\uD800-\uDFFF]/g, "") : v,
            ])
          )
        : typeof obj === "string"
        ? obj.replace(/[\uD800-\uDFFF]/g, "")
        : obj
    );
  }
}
