import AuthHeader from "@/components/shared/authHeader";
import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";
import { FreeTierLimitWrapper } from "@/components/shared/FreeTierLimitWrapper";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { XSmall } from "@/components/ui/typography";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { LockIcon, Search, Tag, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useGetPropertiesV2 } from "../../../services/hooks/propertiesV2";
import { getPropertyFiltersV2 } from "@helicone-package/filters/frontendFilterDefs";
import PropertyPanel from "./propertyPanel";
import { getJawnClient } from "@/lib/clients/jawn";
import { useOrg } from "@/components/layout/org/organizationContext";

const PropertiesPage = (props: { initialPropertyKey?: string }) => {
  const { initialPropertyKey } = props;
  const { properties, isLoading: isPropertiesLoading, refetch } =
    useGetPropertiesV2(getPropertyFiltersV2);

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [hiddenKeysLocal, setHiddenKeysLocal] = useState<Set<string>>(new Set());
  const [hidingKey, setHidingKey] = useState<string | null>(null);

  // Filter properties based on search query
  const filteredProperties = useMemo(() => {
    const base = properties.filter((p) => !hiddenKeysLocal.has(p));
    if (!searchQuery) return base;
    return base.filter((property) =>
      property.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [properties, searchQuery, hiddenKeysLocal]);

  // Only update URL when property is selected via UI
  const handlePropertySelect = (property: string) => {
    router.push(`/properties/${encodeURIComponent(property)}`);
  };

  const handleHideProperty = async (property: string) => {
    try {
      setHidingKey(property);
      const jawn = getJawnClient(org?.currentOrg?.id);
      await (jawn as any).POST("/v1/property/hide", {
        body: { key: property },
      });
      setHiddenKeysLocal((prev) => new Set([...Array.from(prev), property]));
      // Fire and forget refetch; cache may update asynchronously
      refetch();
      if (initialPropertyKey === property) {
        router.replace("/properties");
      }
    } catch (e) {
      // no-op; could add toast later
    } finally {
      setHidingKey(null);
    }
  };

  // Determine the selected property based on initialPropertyKey or first property
  const selectedProperty = useMemo(() => {
    if (initialPropertyKey && properties.includes(initialPropertyKey)) {
      return initialPropertyKey;
    }
    if (filteredProperties.length > 0 && !isPropertiesLoading) {
      return filteredProperties[0];
    }
    return "";
  }, [initialPropertyKey, properties, filteredProperties, isPropertiesLoading]);

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
      <div className="flex h-screen flex-col bg-background">
        <AuthHeader title="Properties" />

        <div className="flex flex-1 flex-col overflow-hidden px-4 py-4">
          <div className="flex flex-1 flex-col border border-border bg-background lg:flex-row">
            <div className="flex w-full flex-col border-b border-border bg-background lg:w-72 lg:border-b-0 lg:border-r">
              <div className="border-b border-border p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search properties..."
                    disabled
                    className="h-8 pl-10 text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 bg-muted" />
                    <Skeleton className="h-5 flex-1 bg-muted" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-y-auto p-8">
              <div className="text-center">
                <Skeleton className="mx-auto mb-4 h-8 w-48 bg-muted" />
                <Skeleton className="mx-auto h-4 w-64 bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex h-screen w-full flex-col bg-background">
        <AuthHeader title="Properties" />
        <div className="flex flex-1 items-center justify-center">
          <EmptyStateCard feature="properties" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <AuthHeader title="Properties" />

      {!canCreate && (
        <FreeTierLimitBanner
          feature="properties"
          itemCount={properties.length}
          freeLimit={freeLimit}
          className="w-full"
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col border border-border bg-background lg:h-full lg:flex-row">
          <div className="flex w-full flex-col border-b border-border bg-background lg:w-72 lg:border-b-0 lg:border-r">
            <div className="border-b border-border p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-10 text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredProperties.map((property, i) => {
                const originalIndex = properties.indexOf(property);
                const requiresPremium =
                  !hasAccess && originalIndex >= freeLimit;
                const isSelected = selectedProperty === property;

                return (
                  <div key={i}>
                    {requiresPremium ? (
                      <FreeTierLimitWrapper
                        feature="properties"
                        itemCount={properties.length}
                      >
                        <div className="flex items-center gap-2 px-4 py-3 text-muted-foreground">
                          <LockIcon className="h-3 w-3 flex-shrink-0" />
                          <XSmall className="truncate">{property}</XSmall>
                        </div>
                      </FreeTierLimitWrapper>
                    ) : (
                      <div
                        className={`group flex w-full items-center justify-between px-4 py-3 transition-colors ${isSelected
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          }`}
                      >
                        <button
                          className="flex items-center gap-2 text-left"
                          onClick={() => handlePropertySelect(property)}
                        >
                          <Tag className="h-3 w-3 flex-shrink-0" />
                          <XSmall className="truncate">{property}</XSmall>
                        </button>
                        <button
                          className={`ml-2 opacity-0 transition-opacity group-hover:opacity-100 text-red-500 hover:text-red-600 disabled:opacity-50`}
                          title="Hide property"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHideProperty(property);
                          }}
                          disabled={hidingKey === property}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <PropertyPanel property={selectedProperty} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPage;
const org = useOrg();
