import { useOrg } from "@/components/layout/org/organizationContext";
import { IslandContainer } from "@/components/ui/islandContainer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BuildingOfficeIcon,
  CreditCardIcon,
  DocumentTextIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";
import { FingerprintIcon, KeyIcon, LinkIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useMemo } from "react";
import { useIsGovernanceEnabled } from "../organization/hooks";
import AuthHeader from "@/components/shared/authHeader";

const DEFAULT_TABS = [
  {
    id: "organization",
    title: "Organization",
    icon: BuildingOfficeIcon,
    href: "/settings",
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
    <IslandContainer>
      <AuthHeader isWithinIsland={true} title={""} />
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
              <TabsList className="flex w-full overflow-x-auto p-1">
                {tabs.map((tab) => (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    passHref
                    legacyBehavior
                    className="hover:no-underline"
                  >
                    <TabsTrigger
                      value={tab.id}
                      className="px-4 py-2 text-sm gap-2"
                      asChild
                    >
                      <a href={tab.href} className="cursor-pointer">
                        <tab.icon className="h-5 w-5" />
                        {tab.title}
                      </a>
                    </TabsTrigger>
                  </Link>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 w-full">{children}</div>
        </div>
      )}
    </IslandContainer>
  );
};

export default SettingsLayout;
