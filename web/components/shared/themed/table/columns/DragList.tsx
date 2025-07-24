import { EllipsisVerticalIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useRef } from "react";
import { useDrag, useDrop, XYCoord } from "react-dnd";
import { Col } from "../../../../layout/common/col";
import { Row } from "../../../../layout/common/row";
import { clsx } from "../../../clsx";

// Define item type for react-dnd
const ItemTypes = {
  COLUMN: "column",
};

// Fake data generator

export interface DragColumnItem {
  name: string;
  id: string;
  column: ColumnDef<any, any>["meta"];
  shown: boolean;
}

export function columnDefToDragColumnItem(
  column: ColumnDef<any, any>,
): DragColumnItem {
  return {
    name: column.id ?? "",
    id: column.id ?? "",
    column: column.meta,
    shown: true,
  };
}

export function columnDefsToDragColumnItems(
  columns: ColumnDef<any, any>[],
): DragColumnItem[] {
  return columns.map(columnDefToDragColumnItem);
}

interface DraggableItemProps {
  item: DragColumnItem;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  removeItem: (index: number) => void;
}

// Define the type for the dragged item
interface DragItem {
  id: string;
  index: number;
}

const DraggableItem = ({
  item,
  index,
  moveItem,
  removeItem,
}: DraggableItemProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: any }>({
    accept: ItemTypes.COLUMN,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(draggedItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = draggedItem.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveItem(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations, but it's good here for the sake of performance
      // to avoid expensive index searches.
      draggedItem.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.COLUMN,
    item: (): DragItem => {
      return { id: item.id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      data-handler-id={handlerId}
      className={clsx(
        "mb-1 p-2",
        isDragging ? "bg-blue-100 dark:bg-slate-900" : "bg-white dark:bg-black",
        "cursor-move rounded-md border border-gray-200 dark:border-gray-800",
        item.shown ? "block" : "hidden",
      )}
    >
      <Row className="items-center justify-between">
        <Row className="items-center gap-2 text-xs">
          <Row>
            <EllipsisVerticalIcon className="h-3 w-3" />
            <EllipsisVerticalIcon className="-ml-2 h-3 w-3" />
          </Row>
          {item.name}
        </Row>
        <Col>
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent drag from starting on button click
              removeItem(index);
            }}
          >
            <TrashIcon className="h-4 w-4 text-red-500" />
          </button>
        </Col>
      </Row>
    </div>
  );
};

export const DragList = ({
  items,
  setItems,
}: {
  items: DragColumnItem[];
  setItems: (items: DragColumnItem[]) => void;
}) => {
  const moveItem = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragItem = items[dragIndex];
      const newItems = [...items];
      newItems.splice(dragIndex, 1);
      newItems.splice(hoverIndex, 0, dragItem);
      setItems(newItems);
    },
    [items, setItems],
  );

  const removeItem = useCallback(
    (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    },
    [items, setItems],
  );

  return (
    <div className="w-full p-1">
      {items.map((item, index) => (
        <DraggableItem
          key={item.id}
          index={index}
          item={item}
          moveItem={moveItem}
          removeItem={removeItem}
        />
      ))}
    </div>
  );
};
