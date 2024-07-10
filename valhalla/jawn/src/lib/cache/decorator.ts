import { stringToNumberHash } from "../../utils/helpers";
import { KVCache } from "./kvCache";

const cache = new KVCache(); // Initialize KVCache instance

function getCacheKey(text: string): string {
  return `cache:${stringToNumberHash(text)}`;
}

function cacheDecorator(ttl?: number, cacheKey?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = getCacheKey(
        `${propertyKey}:${JSON.stringify(args)}:${cacheKey}`
      );
      const cachedResult = await cache.get<any>(key);
      if (cachedResult !== null) {
        return cachedResult;
      }

      const result = await originalMethod.apply(this, args);
      await cache.set(key, result);
      return result;
    };

    return descriptor;
  };
}

export default cacheDecorator;
