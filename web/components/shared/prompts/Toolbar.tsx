"use client";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React, {
  CSSProperties,
  ReactNode,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";
import { PiArrowRightBold, PiCheckBold, PiXBold } from "react-icons/pi";

interface ToolbarProps {
  isVisible: boolean;
  tools: ToolType[];
  style?: CSSProperties;
  position: {
    toolbar: { top: number; left: number };
    preview: { top: number; left: number };
    highlights: Array<{
      left: number;
      top: number;
      width: number;
      height: number;
    }>;
  };
  pendingEdit?: {
    originalText: string;
    generatedText: string;
    start: number;
    end: number;
    isPending: boolean;
  };
  selection?: {
    text: string;
    selectionStart: number;
    selectionEnd: number;
  } | null;
  editSuggestions?: {
    label: string;
    goal: string;
    condition?: (text: string) => number;
  }[];
  onModeChange?: () => void;
}

type ToolType = {
  icon: ReactNode;
  label: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  onAccept?: () => void;
  onDeny?: () => void;
  hotkey?: string;
  multiline?: boolean;
  showConfirmation?: boolean;
};

const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(
  (
    {
      isVisible,
      tools,
      position,
      pendingEdit,
      selection,
      onModeChange,
      editSuggestions,
    },
    ref,
  ) => {
    const [activeInput, setActiveInput] = useState<{
      index: number;
      value: string;
      showConfirmation?: boolean;
    } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Force position update when activeInput changes
    useEffect(() => {
      if (isVisible && activeInput) {
        // Use RAF to ensure the DOM has updated with the new width
        requestAnimationFrame(() => {
          // Dispatch a custom event that PromptBox will listen to
          window.dispatchEvent(new CustomEvent("toolbarModeChange"));
        });
      }
    }, [isVisible, activeInput]);

    // Handle keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (!isVisible) return;

        // Check if cmd/ctrl is pressed
        if (event.metaKey || event.ctrlKey) {
          const tool = tools.find(
            (t) => t.hotkey?.toLowerCase() === event.key.toLowerCase(),
          );
          if (tool) {
            event.preventDefault();
            const index = tools.indexOf(tool);
            setActiveInput({ index, value: "" });
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isVisible, tools]);

    // Clear input state when toolbar becomes invisible
    useEffect(() => {
      if (!isVisible) {
        setActiveInput(null);
      }
    }, [isVisible]);

    if (!isVisible) return null;

    const handleToolClick = (tool: ToolbarProps["tools"][0], index: number) => {
      setActiveInput({ index, value: "" });
      // Update position after mode change
      if (onModeChange) {
        requestAnimationFrame(onModeChange);
      }
    };

    const handleInputSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeInput || !activeInput.value.trim()) return;

      const tool = tools[activeInput.index];
      tool.onSubmit(activeInput.value);

      // If tool requires confirmation, keep input active but show confirmation buttons
      if (tool.showConfirmation) {
        setActiveInput({ ...activeInput, showConfirmation: true });
        // Update position after mode change
        if (onModeChange) {
          requestAnimationFrame(onModeChange);
        }
      } else {
        setActiveInput(null);
      }
    };

    const handleAccept = () => {
      if (!activeInput) return;
      const tool = tools[activeInput.index];
      tool.onAccept?.();
      setActiveInput(null);
    };

    const handleDeny = () => {
      if (!activeInput) return;
      const tool = tools[activeInput.index];
      tool.onDeny?.();
      setActiveInput({ ...activeInput, showConfirmation: false });
      textareaRef.current?.focus();
    };

    return (
      <>
        {/* Toolbar */}
        <div
          ref={ref}
          style={{
            transform: `translate(${position.toolbar.left}px, ${
              position.toolbar.top - 36
            }px)`,
            marginTop:
              activeInput && tools[activeInput.index].multiline
                ? "-2rem"
                : undefined,
            zIndex: 2,
          }}
          className={`glass fixed left-0 top-0 !z-50 rounded-full shadow-md ${
            activeInput && !activeInput.showConfirmation
              ? "border-2 border-heliblue"
              : "border border-slate-200 dark:border-slate-800"
          } ${
            activeInput
              ? tools[activeInput.index].multiline
                ? "rounded-lg"
                : "rounded-full"
              : "rounded-full"
          }`}
        >
          {activeInput ? (
            // Input Mode
            <form
              onSubmit={handleInputSubmit}
              className={`flex flex-row items-center gap-0 ${
                tools[activeInput.index].multiline ? "h-16" : "h-8"
              }`}
            >
              {tools[activeInput.index].multiline ? (
                // Multiline Input
                <div className="relative h-full w-full">
                  <textarea
                    ref={textareaRef}
                    className="h-full w-64 resize-none rounded-l-lg bg-white px-2.5 py-1.5 text-sm placeholder-slate-400 outline-none hover:shadow-md dark:bg-slate-900 dark:placeholder-slate-600"
                    value={activeInput.value}
                    required
                    placeholder={
                      tools[activeInput.index].placeholder ?? "Type here..."
                    }
                    onChange={(e) => {
                      if (activeInput.showConfirmation) {
                        handleDeny();
                      } else {
                        setActiveInput({
                          ...activeInput,
                          value: e.target.value,
                        });
                      }
                    }}
                    autoFocus
                    readOnly={pendingEdit?.isPending}
                    onKeyDown={(e) => {
                      // Escape key: Cancels or denies
                      if (e.key === "Escape") {
                        e.preventDefault();
                        activeInput.showConfirmation
                          ? handleDeny()
                          : setActiveInput(null);
                        return;
                      }

                      // Any other key: Ignored if pending edit is loading
                      if (pendingEdit?.isPending) return;

                      // Enter key: Submits or accepts
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (activeInput.showConfirmation) {
                          handleAccept();
                        } else {
                          handleInputSubmit(e);
                        }
                      } else if (activeInput.showConfirmation) {
                        handleDeny();
                      }
                    }}
                  />
                  {activeInput.value === "" && (
                    // Suggestions (max 2)
                    <div className="absolute bottom-0 left-0 flex w-full flex-row justify-around pb-3.5">
                      {editSuggestions
                        ?.map((suggestion) => ({
                          ...suggestion,
                          weight:
                            suggestion.condition?.(
                              // Use the selected text for conditions
                              selection?.text || "",
                            ) || 0,
                        }))
                        .sort((a, b) => b.weight - a.weight)
                        .slice(0, 2)
                        .map((suggestion, index) => (
                          <button
                            key={index}
                            className="text-tertiary text-xs hover:underline"
                            onClick={(e) => {
                              e.preventDefault();
                              const tool = tools[activeInput.index];
                              tool.onSubmit(suggestion.goal);
                              if (tool.showConfirmation) {
                                setActiveInput({
                                  ...activeInput,
                                  value: suggestion.goal,
                                  showConfirmation: true,
                                });
                              } else {
                                setActiveInput(null);
                              }
                            }}
                          >
                            {suggestion.label}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                // Single Line Input
                <Input
                  className="h-full w-32 rounded-l-full bg-white p-2.5 text-sm placeholder-slate-400 outline-none hover:shadow-md"
                  type="text"
                  value={activeInput.value}
                  required
                  onChange={(e) => {
                    if (activeInput.showConfirmation) {
                      handleDeny();
                    } else {
                      setActiveInput({ ...activeInput, value: e.target.value });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      activeInput.showConfirmation
                        ? handleDeny()
                        : setActiveInput(null);
                      return;
                    }

                    if (pendingEdit?.isPending) return;

                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (activeInput.showConfirmation) {
                        handleAccept();
                      } else {
                        handleInputSubmit(e);
                      }
                    } else if (activeInput.showConfirmation) {
                      handleDeny();
                    }
                  }}
                  placeholder={
                    tools[activeInput.index].placeholder ?? "Type here..."
                  }
                  autoFocus
                  readOnly={pendingEdit?.isPending}
                />
              )}
              {activeInput.showConfirmation ? (
                // B. Confirmation Mode
                // Loading state
                pendingEdit?.isPending ? ( // Confirmation buttons
                  <div className="flex h-full items-center justify-center px-2.5">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-heliblue border-t-transparent" />
                  </div>
                ) : (
                  <div className="flex h-full flex-col">
                    <button
                      type="button"
                      onClick={handleAccept}
                      className={`interactive group-three flex h-1/2 items-center justify-center rounded-tr-lg px-2.5`}
                    >
                      <PiCheckBold className="text-base text-heliblue group-three-hover:scale-105" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDeny}
                      className={`interactive group-three flex h-1/2 items-center justify-center rounded-br-lg px-2.5`}
                    >
                      <PiXBold className="text-base group-three-hover:scale-105" />
                    </button>
                  </div>
                )
              ) : (
                // A. Submit Mode
                <button
                  type="submit"
                  className={`flex h-full items-center justify-center px-2.5 ${
                    tools[activeInput.index].multiline
                      ? "rounded-r-lg"
                      : "rounded-r-full"
                  } interactive group-three`}
                >
                  <PiArrowRightBold className="text-base group-three-hover:scale-105" />
                </button>
              )}
            </form>
          ) : (
            // Toolbar Mode
            <div className="font-size-0 flex h-8 w-full flex-row items-center gap-0">
              {tools.map((tool, index) => {
                const isFirst = index === 0;
                const isLast = index === tools.length - 1;
                const isOnly = tools.length === 1;

                return (
                  <Tooltip key={index} delayDuration={100}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleToolClick(tool, index)}
                        className={`group-two interactive flex h-full w-12 items-center justify-center px-2.5 text-base ${
                          isOnly
                            ? "rounded-full"
                            : isFirst
                              ? "rounded-l-full"
                              : isLast
                                ? "rounded-r-full"
                                : ""
                        }`}
                      >
                        <span className="text-base group-two-hover:scale-105">
                          {tool.icon}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="center"
                      className="z-[9999]"
                    >
                      <div className="flex flex-row items-center gap-1 text-sm">
                        <span className="">{tool.label}</span>
                        {tool.hotkey && (
                          <span className="text-heliblue">
                            ⌘{tool.hotkey.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>
        {/* Pending Edit Preview */}
        {pendingEdit && activeInput?.showConfirmation && (
          <div
            className="fixed inset-0 z-40 mt-[3px] max-w-lg"
            style={{
              transform: `translate(${position.preview.left}px, ${position.preview.top}px)`,
            }}
          >
            <span
              className="whitespace-pre-wrap bg-green-500 py-[3px] text-white"
              style={{
                lineHeight: "24px",
                fontSize: "16px",
              }}
            >
              {pendingEdit.generatedText}
            </span>
          </div>
        )}
        {/* Highlight Overlay */}
        {activeInput && (
          <div className="z-1 pointer-events-none fixed inset-0">
            {position.highlights.map((highlight, index) => (
              <div
                key={index}
                className={`fixed ${
                  pendingEdit && activeInput?.showConfirmation
                    ? "bg-red-300"
                    : "bg-blue-200"
                }`}
                style={{
                  transform: `translate(${highlight.left}px, ${highlight.top}px)`,
                  width: highlight.width,
                  height: highlight.height,
                }}
              />
            ))}
          </div>
        )}
      </>
    );
  },
);
Toolbar.displayName = "Toolbar";

export default Toolbar;
