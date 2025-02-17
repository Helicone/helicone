import { useState, useMemo } from "react";

import AuthHeader from "../../shared/authHeader";

import { TagIcon } from "@heroicons/react/24/outline";
import { useGetPropertiesV2 } from "../../../services/hooks/propertiesV2";
import { clsx } from "../../shared/clsx";
import LoadingAnimation from "../../shared/loadingAnimation";
import PropertyPanel from "./propertyPanel";
import { getPropertyFiltersV2 } from "../../../services/lib/filters/frontendFilterDefs";
import { IslandContainer } from "@/components/ui/islandContainer";
import { useHasAccess } from "@/hooks/useHasAccess";
import { useOrg } from "@/components/layout/org/organizationContext";
import { FeatureUpgradeCard } from "@/components/shared/helicone/FeatureUpgradeCard";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";

const PropertiesPage = (props: {}) => {
  const { properties, isLoading: isPropertiesLoading } =
    useGetPropertiesV2(getPropertyFiltersV2);

  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const hasAccess = useHasAccess("properties");
  const org = useOrg();

  const hasAccessToProperties = useMemo(() => {
    return (
      hasAccess ||
      (properties.length > 0 &&
        new Date().getTime() < new Date("2024-09-27").getTime())
    );
  }, [org?.currentOrg?.tier, properties.length]);

  if (isPropertiesLoading) {
    return <LoadingAnimation title="Loading Properties" />;
  }

  if (!hasAccessToProperties) {
    return (
      <div className="flex justify-center items-center bg-white">
        <FeatureUpgradeCard
          title="Properties"
          featureName="Properties"
          headerTagline="Tag and analyze request metadata"
          icon={<TagIcon className="w-4 h-4 text-sky-500" />}
          highlightedFeature="properties"
        />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col w-full min-h-screen items-center bg-slate-50">
        <EmptyStateCard feature="properties" />
      </div>
    );
  }

  return (
    <IslandContainer>
      <AuthHeader isWithinIsland={true} title={"Properties"} />
      <div className="flex flex-col gap-4">
        {isPropertiesLoading ? (
          <LoadingAnimation title="Loading Properties" />
        ) : (
          <div className="flex flex-col xl:flex-row xl:divide-x xl:divide-gray-200 dark:xl:divide-gray-800 gap-8 xl:gap-4 min-h-[80vh] h-full">
            <div className="flex flex-col space-y-6 w-full min-w-[350px] max-w-[350px]">
              <h3 className="font-semibold text-md text-black dark:text-white">
                Your Properties
              </h3>

              <ul className="w-full bg-white h-fit border border-gray-300 dark:border-gray-700 rounded-lg">
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
                        i === 0 ? "rounded-t-md" : "",
                        i === properties.length - 1 ? "rounded-b-md" : "",
                        "w-full flex flex-row items-center space-x-2 p-4 border-b border-gray-200 dark:border-gray-800"
                      )}
                    >
                      <TagIcon className="h-4 w-4 text-black dark:text-white" />
                      <p className="text-md font-semibold text-black dark:text-white">
                        {property}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full xl:pl-4 flex flex-col space-y-4">
              <PropertyPanel property={selectedProperty} />
            </div>
          </div>
        )}
      </div>
    </IslandContainer>
  );
};

export default PropertiesPage;
