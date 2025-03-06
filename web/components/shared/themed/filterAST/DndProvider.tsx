import React from "react";
import { DndProvider as ReactDndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export const DndProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <ReactDndProvider backend={HTML5Backend}>{children}</ReactDndProvider>;
};
