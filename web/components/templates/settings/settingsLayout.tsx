import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BuildingOfficeIcon,
  CreditCardIcon,
  NoSymbolIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Divider } from "@tremor/react";
import { LinkIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";

const tabs = [
  {
    id: "organization",
    title: "Organization",
    icon: BuildingOfficeIcon,
    href: "/settings",
  },
  {
    id: "connections",
    title: "Connections",
    icon: LinkIcon,
    href: "/settings/connections",
  },
  {
    id: "billing",
    title: "Billing",
    icon: CreditCardIcon,
    href: "/settings/billing",
  },
  {
    id: "members",
    title: "Members",
    icon: UserGroupIcon,
    href: "/settings/members",
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

  return (
    <div className="space-y-6">
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
          <Divider />
        </div>

        <div className="flex-1 w-full">{children}</div>
      </div>
    </div>
  );
};

export default SettingsLayout;
