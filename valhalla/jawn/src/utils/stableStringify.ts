type StableStringifyOptions = {
  space?: number | string;
  sortKeys?: (a: string, b: string) => number; // default: Unicode codepoint asc
  bigintAsString?: boolean; // default: true
  onCycle?: "throw" | "replace" | "ignore"; // default: "throw"
  cyclePlaceholder?: string; // used if onCycle === "replace"
};

/**
 * Deterministic JSON stringify.
 * - Recursively sorts object keys
 * - Mirrors JSON.stringify for primitives, arrays, Date, undefined handling, NaN/Infinity -> null
 * - Throws on circular refs by default (configurable)
 * - Optionally renders BigInt as a quoted string
 */
export function stableStringify(
  value: unknown,
  opts: StableStringifyOptions = {}
): string {
  const {
    space,
    sortKeys = (a, b) => (a < b ? -1 : a > b ? 1 : 0),
    bigintAsString = true,
    onCycle = "throw",
    cyclePlaceholder = "[Circular]",
  } = opts;

  const ancestors = new WeakSet<object>();

  const build = (v: any): any => {
    // Primitives
    if (v === null) return null;
    const t = typeof v;

    if (t === "string" || t === "boolean") return v;

    if (t === "number") {
      // Match JSON.stringify semantics: NaN/Infinity -> null
      return Number.isFinite(v) ? v : null;
    }

    if (t === "bigint") {
      if (bigintAsString) return v.toString();
      throw new TypeError(
        "BigInt cannot be serialized to JSON. Set bigintAsString: true."
      );
    }

    if (t !== "object") {
      // functions, symbols become undefined like JSON.stringify on object props
      return undefined;
    }

    // Dates serialize via toJSON under JSON.stringify, so pass through untouched
    if (v instanceof Date) return v;

    // Arrays - preserve order but recurse
    if (Array.isArray(v)) {
      if (ancestors.has(v)) return handleCycle();
      ancestors.add(v);
      const out = v.map(build);
      ancestors.delete(v);
      return out;
    }

    // Plain objects - sort keys deterministically
    // Ignore special objects like Map/Set by default (JSON.stringify turns them into {})
    const proto = Object.getPrototypeOf(v);
    const isPlainObject = proto === Object.prototype || proto === null;
    if (!isPlainObject) {
      // Keep as-is so JSON.stringify handles it like a normal object (no enumerable props => {})
      return v;
    }

    if (ancestors.has(v)) return handleCycle();
    ancestors.add(v);

    try {
      const keys = Object.keys(v).sort(sortKeys);
      const out: Record<string, unknown> = {};
      for (const k of keys) {
        // Symbols are skipped by JSON.stringify, so ignore
        const child = build(v[k]);
        // JSON.stringify drops undefined in objects
        if (child !== undefined) out[k] = child;
      }
      return out;
    } finally {
      ancestors.delete(v);
    }
  };

  const handleCycle = () => {
    if (onCycle === "throw") {
      throw new TypeError("Converting circular structure to JSON");
    }
    if (onCycle === "replace") return cyclePlaceholder;
    // "ignore" - behave like undefined in objects, null in arrays will be handled by JSON.stringify
    return undefined;
  };

  // Build a key-sorted clone and let JSON.stringify handle escaping, toJSON, spacing, etc.
  const prepared = build(value);
  return JSON.stringify(prepared, null, space);
}
