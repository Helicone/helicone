import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Rocket } from "lucide-react";
import { useRouter } from "next/router";
import { useRef } from "react";
import { useOrg } from "../org/organizationContext";
import { useNavigation } from "../navigation/NavigationContext";
import NavItem from "./NavItem";
import { NavigationItem } from "./types";
import { ProFeatureWrapper } from "@/components/shared/ProBlockerComponents/ProFeatureWrapper";

interface NavItemListProps {
  navigation: NavigationItem[];
}

/**
 * NavItemList component
 *
 * Renders navigation items, special buttons, and info boxes
 */
const NavItemList = ({ navigation }: NavItemListProps) => {
  const { isCollapsed, expandedItems, toggleExpanded, handleNavItemClick } =
    useNavigation();

  const orgContext = useOrg();
  const router = useRouter();
  const navItemsRef = useRef<HTMLDivElement>(null);

  // Compute navigation items based on sidebar state
  const navigationItems = isCollapsed
    ? navigation
        .flatMap((item) => {
          if (item.subItems && expandedItems.includes(item.name)) {
            return [
              item,
              ...item.subItems.filter((subItem) => subItem.icon !== null),
            ];
          }
          return [item];
        })
        .filter((item) => item.icon !== null)
    : navigation.map((item) => {
        if (item.subItems) {
          return {
            ...item,
            subItems: item.subItems.map((subItem) => ({
              ...subItem,
              href: subItem.href,
            })),
          };
        }
        return item;
      });

  return (
    <div className="flex flex-col">
      {/* Reseller button (conditional) */}
      {((!isCollapsed &&
        orgContext?.currentOrg?.organization_type === "reseller") ||
        orgContext?.isResellerOfCurrentCustomerOrg) && (
        <div className="flex w-full justify-center px-5 py-2">
          <Button
            variant="outline"
            className="w-full dark:text-slate-400"
            size="sm_sleek"
            onClick={() => {
              router.push("/enterprise/portal");
              if (
                orgContext.currentOrg?.organization_type === "customer" &&
                orgContext.currentOrg?.reseller_id
              ) {
                orgContext.setCurrentOrg(orgContext.currentOrg.reseller_id);
              }
            }}
          >
            {orgContext.currentOrg?.organization_type === "customer"
              ? "Back to Portal"
              : "Customer Portal"}
          </Button>
        </div>
      )}

      {/* Navigation items */}
      <div
        ref={navItemsRef}
        data-collapsed={isCollapsed}
        className="group flex flex-col py-2 data-[collapsed=true]:py-2"
      >
        <nav className="grid px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
          {navigationItems.map((link) => (
            <NavItem
              key={link.name}
              link={link}
              isCollapsed={isCollapsed}
              expandedItems={expandedItems}
              toggleExpand={toggleExpanded}
              onClick={handleNavItemClick}
              deep={0}
            />
          ))}

          {/* Demo integration button (conditional) */}
          {orgContext?.currentOrg?.tier === "demo" && (
            <Button
              onClick={() => {
                orgContext.allOrgs.forEach((org) => {
                  if (org.is_main_org === true) {
                    orgContext.setCurrentOrg(org.id);
                    router.push("/onboarding");
                  }
                });
              }}
              className={cn(
                "mt-10 gap-1 text-white text-large font-medium leading-normal tracking-normal bg-sky-500 hover:bg-sky-600 transition-colors",
                isCollapsed ? "h-8 w-8 px-2" : "h-[46px] w-full px-6 md:px-4"
              )}
              variant="action"
            >
              {!isCollapsed && (
                <span className="text-white">Ready to integrate</span>
              )}
              <Rocket
                className={
                  isCollapsed ? "h-4 w-4 text-white" : "h-6 w-6 text-white"
                }
              />
            </Button>
          )}
        </nav>
      </div>

      {/* Pro upgrade info box (conditional) */}
      {orgContext?.currentOrg?.tier === "free" &&
        (isCollapsed ? (
          <div className="px-2 py-2">
            <ProFeatureWrapper featureName="pro" enabled={false}>
              <Button
                variant="action"
                size="icon"
                className="w-full h-8 bg-sky-500 hover:bg-sky-600 text-white"
              >
                <Rocket className="h-4 w-4" />
              </Button>
            </ProFeatureWrapper>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 flex flex-col md:flex-row md:gap-2 gap-4 justify-between md:justify-center md:items-center items-start px-3 py-2 mt-2 mx-2 mb-4 font-medium">
            <div className="flex flex-col gap-2">
              <h1 className="text-xs text-start tracking-tight leading-[1.35rem]">
                Unlock more features with{" "}
                <span className="font-bold text-sky-500">Pro</span>. No usage
                limits, sessions, user analytics, custom properties and much
                more.
              </h1>
              <ProFeatureWrapper featureName="pro" enabled={false}>
                <Button
                  variant="action"
                  className="w-full text-xs h-8 bg-sky-500 hover:bg-sky-600 text-white"
                >
                  Start Pro Free Trial
                </Button>
              </ProFeatureWrapper>
            </div>
          </div>
        ))}
    </div>
  );
};

export default NavItemList;
