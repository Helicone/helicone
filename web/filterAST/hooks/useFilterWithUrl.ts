import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

/**
 * A hook that combines filter state management with URL synchronization
 * This provides a simpler API for components that need to work with filters
 */
export const useSyncURL = ({
  loadFilterById,
  activeFilterId,
}: {
  loadFilterById: (filterId: string) => Promise<boolean>;
  activeFilterId: string | null;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialFilterId, setInitialFilterId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (!searchParams) return;

    const filterIdFromUrl = searchParams.get("filter_id");
    if (filterIdFromUrl) {
      setInitialFilterId(filterIdFromUrl);
    }
    setIsMounted(true);
  }, [
    activeFilterId,
    initialFilterId,
    loadFilterById,
    searchParams,
    isMounted,
  ]);

  /**
   * Utility function to manually update the URL with a filter ID
   */
  const updateUrlWithFilterId = useCallback(
    (filterId: string | null) => {
      if (!router || !searchParams) return;

      const params = new URLSearchParams(searchParams.toString());

      if (filterId) {
        params.set("filter_id", filterId);
      } else {
        params.delete("filter_id");
      }

      const newUrl = window.location.pathname + "?" + params.toString();
      router.replace(newUrl, { scroll: false });
    },
    [router, searchParams]
  );

  // Update URL when filter ID changes
  useEffect(() => {
    if (!searchParams || !router) return;
    if (!isMounted) return;

    const params = new URLSearchParams(searchParams.toString());
    const currentFilterIdInUrl = params.get("filter_id");

    // Only update URL if the filter ID has changed
    if (activeFilterId !== currentFilterIdInUrl) {
      if (activeFilterId) {
        params.set("filter_id", activeFilterId);
      } else {
        params.delete("filter_id");
      }

      const newUrl = window.location.pathname + "?" + params.toString();
      router.replace(newUrl, { scroll: false });
    }
  }, [activeFilterId, router, searchParams, isMounted]);

  // Load filter from URL on initial mount
  useEffect(() => {
    if (!isMounted) return;
    if (!initialFilterId) return;
    loadFilterById(initialFilterId);
  }, [initialFilterId, loadFilterById, isMounted]);

  // Return utility function for manual URL updates
  return {
    updateUrlWithFilterId,
  };
};
