/* eslint-disable @next/next/no-img-element */

import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { useAlertBanners, useChangelog } from "../../../services/hooks/admin";
import UpgradeProModal from "../../shared/upgradeProModal";
import { Row } from "../common";
import { useOrg } from "../org/organizationContext";
import MetaData from "../public/authMetaData";
import DemoModal from "./DemoModal";
import MainContent from "./MainContent";
import Sidebar from "./Sidebar";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = (props: AuthLayoutProps) => {
  const { children } = props;
  const router = useRouter();
  const { pathname } = router;
  const org = useOrg();

  const [open, setOpen] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const currentPage = useMemo(() => {
    const path = pathname.split("/")[1];
    return path.charAt(0).toUpperCase() + path.slice(1);
  }, [pathname]);

  const { alertBanners, isAlertBannersLoading, refetch } = useAlertBanners();

  const banner = useMemo(
    () => alertBanners?.data?.find((x) => x.active),
    [alertBanners]
  );

  const { changelog, isLoading: isChangelogLoading } = useChangelog();

  return (
    <MetaData
      title={`${currentPage} ${
        org?.currentOrg?.name ? `- ${org.currentOrg.name}` : ""
      }`}
    >
      <div>
        <DemoModal />
        <Row className="flex-col md:flex-row">
          <div className=" w-full md:w-min ">
            <Sidebar
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
          <div className="flex-grow max-w-full overflow-hidden">
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
