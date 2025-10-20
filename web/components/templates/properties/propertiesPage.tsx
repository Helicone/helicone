import AuthHeader from "@/components/shared/authHeader";
import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";
import { FreeTierLimitWrapper } from "@/components/shared/FreeTierLimitWrapper";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { XSmall } from "@/components/ui/typography";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { ClientType, getJawnClient } from "@/lib/clients/jawn";
import { useQuery } from "@tanstack/react-query";
import { Loader2, LockIcon, Search, Tag, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { getPropertyFiltersV2 } from "@helicone-package/filters/frontendFilterDefs";
import { useGetPropertiesV2 } from "../../../services/hooks/propertiesV2";
import PropertyPanel from "./propertyPanel";

type HiddenProperty = { property: string };

const PropertiesPage = (props: { initialPropertyKey?: string }) => {
  const { initialPropertyKey } = props;
  const {
    properties,
    isLoading: isPropertiesLoading,
    refetch,
  } = useGetPropertiesV2(getPropertyFiltersV2);

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [hiddenKeysLocal, setHiddenKeysLocal] = useState<Set<string>>(
    new Set(),
  );
  const [hidingKey, setHidingKey] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [selectedHiddenProperty, setSelectedHiddenProperty] =
    useState<string>("");
  const [restoringKey, setRestoringKey] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const {
    data: hiddenProperties,
    isLoading: isHiddenPropertiesLoading,
    isRefetching: isHiddenPropertiesRefetching,
    error: hiddenPropertiesError,
    refetch: refetchHiddenProperties,
  } = useQuery<HiddenProperty[], Error>({
    queryKey: ["properties", "hidden"],
    queryFn: async () => {
      const jawn = getJawnClient();
      const res = await (jawn as ClientType).POST(
        "/v1/property/hidden/query",
        {},
      );
      if (!res.data || res.data.error !== null) {
        throw new Error(
          res.data?.error ?? "Failed to load deleted properties.",
        );
      }
      return res.data.data ?? [];
    },
    enabled: restoreModalOpen,
    refetchOnWindowFocus: false,
  });

  const hiddenPropertyKeys = useMemo(
    () => hiddenProperties?.map((p) => p.property) ?? [],
    [hiddenProperties],
  );

  const hiddenPropertiesErrorMessage = hiddenPropertiesError?.message ?? null;

  const effectiveSelectedHiddenProperty = selectedHiddenProperty || "";

  const isRestoreDisabled =
    !effectiveSelectedHiddenProperty ||
    !!restoringKey ||
    hiddenPropertyKeys.length === 0;

  useEffect(() => {
    if (!restoreModalOpen) {
      setSelectedHiddenProperty("");
      setRestoreError(null);
    }
  }, [restoreModalOpen]);

  const isHiddenPropertiesLoadingState =
    isHiddenPropertiesLoading || isHiddenPropertiesRefetching;

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
      const jawn = getJawnClient();
      await (jawn as ClientType).POST("/v1/property/hide", {
        body: { key: property },
      });
      setHiddenKeysLocal((prev) => {
        const updated = new Set(prev);
        updated.add(property);
        return updated;
      });
      refetch();
      if (restoreModalOpen) {
        void refetchHiddenProperties();
      }
      if (initialPropertyKey === property) {
        router.replace("/properties");
      }
    } catch (e) {
      // no-op; could add toast later
    } finally {
      setHidingKey(null);
    }
  };

  const handleOpenRestoreModal = () => {
    if (restoringKey) {
      return;
    }
    setRestoreModalOpen(true);
    setRestoreError(null);
  };

  const handleRestoreProperty = async () => {
    const propertyToRestore = effectiveSelectedHiddenProperty;
    if (!propertyToRestore) {
      return;
    }

    try {
      setRestoreError(null);
      setRestoringKey(propertyToRestore);
      const jawn = getJawnClient();
      await (jawn as ClientType).POST("/v1/property/restore", {
        body: { key: propertyToRestore },
      });
      setHiddenKeysLocal((prev) => {
        const updated = new Set(prev);
        updated.delete(propertyToRestore);
        return updated;
      });
      await Promise.all([refetch(), refetchHiddenProperties()]);
      setRestoreModalOpen(false);
      setSelectedHiddenProperty("");
    } catch (e) {
      setRestoreError("Unable to restore property. Please try again.");
    } finally {
      setRestoringKey(null);
    }
  };

  const handleRestoreModalOpenChange = (open: boolean) => {
    if (restoringKey) {
      return;
    }
    setRestoreModalOpen(open);
    if (!open) {
      setRestoreError(null);
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
                        className={`group flex w-full items-center justify-between px-4 py-3 transition-colors ${
                          isSelected
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
                          className={`ml-2 text-destructive opacity-0 transition-opacity hover:text-destructive/90 disabled:opacity-50 group-hover:opacity-100`}
                          title="Delete property"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDelete(property);
                            setConfirmOpen(true);
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
            <div className="border-t border-border p-2">
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={handleOpenRestoreModal}
              >
                Restore Deleted Properties
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <PropertyPanel property={selectedProperty} />
          </div>
        </div>
      </div>

      <HidePropertyConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setPendingDelete(null);
        }}
        property={pendingDelete}
        isLoading={hidingKey === pendingDelete && hidingKey !== null}
        onConfirm={async () => {
          if (!pendingDelete) return;
          await handleHideProperty(pendingDelete);
          setConfirmOpen(false);
          setPendingDelete(null);
        }}
      />

      <RestoreHiddenPropertiesDialog
        open={restoreModalOpen}
        onOpenChange={handleRestoreModalOpenChange}
        hiddenPropertyKeys={hiddenPropertyKeys}
        isLoading={isHiddenPropertiesLoadingState}
        errorMessage={hiddenPropertiesErrorMessage}
        selectedProperty={effectiveSelectedHiddenProperty}
        onSelect={setSelectedHiddenProperty}
        onRestore={handleRestoreProperty}
        isRestoreDisabled={isRestoreDisabled}
        restoreError={restoreError}
        restoringKey={restoringKey}
      />
    </div>
  );
};

export default PropertiesPage;

// Confirmation dialog for hiding a property
const HidePropertyConfirmDialog = ({
  open,
  onOpenChange,
  property,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: string | null;
  onConfirm: () => void;
  isLoading: boolean;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-4">
          <DialogTitle>Delete property?</DialogTitle>
          <DialogDescription>
            {property
              ? `This will delete the property "${property}" from your Properties list.`
              : "This will delete the selected property from your Properties list."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading || !property}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

type RestoreHiddenPropertiesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hiddenPropertyKeys: string[];
  isLoading: boolean;
  errorMessage: string | null;
  selectedProperty: string;
  onSelect: (value: string) => void;
  onRestore: () => void;
  isRestoreDisabled: boolean;
  restoreError: string | null;
  restoringKey: string | null;
};

const RestoreHiddenPropertiesDialog = ({
  open,
  onOpenChange,
  hiddenPropertyKeys,
  isLoading,
  errorMessage,
  selectedProperty,
  onSelect,
  onRestore,
  isRestoreDisabled,
  restoreError,
  restoringKey,
}: RestoreHiddenPropertiesDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restore Deleted Properties</DialogTitle>
          <DialogDescription>
            Select a property to restore. Restored properties will reappear in
            your list.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : hiddenPropertyKeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You do not have any deleted properties to restore.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="restore-hidden-property">Deleted property</Label>
              <Select
                value={selectedProperty || undefined}
                onValueChange={(value) => onSelect(value)}
              >
                <SelectTrigger id="restore-hidden-property">
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {hiddenPropertyKeys.map((property) => (
                    <SelectItem key={property} value={property}>
                      {property}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {restoreError && (
              <p className="text-sm text-destructive">{restoreError}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              if (!restoringKey) {
                onOpenChange(false);
              }
            }}
            disabled={!!restoringKey}
          >
            Cancel
          </Button>
          <Button
            onClick={onRestore}
            disabled={isRestoreDisabled}
            variant="action"
          >
            {restoringKey ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restoring
              </>
            ) : (
              "Restore"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
