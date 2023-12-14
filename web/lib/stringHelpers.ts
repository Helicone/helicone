/**
 * Truncates a string to a specified length and adds ellipsis if necessary.
 * @param str - The string to truncate.
 * @param n - The maximum length of the truncated string.
 * @returns The truncated string.
 */
export function truncString(str: string, n: number) {
  if (!str) return "";
  return str.length > n ? str.substring(0, n - 1) + "..." : str;
}

/**
 * Truncates a string and adds ellipsis in the middle if it exceeds a specified length.
 * @param str - The string to be truncated.
 * @param n - The maximum length of the truncated string.
 * @returns The truncated string with ellipsis in the middle, or an empty string if the input string is falsy.
 */
export function middleTruncString(str: string, n: number) {
  if (!str) return "";
  return str.length > n
    ? str.substring(0, n / 2) +
        "..." +
        str.substring(str.length - n / 2, str.length)
    : str;
}
