import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import { clsx } from "../../../clsx";
import { ColumnDef } from "@tanstack/react-table";
import { EllipsisVerticalIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Col } from "../../../../layout/common/col";
import { Row } from "../../../../layout/common/row";

// Fake data generator

export interface DragColumnItem {
  name: string;
  id: string;
  column: ColumnDef<any, any>["meta"];
  shown: boolean;
}

export function columnDefToDragColumnItem(
  column: ColumnDef<any, any>
): DragColumnItem {
  return {
    name: column.id ?? "",
    id: column.id ?? "",
    column: column.meta,
    shown: true,
  };
}

export function columnDefsToDragColumnItems(
  columns: ColumnDef<any, any>[]
): DragColumnItem[] {
  return columns.map(columnDefToDragColumnItem);
}

// A little function to help with reordering the result
const reorder = (list: any[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const grid = 4;

const getItemStyle = (isDragging: boolean, draggableStyle: any) => ({
  // Some basic styles to make the items look a bit nicer
  userSelect: "none",
  // Styles we need to apply on draggables
  ...draggableStyle,
});

const getListStyle = (isDraggingOver: boolean) =>
  clsx(
    isDraggingOver ? "bg-lightblue" : "bg-lightgrey",
    `p-${grid}`,
    "w-250px"
  );

export const DragList = ({
  items,
  setItems,
}: {
  items: DragColumnItem[];
  setItems: (items: DragColumnItem[]) => void;
}) => {
  const onDragEnd = (result: DropResult) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }
    const reorderedItems = reorder(
      items,
      result.source.index,
      result.destination.index
    );
    setItems(reorderedItems);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={getListStyle(snapshot.isDraggingOver)}
          >
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={getItemStyle(
                      snapshot.isDragging,
                      provided.draggableProps.style
                    )}
                    className={clsx(
                      "p-2 mb-1",
                      snapshot.isDragging
                        ? "bg-blue-100 dark:bg-slate-900"
                        : "bg-white dark:bg-black",
                      "border border-gray-200 dark:border-gray-800 rounded-md",
                      item.shown ? "block" : "hidden"
                    )}
                  >
                    <Row className="items-center justify-between">
                      <Row className="items-center gap-2 text-xs">
                        <Row>
                          <EllipsisVerticalIcon className="h-3 w-3 " />
                          <EllipsisVerticalIcon className="h-3 w-3 -ml-2" />
                        </Row>
                        {item.name}
                      </Row>
                      <Col>
                        <button
                          onClick={() => {
                            setItems(items.filter((_, i) => i !== index));
                          }}
                        >
                          <TrashIcon className="w-4 h-4 text-red-500" />
                        </button>
                      </Col>
                    </Row>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
