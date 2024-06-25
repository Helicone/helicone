import { NextFunction, Request, Response } from "express";
import { KVCache } from "../lib/cache/kvCache";
import { stringToNumberHash } from "../utils/helpers";

const kvCache = new KVCache(24 * 60 * 60 * 1000); // 24 hours

function getCacheKey(text: string): string {
  return `cache:${stringToNumberHash(text)}`;
}

export const cacheMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const cacheKey = getCacheKey(
    req.originalUrl +
      JSON.stringify(req.body) +
      JSON.stringify(req.headers.authorization) +
      JSON.stringify(req.headers["helicone-auth"]) +
      JSON.stringify(req.headers["helicone-authorization"])
  );

  const cachedValue = await kvCache.get(cacheKey);
  if (cachedValue) {
    res.send(cachedValue);
    return;
  }

  const originalSend = res.send.bind(res);

  res.send = (body: any) => {
    kvCache.set(cacheKey, body).catch((err) => {
      console.error("Failed to set cache:", err);
    });
    return originalSend(body);
  };

  next();
};
