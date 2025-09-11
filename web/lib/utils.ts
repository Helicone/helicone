import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ISLAND_WIDTH =
  " w-full px-4 sm:px-16 md:px-24 2xl:px-40 max-w-[2000px] mx-auto";

export function isJson(content: string) {
  try {
    JSON.parse(content);
    return true;
  } catch (e) {
    return false;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount);
}
