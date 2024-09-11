/* eslint-disable @next/next/no-img-element */

import {
  ArchiveBoxIcon,
  BeakerIcon,
  BellIcon,
  ChartBarIcon,
  CircleStackIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
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
import MobileSidebar from "./MobileSidebar";

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
        icon: () => (
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="fill-blue-500 dark:fill-blue-400"
          >
            <path
              d="M16.0313 9.70305H12.9095V6.89055C12.9095 5.90618 12.122 5.11868 11.1376 5.11868H8.3251V2.30618C8.3251 1.3218 7.5376 0.534302 6.55322 0.534302H2.27822C1.29385 0.534302 0.506348 1.3218 0.506348 2.30618V6.55305C0.506348 7.53743 1.29385 8.32493 2.27822 8.32493H5.09072V11.1374C5.09072 12.1218 5.87822 12.9093 6.8626 12.9093H9.6751V16.0312C9.6751 16.8468 10.3501 17.4937 11.1376 17.4937H16.0313C16.847 17.4937 17.4938 16.8187 17.4938 16.0312V11.1656C17.4938 10.3781 16.847 9.70305 16.0313 9.70305ZM2.27822 7.03118C1.99697 7.03118 1.77197 6.80618 1.77197 6.52493V2.27805C1.77197 1.9968 1.99697 1.7718 2.27822 1.7718H6.5251C6.80635 1.7718 7.03135 1.9968 7.03135 2.27805V5.09055H6.8626C5.87822 5.09055 5.09072 5.87805 5.09072 6.86243V7.03118H2.27822ZM6.8626 11.6437C6.58135 11.6437 6.35635 11.4187 6.35635 11.1374V6.86243C6.35635 6.58118 6.58135 6.35618 6.8626 6.35618H11.1095C11.3907 6.35618 11.6157 6.58118 11.6157 6.86243V9.67493H11.1657C10.3501 9.67493 9.70322 10.3499 9.70322 11.1374V11.5874H6.8626V11.6437ZM16.2563 16.0312C16.2563 16.1437 16.172 16.2562 16.0313 16.2562H11.1657C11.0532 16.2562 10.9407 16.1718 10.9407 16.0312V11.1656C10.9407 11.0531 11.0251 10.9406 11.1657 10.9406H16.0313C16.1438 10.9406 16.2563 11.0249 16.2563 11.1656V16.0312Z"
              fill="#111928"
            />
          </svg>
        ),
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
        current: pathname.includes("/settings"),
      },
    ],
    [pathname, user?.email]
  );

  return (
    <>
      <MobileSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        NAVIGATION={NAVIGATION}
        tier={tier ?? ""}
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
