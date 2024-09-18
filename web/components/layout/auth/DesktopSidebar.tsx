import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/services/hooks/localStorage";
import {
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudArrowUpIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";
import { useOrg } from "../organizationContext";
import OrgDropdown from "../orgDropdown";
import NavItem from "./NavItem";
import { InfoBox } from "@/components/ui/helicone/infoBox";
import { useMemo } from "react";

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>> | null;
  current: boolean;
  featured?: boolean;
  subItems?: NavigationItem[];
}

interface SidebarProps {
  NAVIGATION: NavigationItem[];

  setOpen: (open: boolean) => void;
}

const DesktopSidebar = ({ NAVIGATION }: SidebarProps) => {
  const org = useOrg();
  const tier = org?.currentOrg?.tier;
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    "isSideBarCollapsed",
    false
  );

  const [expandedItems, setExpandedItems] = useLocalStorage<string[]>(
    "expandedItems",
    []
  );

  const toggleExpand = (name: string) => {
    const prev = expandedItems || [];
    setExpandedItems(
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };
  const largeWith = useMemo(
    () => cn(isCollapsed ? "w-16" : "w-52"),
    [isCollapsed]
  );

  return (
    <>
      <div
        className={cn(
          "hidden md:block",
          largeWith,
          "transition-all duration-300"
        )}
      />
      <div
        className={cn(
          "hidden md:flex md:flex-col z-30 bg-background dark:bg-gray-900 transition-all duration-300 h-screen bg-white pb-4",
          largeWith,
          "fixed top-0 left-0" // Changed from "sticky top-0" to "fixed top-0 left-0"
        )}
      >
        <div className="w-full flex flex-grow flex-col overflow-y-auto border-r dark:border-gray-700 justify-between">
          <div className="flex items-center gap-2 h-14 border-b dark:border-gray-700">
            {!isCollapsed && <OrgDropdown />}
            <div className={cn("mx-auto", !isCollapsed && "mr-2")}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex justify-center dark:hover:bg-gray-800 px-2"
              >
                {isCollapsed ? (
                  <ChevronRightIcon className="h-4 w-4" />
                ) : (
                  <ChevronLeftIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex flex-grow flex-col">
            {((!isCollapsed &&
              org?.currentOrg?.organization_type === "reseller") ||
              org?.isResellerOfCurrentCustomerOrg) && (
              <div className="flex w-full justify-center px-5 py-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    router.push("/enterprise/portal");
                    if (
                      org.currentOrg?.organization_type === "customer" &&
                      org.currentOrg?.reseller_id
                    ) {
                      org.setCurrentOrg(org.currentOrg.reseller_id);
                    }
                  }}
                >
                  {org.currentOrg?.organization_type === "customer"
                    ? "Back to Portal"
                    : "Customer Portal"}
                </Button>
              </div>
            )}

            <div
              data-collapsed={isCollapsed}
              className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2 "
            >
              <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
                {NAVIGATION.map((link) => (
                  <NavItem
                    key={link.name}
                    link={link}
                    isCollapsed={isCollapsed}
                    expandedItems={expandedItems}
                    toggleExpand={toggleExpand}
                  />
                ))}
              </nav>
            </div>
          </div>
          {!isCollapsed && (
            <div className="p-2">
              <InfoBox icon={() => <></>} className="flex flex-col">
                <div>
                  <span className="text-[#1c4ed8] text-xs font-semibold font-['Inter'] leading-tight">
                    Early Adopter Exclusive: $300 Credit for the year. <br />
                  </span>
                  <span className="text-[#1c4ed8] text-xs font-light font-['Inter'] leading-tight">
                    Switch to Pro and get $25/mo credit on requests exceeding
                    100k, as a thank you for your early support!{" "}
                  </span>
                </div>
                <Button className="bg-blue-700 mt-[10px] text-xs" size="xs">
                  <Link href="/settings/billing">Upgrade to Pro</Link>
                </Button>
              </InfoBox>
            </div>
          )}
          <div className="mt-auto">
            {isCollapsed ? (
              <>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full dark:hover:bg-gray-800"
                      asChild
                    >
                      <Link
                        href="https://docs.helicone.ai/introduction"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <BookOpenIcon className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="dark:bg-gray-800 dark:text-gray-200"
                  >
                    View Documentation
                  </TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full dark:hover:bg-gray-800"
                      asChild
                    >
                      <Link
                        href="https://discord.gg/zsSTcH2qhG"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <QuestionMarkCircleIcon className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="dark:bg-gray-800 dark:text-gray-200"
                  >
                    Help And Support
                  </TooltipContent>
                </Tooltip>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start dark:hover:bg-gray-800 text-[12px]"
                  asChild
                >
                  <Link
                    href="https://docs.helicone.ai/introduction"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2"
                  >
                    <BookOpenIcon className="h-4 w-4 mr-2" />
                    Documentation
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start dark:hover:bg-gray-800 text-[12px]"
                  asChild
                >
                  <Link
                    href="/settings"
                    rel="noopener noreferrer"
                    className="px-2"
                  >
                    <Cog6ToothIcon className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </Button>
              </>
            )}
          </div>
          {tier === "free" &&
            org?.currentOrg?.organization_type !== "customer" && (
              <div className={cn("p-2", isCollapsed && "hidden")}>
                <Link href="/settings/billing">
                  <Button
                    variant="outline"
                    className="w-full justify-between dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center">
                      <CloudArrowUpIcon className="h-5 w-5 mr-1.5" />
                      <span>Free Plan</span>
                    </div>
                    <span className="text-xs font-normal text-primary dark:text-gray-300">
                      Upgrade
                    </span>
                  </Button>
                </Link>
              </div>
            )}
        </div>
      </div>
    </>
  );
};

export default DesktopSidebar;
