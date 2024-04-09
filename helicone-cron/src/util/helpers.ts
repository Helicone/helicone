export function chunkArray<T>(array: T[], size: number): T[][] {
  return array.reduce(
    (acc, _, index) =>
      index % size ? acc : [...acc, array.slice(index, index + size)],
    [] as T[][]
  );
}
