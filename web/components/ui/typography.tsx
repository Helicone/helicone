import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

// Style variables for typography
export const typography = {
  // Headings
  h1: "scroll-m-20 font-sans text-3xl leading-10 font-semibold tracking-tight lg:text-4xl text-[hsl(var(--foreground))]",
  "h1-large":
    "scroll-m-20 font-sans text-5xl leading-10 font-extrabold tracking-tight text-[hsl(var(--foreground))]",
  h2: "scroll-m-20 font-sans text-2xl md:text-3xl leading-9 font-semibold tracking-tight text-[hsl(var(--foreground))]",
  h3: "scroll-m-20 font-sans text-2xl leading-8 font-semibold tracking-tight text-[hsl(var(--foreground))]",
  h4: "scroll-m-20 font-sans text-xl leading-7 font-semibold tracking-tight text-[hsl(var(--foreground))]",

  // Body text
  p: "font-sans text-base leading-7 font-normal text-[hsl(var(--foreground))]",
  lead: "font-sans text-xl leading-7 font-normal text-[hsl(var(--muted-foreground))]",
  large: "font-sans text-lg leading-7 font-light text-[hsl(var(--foreground))]",
  small: "font-sans text-sm leading-4 font-light text-[hsl(var(--foreground))]",
  muted: "font-sans text-sm font-normal text-[hsl(var(--muted-foreground))]",
  xsmall:
    "font-sans text-xs leading-4 font-light text-[hsl(var(--foreground))]",
  // Special elements
  blockquote:
    "font-sans text-base leading-6 font-normal mt-6 border-l-2 border-[hsl(var(--border))] pl-6 italic text-[hsl(var(--muted-foreground))]",
  code: "font-mono text-sm leading-5 font-semibold relative rounded bg-[hsl(var(--muted))] px-[0.3rem] py-[0.2rem] text-[hsl(var(--foreground))]",

  // Lists
  list: "font-sans text-base leading-7 font-normal my-6 ml-6 list-disc [&>li]:mt-2 text-[hsl(var(--foreground))]",

  // Table
  "table-head": "font-sans text-base font-bold text-[hsl(var(--foreground))]",
  "table-cell": "font-sans text-base font-normal text-[hsl(var(--foreground))]",
} as const;

// Type for style keys
export type TypographyStyleKey = keyof typeof typography;

// Base props interface
interface TypographyProps extends HTMLAttributes<HTMLElement> {
  className?: string;
  children: React.ReactNode;
}

// Heading Components
export function H1({ className, ...props }: TypographyProps) {
  return <h1 className={cn(typography.h1, className)} {...props} />;
}

export function H1Large({ className, ...props }: TypographyProps) {
  return <h1 className={cn(typography["h1-large"], className)} {...props} />;
}

export function H2({ className, ...props }: TypographyProps) {
  return <h2 className={cn(typography.h2, className)} {...props} />;
}

export function H3({ className, ...props }: TypographyProps) {
  return <h3 className={cn(typography.h3, className)} {...props} />;
}

export function H4({ className, ...props }: TypographyProps) {
  return <h4 className={cn(typography.h4, className)} {...props} />;
}

// Text Components
export function P({ className, ...props }: TypographyProps) {
  return <p className={cn(typography.p, className)} {...props} />;
}

export function Lead({ className, ...props }: TypographyProps) {
  return <p className={cn(typography.lead, className)} {...props} />;
}

export function Large({ className, ...props }: TypographyProps) {
  return <div className={cn(typography.large, className)} {...props} />;
}

export function Small({ className, ...props }: TypographyProps) {
  return <small className={cn(typography.small, className)} {...props} />;
}

export function XSmall({ className, ...props }: TypographyProps) {
  return <small className={cn(typography.xsmall, className)} {...props} />;
}

export function Muted({ className, ...props }: TypographyProps) {
  return <p className={cn(typography.muted, className)} {...props} />;
}

// Special Components
export function Blockquote({ className, ...props }: TypographyProps) {
  return (
    <blockquote className={cn(typography.blockquote, className)} {...props} />
  );
}

export function Code({ className, ...props }: TypographyProps) {
  return <code className={cn(typography.code, className)} {...props} />;
}

export function List({ className, ...props }: TypographyProps) {
  return <ul className={cn(typography.list, className)} {...props} />;
}

// Table Components
export function TableHead({ className, ...props }: TypographyProps) {
  return <th className={cn(typography["table-head"], className)} {...props} />;
}

export function TableCell({ className, ...props }: TypographyProps) {
  return <td className={cn(typography["table-cell"], className)} {...props} />;
}
