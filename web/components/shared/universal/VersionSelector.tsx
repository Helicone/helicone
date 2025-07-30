"use client";
import { PromptVersionReference } from "@/types/prompt-state";
import { formatDate } from "@/utils/date";
import { toKebabCase } from "@/utils/strings";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PiArrowCircleUpBold,
  PiCaretDownBold,
  PiCopyBold,
  PiPencilSimpleBold,
} from "react-icons/pi";
import useNotification from "../notification/useNotification";
import CustomScrollbar from "./Scrollbar";
import Tooltip from "./Tooltip";

interface VersionSelectorProps {
  isLoading: boolean;

  id: string;
  masterVersion: number;

  currentVersion: number;
  isDirty: boolean;

  versions: PromptVersionReference[];
  onVersionSelect: (version: PromptVersionReference) => void;
  onVersionPromote: (version: PromptVersionReference) => void;
  onIdEdit: (newId: string) => void;
}

export default function VersionSelector({
  id,
  currentVersion,
  masterVersion,
  versions,
  isLoading,
  isDirty,
  onVersionSelect,
  onVersionPromote,
  onIdEdit: onIdChange,
}: VersionSelectorProps) {
  const { setNotification } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(id);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle dropdown interactions
  useEffect(() => {
    if (!isDropdownOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  // Handle editing logic
  const handleEditComplete = useCallback(
    (shouldSave: boolean) => {
      if (shouldSave) {
        const newId = toKebabCase(editValue);
        if (newId !== id) {
          onIdChange(newId);
        }
      }
      setIsEditing(false);
      setEditValue(id);
    },
    [editValue, id, onIdChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        handleEditComplete(false);
      } else if (e.key === "Enter") {
        handleEditComplete(true);
      }
    },
    [handleEditComplete],
  );

  return (
    // "pseudo border"
    <div
      ref={dropdownRef}
      className={`group relative -ml-[calc(2px+0.625rem)] bg-gradient-to-r from-transparent to-slate-200 py-[1px] pr-[1px] dark:to-slate-800 ${
        isDropdownOpen ? "rounded-t-[1.1rem]" : "rounded-full"
      }`}
    >
      <div
        className={`flex flex-row items-center gap-2 bg-gradient-to-r from-transparent to-slate-200 p-[2px] pl-[calc(2px+0.625rem)] dark:to-slate-800 ${isDropdownOpen ? "rounded-t-[1.1rem]" : "rounded-full"}`}
      >
        {/* Rename Input OR ID Title + Tools */}
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => handleEditComplete(false)}
            autoFocus
            className="-ml-[calc(0.625rem-2px)] w-fit max-w-56 appearance-none rounded-full bg-white px-2.5 text-lg outline-none focus:border-transparent focus:ring-2 focus:ring-heliblue dark:bg-slate-950"
            aria-label="Edit prompt id"
          />
        ) : (
          <div className="flex flex-row items-center gap-2 [&:has(>div:nth-child(2):hover,>div:nth-child(3):hover)_h1]:text-heliblue">
            {/* ID Title */}
            <h1 className="text-nowrap text-lg font-semibold">{id}</h1>

            {/* Copy Button */}
            <Tooltip
              content="Copy Prompt ID"
              position="bottom"
              margin="2"
              glass={false}
            >
              <button
                className="flex items-center justify-center text-slate-700 transition-transform hover:text-heliblue active:scale-95"
                onClick={() => {
                  navigator.clipboard.writeText(id);
                  setNotification("Copied Prompt ID to clipboard", "success");
                }}
              >
                <PiCopyBold className="h-4 w-4" />
              </button>
            </Tooltip>

            {/* Rename Button */}
            <Tooltip
              content="Change Prompt ID"
              position="bottom"
              margin="2"
              glass={false}
            >
              <button
                className="flex items-center justify-center text-slate-700 transition-transform hover:text-heliblue active:scale-95"
                onClick={() => {
                  setEditValue(id);
                  setIsEditing(true);
                }}
              >
                <PiPencilSimpleBold className="h-4 w-4" />
              </button>
            </Tooltip>

            {/* Promote Button */}
            <Tooltip
              content="Promote Version to Production"
              position="bottom"
              margin="2"
              glass={false}
            >
              <button
                className="flex items-center justify-center text-slate-700 transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 enabled:group-one-hover:text-heliblue"
                disabled={currentVersion === masterVersion}
                onClick={() => {
                  const version = versions.find(
                    (v) => v.major_version === currentVersion,
                  );
                  if (version) {
                    onVersionPromote(version);
                  }
                }}
              >
                <PiArrowCircleUpBold className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        )}

        {/* Version Pill Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="group-two flex w-full flex-row items-center justify-end rounded-full bg-white px-2.5 py-1 transition-transform hover:bg-slate-100 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-950 dark:hover:bg-slate-900"
          disabled={versions.length === 0 || versions.length === 1} // No versions or only version 0
        >
          {/* Master/Dirty Indicator */}
          <div
            className={`mr-2 h-2 w-2 rounded-full transition-all ${
              isDirty
                ? "animate-pulse bg-amber-500"
                : currentVersion === masterVersion
                  ? "bg-heliblue"
                  : "bg-slate-400 dark:bg-slate-600"
            }`}
          />

          {/* Version */}
          <span className="mr-[.3125rem] font-bold">v{currentVersion}</span>

          {/* Chevron */}
          <PiCaretDownBold
            className={`group-two-hover:scale-110 ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Version Dropdown */}
        {isDropdownOpen && (
          <div
            className="absolute left-0 top-full z-40 w-full overflow-hidden rounded-b-[1.1rem] border-x border-b border-slate-200 bg-slate-200 shadow-lg dark:border-slate-800 dark:bg-slate-800"
            role="menu"
          >
            <CustomScrollbar
              className="flex h-full max-h-[23.5rem] w-full flex-col"
              withBorder
            >
              {isLoading ? (
                <>
                  <VersionItem isLoading />
                  <VersionItem isLoading />
                  <VersionItem isLoading />
                </>
              ) : (
                versions
                  .sort((a, b) => b.major_version - a.major_version)
                  .map((v, index, filteredArray) => (
                    <VersionItem
                      key={v.major_version}
                      majorVersion={v.major_version}
                      masterVersion={masterVersion}
                      createdAt={v.created_at}
                      isSelected={v.major_version === currentVersion}
                      isLast={index === filteredArray.length - 1}
                      onSelect={() => {
                        onVersionSelect(v);
                        setIsDropdownOpen(false);
                      }}
                    />
                  ))
              )}
            </CustomScrollbar>
          </div>
        )}
      </div>
    </div>
  );
}

function VersionItem({
  majorVersion,
  masterVersion,
  createdAt,
  isSelected,
  onSelect,
  isLoading,
  isLast,
}: {
  majorVersion?: number;
  masterVersion?: number;
  createdAt?: string;
  isSelected?: boolean;
  onSelect?: () => void;
  isLoading?: boolean;
  isLast?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="w-full animate-pulse space-y-2 px-2.5 py-1.5 text-left text-sm">
        <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <button
      className={`group-three flex w-full flex-row items-center justify-between px-2.5 py-1.5 text-left text-sm hover:shadow-md ${
        isSelected
          ? "bg-white hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900"
          : "text-tertiary bg-transparent hover:bg-slate-100 dark:hover:bg-slate-900"
      } ${isLast ? "rounded-bl-[1rem]" : ""}`}
      onClick={onSelect}
      role="menuitem"
    >
      {/* CreatedAt */}
      <h3 className="text-xs text-slate-500">{formatDate(createdAt!)}</h3>

      {/* Master Indicator */}
      {majorVersion === masterVersion && (
        <div className="flex flex-row items-center gap-1">
          <h3 className="text-xs text-slate-500">Production</h3>
          <div className="h-2 w-2 rounded-full bg-heliblue" />
        </div>
      )}

      {/* Version */}
      <span className="font-medium">v{majorVersion}</span>
    </button>
  );
}
