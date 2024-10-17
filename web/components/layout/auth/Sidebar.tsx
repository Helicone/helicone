/* eslint-disable @next/next/no-img-element */

import {
  ArchiveBoxIcon,
  BeakerIcon,
  BellIcon,
  CircleStackIcon,
  HomeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TableCellsIcon,
  TagIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useMemo } from "react";
import DesktopSidebar, { NavigationItem } from "./DesktopSidebar";

import { PiGraphLight } from "react-icons/pi";
import { useOrg } from "../organizationContext";
import { NotepadText, TestTube2, Webhook } from "lucide-react";
import { Enclosure } from "rss-parser";

export interface ChangelogItem {
  title: string;
  description: string;
  link: string;
  content: string;
  "content:encoded": string;
  "content:encodedSnippet": string;
  contentSnippet: string;
  isoDate: string;
  pubDate: string;
  image?: Enclosure;
}
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
        name: "Segments",
        href: "/segments",
        icon: null,
        current: false,
        subItems: [
          {
            name: "Sessions",
            href: "/sessions",
            icon: PiGraphLight,
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

          ...(!user?.email?.includes("@helicone.ai")
            ? []
            : [
                {
                  name: "Experiments",
                  href: "/experiments",
                  icon: BeakerIcon,
                  current: pathname.includes("/experiments"),
                },
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
            icon: CircleStackIcon,
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
            icon: ArchiveBoxIcon,
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
                  name: "Webhooks",
                  href: "/webhooks",
                  icon: Webhook,
                  current: pathname.includes("/webhooks"),
                },
                {
                  name: "Vault",
                  href: "/vault",
                  icon: LockClosedIcon,
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
