import { Fragment, useCallback, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  Home,
  Menu,
  X,
  BarChart,
  Ticket,
  Box,
  Building,
  Flag,
  Users,
  Settings,
  ArrowLeftRight,
} from "lucide-react";
import { clsx } from "../../shared/clsx";
import { useRouter } from "next/router";
import { useOrg } from "../org/organizationContext";
import MetaData from "../public/authMetaData";
import { H3, P, Muted } from "@/components/ui/typography";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Separator } from "@/components/ui/separator";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.FC<{ className?: string }>;
}

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/admin", icon: Home },
      { name: "Metrics", href: "/admin/metrics", icon: BarChart },
    ],
  },
  {
    title: "Organizations",
    items: [
      { name: "All Orgs", href: "/admin/stats", icon: Building },
      { name: "Top Orgs", href: "/admin/top-orgs", icon: BarChart },
      { name: "Org Analytics", href: "/admin/org-analytics", icon: Box },
    ],
  },
  {
    title: "Administration",
    items: [
      { name: "Feature Flags", href: "/admin/feature-flags", icon: Flag },
      { name: "On Prem", href: "/admin/on-prem", icon: Ticket },
    ],
  },
];

export default function AdminLayout(props: { children: React.ReactNode }) {
  const { children } = props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const org = useOrg();
  const { pathname } = router;
  const currentPage =
    pathname.split("/")[1].charAt(0).toUpperCase() +
    pathname.split("/")[1].substring(1);

  const isCurrentPage = useCallback(
    (href: string) => {
      return pathname === href;
    },
    [pathname]
  );

  const renderNavigationItems = (items: NavigationItem[]) => (
    <ul role="list" className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.name}>
          <a
            href={item.href}
            className={clsx(
              isCurrentPage(item.href)
                ? "bg-sidebar-accent text-sidebar-foreground font-medium border-l-2 border-primary"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              "group flex gap-x-3 rounded-md py-2 px-3 text-sm leading-6"
            )}
          >
            <item.icon
              className={clsx(
                "h-5 w-5 shrink-0",
                isCurrentPage(item.href)
                  ? "text-primary"
                  : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70"
              )}
              aria-hidden="true"
            />
            {item.name}
          </a>
        </li>
      ))}
    </ul>
  );

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-1">
            <ArrowLeftRight className="h-6 w-6 text-primary" />
          </div>
          <H3>Helicone Admin</H3>
        </div>
        <ThemeToggle />
      </div>

      <Separator className="my-2" />

      <nav className="flex flex-1 flex-col px-2">
        {navigationGroups.map((group, index) => (
          <div key={group.title} className="py-2">
            <Muted className="px-3 text-xs font-medium uppercase tracking-wider mb-2">
              {group.title}
            </Muted>
            {renderNavigationItems(group.items)}
            {index < navigationGroups.length - 1 && (
              <Separator className="my-4 opacity-30" />
            )}
          </div>
        ))}
      </nav>

      <div className="mt-auto px-2 py-4">
        <Separator className="mb-4" />
        <a
          href="/admin/settings"
          className="flex items-center gap-3 rounded-md py-2 px-3 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <Settings className="h-5 w-5 text-sidebar-foreground/50" />
          <span>Admin Settings</span>
        </a>
        <Muted className="mt-4 px-3 text-xs">Helicone Admin v1.0.0</Muted>
      </div>
    </>
  );

  return (
    <MetaData title={`${currentPage} ${"- " + (org?.currentOrg?.name || "")}`}>
      <div className="text-foreground">
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-sidebar-background/80" />
            </Transition.Child>

            <div className="fixed inset-0 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute right-0 top-0 -mr-12 pt-5">
                      <button
                        type="button"
                        className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="sr-only">Close sidebar</span>
                        <X
                          className="h-6 w-6 text-foreground"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </Transition.Child>
                  {/* Sidebar component, swap this element with another sidebar if you like */}
                  <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar-background px-3 pb-2 ring-1 ring-sidebar-border">
                    {sidebarContent}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex grow flex-col overflow-y-auto border-r border-sidebar-border/30 bg-sidebar-background">
            {sidebarContent}
          </div>
        </div>

        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-sidebar-border bg-sidebar-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-sidebar-foreground/70 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-1">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-semibold leading-6 text-sidebar-foreground">
                Helicone
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <main className="py-10 lg:pl-72 bg-background min-h-screen">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </MetaData>
  );
}
