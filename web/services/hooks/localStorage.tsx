import { useState, useEffect, useCallback } from "react";
import { useOrg } from "../../components/layout/org/organizationContext";

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  onNothingStored?: (setStored: (t: T) => void) => void
): [T, (t: T) => void] {
  const org = useOrg();

  const orgId = org?.currentOrg?.id ?? "";
  const orgKey = `${orgId}_${key}`; // Updated key to include orgId
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  const setValue = useCallback(
    (value: T) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(orgKey, JSON.stringify(valueToStore)); // Use orgKey
        }
      } catch (error) {
        console.error(error);
      }
    },
    [orgKey, storedValue] // Updated dependency to orgKey
  );

  useEffect(() => {
    try {
      const item =
        typeof window !== "undefined" && window.localStorage.getItem(orgKey); // Use orgKey
      if (!item) {
        throw new Error("No item stored");
      }
      const val = JSON.parse(item);
      if (JSON.stringify(val) !== JSON.stringify(storedValue)) {
        setStoredValue(val);
      }
    } catch (error) {
      onNothingStored && onNothingStored(setValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgKey, onNothingStored, setValue]); // Updated dependency to orgKey

  return [storedValue, setValue];
}
