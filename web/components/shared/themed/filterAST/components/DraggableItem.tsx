import React, { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { GripVertical } from "lucide-react";

// Define the item type for drag and drop
export const FILTER_ITEM = "filter-item";

// Interface for the draggable item props
export interface DraggableItemProps {
  id: string;
  index: number;
  path: number[];
  moveItem: (
    dragIndex: number,
    hoverIndex: number,
    dragPath: number[],
    hoverPath: number[]
  ) => void;
  children: React.ReactNode;
  isRoot?: boolean;
}

// Interface for the drag item
interface DragItem {
  index: number;
  id: string;
  path: number[];
  type: string;
}

export const DraggableItem: React.FC<DraggableItemProps> = ({
  id,
  index,
  path,
  moveItem,
  children,
  isRoot = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Set up the drop functionality
  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: string | symbol | null }
  >({
    accept: FILTER_ITEM,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }

      // Don't replace items with themselves
      if (item.id === id) {
        return;
      }

      // Only allow reordering within the same parent
      const dragPath = item.path.slice(0, -1);
      const hoverPath = path.slice(0, -1);

      // Check if paths are the same length and have the same parent
      if (dragPath.length !== hoverPath.length) {
        return;
      }

      for (let i = 0; i < dragPath.length; i++) {
        if (dragPath[i] !== hoverPath[i]) {
          return;
        }
      }

      const dragIndex = item.index;
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
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

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
      moveItem(dragIndex, hoverIndex, item.path, path);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
      item.path = path;
    },
  });

  // Set up the drag functionality
  const [{ isDragging }, drag, preview] = useDrag({
    type: FILTER_ITEM,
    item: () => {
      return { id, index, path };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isRoot, // Root items cannot be dragged
  });

  // Apply the ref to enable drag and drop
  drag(drop(ref));

  // Apply the preview ref
  React.useEffect(() => {
    preview(previewRef);
  }, [preview]);

  return (
    <div
      ref={previewRef}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      data-handler-id={handlerId}
      className="relative"
    >
      {!isRoot && (
        <div
          ref={ref}
          className="absolute left-0 top-0 bottom-0 flex items-center cursor-grab active:cursor-grabbing z-10 px-2"
        >
          <GripVertical size={16} className="text-muted-foreground" />
        </div>
      )}
      <div className={`${!isRoot ? "pl-8" : ""}`}>{children}</div>
    </div>
  );
};
