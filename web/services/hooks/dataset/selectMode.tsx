import { useState, useCallback } from "react";
import useShiftKeyPress from "../isShiftPressed";

interface UseSelectModeProps<T> {
  items: T[];
  getItemId: (item: T) => string;
}

export function useSelectMode<T>({ items, getItemId }: UseSelectModeProps<T>) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedItem, setLastSelectedItem] = useState<T | null>(null);
  const isShiftPressed = useShiftKeyPress();

  const toggleSelectMode = useCallback((mode: boolean) => {
    setSelectMode(mode);
    if (!mode) {
      setSelectedIds([]);
    }
  }, []);

  const toggleSelection = useCallback(
    (item: T) => {
      const id = getItemId(item);
      setSelectedIds((prevSelectedIds) => {
        if (prevSelectedIds.includes(id)) {
          return prevSelectedIds.filter((selectedId) => selectedId !== id);
        } else {
          if (isShiftPressed && lastSelectedItem) {
            const startIndex = items.findIndex(
              (i) => getItemId(i) === getItemId(lastSelectedItem)
            );
            const endIndex = items.findIndex((i) => getItemId(i) === id);
            const newSelectedIds = items
              .slice(
                Math.min(startIndex, endIndex),
                Math.max(startIndex, endIndex) + 1
              )
              .map(getItemId);
            return Array.from(new Set([...prevSelectedIds, ...newSelectedIds]));
          } else {
            return [...prevSelectedIds, id];
          }
        }
      });
      setLastSelectedItem(item);
    },
    [items, getItemId, isShiftPressed, lastSelectedItem]
  );

  const selectAll = useCallback(() => {
    setSelectedIds((prevSelectedIds) =>
      prevSelectedIds.length > 0 ? [] : items.map(getItemId)
    );
  }, [items, getItemId]);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    selectMode,
    toggleSelectMode,
    selectedIds,
    toggleSelection,
    selectAll,
    deselectAll,
    isShiftPressed,
  };
}
