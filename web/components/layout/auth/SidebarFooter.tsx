import { useState } from "react";
import { useOrg } from "../org/organizationContext";
import SidebarHelpDropdown from "../SidebarHelpDropdown";
import ChangelogModal from "../ChangelogModal";
import { ChangelogItem } from "./types";
import { useNavigation } from "../navigation/NavigationContext";

interface SidebarFooterProps {
  changelog: ChangelogItem[];
  setOpen: (open: boolean) => void;
}

/**
 * SidebarFooter component
 *
 * Renders the bottom section of the sidebar with help dropdown and changelog
 */
const SidebarFooter = ({ changelog, setOpen }: SidebarFooterProps) => {
  const { isCollapsed } = useNavigation();
  const orgContext = useOrg();

  const [modalOpen, setModalOpen] = useState(false);
  const [changelogToView, setChangelogToView] = useState<ChangelogItem | null>(
    null
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

  // Only render for non-demo organizations
  if (orgContext?.currentOrg?.tier === "demo") {
    return null;
  }

  return (
    <>
      <div className="p-3">
        <SidebarHelpDropdown
          changelog={changelog}
          handleChangelogClick={handleChangelogClick}
          isCollapsed={isCollapsed}
        />
      </div>

      <ChangelogModal
        open={modalOpen}
        setOpen={handleModalOpen}
        changelog={changelogToView}
      />
    </>
  );
};

export default SidebarFooter;
