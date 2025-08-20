/* eslint-disable @next/next/no-img-element */
import {
  ArchiveIcon,
  DatabaseIcon,
  Home,
  ListTreeIcon,
  ScrollTextIcon,
  SheetIcon,
  ShieldCheckIcon,
  TagIcon,
  TestTube2,
  UsersIcon,
  Code2Icon,
} from "lucide-react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useMemo } from "react";
import DesktopSidebar from "./DesktopSidebar";
import { ChangelogItem, NavigationItem } from "./types";
import { useOrg } from "../org/organizationContext";
import { useFeatureFlag } from "@/services/hooks/admin";

interface SidebarProps {
  setOpen: (open: boolean) => void;
  changelog: ChangelogItem[];
  sidebarRef: React.RefObject<HTMLDivElement>;
}

const Sidebar = ({ changelog, setOpen, sidebarRef }: SidebarProps) => {
  const router = useRouter();
  const { pathname } = router;
  const org = useOrg();
  const { data: hasFeatureFlag } = useFeatureFlag(
    "ai_gateway",
    org?.currentOrg?.id ?? "",
  );
  const { data: hasHQLFeatureFlag } = useFeatureFlag(
    "hql",
    org?.currentOrg?.id ?? "",
  );

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
        name: "Alerts",
        href: "/alerts",
        icon: ExclamationTriangleIcon,
        current: pathname.includes("/alerts"),
      },
      ...(hasHQLFeatureFlag?.data
        ? [
            {
              name: "HQL",
              href: "/hql",
              icon: Code2Icon,
              current: pathname.includes("/hql"),
            },
          ]
        : []),
    ],
    [pathname, hasFeatureFlag?.data, hasHQLFeatureFlag?.data],
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
