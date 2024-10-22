import { Button } from "@/components/ui/button";
import { ChevronsRightIcon } from "lucide-react";
import React, { useRef } from "react";

interface ThemedDivProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  defaultWidth?: string;
}

const ThemedDiv: React.FC<ThemedDivProps> = ({
  open,
  setOpen,
  children,
  actions,
  defaultWidth = "md:w-[60vw]",
}) => {
  const divRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className="px-2 py-1 sticky top-0 bg-white dark:bg-black z-10 border-b border-gray-200 dark:border-gray-800">
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
      <div className="flex-1 overflow-y-auto bg-white dark:bg-black px-5 pt-5">
        {children}
      </div>
    </>
  );
};

export default ThemedDiv;
