import {
  ICacheService,
  RosettaMapper,
} from "@helicone/project-rosetta/dist/src/RosettaTypes";
// import { kv } from "@vercel/kv";

export class RosettaCache implements ICacheService {
  private defaultTTLSeconds: number = 120; // 2 minutes

  async getMappers(mapperKey: string): Promise<RosettaMapper[]> {
    // let rosettaMappers: RosettaMapper[] = [];
    // try {
    //   rosettaMappers = ((await kv.get(mapperKey)) ?? []) as RosettaMapper[];
    // } catch (error: any) {
    //   console.error("Error getting mappers: ", error.message);
    // }

    // return rosettaMappers ?? [];
    return [];
  }

  async invalidateMappers(mapperKey: string): Promise<void> {
    // try {
    //   await kv.del(mapperKey);
    // } catch (error: any) {
    //   console.error("Error invalidating mappers: ", error.message);
    // }
  }

  async insertMappers(
    mapperKey: string,
    mappers: RosettaMapper[],
    ttl: number = this.defaultTTLSeconds
  ): Promise<void> {
    // try {
    //   await kv.set(mapperKey, mappers, { ex: ttl });
    // } catch (error: any) {
    //   console.error("Error inserting mappers: ", error.message);
    // }
  }
}
