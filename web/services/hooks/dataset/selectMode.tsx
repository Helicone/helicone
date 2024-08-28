import { useState } from "react";
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

  const toggleSelectMode = (mode: boolean) => {
    setSelectMode(mode);
    if (!mode) {
      setSelectedIds([]);
    }
  };

  const toggleSelection = (item: T) => {
    const id = getItemId(item);
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
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
        setSelectedIds([
          ...selectedIds,
          ...Array.from(new Set(newSelectedIds)),
        ]);
      } else {
        setSelectedIds([...selectedIds, id]);
      }
      setLastSelectedItem(item);
    }
  };

  const selectAll = () => {
    if (selectedIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(getItemId));
    }
  };

  return {
    selectMode,
    toggleSelectMode,
    selectedIds,
    toggleSelection,
    selectAll,
    isShiftPressed,
  };
}
