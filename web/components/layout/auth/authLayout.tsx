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
import { HeliconeAgentProvider } from "@/components/templates/agent/HeliconeAgentContext";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import AgentChat from "@/components/templates/agent/agentChat";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = (props: AuthLayoutProps) => {
  const { children } = props;
  const router = useRouter();
  const { pathname } = router;

  const [open, setOpen] = useState(false);
  const [chatWindowOpen, setChatWindowOpen] = useState(false);
  const agentChatPanelRef = useRef<any>(null);

  const auth = useHeliconeAuthClient();

  const handleResizableHandleDoubleClick = () => {
    if (agentChatPanelRef.current) {
      // Reset the agent chat panel to its default size (35)
      agentChatPanelRef.current.resize(35);
    }
  };

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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await auth.getUser();
        // Avoid redirecting while the auth client is still initializing
        if (user.error === "Supabase client not found") {
          return;
        }
        if (user.error || !user.data) {
          router.push("/signin?unauthorized=true");
        }
      } catch (error) {
        logger.error({ error }, "Authentication error");
        router.push("/signin?unauthorized=true");
      }
    };

    checkAuth();
  }, [router, auth]);

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
    // Allow access to certain pages during onboarding (like quickstart and settings for setup)
    const allowedPagesDuringOnboarding = [
      '/quickstart',
      '/settings/providers',
      '/settings/billing',
      '/credits',
    ];

    const isOnAllowedPage = allowedPagesDuringOnboarding.some(path =>
      pathname.startsWith(path)
    );

    if (orgContext?.currentOrg?.has_onboarded === false && !isOnAllowedPage) {
      router.push("/onboarding");
    }
  }, [orgContext?.currentOrg?.has_onboarded, pathname]);

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
    <HeliconeAgentProvider
      agentChatOpen={chatWindowOpen}
      setAgentChatOpen={setChatWindowOpen}
    >
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
              <ResizablePanelGroup
                direction="horizontal"
                className="h-full max-h-screen w-full"
              >
                <ResizablePanel
                  defaultSize={chatWindowOpen ? 65 : 100}
                  minSize={30}
                  className="relative h-full"
                >
                  <MainContent banner={banner} pathname={pathname}>
                    <ErrorBoundary>{children}</ErrorBoundary>
                  </MainContent>
                </ResizablePanel>

                {chatWindowOpen && (
                  <>
                    <ResizableHandle
                      withHandle
                      onDoubleClick={handleResizableHandleDoubleClick}
                    />
                    <ResizablePanel
                      ref={agentChatPanelRef}
                      defaultSize={35}
                      minSize={20}
                      maxSize={50}
                      collapsible={true}
                      collapsedSize={0}
                      onCollapse={() => setChatWindowOpen(false)}
                      className="h-full max-h-screen border-l border-border bg-background"
                    >
                      <AgentChat onClose={() => setChatWindowOpen(false)} />
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </div>
          </Row>
        </div>

        <UpgradeProModal open={open} setOpen={setOpen} />
        {/* <AcceptTermsModal /> */}
      </MetaData>
    </HeliconeAgentProvider>
  );
};

// export default AuthLayout;

export default AuthLayout;
