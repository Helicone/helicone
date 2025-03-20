/* eslint-disable @next/next/no-img-element */

import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { memo, useMemo } from "react";
import DesktopSidebar from "./DesktopSidebar";
import { ChangelogItem, NavigationItem } from "./types";

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
import { useOrg } from "../org/organizationContext";

interface SidebarProps {
  setOpen: (open: boolean) => void;
  changelog: ChangelogItem[];
  sidebarRef: React.RefObject<HTMLDivElement>;
}

// Create the base navigation items outside of the component to avoid recreating them on every render
const BASE_NAVIGATION_ITEMS = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Requests",
    href: "/requests",
    icon: SheetIcon,
  },
  {
    name: "Segments",
    href: "/segments",
    icon: null,
    subItems: [
      {
        name: "Sessions",
        href: "/sessions",
        icon: ListTreeIcon,
      },
      {
        name: "Properties",
        href: "/properties",
        icon: TagIcon,
      },
      {
        name: "Users",
        href: "/users",
        icon: UsersIcon,
      },
    ],
  },
  {
    name: "Improve",
    href: "/improve",
    icon: null,
    subItems: [
      {
        name: "Prompts",
        href: "/prompts",
        icon: ScrollTextIcon,
        isNew: true,
      },
      {
        name: "Experiments",
        href: "/experiments",
        icon: FlaskConicalIcon,
      },
      {
        name: "Evaluators",
        href: "/evaluators",
        icon: ChartLineIcon,
      },
      {
        name: "Datasets",
        href: "/datasets",
        icon: DatabaseIcon,
      },
      {
        name: "Playground",
        href: "/prompts/fromPlayground",
        icon: TestTube2,
      },
    ],
  },
  {
    name: "Developer",
    href: "/developer",
    icon: null,
    subItems: [
      {
        name: "Cache",
        href: "/cache",
        icon: ArchiveIcon,
      },
      {
        name: "Rate Limits",
        href: "/rate-limit",
        icon: ShieldCheckIcon,
      },
      {
        name: "Alerts",
        href: "/alerts",
        icon: BellIcon,
      },
      {
        name: "Webhooks",
        href: "/webhooks",
        icon: Webhook,
      },
    ],
  },
];

const SidebarComponent = ({ changelog, setOpen, sidebarRef }: SidebarProps) => {
  const router = useRouter();
  const { pathname } = router;
  const user = useUser();
  const org = useOrg();

  // Only calculate the "current" property when the pathname changes
  const NAVIGATION: NavigationItem[] = useMemo(() => {
    return BASE_NAVIGATION_ITEMS.map((item) => {
      if (item.subItems) {
        return {
          ...item,
          current: item.subItems.some((subItem) =>
            pathname.includes(subItem.href)
          ),
          subItems: item.subItems.map((subItem) => ({
            ...subItem,
            current:
              pathname.includes(subItem.href) ||
              (subItem.href === "/rate-limit" && pathname === "/rate-limit"),
          })),
        };
      }
      return {
        ...item,
        current: pathname.includes(item.href),
      };
    });
  }, [pathname]);

  return (
    <DesktopSidebar
      sidebarRef={sidebarRef}
      changelog={changelog}
      NAVIGATION={NAVIGATION}
      setOpen={setOpen}
    />
  );
};

// Set display name for the memoized component
SidebarComponent.displayName = "SidebarComponent";

// Export the memoized component
const Sidebar = memo(SidebarComponent);
export default Sidebar;
