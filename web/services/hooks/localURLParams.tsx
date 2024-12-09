import { useState, useEffect, useCallback } from "react";

export function useURLParams<T>(
  key: string,
  initialValue: T,
  onNothingStored?: (setStored: (t: T) => void) => void
): [T, (t: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Read from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stored = params.get(key);

    if (stored) {
      try {
        setStoredValue(JSON.parse(stored));
      } catch (e) {
        console.error(`Failed to parse URL param ${key}:`, e);
        if (onNothingStored) onNothingStored(setStoredValue);
      }
    } else if (onNothingStored) {
      onNothingStored(setStoredValue);
    }
  }, [key, onNothingStored]);

  // Update URL when value changes
  const setValue = useCallback(
    (value: T) => {
      setStoredValue(value);

      const params = new URLSearchParams(window.location.search);
      params.set(key, JSON.stringify(value));

      // Update URL without reload
      const newRelativePathQuery =
        window.location.pathname + "?" + params.toString();
      window.history.pushState(null, "", newRelativePathQuery);
    },
    [key]
  );

  return [storedValue, setValue];
}
