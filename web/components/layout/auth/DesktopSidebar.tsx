import { ProFeatureWrapper } from "@/components/shared/ProBlockerComponents/ProFeatureWrapper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/services/hooks/localStorage";
import {
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Rocket } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import ChangelogModal from "../ChangelogModal";
import { useOrg } from "../org/organizationContext";
import OrgDropdown from "../orgDropdown";
import SidebarHelpDropdown from "../SidebarHelpDropdown";
import NavItem from "./NavItem";
import { ChangelogItem } from "./types";

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
  sidebarRef: React.RefObject<HTMLDivElement>;
}

const DesktopSidebar = ({
  changelog,
  NAVIGATION,
  sidebarRef,
}: SidebarProps) => {
  const orgContext = useOrg();
  const router = useRouter();

  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    "isSideBarCollapsed",
    false,
  );

  const [expandedItems, setExpandedItems] = useLocalStorage<string[]>(
    "expandedItems",
    ["Developer", "Segments", "Improve"],
  );

  const toggleExpand = (name: string) => {
    const prev = expandedItems || [];
    setExpandedItems(
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name],
    );
  };
  const largeWith = useMemo(
    () => cn(isCollapsed ? "w-16" : "w-52"),
    [isCollapsed],
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

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    calculateAvailableSpace();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "b" &&
        event.metaKey &&
        orgContext?.currentOrg?.tier !== "demo"
      ) {
        event.preventDefault();
        setIsCollapsed(!isCollapsed);
      } else if (event.metaKey && event.shiftKey && event.key === "l") {
        event.preventDefault();
        setTheme(theme === "dark" ? "light" : "dark");
      }
    };

    const sidebarWidth = isCollapsed ? 64 : 208;
    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${sidebarWidth}px`,
    );

    // Add event listeners
    window.addEventListener("resize", calculateAvailableSpace);
    window.addEventListener("keydown", handleKeyDown);

    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("resize", calculateAvailableSpace);
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCollapsed, expandedItems, setIsCollapsed, setTheme, theme]);

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
    null,
  );

  const handleChangelogClick = (changelog: ChangelogItem) => {
    setChangelogToView(changelog);
    setModalOpen(true);
  };

  const handleModalOpen = (open: boolean) => {
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
      <div className="dark:border-slate-70 sticky top-0 z-20 flex flex-shrink-0 border-b border-slate-300 bg-slate-100 px-2 py-3 dark:bg-black md:hidden">
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
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
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
          "transition-all duration-300",
        )}
      />

      {/* Sidebar content */}
      <div
        ref={sidebarRef}
        className={cn(
          "z-50 flex h-screen flex-col bg-sidebar-background transition-all duration-300",
          largeWith,
          "fixed left-0 top-0",
          "md:translate-x-0", // Always visible on desktop
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-full w-full flex-col border-r border-slate-200 dark:border-slate-800">
          {/* Collapse button and OrgDropdown */}
          <div
            className={`flex flex-row items-center p-2.5 ${isCollapsed ? "justify-center" : "justify-between"}`}
          >
            {/* - OrgDropdown */}
            {!isCollapsed && <OrgDropdown />}

            {/* - Collapse button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCollapseToggle}
              className="flex shrink-0 items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              {isCollapsed ? (
                <ChevronRightIcon className="h-4 w-4" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Main content area */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-2 flex h-full flex-1 flex-col justify-between overflow-y-auto">
              {/* Navigation items */}
              <div className="flex flex-col">
                <div
                  ref={navItemsRef}
                  data-collapsed={isCollapsed}
                  className="group flex flex-col py-2 data-[collapsed=true]:py-2"
                >
                  <nav className="grid px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
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
                          "text-large mt-10 gap-1 bg-sky-500 font-medium leading-normal tracking-normal text-white transition-colors hover:bg-sky-600",
                          isCollapsed
                            ? "h-8 w-8 px-2"
                            : "h-[46px] w-full px-6 md:px-4",
                        )}
                        variant="action"
                      >
                        {!isCollapsed && (
                          <span className="text-white">Ready to integrate</span>
                        )}
                        <Rocket
                          className={
                            isCollapsed
                              ? "h-4 w-4 text-white"
                              : "h-6 w-6 text-white"
                          }
                        />
                      </Button>
                    )}
                  </nav>
                </div>
              </div>

              {/* InfoBox */}
              {canShowInfoBox &&
                orgContext?.currentOrg?.tier === "free" &&
                (isCollapsed ? (
                  <div className="px-2 py-2">
                    <ProFeatureWrapper featureName="pro" enabled={false}>
                      <Button
                        variant="action"
                        size="icon"
                        className="h-8 w-full bg-sky-500 text-white hover:bg-sky-600"
                      >
                        <Rocket className="h-4 w-4" />
                      </Button>
                    </ProFeatureWrapper>
                  </div>
                ) : (
                  <div className="mx-2 mb-4 mt-2 flex flex-col items-start justify-between gap-4 rounded border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 md:flex-row md:items-center md:justify-center md:gap-2">
                    <div className="flex flex-col gap-2">
                      <h1 className="text-start text-xs leading-[1.35rem] tracking-tight">
                        Unlock more features with{" "}
                        <span className="font-bold text-sky-500">Pro</span>. No
                        usage limits, sessions, user analytics, custom
                        properties and much more.
                      </h1>
                      <ProFeatureWrapper featureName="pro" enabled={false}>
                        <Button
                          variant="action"
                          className="h-8 w-full bg-sky-500 text-xs text-white hover:bg-sky-600"
                        >
                          Start Pro Free Trial
                        </Button>
                      </ProFeatureWrapper>
                    </div>
                  </div>
                ))}
            </div>

            {/* Sticky help dropdown */}
            {orgContext?.currentOrg?.tier !== "demo" && (
              <div className="p-3">
                <SidebarHelpDropdown
                  changelog={changelog}
                  handleChangelogClick={handleChangelogClick}
                  isCollapsed={isCollapsed}
                />
              </div>
            )}
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
