import { Column } from "@tanstack/react-table";
import { Col } from "../../../../layout/common/col";
import { Row } from "../../../../layout/common/row";
import { clsx } from "../../../clsx";
import { columnDefToDragColumnItem, DragColumnItem } from "./DragList";
import ColumnSelectButton, { ColumnViewOptions } from "./ColumnSelect";

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
    <Col className="space-y-2 flex-1 pl-2">
      <ColumnSelectButton
        categories={categories}
        currentView={selectedCategory as ColumnViewOptions}
        onViewChange={setSelectedCategory}
      />
      <Col className="pt-2">
        <Col className="flex flex-col space-y-2 pt-2">
          {categories
            .filter((category) => category !== "all")
            .filter((category) => {
              if (selectedCategory === "All columns") {
                return true;
              }
              return category === selectedCategory;
            })
            .map((category, idx) => (
              <Col key={`${category}-${idx}`} className="gap-2">
                <p className="text-xs text-gray-500 font-medium">{category}</p>
                <ul className="flex flex-wrap gap-2">
                  {columns
                    .filter((column) => {
                      if (
                        !column.columnDef.meta?.category &&
                        category === "Default"
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
                              if (
                                activeColumns.find((c) => c.id === column.id)
                              ) {
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
                              activeColumns.find((c) => c.id === column.id)
                                ?.shown
                                ? "bg-sky-100 dark:bg-sky-900 text-sky-700 font-medium hover:text-sky-900 dark:hover:text-sky-100 dark:text-sky-300"
                                : "bg-white dark:bg-black text-gray-500 hover:bg-sky-50 dark:hover:bg-sky-900 hover:text-sky-900 dark:hover:text-sky-100",
                              "text-xs border border-gray-300 dark:border-gray-700 w-fit px-2 py-1 rounded-md whitespace-pre-wrap text-left"
                            )}
                          >
                            {header}
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </Col>
            ))}
        </Col>
      </Col>
    </Col>
  );
}
