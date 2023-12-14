import {
  ICacheService,
  RosettaMapper,
} from "@helicone/project-rosetta/dist/src/RosettaTypes";
import { kv } from "@vercel/kv";

export class RosettaCache implements ICacheService {
  private defaultTTLSeconds: number = 120; // 2 minutes

  /**
   * Retrieves the Rosetta mappers associated with the given mapper key.
   * @param mapperKey The key used to retrieve the mappers.
   * @returns A promise that resolves to an array of RosettaMapper objects.
   */
  async getMappers(mapperKey: string): Promise<RosettaMapper[]> {
    let rosettaMappers: RosettaMapper[] = [];
    try {
      rosettaMappers = ((await kv.get(mapperKey)) ?? []) as RosettaMapper[];
    } catch (error: any) {
      console.error("Error getting mappers: ", error.message);
    }

    return rosettaMappers ?? [];
  }

  /**
   * Invalidates the mappers associated with the given mapper key.
   * @param mapperKey The key of the mappers to invalidate.
   * @returns A promise that resolves when the mappers are invalidated.
   */
  async invalidateMappers(mapperKey: string): Promise<void> {
    try {
      await kv.del(mapperKey);
    } catch (error: any) {
      console.error("Error invalidating mappers: ", error.message);
    }
  }

  /**
   * Inserts the given mappers into the cache with the specified TTL (Time To Live).
   * @param mapperKey - The key to identify the mappers in the cache.
   * @param mappers - The array of RosettaMapper objects to be inserted.
   * @param ttl - The time to live for the cache entry in seconds. Defaults to the default TTL value.
   * @returns A Promise that resolves when the mappers are successfully inserted into the cache.
   */
  async insertMappers(
    mapperKey: string,
    mappers: RosettaMapper[],
    ttl: number = this.defaultTTLSeconds
  ): Promise<void> {
    try {
      await kv.set(mapperKey, mappers, { ex: ttl });
    } catch (error: any) {
      console.error("Error inserting mappers: ", error.message);
    }
  }
}
