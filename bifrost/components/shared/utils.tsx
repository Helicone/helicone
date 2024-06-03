export const clsx = (...classes: (string | boolean | undefined)[]): string =>
  classes.filter(Boolean).join(" ");
