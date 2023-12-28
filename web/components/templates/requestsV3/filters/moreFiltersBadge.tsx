import { PlusCircleIcon, TagIcon } from "@heroicons/react/24/outline";
import FilterBadge from "../../../ui/filters/filterBadge";
import { useState } from "react";
import TextFilterBadge from "./shared/textFilterBadge";
import Link from "next/link";

interface MoreFiltersBadgeProps {
  properties: string[];
}

const MoreFiltersBadge = (props: MoreFiltersBadgeProps) => {
  const { properties } = props;

  const [activeProperties, setActiveProperties] = useState<string[]>([]);

  const nonActiveProperties = properties.filter(
    (property: string) => !activeProperties.includes(property)
  );

  return (
    <>
      {activeProperties.map((property: string) => (
        <TextFilterBadge title={property} filterKey={property} />
      ))}

      <FilterBadge
        title="Custom"
        showTitle={false}
        clearFilter={() => {}}
        variant="secondary"
      >
        {properties.length === 0 && (
          <div className="flex flex-col space-y-4 w-full text-center items-center justify-center py-4 px-2">
            <TagIcon className="w-8 h-8 text-gray-500" />
            <h2 className="text-md font-semibold text-gray-900 dark:text-gray-100">
              No custom properties
            </h2>
            <p className="text-sm test-gray-500">
              Please view our{" "}
              <Link
                href="https://docs.helicone.ai/features/advanced-usage/custom-properties"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                docs
              </Link>{" "}
              to learn how to use custom properties
            </p>
          </div>
        )}

        <div className="flex flex-col space-y-1 pt-1 w-full">
          <h2 className="text-xs font-semibold text-gray-500">
            Your custom properties
          </h2>
          <ul className="flex flex-col w-full">
            {properties.map((property: string) => (
              <li className="w-full">
                <button
                  className="hover:bg-gray-200 rounded-lg w-full flex items-center text-sm py-2 space-x-1 px-1"
                  onClick={() => {
                    if (activeProperties.includes(property)) {
                      return;
                    }
                    setActiveProperties([...activeProperties, property]);
                  }}
                >
                  <PlusCircleIcon className="w-4 h-4 text-gray-500" />
                  <p>{property}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </FilterBadge>
    </>
  );
};

export default MoreFiltersBadge;
