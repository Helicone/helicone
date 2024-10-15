import React from "react";
import { Column } from "@tanstack/react-table";
import { Col } from "../../../../layout/common/col";
import { clsx } from "../../../clsx";
import { columnDefToDragColumnItem, DragColumnItem } from "./DragList";
import ColumnSelectButton, { ColumnViewOptions } from "./ColumnSelect";
import { CheckIcon } from "@heroicons/react/24/outline";

interface ColumnOptionsProps<T> {
  categories: string[];
  selectedCategory: string | undefined | "All columns";
  setSelectedCategory: (category: string | undefined | "All columns") => void;
  columns: Column<T, unknown>[];
  activeColumns: DragColumnItem[];
  setActiveColumns: (columns: DragColumnItem[]) => void;
}

export default function ColumnOptions<T>({
  categories,
  selectedCategory,
  setSelectedCategory,
  columns,
  activeColumns,
  setActiveColumns,
}: ColumnOptionsProps<T>) {
  return (
    <Col className="h-full flex flex-col">
      <ColumnSelectButton
        categories={categories}
        currentView={selectedCategory as ColumnViewOptions}
        onViewChange={setSelectedCategory}
      />
      <Col className="flex-grow overflow-y-auto mt-2">
        {categories
          .filter((category) => category !== "All columns")
          .filter((category) => {
            if (selectedCategory === "All columns") {
              return true;
            }
            return category === selectedCategory;
          })
          .map((category, idx) => (
            <Col key={`${category}-${idx}`} className="gap-2 mb-4">
              <p className="text-xs text-slate-500 font-medium">
                {category === "Default" ? "All columns" : category}
              </p>
              <ul className="flex flex-wrap gap-2">
                {columns
                  .filter((column) => {
                    if (
                      !column.columnDef.meta?.category &&
                      category == "Default"
                    ) {
                      return true;
                    }
                    return column.columnDef.meta?.category === category;
                  })
                  .map((column) => {
                    const header = column.columnDef.header as string;
                    return (
                      <li key={column.id}>
                        <button
                          onClick={() => {
                            if (activeColumns.find((c) => c.id === column.id)) {
                              setActiveColumns(
                                activeColumns.map((c) => {
                                  if (c.id === column.id) {
                                    c.shown = !c.shown;
                                  }
                                  return c;
                                })
                              );
                            } else {
                              setActiveColumns([
                                ...activeColumns,
                                columnDefToDragColumnItem(column.columnDef),
                              ]);
                            }
                          }}
                          className={clsx(
                            activeColumns.find((c) => c.id === column.id)?.shown
                              ? "bg-sky-100 border-[#73ACCF] dark:bg-sky-900 text-sky-700 font-medium hover:text-sky-900 dark:hover:text-sky-100 dark:text-sky-300"
                              : "bg-white dark:bg-black text-slate-500 hover:bg-sky-50 dark:hover:bg-sky-900 hover:text-sky-900 dark:hover:text-sky-100",
                            "text-xs border border-slate-300 dark:border-slate-700 w-fit px-2 py-1 rounded-md whitespace-pre-wrap text-left flex flex-row items-center space-x-2"
                          )}
                        >
                          {header}{" "}
                          {activeColumns.find((c) => c.id === column.id)
                            ?.shown && <CheckIcon className="h-4 w-4" />}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </Col>
          ))}
      </Col>
    </Col>
  );
}
