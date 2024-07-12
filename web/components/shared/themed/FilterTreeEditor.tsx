import React from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@tremor/react";
import { Result } from "../../../lib/result";
import { SingleFilterDef } from "../../../services/lib/filters/frontendFilterDefs";
import { AdvancedFilterRow, UIFilterRow } from "./themedAdvancedFilters";
import {
  UIFilterRowNode,
  UIFilterRowTree,
} from "../../../services/lib/filters/uiFilterRowTree";
import SaveFilterButton from "../../templates/dashboard/saveFilterButton";
import { OrganizationFilter } from "../../../services/lib/organization_layout/organization_layout";

interface FilterTreeEditorProps {
  uiFilterRowTree: UIFilterRowTree;
  onUpdate: (updatedTree: UIFilterRowTree) => void;
  filterMap: SingleFilterDef<any>[];
  onSearchHandler: (
    property: string,
    search: string
  ) => Promise<Result<void, string>>;
  filters: UIFilterRowTree;
  onSaveFilterCallback?: () => void;
  savedFilters?: OrganizationFilter[];
  layoutPage: "dashboard" | "requests";
}

const FilterTreeEditor: React.FC<FilterTreeEditorProps> = ({
  uiFilterRowTree,
  onUpdate,
  filterMap,
  onSearchHandler,
  filters,
  onSaveFilterCallback,
  savedFilters,
  layoutPage,
}) => {
  const handleAddFilter = (parentNode: UIFilterRowNode) => {
    const newFilter: UIFilterRow = {
      filterMapIdx: 0,
      operatorIdx: 0,
      value: "",
    };
    parentNode.rows.push(newFilter);
    onUpdate({ ...uiFilterRowTree });
  };

  const handleTransformToNode = (
    parentNode: UIFilterRowNode,
    index: number
  ) => {
    const currentFilter = parentNode.rows[index] as UIFilterRow;
    const newNode: UIFilterRowNode = {
      operator: "and",
      rows: [
        currentFilter,
        {
          filterMapIdx: 0,
          operatorIdx: 0,
          value: "",
        },
      ],
    };
    parentNode.rows[index] = newNode;
    onUpdate({ ...uiFilterRowTree });
  };

  const handleRemoveNode = (node: UIFilterRowTree, path: number[]) => {
    const updatedTree = removeNodeByPath(uiFilterRowTree, path);
    onUpdate(updatedTree || { operator: "and", rows: [] });
  };

  const removeNodeByPath = (
    tree: UIFilterRowTree,
    path: number[],
    isRoot: boolean = true
  ): UIFilterRowTree | null => {
    if (path.length === 0) return tree;

    if ("operator" in tree) {
      const [index, ...restPath] = path;
      if (restPath.length === 0) {
        const newRows = [...tree.rows];
        newRows.splice(index, 1);

        if (newRows.length === 0) {
          return null;
        } else if (isRoot && newRows.length === 1) {
          return { ...tree, rows: newRows };
        } else if (!isRoot && newRows.length === 1) {
          return newRows[0];
        } else {
          return { ...tree, rows: newRows };
        }
      } else {
        const updatedChild = removeNodeByPath(
          tree.rows[index],
          restPath,
          false
        );
        const newRows = [...tree.rows];
        if (updatedChild === null) {
          newRows.splice(index, 1);
        } else {
          newRows[index] = updatedChild;
        }

        if (newRows.length === 0) {
          return null;
        } else if (isRoot && newRows.length === 1) {
          return { ...tree, rows: newRows };
        } else if (!isRoot && newRows.length === 1) {
          return newRows[0];
        } else {
          return { ...tree, rows: newRows };
        }
      }
    }
    return null;
  };

  const handleOperatorToggle = (node: UIFilterRowNode) => {
    node.operator = node.operator === "and" ? "or" : "and";
    onUpdate({ ...uiFilterRowTree });
  };

  const renderNode = (
    node: UIFilterRowTree,
    path: number[] = [],
    isRoot: boolean = false
  ): JSX.Element => {
    if ("operator" in node) {
      const content = (
        <>
          {node.rows.length > 1 && (
            <div
              className={`flex items-center mb-4 ${
                path.length === 1 && "ml-4"
              }`}
            >
              <Button
                onClick={() => handleOperatorToggle(node)}
                variant="secondary"
                size="xs"
                className="mr-2 uppercase bg-[#E5F3F9] border-[#6BB9EF]"
              >
                {node.operator}
              </Button>
            </div>
          )}
          {node.rows.map((childNode: UIFilterRowTree, childIndex: number) => (
            <div key={childIndex} className="mb-2">
              {renderNode(childNode, [...path, childIndex], false)}
            </div>
          ))}
          {isRoot && (
            <div className="flex flex-row w-full items-center justify-between my-4">
              <button
                onClick={() => handleAddFilter(node)}
                className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
              >
                <PlusIcon
                  className="mr-1 h-3.5 flex-none text-black dark:text-white hover:bg-sky-100 hover:text-sky-900 dark:hover:bg-sky-900 dark:hover:text-sky-100"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block">
                  Add Filter
                </p>
              </button>
              {onSaveFilterCallback && (
                <SaveFilterButton
                  filters={filters}
                  onSaveFilterCallback={onSaveFilterCallback}
                  filterMap={filterMap}
                  savedFilters={savedFilters}
                  layoutPage={layoutPage}
                />
              )}
            </div>
          )}
        </>
      );

      return isRoot ? (
        <div className="mb-4">{content}</div>
      ) : (
        <div className="mb-4 flex flex-col bg-gray-100 dark:bg-black py-4 rounded-lg border border-gray-300 dark:border-gray-700">
          {content}
        </div>
      );
    } else {
      const parentNode = getNodeByPath(
        uiFilterRowTree,
        path.slice(0, -1)
      ) as UIFilterRowNode;
      const showAddFilter =
        path.length === 1 ||
        path[path.length - 1] === parentNode?.rows?.length - 1;

      const filterRow = (
        <div className="flex flex-row items-center justify-around">
          <AdvancedFilterRow
            filterMap={filterMap}
            filter={node}
            setFilter={(updatedFilter) => {
              const updatedTree = updateNodeByPath(
                uiFilterRowTree,
                path,
                updatedFilter
              );
              onUpdate(updatedTree);
            }}
            onDeleteHandler={() => handleRemoveNode(node, path)}
            onSearchHandler={onSearchHandler}
            onAddFilter={() => {
              const parentPath = path.slice(0, -1);
              const parentNode = getNodeByPath(
                uiFilterRowTree,
                parentPath
              ) as UIFilterRowNode;
              if (parentNode.rows.length > 1 && path.length > 1) {
                handleAddFilter(parentNode);
              } else {
                handleTransformToNode(parentNode, path[path.length - 1]);
              }
            }}
            showAddFilter={showAddFilter}
          />
        </div>
      );

      return path.length === 1 ? (
        <div className="flex flex-col bg-gray-100 dark:bg-black py-4 rounded-lg border border-gray-300 dark:border-gray-700 ">
          {filterRow}
        </div>
      ) : (
        filterRow
      );
    }
  };

  const updateNodeByPath = (
    tree: UIFilterRowTree,
    path: number[],
    newValue: UIFilterRowTree
  ): UIFilterRowTree => {
    if (path.length === 0) return newValue;
    if ("operator" in tree) {
      const [index, ...restPath] = path;
      const newRows = [...tree.rows];
      newRows[index] = updateNodeByPath(newRows[index], restPath, newValue);
      return { ...tree, rows: newRows };
    }
    return tree;
  };

  const getNodeByPath = (
    tree: UIFilterRowTree,
    path: number[]
  ): UIFilterRowTree | null => {
    if (path.length === 0) return tree;
    if ("operator" in tree) {
      const [index, ...restPath] = path;
      return getNodeByPath(tree.rows[index], restPath);
    }
    return null;
  };

  return (
    <div className="-mb-4 mt-4">{renderNode(uiFilterRowTree, [], true)}</div>
  );
};

export default FilterTreeEditor;
