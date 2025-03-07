import { MappedLLMRequest } from "../types";
import { PathMapper } from "./core";

/**
 * Simplified registry for managing and accessing mappers by name
 */
export class MapperRegistry {
  private static instance: MapperRegistry;
  private mappers: Map<string, PathMapper<any, any>> = new Map();

  private constructor() {
    // Private constructor to prevent direct instantiation (singleton pattern)
  }

  /**
   * Get the singleton instance of the registry
   */
  static getInstance(): MapperRegistry {
    if (!MapperRegistry.instance) {
      MapperRegistry.instance = new MapperRegistry();
    }
    return MapperRegistry.instance;
  }

  /**
   * Register a mapper with the registry
   * @param mapper The mapper to register
   */
  register<T, I extends MappedLLMRequest = MappedLLMRequest>(
    mapper: PathMapper<T, I>
  ): this {
    this.mappers.set(mapper.mapperName, mapper);
    return this;
  }

  /**
   * Retrieve a mapper by name
   * @param name The name of the mapper to retrieve
   */
  get<T, I extends MappedLLMRequest = MappedLLMRequest>(
    name: string
  ): PathMapper<T, I> {
    const mapper = this.mappers.get(name);
    if (!mapper) {
      throw new Error(`Mapper '${name}' not found in registry`);
    }
    return mapper as PathMapper<T, I>;
  }

  /**
   * Check if a mapper exists in the registry
   * @param name The name of the mapper to check
   */
  exists(name: string): boolean {
    return this.mappers.has(name);
  }

  /**
   * List all registered mapper names
   */
  listMappers(): string[] {
    return Array.from(this.mappers.keys());
  }
}
