export function getEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    return null;
  }
  return value;
}
