export interface CacheSettings {
  maxAge: number;
  staleWhileRevalidate: number;
  shouldSaveToCache: boolean;
  shouldReadFromCache: boolean;
}

export function getCacheSettings(request: Request): CacheSettings {
  //TODO
}
