import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ISLAND_WIDTH =
  " w-full px-4 sm:px-16 md:px-24 2xl:px-40 max-w-[2000px] mx-auto";
