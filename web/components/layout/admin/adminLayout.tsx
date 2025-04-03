import { useRouter } from "next/router";
import { useOrg } from "../org/organizationContext";
import MetaData from "../public/authMetaData";
import { H4 } from "@/components/ui/typography";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./adminSidebar";

export default function AdminLayout(props: { children: React.ReactNode }) {
  const { children } = props;
  const router = useRouter();
  const org = useOrg();
  const { pathname } = router;
  const currentPage =
    pathname.split("/")[1].charAt(0).toUpperCase() +
    pathname.split("/")[1].substring(1);

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

  return (
    <MetaData title={`${currentPage} ${"- " + (org?.currentOrg?.name || "")}`}>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AdminSidebar />

          <div className="flex-1 flex flex-col min-w-0">
            {/* Top navigation bar - visible on all screens */}
            <div className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-sidebar-border bg-sidebar-background px-4">
              {/* Sidebar trigger - visible on all screens */}
              <SidebarTrigger className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors" />

              <H4>{getPageName()}</H4>
            </div>

            <main className="flex-1 w-full bg-background p-6 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </MetaData>
  );
}
