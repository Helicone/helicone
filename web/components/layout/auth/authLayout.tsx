/* eslint-disable @next/next/no-img-element */

import { ErrorBoundary } from "@/components/ui/error-boundary";
import { $JAWN_API } from "@/lib/clients/jawn";
import { Rocket } from "lucide-react";
import { useRouter } from "next/router";
import { useMemo, useRef, useState, useEffect } from "react";
import { useChangelog } from "../../../services/hooks/admin";
import UpgradeProModal from "../../shared/upgradeProModal";
import { Row } from "../common";
import { logger } from "@/lib/telemetry/logger";
import { useOrg } from "../org/organizationContext";
import MetaData from "../public/authMetaData";
import DemoModal from "./DemoModal";
import MainContent, { BannerType } from "./MainContent";
import Sidebar from "./Sidebar";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import AgentChat from "@/components/templates/agent/agentChat";
import { HeliconeAgentProvider } from "@/components/templates/agent/HeliconeAgentContext";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = (props: AuthLayoutProps) => {
  const { children } = props;
  const router = useRouter();
  const { pathname } = router;

  const [open, setOpen] = useState(false);
  const [chatWindowOpen, setChatWindowOpen] = useState(true);
  const [chatWidth, setChatWidth] = useState(384); // 384px = 24rem = w-96
  const [isResizing, setIsResizing] = useState(false);

  const auth = useHeliconeAuthClient();

  // Handle Command+I keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "i") {
        event.preventDefault();
        setChatWindowOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Handle resize functionality
  useEffect(() => {
    if (!chatWindowOpen) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 300; // Minimum width
      const maxWidth = window.innerWidth * 0.8; // Maximum 80% of screen width

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setChatWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      // TODO: this is pretty ugly given this is a react app, figure out a better way to handle resizing
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, chatWindowOpen]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await auth.getUser();
        if (user.error || !user.data) {
          router.push("/signin?unauthorized=true");
        }
      } catch (error) {
        logger.error({ error }, "Authentication error");
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

  useEffect(() => {
    if (orgContext?.currentOrg?.has_onboarded === false) {
      router.push("/onboarding");
    } else if (orgContext?.currentOrg?.has_integrated === false) {
      router.push("/quickstart");
    }
  }, [orgContext?.currentOrg?.has_integrated]);

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

  const { changelog } = useChangelog();

  const sidebarRef = useRef<HTMLDivElement>(null);

  return (
    <HeliconeAgentProvider>
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

          {/* Floating Resizable Chat Window */}
          {chatWindowOpen && (
            <div
              className="fixed right-0 top-0 z-50 h-full border-l border-border bg-background transition-transform duration-300 ease-in-out"
              style={{ width: `${chatWidth}px` }}
            >
              {/* Resize Handle */}
              <div
                className="absolute left-0 top-0 h-full w-0.5 cursor-col-resize select-none bg-border transition-colors hover:bg-primary"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsResizing(true);
                }}
              />

              <AgentChat onClose={() => setChatWindowOpen(false)} />
            </div>
          )}
        </div>

        <UpgradeProModal open={open} setOpen={setOpen} />
        {/* <AcceptTermsModal /> */}
      </MetaData>
    </HeliconeAgentProvider>
  );
};

export default AuthLayout;
