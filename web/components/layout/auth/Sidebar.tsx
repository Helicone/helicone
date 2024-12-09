/* eslint-disable @next/next/no-img-element */

import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useMemo } from "react";
import DesktopSidebar from "./DesktopSidebar";
import { ChangelogItem, NavigationItem } from "./types";

import { useOrg } from "../org/organizationContext";
import {
  ArchiveIcon,
  BellIcon,
  DatabaseIcon,
  FlaskConicalIcon,
  Home,
  ListTreeIcon,
  LockIcon,
  NotepadText,
  SheetIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TagIcon,
  TestTube2,
  UsersIcon,
  Webhook,
} from "lucide-react";

interface SidebarProps {
  setOpen: (open: boolean) => void;
  changelog: ChangelogItem[];
}

const Sidebar = ({ changelog, setOpen }: SidebarProps) => {
  const router = useRouter();
  const { pathname } = router;
  const user = useUser();
  const org = useOrg();
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
            icon: NotepadText,
            current: pathname.includes("/prompts"),
          },
          {
            name: "Playground",
            href: "/playground",
            icon: TestTube2,
            current: pathname.includes("/playground"),
          },
          {
            name: "Experiments",
            href: "/experiments",
            icon: FlaskConicalIcon,
            current: pathname.includes("/experiments"),
          },
          ...(!user?.email?.includes("@helicone.ai") ||
          !!user?.email?.includes("@greptile")
            ? []
            : [
                {
                  name: "Evaluators",
                  href: "/evaluators",
                  icon: SparklesIcon,
                  current: pathname.includes("/evaluators"),
                },
              ]),
          {
            name: "Datasets",
            href: "/datasets",
            icon: DatabaseIcon,
            current: pathname.includes("/datasets"),
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
        ],
      },
      ...(org?.currentOrg?.tier === "enterprise"
        ? [
            {
              name: "Enterprise",
              href: "/enterprise",
              current: pathname.includes("/enterprise"),
              icon: null,
              subItems: [
                {
                  name: "Vault",
                  href: "/vault",
                  icon: LockIcon,
                  current: pathname.includes("/vault"),
                },
              ],
            },
          ]
        : []),
      // {
      //   name: "Settings",
      //   href: "/settings",
      //   icon: Cog6ToothIcon,
      //   current: false,
      //   subItems: [
      //     {
      //       name: "Organization",
      //       href: "/settings/organization",
      //       icon: null,
      //       current: false,
      //     },
      //     {
      //       name: "API Keys",
      //       href: "/settings/api-keys",
      //       icon: null,
      //       current: false,
      //     },
      //     ...(!user?.email?.includes("@helicone.ai")
      //       ? []
      //       : [
      //           {
      //             name: "Connections",
      //             href: "/settings/connections",
      //             icon: null,
      //             current: pathname.includes("/settings/connections"),
      //           },
      //         ]),
      //     {
      //       name: "Members",
      //       href: "/settings/members",
      //       icon: null,
      //       current: false,
      //     },
      //     {
      //       name: "Billing",
      //       href: "/settings/billing",
      //       icon: null,
      //       current: pathname.includes("/settings/billing"),
      //     },
      //   ],
      // },
    ],
    [pathname, user?.email]
  );

  return (
    <>
      {/* Remove this line */}
      {/* <MobileNavigation NAVIGATION={NAVIGATION} setOpen={setOpen} /> */}

      <DesktopSidebar
        changelog={changelog}
        NAVIGATION={NAVIGATION}
        setOpen={setOpen}
      />
    </>
  );
};

export default Sidebar;
