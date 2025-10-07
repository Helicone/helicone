/**
 * Ex: subdivide([1,2,3,4,5], 2) => [[1,2],[3,4],[5]]
 * @param array
 * @param chunkSize
 * @returns
 */

function subdivide<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

export { subdivide };
