export type Result<T, E = Error> =
  | { kind: "Ok"; value: T }
  | { kind: "Err"; error: E };

export function Ok<T, E = Error>(value: T): Result<T, E> {
  return { kind: "Ok", value };
}

export function Err<T, E = Error>(error: E): Result<T, E> {
  return { kind: "Err", error };
}

export function isErr<T, E = Error>(
  result: Result<T, E>
): result is { kind: "Err"; error: E } {
  return result.kind === "Err";
}
