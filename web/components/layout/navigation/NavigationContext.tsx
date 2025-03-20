import { useLocalStorage } from "@/services/hooks/localStorage";
import { useRouter } from "next/router";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

/**
 * Navigation context type definition
 */
interface NavigationContextType {
  // Sidebar collapse state
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;

  // Mobile menu state
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;

  // Expanded items state
  expandedItems: string[];
  toggleExpanded: (name: string) => void;

  // Navigation event handlers
  handleNavItemClick: () => void;
}

// Create context with default values
const NavigationContext = createContext<NavigationContextType>({
  isCollapsed: false,
  setIsCollapsed: () => {},
  toggleCollapsed: () => {},
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: () => {},
  expandedItems: [],
  toggleExpanded: () => {},
  handleNavItemClick: () => {},
});

/**
 * Navigation Provider component
 */
export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  // Persistent sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    "isSideBarCollapsed",
    false
  );

  // Persistent expanded navigation sections
  const [expandedItems, setExpandedItems] = useLocalStorage<string[]>(
    "expandedItems",
    ["Developer", "Segments", "Improve"]
  );

  // Mobile menu state (non-persistent)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toggle sidebar collapse state
  const toggleCollapsed = () => {
    // For mobile screens, close the menu
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    } else {
      // For desktop, toggle collapse
      setIsCollapsed(!isCollapsed);
    }
  };

  // Toggle item expansion in the navigation
  const toggleExpanded = (name: string) => {
    const prev = expandedItems || [];
    setExpandedItems(
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  // Handler for navigation item clicks
  const handleNavItemClick = () => {
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  };

  // Close mobile menu on navigation
  useEffect(() => {
    const handleRouteChange = () => {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    router.events.on("routeChangeStart", handleRouteChange);

    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [router, isMobileMenuOpen]);

  // Update CSS variable for sidebar width
  useEffect(() => {
    const sidebarWidth = isCollapsed ? 64 : 208;
    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${sidebarWidth}px`
    );
  }, [isCollapsed]);

  // Expose values to children via context
  const value = {
    isCollapsed,
    setIsCollapsed,
    toggleCollapsed,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    expandedItems,
    toggleExpanded,
    handleNavItemClick,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

/**
 * Custom hook to use the navigation context
 */
export const useNavigation = () => {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }

  return context;
};
