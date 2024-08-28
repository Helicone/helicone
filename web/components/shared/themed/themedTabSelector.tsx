import React from "react";
import { clsx } from "../clsx";

interface TabItem<T> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

interface TabSelectorProps<T> {
  tabs: TabItem<T>[];
  currentTab: string;
  onTabChange: (tabId: string) => void;
}

function ThemedTabSelector<T extends string>({
  tabs,
  currentTab,
  onTabChange,
}: TabSelectorProps<T>) {
  return (
    <div className="border-2 flex flex-row h-[34px] text-gray-500 rounded-lg bg-white w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={clsx(
            "w-full h-full flex justify-items-center items-center text-sm px-[24px] font-semibold shadow-sm text-center my-auto",
            currentTab === tab.id
              ? "bg-[#E0F5FF] border border-[#0CA5E9] text-black rounded-md"
              : "text-black border border-transparent hover:bg-gray-100 rounded-md"
          )}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default ThemedTabSelector;
