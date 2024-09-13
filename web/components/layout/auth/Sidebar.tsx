/* eslint-disable @next/next/no-img-element */

import {
  ArchiveBoxIcon,
  BeakerIcon,
  BellIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  ChartPieIcon,
  CircleStackIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  HomeIcon,
  KeyIcon,
  LightBulbIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TableCellsIcon,
  TagIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { GoRepoForked } from "react-icons/go";
import DesktopSidebar, { NavigationItem } from "./DesktopSidebar";

import { PiGraphLight } from "react-icons/pi";
import MobileNavigation from "./MobileNavigation";
import { useOrg } from "../organizationContext";

interface SidebarProps {
  tier: string;
  setReferOpen: (open: boolean) => void;
  setOpen: (open: boolean) => void;
}

const Sidebar = ({ tier, setReferOpen, setOpen }: SidebarProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { pathname } = router;
  const user = useUser();
  const org = useOrg();

  const NAVIGATION: NavigationItem[] = useMemo(
    () => [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: HomeIcon,
        current: pathname.includes("/dashboard"),
      },
      {
        name: "Traces",
        href: "/requests",
        icon: TableCellsIcon,
        current: pathname.includes("/requests"),
      },

      {
        name: "Segments",
        href: "/segments",
        icon: ChartPieIcon,
        current: false,
        subItems: [
          {
            name: "Sessions",
            href: "/sessions",
            icon: null,
            current: pathname.includes("/sessions"),
          },
          {
            name: "Properties",
            href: "/properties",
            icon: null,
            current: pathname.includes("/properties"),
          },

          {
            name: "Users",
            href: "/users",
            icon: null,
            current: pathname.includes("/users"),
          },
        ],
      },
      {
        name: "Improve",
        href: "/improve",
        icon: LightBulbIcon,
        current: false,
        subItems: [
          {
            name: "Playground",
            href: "/playground",
            icon: null,
            current: pathname.includes("/playground"),
          },
          {
            name: "Datasets",
            href: "/datasets",
            icon: null,
            current: pathname.includes("/datasets"),
          },
          {
            name: "Fine-Tune",
            href: "/fine-tune",
            icon: null,
            current: pathname.includes("/fine-tune"),
          },
          {
            name: "Prompts",
            href: "/prompts",
            icon: null,
            current: pathname.includes("/prompts"),
          },

          ...(!user?.email?.includes("@helicone.ai")
            ? []
            : [
                {
                  name: "Evals",
                  href: "/evals",
                  icon: null,
                  current: pathname.includes("/evals"),
                },
              ]),
        ],
      },

      {
        name: "Developer",
        href: "/developer",
        icon: CodeBracketIcon,
        current: pathname.includes("/developer"),
        subItems: [
          {
            name: "Cache",
            href: "/cache",
            icon: null,
            current: pathname.includes("/cache"),
          },
          {
            name: "Rate Limits",
            href: "/rate-limit",
            icon: null,
            current: pathname.includes("/rate-limit"),
          },
          {
            name: "Alerts",
            href: "/alerts",
            icon: null,
            current: pathname.includes("/alerts"),
          },
        ],
      },
      ...(org?.currentOrg?.tier === "enterprise"
        ? [
            {
              name: "Enterprise",
              href: "/enterprise",
              icon: BuildingLibraryIcon,
              current: pathname.includes("/enterprise"),
              subItems: [
                {
                  name: "Webhooks",
                  href: "/enterprise/webhooks",
                  icon: null,
                  current: false,
                },
                {
                  name: "Vault",
                  href: "/enterprise/vault",
                  icon: null,
                  current: false,
                },
              ],
            },
          ]
        : []),
      {
        name: "Settings",
        href: "/settings",
        icon: Cog6ToothIcon,
        current: false,
        subItems: [
          {
            name: "Organization",
            href: "/settings/organization",
            icon: null,
            current: false,
          },
          {
            name: "API Keys",
            href: "/settings/api-keys",
            icon: null,
            current: false,
          },
          ...(!user?.email?.includes("@helicone.ai")
            ? []
            : [
                {
                  name: "Connections",
                  href: "/settings/connections",
                  icon: null,
                  current: pathname.includes("/settings/connections"),
                },
              ]),
          {
            name: "Detailed Reports",
            href: "/settings/billing",
            icon: null,
            current: false,
          },
          {
            name: "Members",
            href: "/settings/members",
            icon: null,
            current: false,
          },
          {
            name: "Billing",
            href: "/settings/rate-limits",
            icon: null,
            current: false,
          },
        ],
      },
    ],
    [pathname, user?.email]
  );

  return (
    <>
      <MobileNavigation
        NAVIGATION={NAVIGATION}
        setReferOpen={setReferOpen}
        setOpen={setOpen}
      />

      <DesktopSidebar
        NAVIGATION={NAVIGATION}
        setReferOpen={setReferOpen}
        setOpen={setOpen}
      />
    </>
  );
};

export default Sidebar;
