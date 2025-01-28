"use client";
import {
  CSSProperties,
  ReactNode,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";
import { PiArrowRightBold, PiCheckBold, PiXBold } from "react-icons/pi";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

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
    isLoading: boolean;
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
    ref
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
            (t) => t.hotkey?.toLowerCase() === event.key.toLowerCase()
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
          className={`!z-50 fixed top-0 left-0 rounded-full glass shadow-md 
            ${
              activeInput && !activeInput.showConfirmation
                ? "border-2 border-heliblue"
                : "border border-slate-200 dark:border-slate-800"
            }
            ${
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
                <div className="relative w-full h-full">
                  <textarea
                    ref={textareaRef}
                    className="w-64 h-full px-2.5 py-1.5 text-sm bg-white dark:bg-slate-900 outline-none resize-none rounded-l-lg hover:shadow-md placeholder-slate-400 dark:placeholder-slate-600"
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
                    readOnly={pendingEdit?.isLoading}
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
                      if (pendingEdit?.isLoading) return;

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
                    <div className="absolute bottom-0 left-0 w-full flex flex-row justify-around pb-3.5">
                      {editSuggestions
                        ?.map((suggestion) => ({
                          ...suggestion,
                          weight:
                            suggestion.condition?.(
                              // Use the selected text for conditions
                              selection?.text || ""
                            ) || 0,
                        }))
                        .sort((a, b) => b.weight - a.weight)
                        .slice(0, 2)
                        .map((suggestion, index) => (
                          <button
                            key={index}
                            className="text-xs text-tertiary hover:underline"
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
                  className="h-full w-32 p-2.5 text-sm bg-white rounded-l-full outline-none hover:shadow-md placeholder-slate-400"
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

                    if (pendingEdit?.isLoading) return;

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
                  readOnly={pendingEdit?.isLoading}
                />
              )}
              {activeInput.showConfirmation ? (
                // B. Confirmation Mode
                pendingEdit?.isLoading ? (
                  // Loading state
                  <div className="flex items-center justify-center h-full px-2.5">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-heliblue border-t-transparent" />
                  </div>
                ) : (
                  // Confirmation buttons
                  <div className="flex flex-col h-full">
                    <button
                      type="button"
                      onClick={handleAccept}
                      className={`h-1/2 px-2.5 rounded-tr-lg flex items-center justify-center interactive group-three`}
                    >
                      <PiCheckBold className="text-base group-three-hover:scale-105 text-heliblue" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDeny}
                      className={`h-1/2 px-2.5 rounded-br-lg flex items-center justify-center interactive group-three`}
                    >
                      <PiXBold className="text-base group-three-hover:scale-105" />
                    </button>
                  </div>
                )
              ) : (
                // A. Submit Mode
                <button
                  type="submit"
                  className={`flex items-center justify-center h-full px-2.5 ${
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
            <div className="h-8 w-full flex flex-row items-center gap-0 font-size-0">
              {tools.map((tool, index) => {
                const isFirst = index === 0;
                const isLast = index === tools.length - 1;
                const isOnly = tools.length === 1;

                return (
                  <Tooltip key={index} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleToolClick(tool, index)}
                        className={`flex justify-center items-center px-2.5 group-two interactive h-full w-12 text-base
                          ${
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
                        <span>{tool.label}</span>
                        {tool.hotkey && (
                          <span className="font-bold">
                            ⌘ {tool.hotkey.toUpperCase()}
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
            className="fixed z-40 inset-0 mt-[3px] max-w-lg"
            style={{
              transform: `translate(${position.preview.left}px, ${position.preview.top}px)`,
            }}
          >
            <span
              className="bg-green-500 text-white py-[3px] whitespace-pre-wrap"
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
          <div className="fixed z-1 inset-0 pointer-events-none">
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
  }
);
Toolbar.displayName = "Toolbar";

export default Toolbar;
