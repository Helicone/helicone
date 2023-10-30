import {
  ICacheService,
  RosettaMapper,
} from "@helicone/project-rosetta/dist/src/RosettaTypes";
import { kv } from "@vercel/kv";

export class RosettaCache implements ICacheService {
  private defaultTTLSeconds: number = 120; // 2 minutes

  async getMappers(mapperKey: string): Promise<RosettaMapper[]> {
    const rosettaMappers = ((await kv.get(mapperKey)) ?? []) as RosettaMapper[];

    if (!rosettaMappers || rosettaMappers.length === 0) {
      return [];
    }

    return rosettaMappers;
  }

  async insertMappers(
    mapperKey: string,
    mappers: RosettaMapper[],
    ttl: number = this.defaultTTLSeconds
  ): Promise<void> {
    await kv.set(mapperKey, mappers, { ex: ttl });
  }

  async insertMapper(
    mapperKey: string,
    mapper: RosettaMapper,
    ttl: number = this.defaultTTLSeconds
  ): Promise<void> {
    const existingMappers = (await this.getMappers(mapperKey)) || [];
    existingMappers.push(mapper);
    await this.insertMappers(mapperKey, existingMappers, ttl);
  }
}
