import { NextFunction, Request, Response } from "express";
import { KVCache } from "../lib/cache/kvCache";
import { stringToNumberHash } from "../utils/helpers";

function getCacheKey(text: string): string {
  return `cache:${stringToNumberHash(text)}`;
}

export const unauthorizedCacheMiddleware =
  (cacheKeyMiddle: string, ttlMs: number = 24 * 60 * 60 * 1000) => {
  const kvCache = new KVCache(ttlMs);
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.headers["authorization"] || req.headers["helicone-authorization"]) {
      res.status(401).send({
        message: "CANNOT USE UNAUTHORIZED CACHE WITH AUTHENTICATED ROUTES",
      });
      return;
    }
    const cacheKey = getCacheKey(
      req.originalUrl + JSON.stringify(req.body) + req.path + cacheKeyMiddle
    );

    const cachedValue = await kvCache.get(cacheKey);
    if (cachedValue) {
      res.send(cachedValue);
      return;
    }

    const originalSend = res.send.bind(res);

    res.send = (body: any) => {
      if (res.statusCode !== 200) {
        return originalSend(body);
      }

      kvCache.set(cacheKey, body).catch((err) => {
        console.error("Failed to set cache:", err);
      });
      return originalSend(body);
    };

    next();
  };
};
