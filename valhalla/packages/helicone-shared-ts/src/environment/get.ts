export type Environment = "development" | "production";
export function getEnvironment(): Environment {
  const environment = process.env.ENV || "development";
  return environment as Environment;
}
