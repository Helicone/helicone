import React from "react";
import { clsx } from "../../../shared/clsx";

import {
  ChatBubbleLeftIcon,
  ArrowTurnDownRightIcon,
  Bars3BottomRightIcon,
} from "@heroicons/react/24/outline";

interface TabSelectorProps<T> {
  tabs: readonly T[];
  currentTopView: T;
  setCurrentTopView: (view: T) => void;
}

function TabSelector<T extends string>({
  tabs,
  currentTopView,
  setCurrentTopView,
}: TabSelectorProps<T>) {
  return (
    <div className="border-2 mt-4 mb flex flex-row h-[34px] text-gray-500 rounded-lg bg-white w-fit">
      {tabs.map((tab, i) => (
        <button
          key={`${tab}-${i}`}
          className={clsx(
            "w-full h-full flex justify-items-center items-center text-sm px-[24px] font-semibold shadow-sm text-center my-auto ",
            currentTopView === tab
              ? "bg-[#E0F5FF] border border-[#0CA5E9] text-black rounded-md"
              : "text-black border border-transparent hover:bg-gray-100 rounded-md"
          )}
          onClick={() => setCurrentTopView(tab)}
        >
          {tab === "span" && (
            <span className="mr-2">
              <Bars3BottomRightIcon className="size-5" />
            </span>
          )}
          {tab === "tree" && (
            <span className="mr-2">
              <ArrowTurnDownRightIcon className="size-5" />
            </span>
          )}
          {tab === "chat" && (
            <span className="mr-2">
              <ChatBubbleLeftIcon className="size-5" />
            </span>
          )}
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
}

export default TabSelector;
