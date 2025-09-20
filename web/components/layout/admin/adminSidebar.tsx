import { useCallback } from "react";
import {
  Home,
  BarChart,
  Ticket,
  Box,
  Building2,
  Flag,
  Users,
  Settings,
  DollarSign,
  MessageCircle,
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
      { name: "Dashboard", href: "/admin", icon: Home },
      { name: "Models", href: "/admin/models", icon: DollarSign },
      { name: "On Prem", href: "/admin/on-prem", icon: Ticket },
      { name: "Settings", href: "/admin/settings", icon: Settings },
      { name: "All Orgs", href: "/admin/stats", icon: Building2 },
      { name: "Governance", href: "/admin/governance-orgs", icon: Users },
      { name: "Metrics", href: "/admin/metrics", icon: BarChart },
      { name: "Org Analytics", href: "/admin/org-analytics", icon: Box },
      { name: "Top Orgs", href: "/admin/top-orgs", icon: BarChart },
      { name: "Projections", href: "/admin/projections", icon: BarChart },
      { name: "Feature Flags", href: "/admin/feature-flags", icon: Flag },
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
