import { useCallback } from "react";
import {
  BarChart,
  Ticket,
  Users,
  Settings,
  MessageCircle,
  Zap,
  Wallet,
  Bell,
  Database,
  ChevronLeft,
  User,
  DollarSign,
} from "lucide-react";
import { useRouter } from "next/router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navigation = [
  {
    group: "Analytics",
    items: [
      { name: "HQL", href: "/admin/hql", icon: Zap },
      { name: "Org Search", href: "/admin/org-search", icon: Users },
      { name: "User Search", href: "/admin/user-search", icon: User },
      { name: "Top Orgs", href: "/admin/top-orgs", icon: BarChart },
      { name: "Metrics", href: "/admin/metrics", icon: BarChart },
    ],
  },
  {
    group: "Configuration",
    items: [
      { name: "Banners", href: "/admin/banners", icon: Bell },
      { name: "Backfill", href: "/admin/backfill", icon: Database },
      { name: "Admin Settings", href: "/admin/settings", icon: Settings },
      { name: "On Prem", href: "/admin/on-prem", icon: Ticket },
    ],
  },
  {
    group: "Business",
    items: [
      { name: "Pricing Analytics", href: "/admin/pricing-analytics", icon: DollarSign },
      { name: "Wallet", href: "/admin/wallet", icon: Wallet },
      {
        name: "Stripe Projections",
        href: "/admin/projections",
        icon: BarChart,
      },
      { name: "Governance", href: "/admin/governance-orgs", icon: Users },
      {
        name: "Helix Threads",
        href: "/admin/helix-threads",
        icon: MessageCircle,
      },
    ],
  },
];

export function AdminSidebar() {
  const router = useRouter();
  const { pathname } = router;
  const { toggleSidebar, state } = useSidebar();

  const isCurrentPage = useCallback(
    (href: string) => {
      return pathname === href;
    },
    [pathname],
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-16 flex-row items-center border-b border-slate-200 px-2 dark:border-slate-800">
        <div className="flex w-full items-center justify-between">
          <span className="text-sm font-semibold text-foreground group-data-[collapsible=icon]:hidden">
            Admin
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 shrink-0 hover:bg-slate-200 group-data-[collapsible=icon]:mx-auto dark:hover:bg-slate-800"
          >
            <ChevronLeft
              size={16}
              className={state === "collapsed" ? "rotate-180" : ""}
            />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {navigation.map((group) => (
          <SidebarGroup key={group.group} className="px-2 py-2">
            <SidebarGroupLabel className="px-2 text-[11px] font-normal text-slate-400">
              {group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isCurrentPage(item.href)}
                      tooltip={item.name}
                      size="sm"
                      className="h-8 text-xs font-normal text-slate-500 hover:bg-slate-200 hover:text-slate-900 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 dark:hover:bg-slate-700 dark:hover:text-slate-100 dark:data-[active=true]:bg-blue-900/50 dark:data-[active=true]:text-blue-300"
                    >
                      <a href={item.href} className="flex items-center gap-2">
                        <item.icon
                          size={14}
                          className="shrink-0 text-slate-500 data-[active=true]:text-blue-700 dark:data-[active=true]:text-blue-300"
                        />
                        <span>{item.name}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
