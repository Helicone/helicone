import AuthHeader from "@/components/shared/authHeader";
import { IslandContainer } from "@/components/ui/islandContainer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BuildingOfficeIcon,
  CreditCardIcon,
  DocumentTextIcon,
  NoSymbolIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Separator } from "@/components/ui/separator";
import { FingerprintIcon, KeyIcon, LinkIcon, LockIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useMemo } from "react";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useIsGovernanceEnabled } from "../organization/hooks";

const DEFAULT_TABS = [
  {
    id: "organization",
    title: "Organization",
    icon: BuildingOfficeIcon,
    href: "/settings",
  },
  {
    id: "members",
    title: "Members",
    icon: UserGroupIcon,
    href: "/settings/members",
  },
  {
    id: "billing",
    title: "Billing",
    icon: CreditCardIcon,
    href: "/settings/billing",
  },
  {
    id: "reports",
    title: "Reports",
    icon: DocumentTextIcon,
    href: "/settings/reports",
  },
  {
    id: "api-keys",
    title: "API Keys",
    icon: KeyIcon,
    href: "/settings/api-keys",
  },
  {
    id: "connections",
    title: "Connections",
    icon: LinkIcon,
    href: "/settings/connections",
  },

  {
    id: "rate-limits",
    title: "Rate Limits",
    icon: NoSymbolIcon,
    href: "/settings/rate-limits",
  },
];

interface SettingsLayoutProps {
  children: ReactNode;
}

const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  const router = useRouter();
  const currentPath = router.pathname;
  const org = useOrg();

  const isGovernanceEnabled = useIsGovernanceEnabled();

  const tabs = useMemo(() => {
    if (isGovernanceEnabled.data?.data?.data) {
      return DEFAULT_TABS.slice(0, 1)
        .concat([
          {
            id: "access-keys",
            title: "Access Keys",
            icon: FingerprintIcon,
            href: "/settings/access-keys",
          },
        ])
        .concat(DEFAULT_TABS.slice(1));
    }

    return DEFAULT_TABS;
  }, [isGovernanceEnabled.data?.data?.data]);

  return (
    <IslandContainer className="space-y-6 ">
      <AuthHeader isWithinIsland={true} title={"Settings"} />
      {org?.currentOrg?.tier !== "demo" && (
        <div className="flex flex-col space-y-8 items-start">
          <div className="flex flex-col space-y-2 items-start">
            <Tabs
              defaultValue={
                tabs.find((tab) => tab.href === currentPath)?.id || "general"
              }
              className=""
              orientation="vertical"
            >
              <TabsList className="flex flex-row h-full space-y-1">
                {tabs.map((tab) => (
                  <Link key={tab.id} href={tab.href} passHref>
                    <TabsTrigger
                      value={tab.id}
                      className="w-full justify-start"
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(tab.href);
                      }}
                    >
                      <tab.icon className="h-5 w-5 mr-2" />
                      {tab.title}
                    </TabsTrigger>
                  </Link>
                ))}
              </TabsList>
            </Tabs>
            <Separator />
          </div>

          <div className="flex-1 w-full">{children}</div>
        </div>
      )}
    </IslandContainer>
  );
};

export default SettingsLayout;
