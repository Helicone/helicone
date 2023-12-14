import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for managing a value in local storage.
 *
 * @template T - The type of the value to be stored.
 * @param {string} key - The key used to store the value in local storage.
 * @param {T} initialValue - The initial value to be stored.
 * @param {(setStored: (t: T) => void) => void} [onNothingStored] - Optional callback function to be called when no item is stored in local storage.
 * @returns {[T, (t: T) => void]} - A tuple containing the stored value and a function to update the stored value.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  onNothingStored?: (setStored: (t: T) => void) => void
): [T, (t: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  const setValue = useCallback(
    (value: T) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        typeof window !== "undefined" &&
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(error);
      }
    },
    [key, storedValue]
  );
  useEffect(() => {
    try {
      const item =
        typeof window !== "undefined" && window.localStorage.getItem(key);

      if (!item) {
        throw new Error("No item stored");
      }

      const val = item ? JSON.parse(item) : initialValue;

      if (
        val === storedValue ||
        JSON.stringify(val) === JSON.stringify(storedValue)
      ) {
        return;
      }

      setStoredValue(val);
    } catch (error) {
      onNothingStored && onNothingStored(setValue);
    }
  }, [key, initialValue, onNothingStored, setValue, storedValue]);

  return [storedValue, setValue];
}
