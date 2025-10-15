import { useCallback } from "react";
import {
  BarChart,
  Ticket,
  Flag,
  Users,
  Settings,
  MessageCircle,
  Zap,
  Wallet,
  Bell,
  Database,
  Building2,
  Box,
} from "lucide-react";
import { useRouter } from "next/router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const navigation = [
  {
    group: "Navigation",
    items: [
      { name: "HQL", href: "/admin/hql", icon: Zap },
      { name: "Org Search", href: "/admin/org-search", icon: Users },
      { name: "Top Orgs", href: "/admin/top-orgs", icon: BarChart },
      { name: "Metrics", href: "/admin/metrics", icon: BarChart },
    ],
  },
  {
    group: "Configuration",
    items: [
      { name: "Feature Flags", href: "/admin/feature-flags", icon: Flag },
      { name: "Banners", href: "/admin/banners", icon: Bell },
      { name: "Backfill", href: "/admin/backfill", icon: Database },
      { name: "Admin Settings", href: "/admin/settings", icon: Settings },
      { name: "On Prem", href: "/admin/on-prem", icon: Ticket },
      { name: "All Orgs", href: "/admin/stats", icon: Building2 },
      { name: "Governance", href: "/admin/governance-orgs", icon: Users },
      { name: "Org Analytics", href: "/admin/org-analytics", icon: Box },
      { name: "Wallet", href: "/admin/wallet", icon: Wallet },
      {
        name: "Stripe Projections",
        href: "/admin/projections",
        icon: BarChart,
      },
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

  const isCurrentPage = useCallback(
    (href: string) => {
      return pathname === href;
    },
    [pathname],
  );

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isCurrentPage(item.href)}
                    >
                      <a href={item.href} className="flex items-center gap-3">
                        <item.icon size={20} className="shrink-0" />
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
      <SidebarFooter className="p-6">
        {/* Optional footer content */}
      </SidebarFooter>
    </Sidebar>
  );
}
