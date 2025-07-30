import { CheckIcon } from "@heroicons/react/24/outline";
import { Column } from "@tanstack/react-table";
import { Col } from "../../../../layout/common/col";
import { clsx } from "../../../clsx";
import ColumnSelectButton, { ColumnViewOptions } from "./ColumnSelect";
import { columnDefToDragColumnItem, DragColumnItem } from "./DragList";

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
    <Col className="flex h-full flex-col">
      <ColumnSelectButton
        categories={categories}
        currentView={selectedCategory as ColumnViewOptions}
        onViewChange={setSelectedCategory}
      />
      <Col className="mt-2 flex-grow overflow-y-auto">
        {categories
          .filter((category) => category !== "All columns")
          .filter((category) => {
            if (selectedCategory === "All columns") {
              return true;
            }
            return category === selectedCategory;
          })
          .map((category, idx) => (
            <Col key={`${category}-${idx}`} className="mb-4 gap-2">
              <p className="text-xs font-medium text-slate-500">
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
                                }),
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
                              ? "border-[#73ACCF] bg-sky-100 font-medium text-sky-700 hover:text-sky-900 dark:bg-sky-900 dark:text-sky-300 dark:hover:text-sky-100"
                              : "bg-white text-slate-500 hover:bg-sky-50 hover:text-sky-900 dark:bg-black dark:hover:bg-sky-900 dark:hover:text-sky-100",
                            "flex w-fit flex-row items-center space-x-2 whitespace-pre-wrap rounded-md border border-slate-300 px-2 py-1 text-left text-xs dark:border-slate-700",
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
