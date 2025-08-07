import { Button } from "@/components/ui/button";
import { ChevronsRightIcon } from "lucide-react";
import React from "react";

interface ThemedDivProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  defaultWidth?: string;
}

const ThemedDiv: React.FC<ThemedDivProps> = ({
  open: _open,
  setOpen,
  children,
  actions,
  defaultWidth: _defaultWidth = "md:w-[60vw]",
}) => {
  return (
    <>
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-2 py-1 dark:border-gray-800 dark:bg-black">
        <div className="flex items-center justify-between">
          <Button
            size={"icon"}
            variant={"ghost"}
            onClick={() => setOpen(false)}
          >
            <ChevronsRightIcon className="h-5 w-5" />
          </Button>
          <div className="ml-3 flex h-7 items-center">{actions}</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-white px-5 pt-5 dark:bg-black">
        {children}
      </div>
    </>
  );
};

export default ThemedDiv;
