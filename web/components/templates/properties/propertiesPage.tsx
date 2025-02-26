import { useMemo, useState } from "react";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import { FeatureUpgradeCard } from "@/components/shared/helicone/FeatureUpgradeCard";
import { useHasAccess } from "@/hooks/useHasAccess";
import { Tag } from "lucide-react";
import { useGetPropertiesV2 } from "../../../services/hooks/propertiesV2";
import { getPropertyFiltersV2 } from "../../../services/lib/filters/frontendFilterDefs";
import LoadingAnimation from "../../shared/loadingAnimation";
import PropertyPanel from "./propertyPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const PropertiesPage = (props: {}) => {
  const { properties, isLoading: isPropertiesLoading } =
    useGetPropertiesV2(getPropertyFiltersV2);

  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const hasAccess = useHasAccess("properties");

  const hasAccessToProperties = useMemo(() => {
    return (
      hasAccess ||
      (properties.length > 0 &&
        new Date().getTime() < new Date("2024-09-27").getTime())
    );
  }, [hasAccess, properties.length]);

  if (isPropertiesLoading) {
    return <LoadingAnimation title="Loading Properties" />;
  }

  if (!hasAccessToProperties) {
    return (
      <div className="flex justify-center items-center bg-white dark:bg-gray-950">
        <FeatureUpgradeCard
          title="Properties"
          featureName="Properties"
          headerTagline="Tag and analyze request metadata"
          icon={<Tag className="w-4 h-4 text-sky-500" />}
          highlightedFeature="properties"
        />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col w-full min-h-screen items-center bg-slate-50 dark:bg-gray-900">
        <EmptyStateCard feature="properties" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {isPropertiesLoading ? (
        <LoadingAnimation title="Loading Properties" />
      ) : (
        <div className="flex flex-col xl:flex-row h-full">
          <Card className="w-full xl:w-[350px] h-full rounded-none border-0 shadow-none">
            <CardContent className="p-0">
              <h3 className="font-semibold text-lg text-black dark:text-white p-4">
                Your Properties
              </h3>

              <ScrollArea className="h-full">
                <div>
                  {properties.map((property, i) => (
                    <Button
                      key={i}
                      variant={
                        selectedProperty === property ? "default" : "ghost"
                      }
                      className="w-full justify-start font-medium h-auto py-3 rounded-none"
                      onClick={() => setSelectedProperty(property)}
                    >
                      <Tag className="h-4 w-4 mr-2" />
                      <span className="truncate">{property}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="w-full flex flex-col pt-2">
            <PropertyPanel property={selectedProperty} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesPage;
