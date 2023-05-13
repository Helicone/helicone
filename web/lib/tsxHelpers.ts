export function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export type UnPromise<T> = T extends Promise<infer U> ? U : T;
