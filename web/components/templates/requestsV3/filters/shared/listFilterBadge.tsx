import { useQuery } from "@tanstack/react-query";
import FilterBadge from "../../../../ui/filters/filterBadge";
import { getTimeIntervalAgo } from "../../../../../lib/timeCalculations/time";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface ListFilterBadgeProps {
  listKey: string; // the key for the query
  options: {
    label: string;
    value: string;
  }[];
}

const ListFilterBadge = (props: ListFilterBadgeProps) => {
  const { listKey, options } = props;

  const router = useRouter();

  const query = router.query[listKey];

  const [selectedData, setSelectedData] = useState<string[]>([]);

  const handleClearFilter = () => {
    setSelectedData([]);
    router.push({
      pathname: router.pathname,
      query: { ...router.query, [listKey]: [] },
    });
  };

  useEffect(() => {
    if (query === undefined) {
      return;
    } else {
      setSelectedData(Array.isArray(query) ? query : [query]);
    }
  }, [query]);

  return (
    <FilterBadge
      title={listKey.charAt(0).toUpperCase() + listKey.slice(1)}
      label={selectedData.length > 0 ? `${selectedData.join(", ")}` : undefined}
      clearFilter={() => {
        handleClearFilter();
      }}
    >
      <fieldset className="w-full">
        <button
          onClick={() => {
            handleClearFilter();
          }}
          className="w-full flex font-semibold text-gray-500 justify-center items-center bg-gray-200 dark:bg-gray-800 rounded-lg text-xs py-1 border border-gray-300 dark:border-gray-700"
        >
          Clear All
        </button>
        <div className="divide-y divide-gray-200 dark:divide-gray-800 w-full mt-1">
          {options.map((item, idx) => (
            <div key={idx} className="relative flex items-start py-2 w-full">
              <div className="min-w-0 flex-1 text-sm leading-6 truncate w-24 overflow-hidden">
                <label
                  htmlFor={`item-${idx}`}
                  className="select-none font-semibold"
                >
                  {item.label}
                </label>
              </div>
              <div className="ml-3 flex h-6 items-center">
                <input
                  id={`item-${idx}`}
                  name={`item-${idx}`}
                  type="checkbox"
                  checked={selectedData.includes(item.value)}
                  onClick={() => {
                    const newSelectedData = [...selectedData];
                    if (selectedData.includes(item.value)) {
                      const idx = selectedData.indexOf(item.value);
                      newSelectedData.splice(idx, 1);
                    } else {
                      newSelectedData.push(item.value);
                    }
                    // sort the selected data
                    newSelectedData.sort();
                    setSelectedData(newSelectedData);
                    router.push({
                      pathname: router.pathname,
                      query: { ...router.query, [listKey]: newSelectedData },
                    });
                  }}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-sky-500 focus:ring-sky-500"
                />
              </div>
            </div>
          ))}
        </div>
      </fieldset>
    </FilterBadge>
  );
};

export default ListFilterBadge;
