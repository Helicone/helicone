import React, { useRef } from "react";
import { clsx } from "../clsx";
import { useTheme } from "../theme/themeContext";
import { ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const themeContext = useTheme();

  return (
    <div
      className={clsx(themeContext?.theme ?? "light", "overflow-hidden z-40")}
    >
      <div className=" inset-0 overflow-hidden">
        <div className="pointer-events-none  inset-y-0 right-0 flex max-w-full ">
          <div
            ref={divRef}
            className={clsx(defaultWidth, "pointer-events-auto w-screen")}
          >
            <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-black shadow-xl">
              <div className="px-4 sm:px-6 py-6 sticky top-0 bg-white dark:bg-black z-10">
                <div className="flex items-start justify-between">
                  <Button
                    size={"icon"}
                    variant={"ghost"}
                    onClick={() => setOpen(false)}
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </Button>
                  <div className="ml-3 flex h-7 items-center">{actions}</div>
                </div>
              </div>
              <div className=" flex-1 px-4 sm:px-6">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemedDiv;
