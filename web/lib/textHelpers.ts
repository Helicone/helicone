/**
 * Adds commas to a number for better readability.
 *
 * @param x - The number to format.
 * @returns The formatted number with commas.
 */
export function numberWithCommas(x: number) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
