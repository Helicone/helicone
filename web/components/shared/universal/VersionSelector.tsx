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
import Tooltip from "./Tooltip";
import useNotification from "../notification/useNotification";

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
    [editValue, id, onIdChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        handleEditComplete(false);
      } else if (e.key === "Enter") {
        handleEditComplete(true);
      }
    },
    [handleEditComplete]
  );

  return (
    // "pseudo border"
    <div
      ref={dropdownRef}
      className={`pr-[1px] py-[1px] bg-gradient-to-r from-transparent to-slate-100 relative -ml-[calc(2px+0.625rem)] group ${
        isDropdownOpen ? "rounded-t-[1.1rem]" : "rounded-full"
      }`}
    >
      <div
        className={`flex flex-row items-center from-transparent to-slate-200 bg-gradient-to-r pl-[calc(2px+0.625rem)] p-[2px] gap-2
            ${isDropdownOpen ? "rounded-t-[1.1rem]" : "rounded-full"}`}
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
            className="px-2.5 -ml-[calc(0.625rem-2px)] appearance-none rounded-full text-xl outline-none focus:border-transparent focus:ring-2 focus:ring-heliblue w-fit bg-white max-w-56"
            aria-label="Edit prompt id"
          />
        ) : (
          <div className="flex flex-row items-center gap-2 [&:has(>div:nth-child(2):hover,>div:nth-child(3):hover)_h1]:text-heliblue">
            {/* ID Title */}
            <h1 className="text-xl font-semibold text-nowrap">{id}</h1>

            {/* Copy Button */}
            <Tooltip
              content="Copy Prompt ID"
              position="bottom"
              margin="2"
              glass={false}
            >
              <button
                className="text-slate-700 flex items-center justify-center hover:text-heliblue active:scale-95 transition-transform"
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
                className="text-slate-700 flex items-center justify-center hover:text-heliblue active:scale-95 transition-transform"
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
                className="text-slate-700 flex items-center justify-center enabled:group-one-hover:text-heliblue disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
                disabled={currentVersion === masterVersion}
                onClick={() => {
                  const version = versions.find(
                    (v) => v.major_version === currentVersion
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
          className="w-full group-two justify-end  hover:shadow-md flex flex-row items-center rounded-full px-2.5 py-1 bg-white transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={versions.length === 0 || versions.length === 1} // No versions or only version 0
        >
          {/* Master/Dirty Indicator */}
          <div
            className={`h-2 w-2 rounded-full transition-all mr-2 ${
              isDirty
                ? "bg-amber-500"
                : currentVersion === masterVersion
                ? "bg-heliblue"
                : "bg-slate-500"
            }`}
          />

          {/* Version */}
          <span className="font-bold mr-[.3125rem]">v{currentVersion}</span>

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
            className="shadow-lg overflow-hidden absolute w-full top-full left-0 rounded-b-[1.1rem] bg-slate-200 border-b border-x border-b-slate-100 border-x-slate-100 z-40"
            role="menu"
          >
            <div className="p-[2px] overflow-x-hidden overflow-y-scroll h-full w-full flex flex-col max-h-[23.5rem]">
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
            </div>
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
      <div className="w-full text-left px-2.5 py-1.5 text-sm animate-pulse space-y-2">
        <div className="h-4 w-20 bg-slate-200 rounded" />
      </div>
    );
  }

  return (
    <button
      className={`group-three w-full text-left px-2.5 py-1.5 text-sm hover:shadow-md transition-transform active:scale-95 flex flex-row items-center justify-between ${
        isSelected ? "bg-white" : "bg-transparent text-slate-500"
      } ${isLast ? "rounded-bl-[1rem]" : ""}`}
      onClick={onSelect}
      role="menuitem"
    >
      {/* CreatedAt */}
      <h3 className="text-slate-500 text-xs">{formatDate(createdAt!)}</h3>

      {/* Master Indicator */}
      {majorVersion === masterVersion && (
        <div className="flex flex-row items-center gap-1">
          <h3 className="text-slate-500 text-xs">Production</h3>
          <div className="h-2 w-2 bg-heliblue rounded-full" />
        </div>
      )}

      {/* Version */}
      <span className="font-medium group-three-hover:scale-105">
        v{majorVersion}
      </span>
    </button>
  );
}
