import { useRouter } from "next/router";
import { useOrg } from "../org/organizationContext";
import MetaData from "../public/authMetaData";
import { logger } from "@/lib/telemetry/logger";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./adminSidebar";
import { useState, useEffect } from "react";

// LocalStorage key for sidebar state
const SIDEBAR_STATE_KEY = "admin_sidebar_open";

export default function AdminLayout(props: { children: React.ReactNode }) {
  const { children } = props;
  const router = useRouter();
  const org = useOrg();
  const { pathname } = router;
  const currentPage =
    pathname.split("/")[1].charAt(0).toUpperCase() +
    pathname.split("/")[1].substring(1);

  // Start with undefined to indicate "not loaded yet"
  const [sidebarOpen, setSidebarOpen] = useState<boolean | undefined>(
    undefined,
  );

  // Load state from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      // Check if localStorage has a value
      const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
      // Set state based on localStorage, or default to true if not found
      setSidebarOpen(savedState === null ? true : savedState === "true");
    } catch (e) {
      logger.error(e, "Error accessing localStorage");
      // Default to open if localStorage fails
      setSidebarOpen(true);
    }
  }, []);

  // Listen for changes from the sidebar component
  const handleSidebarChange = (open: boolean) => {
    setSidebarOpen(open);

    try {
      // Save to localStorage whenever it changes
      localStorage.setItem(SIDEBAR_STATE_KEY, String(open));
    } catch (e) {
      logger.error(e, "Error saving to localStorage");
    }
  };

  // Get the current page name from the navigation path
  const getPageName = () => {
    const path = router.pathname;

    // Default to Dashboard for the root admin path
    if (path === "/admin") {
      return "Dashboard";
    }

    // Try to get a more specific name from the path segments
    const segments = path.split("/");
    if (segments.length > 2) {
      // Convert something like "/admin/metrics" to "Metrics"
      return (
        segments[2].charAt(0).toUpperCase() +
        segments[2].slice(1).replace(/-/g, " ")
      );
    }

    return "Admin";
  };

  // Show nothing until we've loaded the sidebar state
  if (sidebarOpen === undefined) {
    return null; // Or a minimal loading placeholder
  }

  return (
    <MetaData title={`${currentPage} ${"- " + (org?.currentOrg?.name || "")}`}>
      <SidebarProvider
        defaultOpen={sidebarOpen}
        open={sidebarOpen}
        onOpenChange={handleSidebarChange}
      >
        <div className="flex h-screen w-full">
          <AdminSidebar />

          <div className="flex min-w-0 flex-1 flex-col">
            <main className="w-full flex-1 overflow-auto bg-background">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </MetaData>
  );
}
