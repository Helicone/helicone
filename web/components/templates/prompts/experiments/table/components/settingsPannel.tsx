import ThemedDrawer from "../../../../../shared/themed/themedDrawer";
import ProviderKeyList from "../../../../enterprise/portal/id/providerKeyList";
import React from "react";

interface SettingsPanelProps {
  setSelectedProviderKey: (key: string | null) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  defaultProviderKey: string | null;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  defaultProviderKey,
  setSelectedProviderKey,
  open,
  setOpen,
}) => {
  return (
    <ThemedDrawer
      open={open}
      setOpen={setOpen}
      defaultWidth="md:min-w-[300px] w-full md:w-[400px]"
    >
      <div className="space-y-4 py-4">
        <h2 className="mb-4 text-lg font-semibold">Settings</h2>
        <ProviderKeyList
          variant="basic"
          setProviderKeyCallback={setSelectedProviderKey}
          defaultProviderKey={defaultProviderKey}
        />
      </div>
    </ThemedDrawer>
  );
};

export default SettingsPanel;
