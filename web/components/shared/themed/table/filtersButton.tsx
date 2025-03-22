import { Fragment, useState } from "react";
import {
  ArrowPathIcon,
  Square2StackIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { OrganizationFilter } from "../../../../services/lib/organization_layout/organization_layout";
import { useOrg } from "../../../layout/org/organizationContext";
import useNotification from "../../notification/useNotification";
import useSearchParams from "../../utils/useSearchParams";
import { useJawnClient } from "../../../../lib/clients/jawnHook";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Small } from "@/components/ui/typography";

interface FilterButtonProps {
  filters?: OrganizationFilter[];
  currentFilter?: string;
  onFilterChange?: (value: OrganizationFilter | null) => void;
  onDeleteCallback?: () => void;
  layoutPage: "dashboard" | "requests";
}

export default function FiltersButton({
  filters,
  currentFilter,
  onFilterChange,
  onDeleteCallback,
  layoutPage,
}: FilterButtonProps) {
  const searchParams = useSearchParams();
  const jawn = useJawnClient();
  const [selectedFilter, setSelectedFilter] =
    useState<OrganizationFilter | null>(
      filters?.find((filter) => filter.id === currentFilter) ?? null
    );

  const [filterToDelete, setFilterToDelete] =
    useState<OrganizationFilter | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { setNotification } = useNotification();
  const orgContext = useOrg();
  if (!filters || filters.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex flex-row items-center">
        <div className="hidden md:block text-right ">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={selectedFilter !== null ? "secondary" : "ghost"}
                className="flex items-center gap-2 text-slate-700 dark:text-slate-400"
                size="sm_sleek"
              >
                <Square2StackIcon className="h-3 w-3" />
                <span className="hidden sm:inline">
                  {selectedFilter !== null ? (
                    <>
                      <span>Filter:</span>
                      <span className="pl-1 text-sky-500">
                        {selectedFilter.name}
                      </span>
                    </>
                  ) : (
                    "Saved Filters (Legacy)"
                  )}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-100 dark:border-amber-900/50 rounded-t-md">
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <Small className="text-amber-800 dark:text-amber-300 text-[11px] leading-tight">
                    This legacy filter system will be replaced soon with our new
                    enhanced filters. Your filters will be automatically
                    migrated.
                  </Small>
                </div>
              </div>
              <DropdownMenuSeparator />

              {filters && filters.length > 0 ? (
                filters.map((filter, idx) => (
                  <DropdownMenuItem
                    key={idx}
                    className="flex justify-between items-center"
                    onSelect={() => {
                      if (onFilterChange) {
                        setSelectedFilter(filter);
                        onFilterChange(filter);
                      }
                    }}
                  >
                    <span className="truncate">{filter.name}</span>
                    <TrashIcon
                      className="h-4 w-4 text-red-500 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilterToDelete(filter);
                        setIsDeleteModalOpen(true);
                      }}
                    />
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No filters</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {selectedFilter !== null && (
          <Button
            variant="ghost"
            size="sm_sleek"
            onClick={() => {
              if (onFilterChange) {
                setSelectedFilter(null);
                onFilterChange(null);
                searchParams.delete("filters");
              }
            }}
          >
            Clear
          </Button>
        )}
      </div>
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete Saved Filter: {filterToDelete?.name}
            </DialogTitle>
            <DialogDescription>
              This filter will be deleted from your organization. Are you sure
              you want to delete this filter?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setIsLoading(true);
                const updatedFilters = filters?.filter(
                  (filter) => filter.id !== filterToDelete?.id
                );
                const { data, error } = await jawn.POST(
                  "/v1/organization/{organizationId}/update_filter",
                  {
                    params: {
                      path: {
                        organizationId: orgContext?.currentOrg?.id!,
                      },
                    },
                    body: {
                      filterType: layoutPage,
                      filters: updatedFilters!,
                    },
                  }
                );
                if (error) {
                  setIsLoading(false);
                  setNotification("Error deleting filter", "error");
                  return;
                }
                setIsLoading(false);
                setIsDeleteModalOpen(false);
                setNotification("Filter deleted successfully", "success");
                onDeleteCallback && onDeleteCallback();
              }}
              disabled={isLoading}
            >
              {isLoading && (
                <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
