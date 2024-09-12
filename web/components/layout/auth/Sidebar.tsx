/* eslint-disable @next/next/no-img-element */

import {
  ArchiveBoxIcon,
  BeakerIcon,
  BellIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  ChartPieIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  HomeIcon,
  KeyIcon,
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
import DesktopSidebar from "./DesktopSidebar";

import { PiGraphLight } from "react-icons/pi";
import MobileNavigation from "./MobileNavigation";

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

  const NAVIGATION = useMemo(
    () => [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: HomeIcon,
        current: pathname.includes("/dashboard"),
      },
      {
        name: "Requests",
        href: "/requests",
        icon: TableCellsIcon,
        current: pathname.includes("/requests"),
      },
      {
        name: "Datasets",
        href: "/datasets",
        icon: CircleStackIcon,
        current: pathname.includes("/datasets"),
      },
      ...(!user?.email?.includes("@helicone.ai")
        ? []
        : [
            {
              name: "Evals",
              href: "/evals",
              icon: ChartBarIcon,
              current: pathname.includes("/evals"),
            },
            {
              name: "Connections",
              href: "/connections",
              icon: GoRepoForked,
              current: pathname.includes("/connections"),
            },
          ]),
      {
        name: "Sessions",
        href: "/sessions",
        icon: PiGraphLight,
        current: pathname.includes("/sessions"),
      },
      {
        name: "Prompts",
        href: "/prompts",
        icon: DocumentTextIcon,
        current: pathname.includes("/prompts"),
      },
      {
        name: "Users",
        href: "/users",
        icon: UsersIcon,
        current: pathname.includes("/users"),
      },
      {
        name: "Alerts",
        href: "/alerts",
        icon: BellIcon,
        current: pathname.includes("/alerts"),
      },
      {
        name: "Fine-Tune",
        href: "/fine-tune",
        icon: SparklesIcon,
        current: pathname.includes("/fine-tune"),
      },
      {
        name: "Properties",
        href: "/properties",
        icon: TagIcon,
        current: pathname.includes("/properties"),
      },
      {
        name: "Cache",
        href: "/cache",
        icon: ArchiveBoxIcon,
        current: pathname.includes("/cache"),
      },
      {
        name: "Rate Limits",
        href: "/rate-limit",
        icon: ShieldCheckIcon,
        current: pathname.includes("/rate-limit"),
      },
      {
        name: "Playground",
        href: "/playground",
        icon: BeakerIcon,
        current: pathname.includes("/playground"),
      },
      {
        name: "Enterprise",
        href: "/enterprise",
        icon: BuildingLibraryIcon,
        current: pathname.includes("/enterprise"),
        subItems: [
          {
            name: "Webhooks",
            href: "/enterprise/webhooks",
            icon: GlobeAltIcon,
            current: false,
          },
          {
            name: "Vault",
            href: "/enterprise/vault",
            icon: LockClosedIcon,
            current: false,
          },
        ],
      },
      {
        name: "Settings",
        href: "/settings",
        icon: Cog6ToothIcon,
        current: false,
        subItems: [
          {
            name: "Organization",
            href: "/settings/organization",
            icon: ChartPieIcon,
            current: false,
          },
          {
            name: "API Keys",
            href: "/settings/api-keys",
            icon: KeyIcon,
            current: false,
          },
          {
            name: "Detailed Reports",
            href: "/settings/billing",
            icon: DocumentChartBarIcon,
            current: false,
          },
          {
            name: "Members",
            href: "/settings/members",
            icon: UsersIcon,
            current: false,
          },
          {
            name: "Billing",
            href: "/settings/rate-limits",
            icon: DocumentChartBarIcon,
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
