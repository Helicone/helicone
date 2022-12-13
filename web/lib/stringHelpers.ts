export function truncString(str: string, n: number) {
  return str.length > n ? str.substring(0, n - 1) + "..." : str;
}

export function middleTruncString(str: string, n: number) {
  return str.length > n
    ? str.substring(0, n / 2) +
        "..." +
        str.substring(str.length - n / 2, str.length)
    : str;
}
