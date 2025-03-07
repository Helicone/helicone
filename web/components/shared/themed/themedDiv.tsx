import { Button } from "@/components/ui/button";
import { ChevronsRightIcon, PanelRightClose } from "lucide-react";
import React, { useRef } from "react";

interface ThemedDivProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  defaultWidth?: string;
  footer?: React.ReactNode;
}

const ThemedDiv: React.FC<ThemedDivProps> = ({
  open,
  setOpen,
  children,
  actions,
  defaultWidth = "md:w-[60vw]",
  footer,
}) => {
  const divRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="pl-1 pr-2 py-1 sticky top-0 z-10 border-b border-border">
        <div className="flex items-center justify-between">
          <Button
            size={"icon"}
            variant={"ghost"}
            onClick={() => setOpen(false)}
          >
            <PanelRightClose className="h-4 w-4 text-muted-foreground" />
          </Button>
          <div className="ml-3 flex h-7 items-center">{actions}</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {children}
      </div>
      {footer && (
        <div className="px-4 py-3 sticky bottom-0 z-10 border-t border-border">
          {footer}
        </div>
      )}
    </div>
  );
};

export default ThemedDiv;
