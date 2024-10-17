import { Button } from "@/components/ui/button";
import { InfoBox } from "@/components/ui/helicone/infoBox";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/services/hooks/localStorage";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useEffect, useRef, useState } from "react";
import { useOrg } from "../organizationContext";
import OrgDropdown from "../orgDropdown";
import NavItem from "./NavItem";
import { ChangelogItem } from "./Sidebar";
import ChangelogModal from "../ChangelogModal";
import SidebarHelpDropdown from "../SidebarHelpDropdown";

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
  changelog: ChangelogItem[];
  setOpen: (open: boolean) => void;
}

const DesktopSidebar = ({ changelog, NAVIGATION }: SidebarProps) => {
  const org = useOrg();
  const tier = org?.currentOrg?.tier;
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    "isSideBarCollapsed",
    false
  );

  const shouldShowInfoBox = useMemo(() => {
    return tier === "pro" || tier === "growth";
  }, [tier]);

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

  const NAVIGATION_ITEMS = useMemo(() => {
    if (isCollapsed) {
      return NAVIGATION.flatMap((item) => {
        if (item.subItems && expandedItems.includes(item.name)) {
          return [
            item,
            ...item.subItems.filter((subItem) => subItem.icon !== null),
          ];
        }
        return [item];
      }).filter((item) => item.icon !== null);
    }

    return NAVIGATION.map((item) => {
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
  }, [NAVIGATION, isCollapsed, expandedItems]);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const navItemsRef = useRef<HTMLDivElement>(null);
  const [canShowInfoBox, setCanShowInfoBox] = useState(false);

  // Function to calculate if there's enough space to show the InfoBox
  const calculateAvailableSpace = () => {
    if (sidebarRef.current && navItemsRef.current) {
      const sidebarHeight = sidebarRef.current.offsetHeight;
      const navItemsHeight = navItemsRef.current.offsetHeight;
      const fixedContentHeight = 100; // Approximate height of fixed elements (header, footer)
      const infoBoxHeight = 150; // Approximate height of the InfoBox

      const availableHeight =
        sidebarHeight - navItemsHeight - fixedContentHeight;

      setCanShowInfoBox(availableHeight >= infoBoxHeight);
    }
  };

  useEffect(() => {
    calculateAvailableSpace();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "b" && event.metaKey) {
        setIsCollapsed(!isCollapsed);
      }
    };

    // Add event listeners
    window.addEventListener("resize", calculateAvailableSpace);
    window.addEventListener("keydown", handleKeyDown);

    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("resize", calculateAvailableSpace);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCollapsed, expandedItems, setIsCollapsed]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCollapseToggle = () => {
    if (window.innerWidth < 768) {
      // Mobile breakpoint
      setIsMobileMenuOpen(false);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [changelogToView, setChangelogToView] = useState<ChangelogItem | null>(
    null
  );

  const handleChangelogClick = (changelog: ChangelogItem) => {
    setChangelogToView(changelog);
    setModalOpen(true);
  };

  const handleModalOpen = (open: boolean) => {
    console.log({ open });
    if (!open) {
      setChangelogToView(null);
    } else {
      setChangelogToView(changelog[0]);
    }
    setModalOpen(open);
  };

  return (
    <>
      {/* Mobile hamburger menu */}
      <div className="sticky top-0 z-20 px-2 py-3 flex md:hidden flex-shrink-0 bg-white dark:bg-black border-b border-slate-300 dark:border-slate-70">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsCollapsed(false);
            setIsMobileMenuOpen(true);
          }}
          className="text-slate-500 hover:text-slate-600"
        >
          <Bars3Icon className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile drawer overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => {
            setIsCollapsed(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}

      {/* Sidebar container */}
      <div
        className={cn(
          "hidden md:block",
          largeWith,
          "transition-all duration-300"
        )}
      />

      {/* Sidebar content */}
      <div
        ref={sidebarRef}
        className={cn(
          "flex flex-col z-50 bg-background dark:bg-neutral-950 transition-all duration-300 h-screen bg-white",
          largeWith,
          "fixed top-0 left-0",
          "md:translate-x-0", // Always visible on desktop
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="w-full flex flex-col h-full border-r dark:border-slate-800">
          <div className="flex-grow overflow-y-auto pb-14">
            {/* Collapsible button and OrgDropdown */}
            <div className="flex items-center gap-2 h-14 border-b dark:border-slate-800">
              <div className="flex items-center gap-2 w-full">
                {!isCollapsed && <OrgDropdown />}
              </div>
              <div
                className={cn("mx-auto", isCollapsed ? "w-full mr-4" : "mr-2")}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCollapseToggle}
                  className="w-full flex justify-center dark:hover:bg-slate-800 px-2"
                >
                  {isCollapsed ? (
                    <ChevronRightIcon className="h-4 w-4" />
                  ) : (
                    <ChevronLeftIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Navigation items */}
            <div className="flex flex-col">
              {((!isCollapsed &&
                org?.currentOrg?.organization_type === "reseller") ||
                org?.isResellerOfCurrentCustomerOrg) && (
                <div className="flex w-full justify-center px-5 py-2">
                  <Button
                    variant="outline"
                    className="w-full  dark:text-slate-400"
                    size="sm_sleek"
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
                ref={navItemsRef}
                data-collapsed={isCollapsed}
                className="group flex flex-col py-2 data-[collapsed=true]:py-2 "
              >
                <nav className="grid flex-grow overflow-y-auto px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
                  {NAVIGATION_ITEMS.map((link) => (
                    <NavItem
                      key={link.name}
                      link={link}
                      isCollapsed={isCollapsed}
                      expandedItems={expandedItems}
                      toggleExpand={toggleExpand}
                      onClick={() => {
                        setIsCollapsed(false);
                        setIsMobileMenuOpen(false);
                      }}
                      deep={0}
                    />
                  ))}
                </nav>
              </div>
            </div>

            {/* InfoBox */}
            {tier !== "growth" &&
              tier !== "pro" &&
              canShowInfoBox &&
              !isCollapsed && (
                <div className="bg-sky-500/10 rounded-lg border-l-4 border-l-sky-500 border-y border-r border-y-sky-200 border-r-sky-200 text-sky-500 flex flex-col md:flex-row md:gap-2 gap-4 justify-between md:justify-center md:items-center items-start p-2 mt-2 mx-2 mb-8">
                  <h1 className="text-xs text-start font-medium tracking-tight leading-tight">
                    🎉 Introducing a new way to perfect your prompts.{" "}
                    <Link
                      href="https://helicone.ai/experiments"
                      target="_blank"
                      className="underline decoration-sky-400 decoration-1 underline-offset-2 font-semibold"
                    >
                      Get early access here.
                    </Link>{" "}
                  </h1>
                </div>
              )}

            {canShowInfoBox && !isCollapsed && shouldShowInfoBox && (
              <div className="p-2">
                <InfoBox icon={() => <></>} className="flex flex-col">
                  <div>
                    <span className="text-[#1c4ed8] text-xs font-semibold leading-tight">
                      Early Adopter Exclusive: $120 Credit for the year. <br />
                    </span>
                    <span className="text-[#1c4ed8] text-xs font-light leading-tight">
                      Switch to Pro and get $10/mo credit for 1 year, as a thank
                      you for your early support!
                    </span>
                  </div>
                  <Button className="bg-blue-700 mt-[10px] text-xs" size="xs">
                    <Link href="/settings/billing">Upgrade to Pro</Link>
                  </Button>
                </InfoBox>
              </div>
            )}
          </div>

          {/* Sticky help dropdown */}
          <div className="absolute bottom-3 left-3 z-10">
            <SidebarHelpDropdown
              changelog={changelog}
              handleChangelogClick={handleChangelogClick}
            />
          </div>
        </div>
      </div>
      <ChangelogModal
        open={modalOpen}
        setOpen={handleModalOpen}
        changelog={changelogToView}
      />
    </>
  );
};

export default DesktopSidebar;
