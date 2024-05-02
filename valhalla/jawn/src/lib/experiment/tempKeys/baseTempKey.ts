export interface BaseTempKey {
  with<T>(callback: (apiKey: string) => Promise<T>): Promise<T>;
  cleanup(): Promise<any>;
}
