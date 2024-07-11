export class InternalHeaders {
  private headers: Record<string, string>;

  constructor(headers: Record<string, string>) {
    this.headers = headers;
  }

  get(key: string): string | null {
    return this.headers[key] || null;
  }

  set(key: string, value: string): void {
    this.headers[key] = value;
  }

  entries(): IterableIterator<[string, string]> {
    return Object.entries(this.headers)[Symbol.iterator]();
  }

  getAll(): Record<string, string> {
    return this.headers;
  }
}
