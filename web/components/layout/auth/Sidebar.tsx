/* eslint-disable @next/next/no-img-element */

import {
  ArchiveBoxIcon,
  BeakerIcon,
  BellIcon,
  ChartBarIcon,
  ChartPieIcon,
  CircleStackIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  HomeIcon,
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
        name: "Developer",
        href: "/developer",
        icon: CodeBracketIcon,
        current: pathname.includes("/developer"),
      },
      {
        name: "Settings",
        href: "/settings",
        icon: Cog6ToothIcon,
        current: false,
        subItems: [
          {
            name: "Overview",
            href: "/analytics/overview",
            icon: ChartPieIcon,
            current: false,
          },
          {
            name: "Detailed Reports",
            href: "/analytics/reports",
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
