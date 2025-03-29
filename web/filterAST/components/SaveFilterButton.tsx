import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import React from "react";
import { useFilterAST } from "../context/filterContext";
import useNotification from "@/components/shared/notification/useNotification";
import { Row } from "@/components/layout/common/row";

interface SaveFilterButtonProps {}

const SaveFilterButton: React.FC<SaveFilterButtonProps> = () => {
  const { crud, store: filterStore, helpers } = useFilterAST();
  const notification = useNotification();

  if (crud.isRefetching || crud.isSaving) {
    return (
      <Row className="gap-2">
        <div className="flex items-center text-muted-foreground bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded-md text-xs border border-slate-200 dark:border-slate-800">
          Saving...
        </div>
        <Button
          variant="outline"
          size="sm_sleek"
          onClick={() => {
            helpers.saveFilter();
          }}
          className="text-[10px] font-normal"
        >
          Save New
        </Button>
      </Row>
    );
  }

  if (!filterStore.activeFilterId) {
    return (
      <Button
        variant="outline"
        size="sm_sleek"
        onClick={() => {
          helpers.saveFilter();
        }}
        className="text-[10px] font-normal"
      >
        Save New
      </Button>
    );
  }

  if (filterStore.hasUnsavedChanges) {
    return (
      <Row className="gap-2">
        <Button
          variant="default"
          size="sm_sleek"
          onClick={() => {
            if (filterStore.activeFilterId) {
              helpers.updateFilterById(filterStore.activeFilterId, {
                filter: filterStore.filter,
                name: filterStore.activeFilterName || "Untitled Filter",
              });
            }
          }}
          className="text-[10px] font-normal"
        >
          Save
        </Button>
        <Button
          variant="outline"
          size="sm_sleek"
          onClick={() => {
            helpers.saveFilter();
          }}
          className="text-[10px] font-normal"
        >
          Save New
        </Button>
      </Row>
    );
  }

  return (
    <Row className="gap-2">
      <Button
        variant="ghost"
        size="square_icon"
        onClick={() => {
          const url = helpers.getShareableUrl();
          if (url) {
            navigator.clipboard.writeText(url);
            notification.setNotification(
              "Filter URL copied to clipboard",
              "success"
            );
          }
        }}
      >
        <Link size={12} className="text-primary" />
      </Button>
      <Button
        variant="outline"
        size="sm_sleek"
        onClick={() => {
          helpers.saveFilter();
        }}
        className="text-[10px] font-normal"
      >
        Save New
      </Button>
    </Row>
  );
};

export default SaveFilterButton;
