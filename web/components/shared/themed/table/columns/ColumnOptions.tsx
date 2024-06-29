import { Column } from "@tanstack/react-table";
import { Col } from "../../../../layout/common/col";
import { Row } from "../../../../layout/common/row";
import { clsx } from "../../../clsx";
import { DragColumnItem } from "./DragList";

interface ColumnOptionsProps<T> {
  categories: string[];
  selectedCategory: string | undefined | "all";
  setSelectedCategory: (category: string | undefined | "all") => void;
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
    <Col className="space-y-2 divide-y divide-gray-200 flex-1">
      <h3 className="text-xs text-black dark:text-white font-medium">
        Column Options
      </h3>
      <Col className="pt-2">
        <Row className="gap-2">
          {categories.map((category, idx) => (
            <button
              key={`${category}-${idx}`}
              className={clsx(
                selectedCategory === category
                  ? "bg-green-100 dark:bg-green-900 text-green-700 font-semibold hover:text-green-900 dark:hover:text-green-100 dark:text-green-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-green-50 dark:hover:bg-green-800 hover:text-green-900 dark:hover:text-green-100",
                "text-xs border border-gray-400 dark:border-gray-600 w-full px-3 py-2 rounded-lg whitespace-nowrap text-center"
              )}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </Row>
        <Col className="flex flex-col space-y-2 pt-2">
          {categories
            .filter((category) => category !== "all")
            .filter((category) => {
              if (selectedCategory === "all") {
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
                              setActiveColumns(
                                activeColumns.map((c) => {
                                  if (c.id === column.id) {
                                    c.shown = !c.shown;
                                  }
                                  return c;
                                })
                              );
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
