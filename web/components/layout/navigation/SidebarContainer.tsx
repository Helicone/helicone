import { Bars3Icon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigation } from "./NavigationContext";
import { ReactNode, forwardRef } from "react";

interface SidebarContainerProps {
  children: ReactNode;
}

/**
 * SidebarContainer component
 *
 * Handles layout and positioning for the sidebar:
 * - Mobile menu button
 * - Mobile overlay when menu is open
 * - Sidebar spacer
 * - Sidebar content with proper positioning
 */
const SidebarContainer = forwardRef<HTMLDivElement, SidebarContainerProps>(
  ({ children }, ref) => {
    const {
      isCollapsed,
      isMobileMenuOpen,
      setIsMobileMenuOpen,
      setIsCollapsed,
    } = useNavigation();

    // Calculate width class based on collapsed state
    const widthClass = cn(isCollapsed ? "w-16" : "w-52");

    return (
      <>
        {/* Mobile hamburger menu */}
        <div className="sticky top-0 z-20 px-2 py-3 flex md:hidden flex-shrink-0 bg-slate-100 dark:bg-black border-b border-slate-300 dark:border-slate-700">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsCollapsed(false);
              setIsMobileMenuOpen(true);
            }}
            className="text-slate-500 hover:text-slate-600"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </Button>
        </div>

        {/* Mobile drawer overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => {
              setIsCollapsed(false);
              setIsMobileMenuOpen(false);
            }}
            aria-hidden="true"
          />
        )}

        {/* Sidebar spacer - maintains layout space on desktop */}
        <div
          className={cn(
            "hidden md:block",
            widthClass,
            "transition-all duration-300"
          )}
        />

        {/* Sidebar content */}
        <div
          ref={ref}
          className={cn(
            "flex flex-col z-50 transition-all duration-300 h-screen bg-sidebar-background",
            widthClass,
            "fixed top-0 left-0",
            "md:translate-x-0", // Always visible on desktop
            isMobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          )}
        >
          <div className="w-full flex flex-col h-full border-r border-slate-200 dark:border-slate-800">
            {children}
          </div>
        </div>
      </>
    );
  }
);

SidebarContainer.displayName = "SidebarContainer";

export default SidebarContainer;
