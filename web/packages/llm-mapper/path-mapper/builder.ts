import { LLMRequestBody } from "../types";
import { PathMapper } from "./core";

/**
 * Type helper to extract all possible paths of T type
 */
export type PathsOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends Array<any>
          ? K | `${K}[${number}]` | `${K}[${number}].${PathsOf<T[K][number]>}`
          : T[K] extends object
          ? K | `${K}.${PathsOf<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

/**
 * Helper type to get the type at a specific path in an object
 */
export type TypeAtPath<T, P extends string> = P extends keyof T
  ? T[P]
  : P extends `${infer K}.${infer R}`
  ? K extends keyof T
    ? TypeAtPath<T[K], R>
    : never
  : P extends `${infer K}[${infer I}]`
  ? K extends keyof T
    ? T[K] extends Array<infer V>
      ? V
      : never
    : never
  : never;

/**
 * Helper to get full recursive path strings for all properties in an object type
 */
export type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: TObj[TKey] extends object
    ? `${TKey}` | `${TKey}.${RecursiveKeyOf<TObj[TKey]>}`
    : `${TKey}`;
}[keyof TObj & (string | number)];

/**
 * Valid paths for the internal type
 * This creates a union of all possible paths within LLMRequestBody
 */
export type ValidInternalPaths = RecursiveKeyOf<LLMRequestBody>;

/**
 * Simplified interface for path mappings
 */
export interface PathMapping<
  T = any,
  E = any,
  InternalType = any,
  ExternalType = any
> {
  external: string;
  internal: string;
  transform?: {
    toInternal: (value: E, internal?: InternalType) => T;
    toExternal: (value: T, external?: ExternalType) => E;
  };
  description?: string;
}

/**
 * Simplified builder class for creating path mappers with a fluent interface
 */
export class MapperBuilder<ExternalType = any, InternalType = LLMRequestBody> {
  private mappings: PathMapping[] = [];
  private mapperName: string;

  /**
   * Create a new mapper builder
   * @param name The name of the mapper
   */
  constructor(name: string) {
    this.mapperName = name;
  }

  /**
   * Map a path from external to internal
   */
  map<
    ExternalPath extends string & PathsOf<ExternalType>,
    InternalPath extends string & ValidInternalPaths
  >(externalPath: ExternalPath, internalPath: InternalPath): this {
    this.mappings.push({
      external: externalPath,
      internal: internalPath,
    });
    return this;
  }

  /**
   * Map a path from external to internal with a transformation
   */
  mapWithTransform<
    ExternalPath extends string & PathsOf<ExternalType>,
    InternalPath extends string & ValidInternalPaths,
    T = any,
    E = TypeAtPath<ExternalType, ExternalPath>
  >(
    externalPath: ExternalPath,
    internalPath: InternalPath,
    toInternal: (value: E, internal?: InternalType) => T,
    toExternal: (value: T, external?: ExternalType) => E,
    description?: string
  ): this {
    this.mappings.push({
      external: externalPath,
      internal: internalPath,
      transform: {
        toInternal,
        toExternal,
      },
      description,
    });
    return this;
  }

  /**
   * Builds and returns the mapper
   */
  build(): PathMapper<ExternalType, InternalType> {
    return new PathMapper<ExternalType, InternalType>(
      this.mapperName,
      this.mappings
    );
  }
}
