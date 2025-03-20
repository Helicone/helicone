/* eslint-disable @next/next/no-img-element */

import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useRouter } from "next/router";
import { memo, useMemo, useRef, useState, useEffect } from "react";
import { useAlertBanners, useChangelog } from "../../../services/hooks/admin";
import UpgradeProModal from "../../shared/upgradeProModal";
import { Row } from "../common";
import MetaData from "../public/authMetaData";
import DemoModal from "./DemoModal";
import MainContent, { BannerType } from "./MainContent";
import Sidebar from "./Sidebar";
import { OnboardingBackground, OnboardingProvider } from "../onboardingContext";
import { useOrg } from "../org/organizationContext";
import { Rocket } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

// Memoize the sidebar component to prevent unnecessary re-renders
const MemoizedSidebar = memo(Sidebar);

const AuthLayout = (props: AuthLayoutProps) => {
  const { children } = props;
  const router = useRouter();
  const { pathname, asPath } = router;

  // State for upgrade modal
  const [open, setOpen] = useState(false);

  // Force re-render on route change
  const [key, setKey] = useState(asPath);

  // Update key when path changes to force re-render
  useEffect(() => {
    setKey(asPath);
  }, [asPath]);

  // Fetch data with SWR's caching to prevent refetching on each navigation
  const { alertBanners } = useAlertBanners();
  const { changelog } = useChangelog();
  const orgContext = useOrg();

  const sidebarRef = useRef<HTMLDivElement>(null);

  // Process changelog data once and memoize it
  const processedChangelog = useMemo(() => {
    return changelog
      ? changelog.slice(0, 2).map((item) => ({
          title: item.title || "",
          image: item.enclosure,
          description: item.description || "",
          link: item.link || "",
          content: item.content || "",
          "content:encoded": item["content:encoded"] || "",
          "content:encodedSnippet": item["content:encodedSnippet"] || "",
          contentSnippet: item.contentSnippet || "",
          isoDate: item.isoDate || "",
          pubDate: item.pubDate || "",
        }))
      : [];
  }, [changelog]);

  // Calculate banner once when data changes
  const banner = useMemo((): BannerType | null => {
    const activeBanner = alertBanners?.data?.find((x) => x.active);
    if (activeBanner) {
      return {
        message: activeBanner.message,
        title: activeBanner.title || "",
        active: activeBanner.active,
        created_at: activeBanner.created_at,
        id: activeBanner.id.toString(),
        updated_at: activeBanner.updated_at,
      } as BannerType;
    }
    if (orgContext?.currentOrg?.tier === "demo") {
      return {
        message: (
          <div className="flex items-center gap-2">
            Click here to start integrating your organization
            <Rocket className="h-6 w-6" />
          </div>
        ),
        title: "Welcome to Your Demo",
        active: true,
        onClick: () => {
          orgContext.allOrgs.forEach((org) => {
            if (org.is_main_org === true) {
              orgContext.setCurrentOrg(org.id);
              router.push("/onboarding");
            }
          });
        },
      } as BannerType;
    }
    return null;
  }, [
    alertBanners?.data,
    orgContext?.currentOrg?.tier,
    orgContext?.allOrgs,
    router,
  ]);

  // Calculate page title once when pathname changes
  const currentPage = useMemo(() => {
    const path = pathname.split("/")[1];
    return path.charAt(0).toUpperCase() + path.slice(1);
  }, [pathname]);

  return (
    <MetaData title={currentPage}>
      <div>
        <DemoModal />
        <OnboardingProvider sidebarRef={sidebarRef}>
          <Row className="flex-col md:flex-row">
            <div className="w-full md:w-min">
              <MemoizedSidebar
                sidebarRef={sidebarRef}
                changelog={processedChangelog}
                setOpen={setOpen}
              />
            </div>
            <div className="flex-grow max-w-full overflow-hidden relative">
              <OnboardingBackground />
              <MainContent key={key} banner={banner} pathname={pathname}>
                <ErrorBoundary>{children}</ErrorBoundary>
              </MainContent>
            </div>
          </Row>
        </OnboardingProvider>
      </div>

      <UpgradeProModal open={open} setOpen={setOpen} />
      {/* <AcceptTermsModal /> */}
    </MetaData>
  );
};

export default AuthLayout;
