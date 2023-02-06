import { SVGProps } from "react";
import { clsx } from "./clsx";

interface ThemedTabsProps {
  tabs: {
    name: string;
    state: string;
    icon: (
      props: SVGProps<SVGSVGElement> & {
        title?: string | undefined;
        titleId?: string | undefined;
      }
    ) => JSX.Element;
    current: boolean;
  }[];
  onSelectHandler: (tab: string) => void;
}

const ThemedTabs = (props: ThemedTabsProps) => {
  const { tabs, onSelectHandler } = props;

  return (
    <>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 focus:border-sky-500 focus:ring-sky-500"
          defaultValue={tabs.find((tab) => tab.current)?.name}
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => onSelectHandler(tab.state)}
                className={clsx(
                  tab.current
                    ? "border-sky-500 text-sky-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                  "group inline-flex items-center py-4 px-1 border-b-2 font-medium text-md"
                )}
                aria-current={tab.current ? "page" : undefined}
              >
                <tab.icon
                  className={clsx(
                    tab.current
                      ? "text-sky-500"
                      : "text-gray-400 group-hover:text-gray-500",
                    "-ml-0.5 mr-2 h-5 w-5"
                  )}
                  aria-hidden="true"
                />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default ThemedTabs;
