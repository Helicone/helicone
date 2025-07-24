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
import { getPropertyFiltersV2 } from "@helicone-package/filters/frontendFilterDefs";
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
    properties.length,
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
      <div className="flex h-full min-h-screen flex-col bg-background dark:bg-sidebar-background">
        <AuthHeader title="Properties" />

        <div className="flex h-full flex-1 flex-col bg-background dark:bg-sidebar-background lg:flex-row">
          <Card className="h-full w-full rounded-none border-0 bg-background shadow-none dark:bg-sidebar-background lg:w-[350px] lg:min-w-[350px] lg:max-w-[350px] lg:flex-shrink-0">
            <CardContent className="p-0">
              <div className="border-b border-border bg-background dark:border-sidebar-border dark:bg-sidebar-background">
                <CardHeader className="px-4 py-3">
                  <H3>Your Properties</H3>
                </CardHeader>
              </div>

              <ScrollArea className="h-full">
                <div className="space-y-3 p-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center">
                      <Skeleton className="mr-2 h-4 w-4 bg-slate-200 dark:bg-slate-700" />
                      <Skeleton className="h-6 w-full bg-slate-200 dark:bg-slate-700" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="flex w-full flex-col pt-2">
            <Card className="rounded-none border-0 shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Skeleton className="mb-6 h-8 w-48 bg-slate-200 dark:bg-slate-700" />
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
      <div className="flex h-screen w-full flex-col bg-background dark:bg-sidebar-background">
        <div className="flex h-full flex-1">
          <EmptyStateCard feature="properties" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-screen flex-col bg-background dark:bg-sidebar-background">
      <AuthHeader title="Properties" />

      {!canCreate && (
        <FreeTierLimitBanner
          feature="properties"
          itemCount={properties.length}
          freeLimit={freeLimit}
          className="w-full"
        />
      )}

      <div className="flex h-full flex-col bg-background dark:bg-sidebar-background lg:flex-row">
        <Card className="h-full w-full rounded-none border-0 border-r border-border bg-background shadow-none dark:border-sidebar-border dark:bg-sidebar-background lg:w-[300px] lg:min-w-[300px] lg:max-w-[300px] lg:flex-shrink-0">
          <CardContent>
            <ScrollArea className="h-full bg-background dark:bg-sidebar-background">
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
                          className="h-auto w-full justify-start rounded-none py-3 font-medium text-muted-foreground hover:text-foreground dark:text-sidebar-foreground dark:hover:text-sidebar-foreground"
                        >
                          <LockIcon className="mr-2 h-3 w-3 text-muted-foreground dark:text-sidebar-foreground" />
                          <span className="max-w-[250px] truncate">
                            {property}
                          </span>
                        </Button>
                      </FreeTierLimitWrapper>
                    ) : (
                      <Button
                        variant={
                          selectedProperty === property ? "default" : "ghost"
                        }
                        className="h-auto w-full justify-start rounded-none py-3 font-medium"
                        onClick={() => handlePropertySelect(property)}
                      >
                        <Tag className="mr-2 h-4 w-4" />
                        <span className="max-w-[250px] truncate">
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

        <div className="h-full w-full flex-1 overflow-auto bg-background pt-2 dark:bg-sidebar-background">
          <div className="h-full min-w-0">
            <PropertyPanel property={selectedProperty} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPage;
