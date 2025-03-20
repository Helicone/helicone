import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import OrgDropdown from "@/components/layout/orgDropdown";
import { useNavigation } from "./NavigationContext";

/**
 * SidebarHeader component
 *
 * Renders the top section of the sidebar containing:
 * - Organization dropdown (when expanded)
 * - Collapse/expand toggle button
 */
const SidebarHeader = () => {
  const { isCollapsed, toggleCollapsed } = useNavigation();

  return (
    <div
      className={`flex flex-row items-center border-b border-slate-200 dark:border-slate-800 p-2.5 
        ${isCollapsed ? "justify-center" : "justify-between"}`}
    >
      {/* Organization dropdown */}
      {!isCollapsed && <OrgDropdown />}

      {/* Collapse/expand toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCollapsed}
        className="flex justify-center items-center hover:bg-slate-200 dark:hover:bg-slate-800 shrink-0"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRightIcon className="h-4 w-4" />
        ) : (
          <ChevronLeftIcon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default SidebarHeader;
