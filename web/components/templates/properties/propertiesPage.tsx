import { useEffect, useState } from "react";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import { LockIcon, Tag } from "lucide-react";
import { useGetPropertiesV2 } from "../../../services/hooks/propertiesV2";
import { getPropertyFiltersV2 } from "../../../services/lib/filters/frontendFilterDefs";
import PropertyPanel from "./propertyPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { FreeTierLimitWrapper } from "@/components/shared/FreeTierLimitWrapper";
import { H3, H4, Muted } from "@/components/ui/typography";

const PropertiesPage = (props: {}) => {
  const { properties, isLoading: isPropertiesLoading } =
    useGetPropertiesV2(getPropertyFiltersV2);

  const [selectedProperty, setSelectedProperty] = useState<string>("");

  const { hasFullAccess, freeLimit } = useFeatureLimit(
    "properties",
    properties.length
  );

  useEffect(() => {
    if (
      !hasFullAccess &&
      properties.length > 0 &&
      selectedProperty === "" &&
      !isPropertiesLoading
    ) {
      setSelectedProperty(properties[0]);
    }
  }, [properties, selectedProperty, isPropertiesLoading, hasFullAccess]);

  if (isPropertiesLoading) {
    return (
      <div className="flex flex-col h-full min-h-screen bg-background dark:bg-sidebar-background">
        <div className="flex flex-col lg:flex-row flex-1 h-full bg-background dark:bg-sidebar-background">
          <Card className="w-full lg:w-[350px] h-full rounded-none border-0 shadow-none bg-background dark:bg-sidebar-background">
            <CardContent className="p-0">
              <div className="bg-background dark:bg-sidebar-background border-b border-border dark:border-sidebar-border">
                <CardHeader className="py-3 px-4">
                  <H3>Your Properties</H3>
                </CardHeader>
              </div>

              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center">
                      <Skeleton className="h-4 w-4 mr-2 bg-slate-200 dark:bg-slate-700" />
                      <Skeleton className="h-6 w-full bg-slate-200 dark:bg-slate-700" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="w-full flex flex-col pt-2">
            <Card className="rounded-none border-0 shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Skeleton className="h-8 w-48 mb-6 bg-slate-200 dark:bg-slate-700" />
                <Skeleton className="h-4 w-64 bg-slate-200 dark:bg-slate-700" />
              </CardContent>
            </Card>
          </div>
        </div>
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
    <div className="flex flex-col h-full min-h-screen bg-background dark:bg-sidebar-background">
      <div className="flex flex-col lg:flex-row flex-1 h-full bg-background dark:bg-sidebar-background">
        <Card className="w-full lg:w-[350px] h-full rounded-none border-0 border-r border-border dark:border-sidebar-border shadow-none bg-background dark:bg-sidebar-background">
          <CardContent className="p-0">
            <div className="bg-background dark:bg-sidebar-background border-b border-border dark:border-sidebar-border">
              <CardHeader className="py-3 px-4">
                <H4>Your Properties</H4>
              </CardHeader>
            </div>

            <ScrollArea className="h-full bg-background dark:bg-sidebar-background">
              <div>
                {properties.map((property, i) => {
                  const requiresPremium = !hasFullAccess && i >= freeLimit;

                  return (
                    <div key={i}>
                      {requiresPremium ? (
                        <FreeTierLimitWrapper
                          feature="properties"
                          itemCount={properties.length}
                        >
                          <Button
                            variant="ghost"
                            className="w-full justify-start font-medium h-auto py-3 rounded-none text-muted-foreground dark:text-sidebar-foreground hover:text-foreground dark:hover:text-sidebar-foreground"
                          >
                            <LockIcon className="h-3 w-3 mr-2 text-muted-foreground dark:text-sidebar-foreground" />
                            <span className="truncate max-w-[250px]">
                              {property}
                            </span>
                          </Button>
                        </FreeTierLimitWrapper>
                      ) : (
                        <Button
                          variant={
                            selectedProperty === property ? "default" : "ghost"
                          }
                          className="w-full justify-start font-medium h-auto py-3 rounded-none"
                          onClick={() => setSelectedProperty(property)}
                        >
                          <Tag className="h-4 w-4 mr-2" />
                          <span className="truncate max-w-[250px]">
                            {property}
                          </span>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {!hasFullAccess && properties.length > freeLimit && (
                <div className="border-t border-border dark:border-sidebar-border bg-background dark:bg-sidebar-background p-3">
                  <div className="flex items-center justify-between">
                    <Muted>
                      Free tier users can view up to {freeLimit} of{" "}
                      {properties.length} properties
                    </Muted>
                    <FreeTierLimitWrapper
                      feature="properties"
                      itemCount={freeLimit + 1}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs font-normal text-primary dark:text-sidebar-primary hover:text-primary-foreground hover:bg-primary dark:hover:text-sidebar-primary-foreground dark:hover:bg-sidebar-primary"
                      >
                        Unlock all →
                      </Button>
                    </FreeTierLimitWrapper>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="w-full flex flex-col flex-1 pt-2 bg-background dark:bg-sidebar-background">
          <PropertyPanel property={selectedProperty} />
        </div>
      </div>
    </div>
  );
};

export default PropertiesPage;
