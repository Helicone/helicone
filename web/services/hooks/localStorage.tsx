import { useState, useEffect, useCallback, useMemo } from "react";
import { useOrg } from "../../components/layout/org/organizationContext";
import { logger } from "@/lib/telemetry/logger";

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  onNothingStored?: (_setStored: (_t: T) => void) => void,
): [T, (_t: T) => void] {
  const org = useOrg();
  useEffect(() => {
    if (!org?.currentOrg?.id) {
      org?.refetchOrgs();
    }
  }, [org]);

  const orgId = useMemo(() => {
    const id = org?.currentOrg?.id ?? "";
    return id;
  }, [org]);
  const orgKey = `${orgId}_${key}`;
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue((prevValue) => {
          const valueToStore =
            value instanceof Function ? value(prevValue) : value;
          // Only save to localStorage if we have a valid orgId and the value is not undefined
          if (
            typeof window !== "undefined" &&
            orgId &&
            valueToStore !== undefined
          ) {
            window.localStorage.setItem(orgKey, JSON.stringify(valueToStore));
          }
          return valueToStore;
        });
      } catch (error) {
        logger.error(
          {
            error,
            key: orgKey,
          },
          "Failed to save to localStorage",
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, orgKey, orgId],
  );

  useEffect(() => {
    // Only try to read from localStorage if we have a valid orgId
    if (!orgId) {
      return;
    }

    try {
      const item =
        typeof window !== "undefined" && window.localStorage.getItem(orgKey);
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
  }, [key, orgKey, onNothingStored, setValue, orgId]);

  return [storedValue, setValue];
}
