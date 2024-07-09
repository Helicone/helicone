import { XCircleIcon } from "@heroicons/react/24/outline";
import { Select, Button, SelectItem } from "@tremor/react";
import { Result } from "../../../lib/result";
import { SingleFilterDef } from "../../../services/lib/filters/frontendFilterDefs";
import { AdvancedFilterRow, UIFilterRow } from "./themedAdvancedFilters";
import {
  UIFilterRowNode,
  UIFilterRowTree,
} from "../../../services/lib/filters/uiFilterRowTree";
import { Row } from "../../layout/common/row";
import { Col } from "../../layout/common/col";

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
    console.log("Parent node", parentNode);
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
    const updatedTree = removeEmptyParents(uiFilterRowTree);
    onUpdate(updatedTree || { operator: "and", rows: [] });
  };

  const removeEmptyParents = (
    node: UIFilterRowTree,
    parent?: UIFilterRowNode
  ): UIFilterRowTree | null => {
    if ("operator" in node) {
      node.rows = node.rows.reduce<UIFilterRowTree[]>((acc, child) => {
        const result = removeEmptyParents(child, node);
        if (result) acc.push(result);
        return acc;
      }, []);

      if (node.rows.length === 0) {
        return null;
      } else if (node.rows.length === 1 && "operator" in node.rows[0]) {
        return node.rows[0];
      }
    }
    return node;
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
          <Row className="relative">
            {node.rows.length >= 2 && (
              <div className="flex items-center mb-2 ">
                <div className="absolute left-[150px]  w-[27px] h-[2px] bg-[#F0F0F0] dark:bg-gray-700 transform -translate-y-1/2" />
                <div className="absolute left-44 top-0 bottom-0 w-[2px] bg-[#F0F0F0] dark:bg-gray-700 h-full" />

                {index && (
                  <div className="absolute -left-16 top-1/2 w-[70px] h-[2px] bg-[#F0F0F0] dark:bg-gray-700 transform -translate-y-1/2" />
                )}

                <div>
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
                </div>
                {/* {parentNode && (
                  <Button
                    onClick={() => handleRemoveNode(parentNode, index!)}
                    variant="secondary"
                    size="sm"
                    className="ml-2"
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </Button>
                )} */}
              </div>
            )}
            <Col className="pl-[50px]">
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
                {index !== undefined && index < 2 && (
                  <Button
                    onClick={() => handleAddGroup(node)}
                    variant="secondary"
                    size="sm"
                  >
                    Add Group {index}
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </div>
      );
    } else {
      return (
        <div className="relative pl-6 mb-2">
          {(() => {
            if (parentNode && parentNode.rows.length == 1) {
              return (
                <div className="absolute -left-[115px] top-1/2 w-[155px] h-[2px] bg-[#F0F0F0] dark:bg-gray-700 transform -translate-y-1/2" />
              );
            } else if (parentNode) {
              return (
                <div className="absolute -left-[40px] top-1/2 w-[80px] h-[2px] bg-[#F0F0F0] dark:bg-gray-700 transform -translate-y-1/2" />
              );
            }
            return null;
          })()}

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
              console.log("Deleting filter");
              console.log("Parent node", parentNode);
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
