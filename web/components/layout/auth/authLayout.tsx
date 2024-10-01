/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { useAlertBanners } from "../../../services/hooks/admin";
import UpgradeProModal from "../../shared/upgradeProModal";
import { Row } from "../common";
import { useOrg } from "../organizationContext";
import MetaData from "../public/authMetaData";
import AcceptTermsModal from "./AcceptTermsModal";
import DemoModal from "./DemoModal";
import MainContent from "./MainContent";
import Sidebar from "./Sidebar";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
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
            <Sidebar setOpen={setOpen} />
          </div>
          <div className="flex-grow max-w-full overflow-hidden">
            <MainContent banner={banner} pathname={pathname}>
              {children}
            </MainContent>
          </div>
        </Row>
      </div>

      <UpgradeProModal open={open} setOpen={setOpen} />
      <AcceptTermsModal />
    </MetaData>
  );
};

export default AuthLayout;
