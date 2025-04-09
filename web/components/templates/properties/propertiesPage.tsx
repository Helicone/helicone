import AuthHeader from "@/components/shared/authHeader";
import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";
import { FreeTierLimitWrapper } from "@/components/shared/FreeTierLimitWrapper";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { H3 } from "@/components/ui/typography";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { LockIcon, Tag } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import { useGetPropertiesV2 } from "../../../services/hooks/propertiesV2";
import { getPropertyFiltersV2 } from "../../../services/lib/filters/frontendFilterDefs";
import PropertyPanel from "./propertyPanel";

const PropertiesPage = (props: { initialPropertyKey?: string }) => {
  const { initialPropertyKey } = props;
  const { properties, isLoading: isPropertiesLoading } =
    useGetPropertiesV2(getPropertyFiltersV2);

  const router = useRouter();

  // Only update URL when property is selected via UI
  const handlePropertySelect = (property: string) => {
    router.push(`/properties/${encodeURIComponent(property)}`);
  };

  // Determine the selected property based on initialPropertyKey or first property
  const selectedProperty = useMemo(() => {
    if (initialPropertyKey && properties.includes(initialPropertyKey)) {
      return initialPropertyKey;
    }
    if (properties.length > 0 && !isPropertiesLoading) {
      return properties[0];
    }
    return "";
  }, [initialPropertyKey, properties, isPropertiesLoading]);

  const { hasAccess, freeLimit, canCreate } = useFeatureLimit(
    "properties",
    properties.length
  );

  // Redirect to root if property not found
  useEffect(() => {
    if (
      initialPropertyKey &&
      !isPropertiesLoading &&
      properties.length > 0 &&
      !properties.includes(initialPropertyKey)
    ) {
      router.replace("/properties");
    }
  }, [initialPropertyKey, properties, isPropertiesLoading, router]);

  if (isPropertiesLoading) {
    return (
      <div className="flex flex-col h-full min-h-screen bg-background dark:bg-sidebar-background">
        <AuthHeader title="Properties" />

        <div className="flex flex-col lg:flex-row flex-1 h-full bg-background dark:bg-sidebar-background">
          <Card className="w-full lg:w-[350px] lg:min-w-[350px] lg:max-w-[350px] lg:flex-shrink-0 h-full rounded-none border-0 shadow-none bg-background dark:bg-sidebar-background">
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
      <div className="flex flex-col w-full h-screen bg-background dark:bg-sidebar-background">
        <div className="flex flex-1 h-full">
          <EmptyStateCard feature="properties" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-background dark:bg-sidebar-background">
      <AuthHeader title="Properties" />

      {!canCreate && (
        <FreeTierLimitBanner
          feature="properties"
          itemCount={properties.length}
          freeLimit={freeLimit}
          className="w-full"
        />
      )}

      <div className="flex flex-col lg:flex-row h-full bg-background dark:bg-sidebar-background">
        <Card className="w-full lg:w-[300px] lg:min-w-[300px] lg:max-w-[300px] lg:flex-shrink-0 h-full rounded-none border-0 border-r border-border dark:border-sidebar-border shadow-none bg-background dark:bg-sidebar-background">
          <CardContent>
            <ScrollArea className="h-full dark:bg-sidebar-background bg-background">
              {properties.map((property, i) => {
                const requiresPremium = !hasAccess && i >= freeLimit;

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
                        onClick={() => handlePropertySelect(property)}
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
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="pt-2 w-full h-full flex-1 overflow-auto bg-background dark:bg-sidebar-background">
          <div className="min-w-0 h-full">
            <PropertyPanel property={selectedProperty} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPage;
