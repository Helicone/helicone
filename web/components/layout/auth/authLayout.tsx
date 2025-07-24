/* eslint-disable @next/next/no-img-element */

import { ErrorBoundary } from "@/components/ui/error-boundary";
import { $JAWN_API } from "@/lib/clients/jawn";
import { Rocket } from "lucide-react";
import { useRouter } from "next/router";
import { useMemo, useRef, useState, useEffect } from "react";
import { useChangelog } from "../../../services/hooks/admin";
import UpgradeProModal from "../../shared/upgradeProModal";
import { Row } from "../common";
import { useOrg } from "../org/organizationContext";
import MetaData from "../public/authMetaData";
import DemoModal from "./DemoModal";
import MainContent, { BannerType } from "./MainContent";
import Sidebar from "./Sidebar";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = (props: AuthLayoutProps) => {
  const { children } = props;
  const router = useRouter();
  const { pathname } = router;

  const [open, setOpen] = useState(false);

  const auth = useHeliconeAuthClient();
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await auth.getUser();
        if (user.error || !user.data) {
          router.push("/signin?unauthorized=true");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        router.push("/signin?unauthorized=true");
      }
    };

    checkAuth();
  }, [router]);

  const currentPage = useMemo(() => {
    const path = pathname.split("/")[1];
    return path.charAt(0).toUpperCase() + path.slice(1);
  }, [pathname]);

  const { data: alertBanners } = $JAWN_API.useQuery(
    "get",
    "/v1/alert-banner",
    {},
  );
  const orgContext = useOrg();

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
  }, [alertBanners?.data, orgContext, router]);

  const { changelog, isLoading: isChangelogLoading } = useChangelog();

  const sidebarRef = useRef<HTMLDivElement>(null);

  return (
    <MetaData title={currentPage}>
      <div>
        <DemoModal />

        <Row className="flex-col md:flex-row">
          <div className="w-full md:w-min">
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
          <div
            className="relative max-w-full flex-grow overflow-hidden"
            key={orgContext?.currentOrg?.id}
          >
            <MainContent banner={banner} pathname={pathname}>
              <ErrorBoundary>{children}</ErrorBoundary>
            </MainContent>
          </div>
        </Row>
      </div>

      <UpgradeProModal open={open} setOpen={setOpen} />
      {/* <AcceptTermsModal /> */}
    </MetaData>
  );
};

export default AuthLayout;
