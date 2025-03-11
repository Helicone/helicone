import { LLMRequestBody } from "../types";
import { PathMapping } from "./builder";

// Core mapping definition - just paths
export interface PathPair {
  external: string;
  internal: string;
}

// Optional transformer for complex cases
export interface ValueTransformer {
  toInternal: (value: any, internal: any) => any;
  toExternal: (value: any, external: any) => any;
}

// Enhanced mapping with optional transformer
export interface EnhancedPathPair extends PathPair {
  transform?: ValueTransformer;
  description?: string; // Documentation for this mapping
}

/**
 * Core PathMapper class that handles transforming between external and internal formats
 */
export class PathMapper<ExternalType, InternalType = LLMRequestBody> {
  constructor(private name: string, private mappings: PathMapping[]) {}

  /**
   * Maps an external request to the provider's format
   * This is a convenience method that's equivalent to toExternal
   */
  map(internal: InternalType): ExternalType {
    return this.toExternal(internal);
  }

  /**
   * Transforms from external API format to internal Helicone format
   */
  toInternal(external: ExternalType): InternalType {
    // Initialize the internal object with default empty values
    const internal = {} as InternalType;

    // Apply each mapping
    for (const mapping of this.mappings) {
      const externalValue = this.getValueByPath(external, mapping.external);

      if (externalValue !== undefined) {
        let internalValue = externalValue;

        // Apply transformation if defined
        if (mapping.transform) {
          // Pass both the external value and the current internal object to the transform function
          internalValue = mapping.transform.toInternal(externalValue, internal);
        }

        // Set the value in the internal object
        this.setValueByPath(internal, mapping.internal, internalValue);
      }
    }

    return internal;
  }

  /**
   * Transforms from internal Helicone format to external API format
   */
  toExternal(internal: InternalType): ExternalType {
    // Initialize the external object
    const external = {} as ExternalType;

    // Apply each mapping
    for (const mapping of this.mappings) {
      const internalValue = this.getValueByPath(internal, mapping.internal);

      if (internalValue !== undefined) {
        let externalValue = internalValue;

        // Apply transformation if defined
        if (mapping.transform) {
          // Pass both the internal value and the current external object to the transform function
          externalValue = mapping.transform.toExternal(internalValue, external);
        }

        // Set the value in the external object
        this.setValueByPath(external, mapping.external, externalValue);
      }
    }

    return external;
  }

  /**
   * Gets a value from an object by a path string
   * e.g. "user.name" -> obj.user.name
   */
  private getValueByPath(obj: any, path: string): any {
    if (!obj || !path) return undefined;

    const pathParts = this.parsePath(path);
    let current = obj;

    for (const part of pathParts) {
      if (current === undefined || current === null) return undefined;

      if (part.type === "property") {
        current = current[part.name];
      } else if (part.type === "array" && part.index !== undefined) {
        // If index is empty string, just return the array itself
        if (part.index === "") {
          // No op - keep current as is
          continue;
        }

        // Try to parse as a number first for array access
        const numericIndex = !isNaN(Number(part.index))
          ? parseInt(part.index, 10)
          : part.index;

        if (Array.isArray(current)) {
          if (typeof numericIndex === "number" && !isNaN(numericIndex)) {
            current = current[numericIndex];
          } else {
            return undefined; // Non-numeric index for an array
          }
        } else if (current && typeof current === "object") {
          // Allow object property access with brackets too
          current = current[part.index];
        } else {
          return undefined;
        }
      }
    }

    return current;
  }

  /**
   * Sets a value in an object by a path string
   * e.g. "user.name" -> obj.user.name = value
   */
  private setValueByPath(obj: any, path: string, value: any): void {
    if (!obj || !path) return;

    const pathParts = this.parsePath(path);
    let current = obj;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      const nextPart = pathParts[i + 1];

      if (part.type === "property") {
        if (current[part.name] === undefined || current[part.name] === null) {
          // Create next object based on next part's type
          current[part.name] = nextPart.type === "array" ? [] : {};
        }
        current = current[part.name];
      } else if (part.type === "array" && part.index !== undefined) {
        // If index is empty string, just use the current array
        if (part.index === "") {
          continue;
        }

        // Try to parse as a number first for array access
        const numericIndex = !isNaN(Number(part.index))
          ? parseInt(part.index, 10)
          : part.index;

        if (Array.isArray(current)) {
          if (typeof numericIndex === "number" && !isNaN(numericIndex)) {
            if (
              current[numericIndex] === undefined ||
              current[numericIndex] === null
            ) {
              current[numericIndex] = nextPart.type === "array" ? [] : {};
            }
            current = current[numericIndex];
          }
        } else if (current && typeof current === "object") {
          // Allow object property access with brackets too
          if (
            current[part.index] === undefined ||
            current[part.index] === null
          ) {
            current[part.index] = nextPart.type === "array" ? [] : {};
          }
          current = current[part.index];
        }
      }
    }

    // Set the last property
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart.type === "property") {
      current[lastPart.name] = value;
    } else if (lastPart.type === "array" && lastPart.index !== undefined) {
      // If index is empty string, we're trying to set the whole array
      if (lastPart.index === "") {
        if (Array.isArray(value)) {
          // We could choose to either:
          // 1. Replace the entire array (current = value)
          // 2. Push all elements (for (const item of value) current.push(item))
          // For consistency with common JS behaviors, we'll replace:
          Object.assign(current, value);
        }
        return;
      }

      // Try to parse as a number first for array access
      const numericIndex = !isNaN(Number(lastPart.index))
        ? parseInt(lastPart.index, 10)
        : lastPart.index;

      if (Array.isArray(current)) {
        if (typeof numericIndex === "number" && !isNaN(numericIndex)) {
          current[numericIndex] = value;
        }
      } else if (current && typeof current === "object") {
        // Allow object property access with brackets too
        current[lastPart.index] = value;
      }
    }
  }

  /**
   * Parse a path string into parts
   * e.g. "users[0].name" -> [{type: "property", name: "users"}, {type: "array", name: "0", index: "0"}, {type: "property", name: "name"}]
   */
  private parsePath(path: string): Array<{
    type: "property" | "array";
    name: string;
    index?: string;
  }> {
    if (!path) return [];

    const result: Array<{
      type: "property" | "array";
      name: string;
      index?: string;
    }> = [];

    // First, split the path by dots outside of brackets
    const segments: string[] = [];
    let currentSegment = "";
    let bracketDepth = 0;

    for (let i = 0; i < path.length; i++) {
      const char = path[i];
      if (char === "[") {
        bracketDepth++;
        currentSegment += char;
      } else if (char === "]") {
        bracketDepth--;
        currentSegment += char;
      } else if (char === "." && bracketDepth === 0) {
        segments.push(currentSegment);
        currentSegment = "";
      } else {
        currentSegment += char;
      }
    }

    if (currentSegment) {
      segments.push(currentSegment);
    }

    // Process each segment for property and array parts
    for (const segment of segments) {
      if (!segment) continue;

      // Extract all array accesses within this segment
      const propertyName = segment;
      const bracketIndex = propertyName.indexOf("[");

      if (bracketIndex === -1) {
        // Simple property with no array access
        result.push({ type: "property", name: propertyName });
        continue;
      }

      // Add the property name first
      result.push({
        type: "property",
        name: propertyName.substring(0, bracketIndex),
      });

      // Process all array bracket pairs in this segment
      const bracketPattern = /\[([^[\]]*)\]/g;
      let bracketMatch;

      while ((bracketMatch = bracketPattern.exec(segment)) !== null) {
        const indexValue = bracketMatch[1];
        // Handle empty index case (e.g., "array[]")
        if (indexValue === "") {
          result.push({ type: "array", name: "", index: "" });
        } else {
          result.push({ type: "array", name: indexValue, index: indexValue });
        }
      }
    }

    return result;
  }

  /**
   * Get the name of this mapper
   */
  get mapperName(): string {
    return this.name;
  }

  /**
   * Get the path pairs defined in this mapper
   */
  get pathPairs(): PathMapping[] {
    return [...this.mappings];
  }
}
