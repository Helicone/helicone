export function sanitizeObject(obj: any): any {
  if (typeof obj === "string") {
    return obj.replace(/\u0000/g, "");
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
