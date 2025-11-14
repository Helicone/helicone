function tryToGetSize(obj: any): number | null {
  try {
    if (typeof obj === "string") {
      return Buffer.byteLength(obj, "utf-8");
    } else if (obj instanceof Buffer) {
      return obj.length;
    } else if (typeof obj === "object") {
      const str = JSON.stringify(obj);
      return Buffer.byteLength(str, "utf-8");
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

export { tryToGetSize };
