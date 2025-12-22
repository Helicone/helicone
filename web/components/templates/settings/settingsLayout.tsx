import { useOrg } from "@/components/layout/org/organizationContext";
import { cn } from "@/lib/utils";
import {
  BuildingOfficeIcon,
  CreditCardIcon,
  DocumentTextIcon,
  NoSymbolIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { KeyIcon, LinkIcon, Plug, Webhook, Lock, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import AuthHeader from "@/components/shared/authHeader";

const ORGANIZATION_TABS = [
  {
    id: "general",
    title: "General",
    icon: BuildingOfficeIcon,
    href: "/settings",
  },
  {
    id: "members",
    title: "Members",
    icon: UsersIcon,
    href: "/settings/members",
  },
  {
    id: "billing",
    title: "Billing",
    icon: CreditCardIcon,
    href: "/settings/billing",
  },
  {
    id: "sso",
    title: "SSO",
    icon: Shield,
    href: "/settings/sso",
  },
  {
    id: "reports",
    title: "Reports",
    icon: DocumentTextIcon,
    href: "/settings/reports",
  },
  {
    id: "rate-limits",
    title: "Rate Limits",
    icon: NoSymbolIcon,
    href: "/settings/rate-limits",
  },
];

const DEVELOPER_TABS = [
  {
    id: "api-keys",
    title: "API Keys",
    icon: KeyIcon,
    href: "/settings/api-keys",
  },
  {
    id: "providers",
    title: "Providers",
    icon: Plug,
    href: "/settings/providers",
  },
  {
    id: "webhooks",
    title: "Webhooks",
    icon: Webhook,
    href: "/settings/webhooks",
  },
  {
    id: "connections",
    title: "Connections",
    icon: LinkIcon,
    href: "/settings/connections",
  },
];

const ACCOUNTS_TABS = [
  {
    id: "password",
    title: "Password",
    icon: Lock,
    href: "/settings/password",
  },
];

interface SettingsLayoutProps {
  children: ReactNode;
}

const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  const router = useRouter();
  const currentPath = router.pathname;
  const org = useOrg();
  const isBetterAuthEnabled = process.env.NEXT_PUBLIC_BETTER_AUTH === "true";

  const organizationTabs = ORGANIZATION_TABS;

  const renderNavSection = (title: string, tabs: typeof ORGANIZATION_TABS) => (
    <div className="space-y-2">
      <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      <nav className="space-y-1">
        {tabs.map((tab) => {
          const isActive =
            currentPath === tab.href ||
            (tab.href === "/settings" && currentPath === "/settings");

          return (
            <Link key={tab.id} href={tab.href}>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors",
                  "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50",
                  isActive
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    : "text-slate-700 dark:text-slate-300",
                )}
              >
                <tab.icon
                  className={cn(
                    "h-3.5 w-3.5",
                    isActive
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-slate-500 dark:text-slate-400",
                  )}
                />
                <span className="flex items-center gap-1.5">{tab.title}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <AuthHeader isWithinIsland={true} title={""} />
      {org?.currentOrg?.tier !== "demo" && (
        <div className="-mt-6 flex h-full min-h-screen">
          {/* Settings Sidebar */}
          <div className="w-48 border-r border-slate-200 bg-slate-50/50 px-2 py-2 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="space-y-8">
              {renderNavSection("Organization", organizationTabs)}
              {renderNavSection("Developer", DEVELOPER_TABS)}
              {isBetterAuthEnabled &&
                renderNavSection("Accounts", ACCOUNTS_TABS)}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">{children}</div>
        </div>
      )}
    </>
  );
};

export default SettingsLayout;
