import { useState, useEffect, useCallback } from "react";

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
