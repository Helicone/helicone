import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ISLAND_WIDTH =
  // " w-full px-4 sm:px-8 md:px-12 lg:px-6 max-w-[1400px] mx-auto";
  " w-full px-4 sm:px-8 md:px-12 lg:px-6 max-w-[1400px] mx-auto";
