/* eslint-disable @next/next/no-img-element */
import {
  ArchiveIcon,
  BellIcon,
  ChartLineIcon,
  DatabaseIcon,
  FlaskConicalIcon,
  Home,
  ListTreeIcon,
  ScrollTextIcon,
  SheetIcon,
  ShieldCheckIcon,
  TagIcon,
  TestTube2,
  UsersIcon,
  Webhook,
} from "lucide-react";
import { useRouter } from "next/router";
import { useMemo } from "react";
import DesktopSidebar from "./DesktopSidebar";
import { ChangelogItem, NavigationItem } from "./types";

interface SidebarProps {
  setOpen: (open: boolean) => void;
  changelog: ChangelogItem[];
  sidebarRef: React.RefObject<HTMLDivElement>;
}

const Sidebar = ({ changelog, setOpen, sidebarRef }: SidebarProps) => {
  const router = useRouter();
  const { pathname } = router;

  const NAVIGATION: NavigationItem[] = useMemo(
    () => [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: Home,
        current: pathname.includes("/dashboard"),
      },
      {
        name: "Requests",
        href: "/requests",
        icon: SheetIcon,
        current: pathname.includes("/requests"),
      },

      {
        name: "Segments",
        href: "/segments",
        icon: null,
        current: false,
        subItems: [
          {
            name: "Sessions",
            href: "/sessions",
            icon: ListTreeIcon,
            current: pathname.includes("/sessions"),
          },
          {
            name: "Properties",
            href: "/properties",
            icon: TagIcon,
            current: pathname.includes("/properties"),
          },

          {
            name: "Users",
            href: "/users",
            icon: UsersIcon,
            current: pathname.includes("/users"),
          },
        ],
      },
      {
        name: "Improve",
        href: "/improve",
        icon: null,
        current: false,
        subItems: [
          {
            name: "Prompts",
            href: "/prompts",
            icon: ScrollTextIcon,
            current: pathname.includes("/prompts"),
          },
          {
            name: "Experiments",
            href: "/experiments",
            icon: FlaskConicalIcon,
            current: pathname.includes("/experiments"),
          },
          {
            name: "Evaluators",
            href: "/evaluators",
            icon: ChartLineIcon,
            current: pathname.includes("/evaluators"),
          },
          {
            name: "Datasets",
            href: "/datasets",
            icon: DatabaseIcon,
            current: pathname.includes("/datasets"),
          },
          {
            name: "Playground",
            href: "/playground",
            icon: TestTube2,
            current: pathname.includes("/playground"),
          },
        ],
      },

      {
        name: "Developer",
        href: "/developer",
        icon: null,
        current: pathname.includes("/developer"),
        subItems: [
          {
            name: "Cache",
            href: "/cache",
            icon: ArchiveIcon,
            current: pathname.includes("/cache"),
          },
          {
            name: "Rate Limits",
            href: "/rate-limit",
            icon: ShieldCheckIcon,
            current: pathname === "/rate-limit",
          },
          {
            name: "Alerts",
            href: "/alerts",
            icon: BellIcon,
            current: pathname.includes("/alerts"),
          },
          {
            name: "Webhooks",
            href: "/webhooks",
            icon: Webhook,
            current: pathname.includes("/webhooks"),
          },
          // {
          //   name: "Providers",
          //   href: "/providers",
          //   icon: ServerIcon,
          //   current: pathname.includes("/providers"),
          // },
          // {
          //   name: "Vault",
          //   href: "/vault",
          //   icon: LockIcon,
          //   current: pathname.includes("/vault"),
          // },
        ],
      },
    ],
    [pathname]
  );

  return (
    <DesktopSidebar
      sidebarRef={sidebarRef}
      changelog={changelog}
      NAVIGATION={NAVIGATION}
      setOpen={setOpen}
    />
  );
};

export default Sidebar;
