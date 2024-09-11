/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { useOrg } from "../organizationContext";

import UpgradeProModal from "../../shared/upgradeProModal";

import { useAlertBanners } from "../../../services/hooks/admin";
import ReferralModal from "../../shared/referralModal";
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
  const tier = org?.currentOrg?.tier;
  const [referOpen, setReferOpen] = useState(false);
  const [open, setOpen] = useState(false);

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

        <Sidebar
          tier={tier ?? ""}
          setReferOpen={setReferOpen}
          setOpen={setOpen}
        />

        <MainContent banner={banner} pathname={pathname}>
          {children}
        </MainContent>
      </div>
      <ReferralModal open={referOpen} setOpen={setReferOpen} />
      <UpgradeProModal open={open} setOpen={setOpen} />
    </MetaData>
  );
};

export default AuthLayout;
