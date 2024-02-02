import { useState } from "react";

import AuthHeader from "../../shared/authHeader";
import { useGetProperties } from "../../../services/hooks/properties";
import { PlusIcon, TagIcon } from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";
import React from "react";
import Link from "next/link";
import PropertyPanel from "./propertyPanel";

const PropertiesPage = (props: {}) => {
  const {
    properties,
    isLoading: isPropertiesLoading,
    refetch,
    searchPropertyFilters,
  } = useGetProperties();

  const [selectedProperty, setSelectedProperty] = useState<string>("");

  return (
    <>
      <AuthHeader title={"Properties"} subtitle="" />
      <div className="flex flex-col gap-4">
        <>
          {properties.length < 1 ? (
            <div className="flex flex-col w-full h-96 justify-center items-center">
              <div className="flex flex-col w-2/5">
                <TagIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
                <p className="text-xl text-black dark:text-white font-semibold mt-8">
                  You do not have any properties.
                </p>
                <p className="text-sm text-gray-500 max-w-sm mt-2">
                  View our docs to get started segmenting your LLM-requests
                </p>
                <div className="mt-4">
                  <Link
                    href="https://docs.helicone.ai/features/advanced-usage/custom-properties#what-are-custom-properties"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="w-fit items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:divide-x md:divide-gray-300 gap-4 min-h-[80vh] h-full">
              <div className="flex flex-col space-y-6 w-full min-w-[350px] max-w-[350px]">
                <h3 className="font-semibold text-md">Your Properties</h3>

                <ul className="w-full bg-white h-fit border border-gray-300 rounded-lg">
                  {properties.map((property, i) => (
                    <li key={i}>
                      <button
                        onClick={() => {
                          setSelectedProperty(property);
                        }}
                        className={clsx(
                          selectedProperty === property
                            ? "bg-sky-200 dark:bg-sky-800"
                            : "bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-950",
                          i === 0 ? "rounded-t-lg" : "",
                          i === properties.length - 1 ? "rounded-b-lg" : "",
                          "w-full flex flex-row items-center space-x-2 p-4 border-b border-gray-200"
                        )}
                      >
                        <TagIcon className="h-4 w-4 text-black dark:text-white" />
                        <p className="text-md font-semibold">{property}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="w-full md:pl-4 flex flex-col space-y-4">
                <PropertyPanel property={selectedProperty} />
              </div>
            </div>
          )}
        </>
      </div>
    </>
  );
};

export default PropertiesPage;
