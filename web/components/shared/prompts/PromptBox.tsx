import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import { StateInputs } from "@/types/prompt-state";
import { createSelectionRange } from "@/utils/selection";
import { toCamelCase, toSnakeCase } from "@/utils/strings";
import { getVariableStatus, isVariable } from "@/utils/variables";

import { generateStream } from "@/lib/api/llm-old/generate-stream";
import autoCompletePrompt from "@/prompts/auto-complete";
import performEditPrompt, { suggestions } from "@/prompts/perform-edit";
import { $assistant, $system, $user } from "@/utils/generate";
import {
  cleanSuggestionIfNeeded,
  MIN_LENGTH_FOR_SUGGESTIONS,
  SUGGESTION_DELAY,
  suggestionReducer,
} from "@/utils/suggestions";

import Toolbar from "@/components/shared/prompts/Toolbar";
import LoadingDots from "@/components/shared/universal/LoadingDots";
import { processStream } from "@/lib/api/llm-old/process-stream";
import { MdKeyboardTab } from "react-icons/md";
import { PiChatDotsBold } from "react-icons/pi";

type SelectionState = {
  text: string;
  selectionStart: number;
  selectionEnd: number;
  isVariable: boolean;
} | null;

const sharedTextAreaStyles: React.CSSProperties = {
  fontFamily: "inherit",
  whiteSpace: "pre-wrap",
  overflowWrap: "break-word",
  lineHeight: "24px",
  fontSize: "16px",
  boxSizing: "border-box",
  overflow: "hidden",
  height: "100%",
  width: "100%",
  minHeight: "100%",
  minWidth: "100%",
  position: "relative",
  border: "none",
  outline: "none",
  margin: 0,
  zIndex: 2,
  gridColumn: 1,
  gridRow: 1,
  paddingTop: "0px",
  paddingBottom: "0px",
  paddingLeft: "1rem",
  paddingRight: "1rem",
} as const;

interface PromptBoxProps {
  value: string;
  onChange: (value: string) => void;
  onVariableCreate?: (variable: StateInputs) => void;
  contextText?: string;
  variables?: StateInputs[];
  disabled?: boolean;
}
export default function PromptBox({
  value,
  onChange,
  onVariableCreate,
  contextText = "",
  variables = [],
  disabled = false,
}: PromptBoxProps) {
  const [suggestionState, dispatch] = useReducer(suggestionReducer, {
    isTyping: false,
    lastTypingTime: 0,
    canShowSuggestions: true,
    suggestion: "",
    isStreaming: false,
  });
  const [selection, setSelection] = useState<SelectionState>(null);
  const toolboxRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUndoingRef = useRef(false);
  const [toolbarPosition, setToolbarPosition] = useState({
    toolbar: { top: 0, left: 0 },
    preview: { top: 0, left: 0 },
    highlights: [] as Array<{
      left: number;
      top: number;
      width: number;
      height: number;
    }>,
  });
  const [pendingEdit, setPendingEdit] = useState<{
    originalText: string;
    generatedText: string;
    start: number;
    end: number;
    isPending: boolean;
    abortController?: AbortController;
  } | null>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // AUTOCOMPLETE: CANCEL
  const abortCurrentRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  const cancelCurrentSuggestion = useCallback(() => {
    abortCurrentRequest();
    dispatch({ type: "CANCEL_SUGGESTIONS" });
  }, [abortCurrentRequest]);

  // AUTOCOMPLETE: TYPING
  useEffect(() => {
    if (suggestionState.isTyping && !isUndoingRef.current) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        if (!isUndoingRef.current) {
          dispatch({ type: "PAUSE_TYPING" });
        }
      }, SUGGESTION_DELAY);

      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }
  }, [suggestionState.isTyping, value]);
  useEffect(() => {
    // console.log("Suggestion Effect:", {
    //   isTyping: suggestionState.isTyping,
    //   canShowSuggestions: suggestionState.canShowSuggestions,
    //   textLength: value.trim().length,
    //   endsWithSpace: /[\s\n]$/.test(value),
    //   timeSinceLastType: Date.now() - suggestionState.lastTypingTime,
    // });

    if (
      suggestionState.isTyping ||
      !suggestionState.canShowSuggestions ||
      value.trim().length < MIN_LENGTH_FOR_SUGGESTIONS ||
      !/[\s\n]$/.test(value)
    ) {
      // console.log("Cancelling suggestions due to:", {
      //   isTyping: suggestionState.isTyping,
      //   canShowSuggestions: suggestionState.canShowSuggestions,
      //   textLength: value.trim().length,
      //   endsWithSpace: /[\s\n]$/.test(value),
      // });
      cancelCurrentSuggestion();
      return;
    }

    const timeSinceLastType = Date.now() - suggestionState.lastTypingTime;
    if (timeSinceLastType < SUGGESTION_DELAY) {
      // console.log("Not enough time since last type:", timeSinceLastType);
      cancelCurrentSuggestion();
      return;
    }

    // Only abort the previous request, don't cancel suggestions state
    abortCurrentRequest();

    // Create new controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchAndHandleStream = async () => {
      try {
        const prompt = autoCompletePrompt(value, contextText);
        // console.log("Fetching suggestions for:", value);

        const stream = await generateStream(
          {
            provider: "OPENROUTER",
            model: "anthropic/claude-3.5-haiku:beta",
            messages: [
              $system(prompt.system),
              $user(prompt.user),
              $assistant(prompt.prefill),
            ],
            temperature: 0.7,
            signal: controller.signal,
          },
          { headers: { "x-cancel": "0" } },
        );

        await processStream(
          stream,
          {
            initialState: { content: "", reasoning: "", calls: "" },
            onUpdate: (result) => {
              // console.log("Received suggestion:", result.content);
              dispatch({
                type: "SET_SUGGESTION",
                payload: cleanSuggestionIfNeeded(value, result.content),
              });
            },
          },
          controller.signal,
        );

        // console.log("Stopped streaming");
        if (abortControllerRef.current === controller) {
          dispatch({ type: "STOP_STREAMING" });
          abortControllerRef.current = null;
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error fetching suggestion:", error);
        }
        dispatch({ type: "STOP_STREAMING" });
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    };
    fetchAndHandleStream();

    return () => {
      controller.abort();
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    };
  }, [
    value,
    suggestionState.isTyping,
    suggestionState.canShowSuggestions,
    suggestionState.lastTypingTime,
    contextText,
    cancelCurrentSuggestion,
    abortCurrentRequest,
  ]);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // console.log("KeyDown Event:", {
    //   key: e.key,
    //   hasSuggestion: !!suggestionState.suggestion,
    // });

    // Track undo operation
    if ((e.metaKey || e.ctrlKey) && e.key === "z") {
      isUndoingRef.current = true;
      // Clear any pending typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Cancel any ongoing suggestions
      cancelCurrentSuggestion();
      // Reset after a short delay
      setTimeout(() => {
        isUndoingRef.current = false;
      }, 100);
    }

    if (e.key === "Tab" && suggestionState.suggestion) {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        document.execCommand(
          "insertText",
          false,
          cleanSuggestionIfNeeded(value, suggestionState.suggestion),
        );
        onChange(textarea.value);
      }
      dispatch({ type: "ACCEPT_SUGGESTION" });
      return;
    }

    if (!["Shift", "Control", "Alt", "Meta"].includes(e.key)) {
      // Only cancel if we're not at a word boundary
      if (!/[\s\n]$/.test(value)) {
        // console.log("Cancelling request - not at word boundary");
        abortCurrentRequest();
      }
      if (!isUndoingRef.current) {
        dispatch({ type: "TYPE" });
      }
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Don't trigger typing actions if this is an undo operation
    if (!isUndoingRef.current) {
      // Only cancel if we're not at a word boundary
      if (!/[\s\n]$/.test(newValue)) {
        // console.log("Cancelling request - not at word boundary");
        abortCurrentRequest();
      }
      dispatch({ type: "TYPE" });
    }
  };

  // VARIABLES: COLORING
  const getColoredText = () => {
    const parts = value.split(/({{[^}]*}})/g);
    return parts.map((part, i) => {
      if (isVariable(part)) {
        const varContent = part.slice(2, -2);
        const varName = varContent.trim();
        const { isValid, hasValue, value } = getVariableStatus(
          varName,
          variables,
        );

        return (
          <span
            key={i}
            className={` ${
              !isValid
                ? "text-tertiary line-through"
                : hasValue
                  ? "text-heliblue"
                  : "text-red-500"
            }`}
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // TOOLBAR: POSITION
  const updateToolboxPosition = useCallback(() => {
    // Step 1. Get All the required measurements
    if (!selection || !textareaRef.current) return;
    const textarea = textareaRef.current;
    const pre = textarea.nextElementSibling as HTMLPreElement;
    const viewPortWidth = window.innerWidth;
    const viewPortHeight = window.innerHeight;
    if (!pre) return;
    const toolbox = toolboxRef.current;
    if (!toolbox) return;
    const toolboxWidth = toolbox.getBoundingClientRect().width;

    // Step 2. Get all client rects for the range to handle multi-line selections
    const selectionRange = createSelectionRange(pre, selection);
    if (!selectionRange) return;
    const { range, preRect } = selectionRange;
    const rects = Array.from(range.getClientRects());
    const firstRect = rects[0];
    const lastRect = rects[rects.length - 1];
    const leftmostRect = Math.min(...rects.map((rect) => rect.left));
    const rightmostRect = Math.max(
      ...rects.map((rect) => rect.left + rect.width),
    );

    // Step 3. Calculate fake highlight positions
    const highlights = rects.map((rect) => ({
      left: rect.left,
      top: rect.top - textarea.scrollTop - 2,
      width: rect.width,
      height: 24,
    }));

    // Step 4. Calculate toolbar position (viewport-relative for fixed positioning)
    const selectionCenter = leftmostRect + (rightmostRect - leftmostRect) / 2;
    const toolbarLeft = Math.max(
      0,
      Math.min(
        selectionCenter - toolboxWidth / 2,
        viewPortWidth - toolboxWidth,
      ),
    );
    const toolbarTop = firstRect.top - 2;

    // Step 5. Set the toolbar positions
    setToolbarPosition({
      highlights,
      toolbar: { left: toolbarLeft, top: toolbarTop },
      preview: { left: firstRect.left, top: lastRect.bottom },
    });
  }, [selection]);
  useEffect(() => {
    const textarea = textareaRef.current;
    const toolbox = toolboxRef.current;
    if (!textarea || !toolbox) return;

    const resizeObserver = new ResizeObserver(() => {
      if (selection) requestAnimationFrame(updateToolboxPosition);
    });

    // Observe both textarea and toolbox for size changes
    resizeObserver.observe(textarea);
    resizeObserver.observe(toolbox);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && selection) {
          requestAnimationFrame(updateToolboxPosition);
        }
      },
      { threshold: [0, 1] },
    );

    // Add scroll listener to parent elements
    const handleScroll = () => {
      if (selection) requestAnimationFrame(updateToolboxPosition);
    };

    // Add listener for toolbar mode changes
    const handleToolbarModeChange = () => {
      if (selection) requestAnimationFrame(updateToolboxPosition);
    };

    resizeObserver.observe(textarea);
    intersectionObserver.observe(textarea);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("toolbarModeChange", handleToolbarModeChange);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("toolbarModeChange", handleToolbarModeChange);
    };
  }, [selection, updateToolboxPosition]);

  // CLICK OUTSIDE HANDLING
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't hide if clicking inside toolbox or if clicking inside container
      if (
        toolboxRef.current?.contains(e.target as Node) ||
        containerRef.current?.contains(e.target as Node)
      ) {
        return;
      }

      // Clear selection if clicking outside
      setSelection(null);
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Clear selection if there's no actual selection
    if (start === end) {
      setSelection(null);
      return;
    }

    const selectedText = value.slice(start, end).trim();
    if (!selectedText) {
      setSelection(null);
      return;
    }

    setSelection({
      text: selectedText,
      selectionStart: start,
      selectionEnd: end,
      isVariable: isVariable(selectedText),
    });

    // Update position immediately after selection
    requestAnimationFrame(updateToolboxPosition);
  }, [value, updateToolboxPosition]);
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Don't hide if focus is moving to toolbox
    if (toolboxRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }

    // Only clear selection if focus is moving outside container
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setSelection(null);
    }
  };
  const handleTextEdit = useCallback(
    (newValue: string, newStart: number, newEnd: number) => {
      onChange(newValue);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newStart, newEnd);
          handleSelection();
        }
      });
    },
    [onChange, handleSelection],
  );

  // TOOLBAR: EDIT - HANDLERS
  const handleGeneratedEdit = async (instruction: string) => {
    if (!selection) return;

    // Abort previous edit if any
    if (pendingEdit?.abortController) {
      pendingEdit.abortController.abort();
    }
    const controller = new AbortController(); // Create new controller

    const prompt = performEditPrompt(
      instruction,
      selection.text,
      value.slice(0, selection.selectionStart),
      value.slice(selection.selectionEnd),
    );

    try {
      setPendingEdit({
        originalText: selection.text,
        generatedText: "",
        start: selection.selectionStart,
        end: selection.selectionEnd,
        isPending: true,
        abortController: controller,
      });

      const stream = await generateStream(
        {
          provider: "OPENROUTER",
          model: "anthropic/claude-3.5-haiku:beta",
          messages: [
            $system(prompt.system),
            $user(prompt.user),
            $assistant(prompt.prefill),
          ],
          temperature: 1,
          stop: ["</edited_target>"],
          signal: controller.signal, // Pass signal to generateStream
        },
        { headers: { "x-cancel": "0" } },
      );

      // Use processStream for the edit generation
      await processStream(
        stream,
        {
          initialState: { content: "", reasoning: "", calls: "" }, // Initial state
          onUpdate: (result) => {
            setPendingEdit((prev) =>
              prev ? { ...prev, generatedText: result.content.trim() } : null,
            );
          },
        },
        controller.signal, // Pass signal to processStream
      );
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error generating edit:", error);
        setPendingEdit(null); // Clear pending edit on non-abort error
      }
      // If it was an abort error, pendingEdit might have already been cleared by handleDenyEdit
    } finally {
      setPendingEdit((prev) => (prev ? { ...prev, isPending: false } : null));
    }
  };
  const handleAcceptEdit = () => {
    if (!pendingEdit) return;

    const newValue =
      value.slice(0, pendingEdit.start) +
      pendingEdit.generatedText +
      value.slice(pendingEdit.end);

    // Update the text and selection in one go
    onChange(newValue);
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          pendingEdit.start,
          pendingEdit.start + pendingEdit.generatedText.length,
        );
        handleSelection();
      }
    });

    setPendingEdit(null);
  };
  const handleDenyEdit = () => {
    setPendingEdit((prev) => {
      if (prev?.abortController) {
        prev.abortController.abort(); // Abort the stream on deny
      }
      return null; // Clear pending edit state
    });
  };

  // TOOLBAR: TOOLS
  const tools = [
    {
      icon: <h3 className="font-medium">{"{{}}"}</h3>,
      label: "Make Into Input",
      hotkey: "e",
      onSubmit: (varName: string) => {
        if (!selection || !textareaRef.current) return;
        const cleanedVarName = toCamelCase(varName);
        const newText = `{{${cleanedVarName}}}`;
        const newValue =
          value.slice(0, selection.selectionStart) +
          newText +
          value.slice(selection.selectionEnd);

        // Create new variable and notify parent
        onVariableCreate?.({
          name: cleanedVarName,
          value: selection.text,
          isValid: true,
        });

        // Update content
        onChange(newValue);

        const newStart = selection.selectionStart;
        const newEnd = selection.selectionStart + newText.length;

        handleTextEdit(newValue, newStart, newEnd);
      },
      placeholder: "Input name...",
    },
    {
      icon: <h3 className="font-medium">{"</>"}</h3>,
      label: "Wrap In Delimiters",
      hotkey: "j",
      onSubmit: (tagName: string) => {
        if (!selection || !textareaRef.current) return;

        const selectedText = selection.text;
        const cleanedTagName = toSnakeCase(tagName);
        const newText = `<${cleanedTagName}>\n${selectedText}\n</${cleanedTagName}>`;

        const newValue =
          value.slice(0, selection.selectionStart) +
          newText +
          value.slice(selection.selectionEnd);

        const newStart = selection.selectionStart;
        const newEnd = selection.selectionStart + newText.length;

        handleTextEdit(newValue, newStart, newEnd);
      },
      placeholder: "Delimiter name...",
    },
    {
      icon: <PiChatDotsBold />,
      label: "Perform an Edit",
      hotkey: "k",
      multiline: true,
      showConfirmation: true,
      onSubmit: handleGeneratedEdit,
      onAccept: handleAcceptEdit,
      onDeny: handleDenyEdit,
      placeholder: "Describe your edit...",
    },
  ];

  return (
    <div
      ref={containerRef}
      className={`group relative grid h-full w-full grid-cols-1 grid-rows-1 caret-black focus-within:border-transparent dark:border-slate-800 dark:caret-white ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelection}
        onBlur={handleBlur}
        placeholder="Type your prompt..."
        disabled={disabled}
        style={sharedTextAreaStyles}
        className="resize-none bg-transparent text-transparent"
      />
      <pre
        aria-hidden="true"
        ref={preRef}
        style={sharedTextAreaStyles}
        className="pointer-events-none selection:bg-blue-200"
      >
        {getColoredText()}
        {/* Invisible character to ensure proper height when empty */}
        <span className="invisible">{"\u200B"}</span>
        {suggestionState.suggestion && (
          <>
            <span className="text-tertiary opacity-0 transition-opacity group-focus-within:opacity-100">
              {suggestionState.suggestion}
            </span>
            {!suggestionState.isStreaming && (
              <span className="opacity-0 transition-opacity group-focus-within:opacity-100">
                <span className="duration-250 relative inline-flex translate-x-0 items-center opacity-100 transition-all ease-out">
                  <div className="glass ml-1 flex flex-row items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-xs text-heliblue">
                    <MdKeyboardTab />
                    <label>tab</label>
                  </div>
                </span>
              </span>
            )}
          </>
        )}
        {suggestionState.isStreaming && (
          <span className="ml-1 opacity-0 transition-opacity group-focus-within:opacity-100">
            <LoadingDots />
          </span>
        )}
      </pre>
      <Toolbar
        ref={toolboxRef}
        isVisible={!!selection}
        tools={tools}
        position={toolbarPosition}
        pendingEdit={pendingEdit || undefined}
        onModeChange={updateToolboxPosition}
        editSuggestions={suggestions}
        selection={selection}
      />
    </div>
  );
}
