export function humanReadableNumber(num: number): string {
  if (num >= 1000000000) {
    return `${Math.ceil(num / 100000000) / 10}B+`;
  } else if (num >= 1000000) {
    return `${Math.ceil(num / 100000) / 10}M+`;
  } else if (num >= 1000) {
    return `${Math.ceil(num / 100) / 10}k+`;
  }
  return num.toLocaleString();
}
