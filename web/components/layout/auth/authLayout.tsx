/* eslint-disable @next/next/no-img-element */

import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useRouter } from "next/router";
import { useMemo, useRef, useState } from "react";
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

const AuthLayout = (props: AuthLayoutProps) => {
  const { children } = props;
  const router = useRouter();
  const { pathname } = router;

  const [open, setOpen] = useState(false);

  const currentPage = useMemo(() => {
    const path = pathname.split("/")[1];
    return path.charAt(0).toUpperCase() + path.slice(1);
  }, [pathname]);

  const { alertBanners } = useAlertBanners();
  const org = useOrg();

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
    if (org?.currentOrg?.tier === "demo") {
      return {
        message: (
          <div className="flex items-center gap-2">
            Click here to start integrating <Rocket className="h-6 w-6" />
          </div>
        ),
        title: "Welcome to Your Demo",
        active: true,
        onClick: () => router.push("/onboarding"),
      } as BannerType;
    }
    return null;
  }, [alertBanners?.data, org?.currentOrg?.tier, router]);

  const { changelog, isLoading: isChangelogLoading } = useChangelog();

  const sidebarRef = useRef<HTMLDivElement>(null);

  return (
    <MetaData title={currentPage}>
      <div>
        <DemoModal />
        <OnboardingProvider sidebarRef={sidebarRef}>
          <Row className="flex-col md:flex-row">
            <div className=" w-full md:w-min ">
              <Sidebar
                sidebarRef={sidebarRef}
                changelog={
                  changelog
                    ? changelog.slice(0, 2).map((item) => ({
                        title: item.title || "",
                        image: item.enclosure,
                        description: item.description || "",
                        link: item.link || "",
                        content: item.content || "",
                        "content:encoded": item["content:encoded"] || "",
                        "content:encodedSnippet":
                          item["content:encodedSnippet"] || "",
                        contentSnippet: item.contentSnippet || "",
                        isoDate: item.isoDate || "",
                        pubDate: item.pubDate || "",
                      }))
                    : []
                }
                setOpen={setOpen}
              />
            </div>
            <div className="flex-grow max-w-full overflow-hidden relative">
              <OnboardingBackground />
              <MainContent banner={banner} pathname={pathname}>
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
