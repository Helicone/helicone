import { useState, useMemo } from "react";
import { $JAWN_API } from "../../../lib/clients/jawn";
import { Button } from "@/components/ui/button";
import { H1, P, Lead, Small } from "@/components/ui/typography";
import MarkdownEditor from "@/components/shared/markdownEditor";
import {
  PlusIcon,
  SaveIcon,
  XIcon,
  ChevronDown,
  ChevronRight,
  SearchIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { InfoBox } from "@/components/ui/helicone/infoBox";
import { logger } from "@/lib/telemetry/logger";

// XSS protection helpers
const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const escapeRegExp = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface SettingType {
  name: string;
  settings: any;
}

interface GroupedSettingsType {
  [key: string]: SettingType[];
}

const AdminSettings = () => {
  const { data: settingsData, refetch } = $JAWN_API.useQuery(
    "get",
    "/v1/admin/settings",
  );
  const [editableSetting, setEditableSetting] = useState<{
    name: string;
    settings: string;
  } | null>(null);
  const [newSetting, setNewSetting] = useState<{
    name: string;
    settings: string;
  }>({
    name: "",
    settings: "{}",
  });
  const [showNewSettingForm, setShowNewSettingForm] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>(
    {},
  );

  // Helper to check if a setting should be treated as a secret/password
  const isSecretSetting = (name: string): boolean => {
    return (
      name.toLowerCase().includes("key") ||
      name.toLowerCase().includes("secret") ||
      name.toLowerCase().includes("password") ||
      name.toLowerCase().includes("token")
    );
  };

  // Toggle password visibility for a setting
  const toggleSecretVisibility = (settingName: string) => {
    setVisibleSecrets((prev) => ({
      ...prev,
      [settingName]: !prev[settingName],
    }));
  };

  // Group settings by prefix before the colon
  const groupedSettings = useMemo(() => {
    if (!settingsData) return {};

    const grouped: GroupedSettingsType = {};

    settingsData.forEach((setting: SettingType) => {
      const parts = setting.name.split(":");
      const prefix = parts.length > 1 ? parts[0] : "other";

      if (!grouped[prefix]) {
        grouped[prefix] = [];
      }

      grouped[prefix].push(setting);
    });

    // Initialize collapsed state for any new groups
    Object.keys(grouped).forEach((group) => {
      if (collapsedGroups[group] === undefined) {
        setCollapsedGroups((prev) => ({
          ...prev,
          [group]: false,
        }));
      }
    });

    return grouped;
  }, [settingsData]);

  // Filter settings based on search query
  const filteredGroupedSettings = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedSettings;
    }

    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered: GroupedSettingsType = {};

    Object.entries(groupedSettings).forEach(([group, settings]) => {
      const matchedSettings = settings.filter((setting) => {
        // Search in the setting name
        if (setting.name.toLowerCase().includes(lowercaseQuery)) {
          return true;
        }

        // Search in the setting content (JSON)
        try {
          const settingStr = JSON.stringify(setting.settings).toLowerCase();
          return settingStr.includes(lowercaseQuery);
        } catch (e) {
          return false;
        }
      });

      if (matchedSettings.length > 0) {
        filtered[group] = matchedSettings;
      }
    });

    return filtered;
  }, [groupedSettings, searchQuery]);

  // Auto-expand groups when searching
  useMemo(() => {
    if (searchQuery.trim() !== "") {
      // Expand all groups that have matching settings
      const groupsToExpand = Object.keys(filteredGroupedSettings);
      const newCollapsedState = { ...collapsedGroups };

      groupsToExpand.forEach((group) => {
        newCollapsedState[group] = false; // Expand the group
      });

      setCollapsedGroups(newCollapsedState);
    }
  }, [searchQuery, filteredGroupedSettings]);

  const toggleGroupCollapse = (group: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const handleSelectSetting = (name: string, settings: any) => {
    setEditableSetting({
      name,
      settings: JSON.stringify(settings, null, 2),
    });
  };

  const handleUpdateSettings = async () => {
    if (!editableSetting) return;

    try {
      const parsed = JSON.parse(editableSetting.settings);

      await $JAWN_API.POST("/v1/admin/settings", {
        body: {
          name: editableSetting.name,
          settings: parsed,
        },
      });

      setEditableSetting(null);
      refetch();
    } catch (error) {
      logger.error(
        { error, settingName: editableSetting.name },
        "Failed to parse or save settings",
      );
    }
  };

  const handleAddSetting = async () => {
    if (!newSetting.name.trim()) return;

    try {
      const parsed = JSON.parse(newSetting.settings);

      await $JAWN_API.POST("/v1/admin/settings", {
        body: {
          name: newSetting.name,
          settings: parsed,
        },
      });

      setNewSetting({
        name: "",
        settings: "{}",
      });
      setShowNewSettingForm(false);
      refetch();
    } catch (error) {
      logger.error(
        { error, settingName: newSetting.name },
        "Failed to parse or save new setting",
      );
    }
  };

  const isJsonValid = (json: string): boolean => {
    try {
      JSON.parse(json);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Render a masked version of the settings json
  const renderMaskedJson = (_settings: any): string => {
    return "••••••••••••";
  };

  // Count total settings
  const totalSettings = useMemo(() => {
    if (!settingsData) return 0;
    return settingsData.length;
  }, [settingsData]);

  // Count filtered settings
  const filteredSettingsCount = useMemo(() => {
    let count = 0;
    Object.values(filteredGroupedSettings).forEach((settings) => {
      count += settings.length;
    });
    return count;
  }, [filteredGroupedSettings]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col p-4">
      <div className="mb-6">
        <H1>Admin Settings</H1>
        <Lead>Manage system-wide configuration settings</Lead>
      </div>

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <P className="text-muted-foreground">
            {totalSettings} settings configured in{" "}
            {Object.keys(groupedSettings).length} groups
          </P>
          {!showNewSettingForm && (
            <Button
              onClick={() => setShowNewSettingForm(true)}
              size="sm"
              variant="outline"
            >
              <PlusIcon className="mr-1 h-4 w-4" /> Add Setting
            </Button>
          )}
        </div>

        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            className="pl-10"
            placeholder="Search settings by name or value..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <div className="mt-1 text-sm text-muted-foreground">
              Found {filteredSettingsCount} setting
              {filteredSettingsCount !== 1 ? "s" : ""} in{" "}
              {Object.keys(filteredGroupedSettings).length} group
              {Object.keys(filteredGroupedSettings).length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {showNewSettingForm && (
        <div className="mb-6 rounded-md border bg-slate-50 p-4 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <P className="font-medium">Add New Setting</P>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setShowNewSettingForm(false);
                setNewSetting({ name: "", settings: "{}" });
              }}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <Small className="mb-1 block">Setting Name</Small>
              <Input
                value={newSetting.name}
                onChange={(e) =>
                  setNewSetting({ ...newSetting, name: e.target.value })
                }
                placeholder="Enter setting name (use prefix:name format for grouping)"
                className="mb-2"
              />
              {isSecretSetting(newSetting.name) && (
                <Small className="text-yellow-600 dark:text-yellow-400">
                  ⚠️ This setting will be treated as sensitive and masked by
                  default
                </Small>
              )}
            </div>
            <div>
              <Small className="mb-1 block">Settings Value (JSON)</Small>
              <div className="h-48 rounded-md border">
                <MarkdownEditor
                  text={newSetting.settings}
                  setText={(text) =>
                    setNewSetting({ ...newSetting, settings: text })
                  }
                  language="json"
                  className="h-full"
                />
              </div>
            </div>
            {!isJsonValid(newSetting.settings) && (
              <InfoBox variant="error">Invalid JSON format</InfoBox>
            )}
            <div className="mt-2 flex justify-end gap-2">
              <Button
                variant="action"
                size="sm"
                onClick={handleAddSetting}
                disabled={
                  !newSetting.name.trim() || !isJsonValid(newSetting.settings)
                }
              >
                <SaveIcon className="mr-1 h-3 w-3" /> Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {!totalSettings && !showNewSettingForm && (
        <InfoBox variant="info">
          No settings found. Add your first setting using the button above.
        </InfoBox>
      )}

      {totalSettings > 0 && filteredSettingsCount === 0 && (
        <InfoBox variant="info">No settings match your search query.</InfoBox>
      )}

      <div className="space-y-4">
        {Object.entries(filteredGroupedSettings).map(([group, settings]) => (
          <div key={group} className="overflow-hidden rounded-md border">
            <div
              className="flex cursor-pointer items-center bg-slate-200 px-4 py-2 dark:bg-slate-700"
              onClick={() => toggleGroupCollapse(group)}
            >
              {collapsedGroups[group] ? (
                <ChevronRight className="mr-2 h-4 w-4" />
              ) : (
                <ChevronDown className="mr-2 h-4 w-4" />
              )}
              <P className="font-medium capitalize">{group}</P>
              <Small className="ml-2 text-muted-foreground">
                ({settings.length})
              </Small>
            </div>

            {!collapsedGroups[group] && (
              <div className="divide-y">
                {settings.map((setting: SettingType) => {
                  // Highlight matching parts in the name when searching
                  // Escape HTML to prevent XSS, then escape regex special chars
                  let displayName = escapeHtml(setting.name);
                  if (searchQuery) {
                    const escapedQuery = escapeRegExp(escapeHtml(searchQuery));
                    const regex = new RegExp(`(${escapedQuery})`, "gi");
                    displayName = displayName.replace(
                      regex,
                      '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>',
                    );
                  }

                  const isSensitive = isSecretSetting(setting.name);
                  const isVisible = visibleSecrets[setting.name] || false;

                  return (
                    <div key={setting.name} className="px-4 py-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center">
                          <p
                            className="font-sans m-0 text-base font-medium leading-7 text-[hsl(var(--foreground))]"
                            dangerouslySetInnerHTML={{ __html: displayName }}
                          />
                          {isSensitive && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                              secret
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {isSensitive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSecretVisibility(setting.name);
                              }}
                            >
                              {isVisible ? (
                                <EyeOffIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {editableSetting?.name !== setting.name && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleSelectSetting(
                                  setting.name,
                                  setting.settings,
                                )
                              }
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>

                      {editableSetting?.name === setting.name ? (
                        <div className="flex flex-col gap-3">
                          <div className="h-48 rounded-md border">
                            <MarkdownEditor
                              text={editableSetting.settings}
                              setText={(text) =>
                                setEditableSetting({
                                  ...editableSetting,
                                  settings: text,
                                })
                              }
                              language="json"
                              className="h-full"
                            />
                          </div>
                          {!isJsonValid(editableSetting.settings) && (
                            <InfoBox variant="error">
                              Invalid JSON format
                            </InfoBox>
                          )}
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditableSetting(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="action"
                              size="sm"
                              onClick={handleUpdateSettings}
                              disabled={!isJsonValid(editableSetting.settings)}
                            >
                              <SaveIcon className="mr-1 h-3 w-3" /> Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <pre className="max-h-48 overflow-auto rounded-md bg-slate-50 p-3 text-xs dark:bg-slate-900">
                          <code>
                            {isSensitive && !isVisible
                              ? renderMaskedJson(setting.settings)
                              : JSON.stringify(setting.settings, null, 2)}
                          </code>
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSettings;
