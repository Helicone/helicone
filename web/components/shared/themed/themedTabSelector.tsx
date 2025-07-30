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
    <div className="flex h-[34px] w-fit flex-row rounded-lg border-2 bg-white text-gray-500">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={clsx(
            "my-auto flex h-full w-full items-center justify-items-center px-[24px] text-center text-sm font-semibold shadow-sm",
            currentTab === tab.id
              ? "rounded-md border border-[#0CA5E9] bg-[#E0F5FF] text-black"
              : "rounded-md border border-transparent text-black hover:bg-gray-100",
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
