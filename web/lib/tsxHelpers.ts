/**
 * Concatenates and returns a string of class names.
 *
 * @param classes - The class names to be concatenated.
 * @returns The concatenated string of class names.
 */
export function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export type UnPromise<T> = T extends Promise<infer U> ? U : T;
