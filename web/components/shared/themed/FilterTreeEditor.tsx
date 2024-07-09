import { XCircleIcon } from "@heroicons/react/24/outline";
import { Select, Button, SelectItem } from "@tremor/react";
import { Result } from "../../../lib/result";
import { SingleFilterDef } from "../../../services/lib/filters/frontendFilterDefs";
import { AdvancedFilterRow, UIFilterRow } from "./themedAdvancedFilters";
import {
  UIFilterRowNode,
  UIFilterRowTree,
} from "../../../services/lib/filters/uiFilterRowTree";

interface FilterTreeEditorProps {
  uiFilterRowTree: UIFilterRowTree;
  onUpdate: (updatedTree: UIFilterRowTree) => void;
  filterMap: SingleFilterDef<any>[];
  onSearchHandler: (
    property: string,
    search: string
  ) => Promise<Result<void, string>>;
}

const FilterTreeEditor: React.FC<FilterTreeEditorProps> = ({
  uiFilterRowTree,
  onUpdate,
  filterMap,
  onSearchHandler,
}) => {
  const handleAddFilter = (parentNode: UIFilterRowNode) => {
    console.log("Adding filter");
    const newFilter: UIFilterRow = {
      filterMapIdx: 0,
      operatorIdx: 0,
      value: "",
    };
    parentNode.rows.push(newFilter);
    onUpdate({ ...uiFilterRowTree });
  };

  const handleAddGroup = (parentNode: UIFilterRowNode) => {
    console.log("Adding group");
    console.log("Parent node", parentNode);
    const newGroup: UIFilterRowNode = { operator: "and", rows: [] };
    
    parentNode.rows.push(newGroup);
    onUpdate({ ...uiFilterRowTree });
  };

  const handleRemoveNode = (parentNode: UIFilterRowNode, index: number) => {
    console.log("Removing node");
    parentNode.rows.splice(index, 1);
    onUpdate({ ...uiFilterRowTree });
  };

  const handleOperatorChange = (
    node: UIFilterRowNode,
    newOperator: "and" | "or"
  ) => {
    node.operator = newOperator;
    onUpdate({ ...uiFilterRowTree });
  };

  const renderNode = (
    node: UIFilterRowTree,
    parentNode?: UIFilterRowNode,
    index?: number
  ): JSX.Element => {
    if ("operator" in node) {
      return (
        <div className="relative pl-6">
          {parentNode && (
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-700" />
          )}
          <div className="relative">
            <div className="flex items-center mb-2">
              <div className="absolute -left-6 top-3 w-6 h-px bg-gray-300 dark:bg-gray-700" />
              <Select
                value={node.operator}
                onValueChange={(value) =>
                  handleOperatorChange(node, value as "and" | "or")
                }
                className="w-24 mr-2"
              >
                <SelectItem value="and">AND</SelectItem>
                <SelectItem value="or">OR</SelectItem>
              </Select>
              {parentNode && (
                <Button
                  onClick={() => handleRemoveNode(parentNode, index!)}
                  variant="secondary"
                  size="sm"
                  className="ml-2"
                >
                  <XCircleIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
            {node.rows.map((childNode: any, childIndex: number) => (
              <div key={childIndex} className="relative mb-2">
                {renderNode(childNode, node, childIndex)}
              </div>
            ))}
            <div className="mt-2">
              <Button
                onClick={() => handleAddFilter(node)}
                variant="secondary"
                size="sm"
                className="mr-2"
              >
                Add Filter
              </Button>
              <Button
                onClick={() => handleAddGroup(node)}
                variant="secondary"
                size="sm"
              >
                Add Group
              </Button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="relative pl-6 mb-2">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-700" />
          <div className="absolute -left-6 top-3 w-6 h-px bg-gray-300 dark:bg-gray-700" />
          <AdvancedFilterRow
            filterMap={filterMap}
            filter={node}
            setFilter={(updatedFilter) => {
              if (parentNode) {
                parentNode.rows[index!] = updatedFilter;
                onUpdate({ ...uiFilterRowTree });
              }
            }}
            onDeleteHandler={() => {
              if (parentNode) {
                handleRemoveNode(parentNode, index!);
              }
            }}
            onSearchHandler={onSearchHandler}
          />
        </div>
      );
    }
  };

  return (
    <div className="filter-tree-editor mt-4">{renderNode(uiFilterRowTree)}</div>
  );
};

export default FilterTreeEditor;
