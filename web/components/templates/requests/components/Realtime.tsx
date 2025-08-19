import GlassHeader from "@/components/shared/universal/GlassHeader";
import { JsonRenderer } from "@/components/templates/requests/components/chatComponent/single/JsonRenderer";
import { logger } from "@/lib/telemetry/logger";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getJawnClient } from "@/lib/clients/jawn";
import { getSortedMessagesFromMappedRequest } from "@/lib/sessions/realtimeSession";
import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  PiCaretDownBold,
  PiDownloadBold,
  PiFunctionBold,
  PiGearBold,
  PiInfoBold,
  PiMicrophoneBold,
  PiPauseBold,
  PiPlayBold,
  PiSpeakerHighBold,
  PiTextTBold,
} from "react-icons/pi";
import ReactMarkdown from "react-markdown";

type MessageType =
  | "text"
  | "audio"
  | "functionCall"
  | "functionOutput"
  | "session";

interface RealtimeProps {
  mappedRequest: MappedLLMRequest;
  messageIndexFilter?: {
    startIndex: number;
    endIndex: number;
  };
  onRequestSelect?: (request_id: string) => void;
}

// Helper function to determine the default expansion state for deleted messages
const calculateDefaultExpandedStates = (
  messages: any[],
): { [key: string]: boolean } => {
  const states: { [key: string]: boolean } = {};
  messages.forEach((message, idx) => {
    const messageKey = idx.toString(); // Use index within the current filtered list + timestamp
    if (message.deleted === true) {
      // Check if it's the last message OR the next message is not an assistant message or is also deleted
      if (
        idx === messages.length - 1 ||
        messages[idx + 1].role === "user" ||
        messages[idx + 1].deleted === true
      ) {
        // Default to collapsed
        states[messageKey] = false;
      } else {
        // Default to expanded (it's deleted and the next is an assistant non-deleted message)
        states[messageKey] = true;
      }
    }
  });
  return states;
};

export const Realtime: React.FC<RealtimeProps> = ({
  mappedRequest,
  messageIndexFilter: propMessageIndexFilter,
  onRequestSelect,
}) => {
  const messageToScrollToRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(true);

  // Derive messageIndexFilter from metadata if not provided
  const derivedMessageIndexFilter = useMemo(() => {
    if (propMessageIndexFilter) {
      return propMessageIndexFilter; // Use prop if available
    }
    const stepIndexStr =
      mappedRequest.heliconeMetadata?.customProperties
        ?._helicone_realtime_step_index;
    if (stepIndexStr) {
      const stepIndex = parseInt(stepIndexStr, 10);
      if (!isNaN(stepIndex)) {
        // Create a filter for the single step index
        return {
          startIndex: stepIndex,
          endIndex: stepIndex,
        };
      }
    }

    return undefined; // No filter derived
  }, [
    propMessageIndexFilter,
    mappedRequest.heliconeMetadata?.customProperties,
  ]);

  // Get all messages sorted by timestamp
  const sortedMessages = useMemo(
    () => getSortedMessagesFromMappedRequest(mappedRequest),
    [mappedRequest],
  );

  // Define getMessageType function before using it
  const getMessageType = (message: any): MessageType => {
    if (message._type === "functionCall") return "functionCall";
    if (message._type === "function") return "functionOutput";
    if (
      message._type === "message" &&
      message.content &&
      (message.content.startsWith("{") ||
        message.content.includes('"session":'))
    ) {
      return "session";
    }
    if (message._type === "audio") return "audio";
    return "text";
  };

  // Filter messages based on the provided index filter
  const filteredMessages = useMemo(() => {
    // Use the derived filter
    if (derivedMessageIndexFilter) {
      const { startIndex, endIndex } = derivedMessageIndexFilter;

      // Filter by message index
      if (typeof startIndex === "number") {
        // Safety check for index out of bounds
        if (startIndex >= 0 && startIndex < sortedMessages.length) {
          // If we have both start and end index, get that range of messages
          if (typeof endIndex === "number" && endIndex >= startIndex) {
            const safeEndIndex = Math.min(endIndex, sortedMessages.length - 1);
            return sortedMessages.slice(startIndex, safeEndIndex + 1);
          }

          // Otherwise just get the single message at startIndex
          return [sortedMessages[startIndex]];
        } else {
          logger.warn(
            { startIndex, messageCount: sortedMessages.length },
            `Message index ${startIndex} is out of range (0-${
              sortedMessages.length - 1
            })`,
          );
          // Fall back to showing all messages if index is out of range
          return sortedMessages;
        }
      }
    }

    // If no filter, return all messages
    return sortedMessages;
  }, [sortedMessages, derivedMessageIndexFilter]);

  // State to manage the expansion of deleted messages
  const [deletedMessageStates, setDeletedMessageStates] = useState<{
    [key: string]: boolean;
  }>({});

  const defaultDeletedStates = useMemo(
    () => calculateDefaultExpandedStates(filteredMessages),
    [filteredMessages],
  );

  // Effect to update deleted message states when filters change, preserving user interactions
  useEffect(() => {
    setDeletedMessageStates((prevStates) => {
      const nextStates: { [key: string]: boolean } = {};
      filteredMessages.forEach((message, idx) => {
        const key = idx.toString();
        if (message.deleted === true) {
          // If the state for this key exists in the previous state (user might have toggled it), keep it.
          // Otherwise, use the newly calculated default state.
          nextStates[key] =
            key in prevStates ? prevStates[key] : defaultDeletedStates[key];
        }
      });
      return nextStates;
    });
  }, [filteredMessages, defaultDeletedStates]); // Only depend on filtered messages and default states

  // Toggle function remains the same
  const toggleDeletedMessage = (key: string) => {
    setDeletedMessageStates((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Get information about the active filter for display
  const filterInfo = useMemo(() => {
    // Use the derived filter
    if (
      derivedMessageIndexFilter &&
      typeof derivedMessageIndexFilter.startIndex === "number"
    ) {
      const startIndex = derivedMessageIndexFilter.startIndex;
      const endIndex = derivedMessageIndexFilter.endIndex;

      // Simple filter info that just shows the index range
      return {
        startIndex,
        endIndex,
        isFiltered: true,
      };
    }

    return null;
  }, [derivedMessageIndexFilter]);

  const ModailityIcon = ({ type }: { type: MessageType }) => {
    const icons = {
      audio: <PiMicrophoneBold size={14} className="text-secondary" />,
      functionCall: <PiFunctionBold size={14} className="text-secondary" />,
      functionOutput: <PiFunctionBold size={14} className="text-secondary" />,
      session: <PiGearBold size={14} className="text-secondary" />,
      text: <PiTextTBold size={14} className="text-secondary" />,
    };
    return icons[type];
  };

  useEffect(() => {
    if (
      messageToScrollToRef.current &&
      filterInfo?.isFiltered &&
      shouldScroll
    ) {
      messageToScrollToRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [filterInfo?.isFiltered, filteredMessages, shouldScroll]);

  return (
    <div className={`flex w-full flex-col gap-4 ${filterInfo ? "" : "pt-4"}`}>
      {/* Filter Indicator */}
      {filterInfo && (
        <GlassHeader className="h-14 flex-shrink-0 px-4">
          <h2 className="text-secondary underline">
            {filterInfo.endIndex !== undefined
              ? filterInfo.endIndex - filterInfo.startIndex === 0
                ? `Highlighting message ${filterInfo.startIndex + 1}`
                : `Highlighting messages ${filterInfo.startIndex + 1} through ${
                    filterInfo.endIndex + 1
                  }`
              : `Highlighting message ${filterInfo.startIndex + 1}`}
          </h2>
        </GlassHeader>
      )}

      {/* Messages Section */}
      <div className="gap-4">
        {sortedMessages.map((message, idx) => {
          const isUser = message.role === "user";
          const isTranscript = message._type === "audio" && message.content;
          const timestamp = message.timestamp
            ? new Date(message.timestamp).toLocaleTimeString()
            : null;
          const messageType = getMessageType(message);
          const isDeleted = message.deleted === true;
          const messageKey = `${idx}`; // Use index within the current filtered list
          const isDeletedExpanded = deletedMessageStates[messageKey] ?? false; // Use state, default to false if not set

          const shouldScrollToThisMessage =
            filterInfo?.isFiltered &&
            idx >= (filterInfo.startIndex || 0) &&
            idx <= (filterInfo.endIndex || filterInfo.startIndex || 0);
          const isFilteredMessage =
            !filterInfo?.isFiltered || shouldScrollToThisMessage;

          return (
            <div
              key={messageKey}
              ref={shouldScrollToThisMessage ? messageToScrollToRef : null}
              className={`mb-4 flex w-full flex-col px-4 pb-4 ${isUser ? "items-end" : "items-start"} ${isFilteredMessage ? "" : "text-sm opacity-85"} ${
                onRequestSelect ? "hover:cursor-pointer hover:bg-accent/50" : ""
              }`}
              onClick={() => {
                if (
                  filterInfo?.isFiltered &&
                  filterInfo?.startIndex === filterInfo?.endIndex
                ) {
                  onRequestSelect?.(
                    mappedRequest.id.replace(
                      `-step-${filterInfo?.startIndex}`,
                      `-step-${idx}`,
                    ),
                  );
                }
              }}
            >
              {isDeleted ? (
                // Collapsible structure for deleted messages
                <div className="flex w-full max-w-[80%] flex-col gap-1">
                  {/* Clickable Header */}
                  <div
                    className={`flex cursor-pointer select-none items-center space-x-2 text-xs text-secondary ${isUser ? "justify-end" : "justify-start"} ${isDeletedExpanded ? "" : "opacity-50"}`}
                    onClick={(e) => {
                      e.stopPropagation();

                      toggleDeletedMessage(messageKey);
                    }}
                  >
                    <PiCaretDownBold
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isDeletedExpanded ? "rotate-180" : ""
                      }`}
                    />
                    <span>
                      {`${isUser ? "User" : "Assistant"} 
                        ${isTranscript ? "(Transcript)" : ""}
                        ${isDeleted ? "(Deleted)" : ""}`}
                    </span>
                    {timestamp && (
                      <>
                        <span className="text-tertiary">•</span>
                        <ModailityIcon type={messageType} />
                        <span className="text-tertiary">•</span>
                        <span>{timestamp}</span>
                      </>
                    )}
                  </div>

                  {/* Collapsible Content */}
                  <div
                    className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
                      isDeletedExpanded
                        ? "max-h-[1000px] opacity-100" // Use a large max-h
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="pt-1">
                      {" "}
                      {/* Add slight padding */}
                      <div
                        className={`rounded-lg p-3 ${
                          isUser
                            ? `${
                                messageType === "session" ||
                                messageType === "functionCall"
                                  ? "border-4 border-blue-400 bg-blue-500 text-white dark:border-blue-600 dark:bg-blue-700"
                                  : messageType === "functionOutput"
                                    ? "border-4 border-slate-50 bg-slate-100 dark:border-slate-950 dark:bg-slate-900"
                                    : "bg-blue-500 text-white dark:bg-blue-700"
                              }`
                            : `bg-slate-100 dark:bg-slate-900 ${
                                messageType === "session" ||
                                messageType === "functionCall" ||
                                messageType === "functionOutput"
                                  ? "border-4 border-slate-50 dark:border-slate-950"
                                  : ""
                              }`
                        }`}
                      >
                        {/* Existing content rendering logic */}
                        {messageType === "functionCall" &&
                        message.tool_calls ? (
                          <FunctionCallContent
                            tool_call_id={message.tool_call_id}
                            tool_call={message.tool_calls[0]}
                          />
                        ) : messageType === "functionOutput" &&
                          message.tool_calls ? (
                          <FunctionOutputContent
                            tool_call_id={message.tool_call_id}
                            tool_call={message.tool_calls[0]}
                          />
                        ) : messageType === "session" ? (
                          <SessionUpdate content={message.content || ""} />
                        ) : (
                          <div className="whitespace-pre-wrap break-words">
                            {message.content || ""}
                            {messageType === "audio" && message.audio_data && (
                              <AudioPlayer
                                audioData={message.audio_data}
                                isUserMessage={isUser}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Original structure for non-deleted messages
                <div className="flex max-w-[80%] flex-col gap-1">
                  {/* Message Info */}
                  <div
                    className={`flex items-center space-x-2 text-xs text-secondary ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span>
                      {`${isUser ? "User" : "Assistant"} 
                        ${isTranscript ? "(Transcript)" : ""}`}
                    </span>
                    {timestamp && (
                      <>
                        <span className="text-tertiary">•</span>
                        <ModailityIcon type={messageType} />
                        <span className="text-tertiary">•</span>
                        <span>{timestamp}</span>
                      </>
                    )}
                  </div>

                  {/* Message Content */}
                  <div
                    className={`rounded-lg p-3 ${(() => {
                      return mappedRequest.id.split("-step-")[1] ===
                        messageKey.toString()
                        ? "font-bold transition-all duration-200"
                        : "";
                    })()} ${
                      isUser
                        ? `${
                            messageType === "session" ||
                            messageType === "functionCall"
                              ? "border-4 border-blue-400 bg-blue-500 text-white dark:border-blue-600 dark:bg-blue-700"
                              : messageType === "functionOutput"
                                ? "border-4 border-slate-50 bg-slate-100 dark:border-slate-950 dark:bg-slate-900"
                                : "bg-blue-500 text-white dark:bg-blue-700"
                          }`
                        : `bg-slate-100 dark:bg-slate-900 ${
                            messageType === "session" ||
                            messageType === "functionCall" ||
                            messageType === "functionOutput"
                              ? "border-4 border-slate-50 dark:border-slate-950"
                              : ""
                          }`
                    }`}
                  >
                    {/* Existing content rendering logic */}
                    {messageType === "functionCall" && message.tool_calls ? (
                      <FunctionCallContent
                        tool_call_id={message.tool_call_id}
                        tool_call={message.tool_calls[0]}
                      />
                    ) : messageType === "functionOutput" &&
                      message.tool_calls ? (
                      <FunctionOutputContent
                        tool_call_id={message.tool_call_id}
                        tool_call={message.tool_calls[0]}
                      />
                    ) : messageType === "session" ? (
                      <SessionUpdate content={message.content || ""} />
                    ) : (
                      <div className="whitespace-pre-wrap break-words">
                        {message.content || ""}
                        {messageType === "audio" && message.audio_data && (
                          <AudioPlayer
                            audioData={message.audio_data}
                            isUserMessage={isUser}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <div
                    className={`flex items-center space-x-2 text-xs text-secondary ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span className="text-tertiary">
                      {message.trigger_event_id && message.ending_event_id && (
                        <>
                          {`${message.trigger_event_id} -> ${message.ending_event_id}`}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getPillStyle = (type: string, label?: string) => {
  // Special handling for modalities
  if (type === "modality") {
    const modalityStyle = {
      className:
        "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300",
    };

    switch (label) {
      case "audio":
        return {
          icon: <PiMicrophoneBold className="h-3.5 w-3.5" />,
          ...modalityStyle,
        };
      case "text":
        return {
          icon: <PiTextTBold className="h-3.5 w-3.5" />,
          ...modalityStyle,
        };
      default:
        return {
          icon: <PiTextTBold className="h-3.5 w-3.5" />,
          ...modalityStyle,
        };
    }
  }

  // Other types
  switch (type) {
    case "voice":
      return {
        icon: <PiSpeakerHighBold className="h-3.5 w-3.5" />,
        className:
          "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300",
      };
    case "tool":
      return {
        icon: <PiFunctionBold className="h-3.5 w-3.5" />,
        className:
          "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300",
      };
    default:
      return {
        icon: null,
        className:
          "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300",
      };
  }
};

/* -------------------------------------------------------------------------- */
/*                           Session Features Header                          */
/* -------------------------------------------------------------------------- */
type SessionUpdateData = {
  modalities?: string[];
  voice?: string;
  tools?: Array<{ name: string }>;
  instructions?: string;
  input_audio_format?: string;
  input_audio_noise_reduction?: object | null;
  input_audio_transcription?: object | null;
  max_response_output_tokens?: number | "inf";
  model?: string;
  output_audio_format?: string;
  temperature?: number;
  tool_choice?: string;
  turn_detection?: object | null;
};
const parseSessionUpdate = (
  content: string | undefined,
): SessionUpdateData | null => {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content)?.session;
    if (!parsed) return null;
    return parsed as SessionUpdateData;
  } catch {
    return null;
  }
};

/* -------------------------------------------------------------------------- */
/*                           Special: Session Update                          */
/* -------------------------------------------------------------------------- */
interface SessionUpdateProps {
  content: string;
}
const SessionUpdate: React.FC<SessionUpdateProps> = ({ content }) => {
  const sessionData = parseSessionUpdate(content);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sessionData) {
    return <div className="whitespace-pre-wrap break-words">{content}</div>;
  }

  const items = [
    {
      label: "Modalities",
      pills:
        sessionData.modalities?.map((m) => ({ type: "modality", label: m })) ||
        [],
    },
    {
      label: "Voice",
      pills: sessionData.voice
        ? [{ type: "voice", label: sessionData.voice }]
        : [],
    },
    {
      label: "Available Tools",
      pills:
        sessionData.tools?.map((t) => ({ type: "tool", label: t.name })) || [],
    },
  ].filter((item) => item.pills && item.pills.length > 0);

  return (
    <div className="flex flex-col divide-y divide-slate-300">
      {items.map(({ label, pills }) => (
        <div key={label} className="flex flex-row justify-between gap-4 py-2">
          <span className="font-medium">{label}:</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {pills.map(({ type, label }, idx) => {
              const { icon, className } = getPillStyle(type, label);
              return (
                <span
                  key={`${type}-${idx}`}
                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
                >
                  {icon}
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      ))}

      {/* Instructions Section */}
      {sessionData.instructions && (
        <div className="flex flex-col gap-2 py-2">
          <div
            className="flex cursor-pointer select-none items-center gap-2 hover:underline"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="font-medium">Instructions:</span>
            <PiCaretDownBold
              className={`h-4 w-4 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
          <div
            className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
              isExpanded ? "max-h-full opacity-100" : "max-h-6 opacity-70"
            }`}
          >
            <ReactMarkdown className="prose prose-sm dark:prose-invert prose-headings:text-slate-50 prose-p:text-slate-200 prose-a:text-cyan-200 hover:prose-a:text-cyan-100 prose-blockquote:border-slate-400 prose-blockquote:text-slate-300 prose-strong:text-white prose-em:text-slate-300 prose-code:text-yellow-200 prose-pre:bg-slate-800/50 prose-pre:text-slate-200 prose-ol:text-slate-200 prose-ul:text-slate-200 prose-li:text-slate-200 [&_ol>li::marker]:text-white [&_ul>li::marker]:text-white">
              {sessionData.instructions}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                           Special: Function Call                           */
/* -------------------------------------------------------------------------- */
interface FunctionCallProps {
  tool_call_id?: string;
  tool_call: {
    name: string;
    arguments: Record<string, any>;
  };
}
const FunctionCallContent: React.FC<FunctionCallProps> = ({
  tool_call_id,
  tool_call,
}) => {
  if (!tool_call) return null;

  return (
    <div className="font-mono flex flex-col">
      <div className="flex flex-row items-center gap-2">
        {tool_call_id && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger>
                <PiInfoBold size={14} />
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-mono text-xs">{tool_call_id}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <span className="text-yellow-500 dark:text-yellow-400">
          {tool_call.name}
        </span>
      </div>

      <div className="flex flex-row gap-2">
        <span className="text-yellow-500 dark:text-yellow-400">{"("}</span>
        {tool_call.arguments && (
          <JsonRenderer data={tool_call.arguments} isExpanded={false} />
        )}
        <span className="text-yellow-500 dark:text-yellow-400">{")"}</span>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                          Special: Function Output                          */
/* -------------------------------------------------------------------------- */
interface FunctionOutputProps {
  tool_call_id?: string;
  tool_call: {
    name?: string;
    arguments: Record<string, any>;
  };
}
const FunctionOutputContent: React.FC<FunctionOutputProps> = ({
  tool_call_id,
  tool_call,
}) => {
  if (!tool_call) return null;

  return (
    <div className="font-mono flex flex-col">
      <div className="flex flex-row items-center gap-2">
        <span className="text-green-400 dark:text-green-500">
          {tool_call_id ? `${tool_call_id} =>` : ""}
        </span>
      </div>
      <JsonRenderer data={tool_call.arguments} isExpanded={false} />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                            Special: Audio Player                           */
/* -------------------------------------------------------------------------- */
interface AudioPlayerProps {
  audioData: string; // Base64 encoded audio data
  isUserMessage?: boolean; // Whether this is a user message (for styling)
  audioFormat?: string; // Format hint from the API (pcm16)
}

type ConversionStatus = "idle" | "loading" | "success" | "error";

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioData,
  isUserMessage = false,
}) => {
  const jawn = getJawnClient();
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  // New state for conversion status and error message
  const [conversionStatus, setConversionStatus] =
    useState<ConversionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [convertedWavData, setConvertedWavData] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const progressRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!audioData) {
      setConversionStatus("idle"); // Reset if audioData is gone
      return;
    }

    let isCancelled = false; // Flag to prevent state updates on unmounted component

    const convertAudio = async () => {
      setConversionStatus("loading");
      setErrorMessage(null);
      setConvertedWavData(null); // Clear previous data

      try {
        const response = await jawn.POST("/v1/audio/convert-to-wav", {
          body: { audioData },
        });

        if (isCancelled) return; // Don't update if component unmounted

        if (response.data?.error || !response.data?.data) {
          throw new Error(
            response.data?.error || "Conversion failed: No data returned",
          );
        }
        setConvertedWavData(response.data.data);
        setConversionStatus("success");
      } catch (err: any) {
        if (isCancelled) return; // Don't update if component unmounted
        logger.error({ error: err }, "Error converting audio");
        setErrorMessage(`Conversion failed: ${err.message}`);
        setConversionStatus("error");
      }
      // No finally block needed as status covers loading state
    };

    convertAudio();

    // Cleanup function to prevent state updates on unmount
    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioData]); // Only run when audioData changes

  const handlePlayPause = () => {
    // Should only be callable when status is 'success' due to disabled state
    if (conversionStatus !== "success" || !convertedWavData) return;

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        // isPlaying state updated by onPause handler
      }
    } else {
      if (audioRef.current) {
        // Reset error specific to playback attempt
        setErrorMessage(null);
        audioRef.current.play().catch((err) => {
          logger.error({ error: err }, "Standard audio playback failed");
          const playErrorMsg = `Playback error: ${
            err.message || "Unknown error"
          }`;
          setErrorMessage(playErrorMsg);
          setConversionStatus("error"); // Set status to error to show the message
          setIsPlaying(false); // Ensure playing state is false on error
          // Note: Web Audio API fallback removed for simplicity, can be added back if needed
        });
        // isPlaying state updated by onPlay handler
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow seeking if playback is possible
    if (conversionStatus !== "success" || !audioRef.current) return;
    if (progressRef.current && audioRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = pos * duration;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes < 10 ? "0" : ""}${minutes}:${
      seconds < 10 ? "0" : ""
    }${seconds}`;
  };

  // Create audio source from base64 data
  const audioSrc = React.useMemo(() => {
    if (conversionStatus !== "success" || !convertedWavData) return "";

    try {
      // Data from backend is already WAV
      return `data:audio/wav;base64,${convertedWavData}`;
    } catch (e) {
      logger.error(
        { error: e },
        "Error creating audio source from converted data",
      );
      // Error should be handled during conversion or playback attempt
      return "";
    }
  }, [conversionStatus, convertedWavData]);

  // Handle download
  const handleDownload = () => {
    // Only allow download if conversion was successful
    if (conversionStatus !== "success" || !convertedWavData || !audioSrc)
      return;

    const link = document.createElement("a");
    link.href = audioSrc;
    link.download = `audio-message-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Button color based on message type
  const buttonClass = isUserMessage
    ? "bg-blue-600 hover:bg-blue-700 text-white"
    : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200";

  // Progress bar colors
  const progressBgClass = isUserMessage
    ? "bg-blue-400/30"
    : "bg-slate-300 dark:bg-slate-600";

  const progressFillClass = isUserMessage
    ? "bg-white"
    : "bg-blue-500 dark:bg-blue-400";

  // Handle <audio> element errors
  const handleAudioElementError = () => {
    const err = audioRef.current?.error;
    const errorMsg = err
      ? `Audio Error ${err.code}: ${err.message}`
      : "Error loading audio";

    logger.error({ errorMsg, audioError: err }, "Audio element error");
    setErrorMessage(errorMsg);
    setConversionStatus("error");
    setIsPlaying(false);
  };

  const canPlay = conversionStatus === "success";
  const commonDisabledProps = {
    disabled: !canPlay,
    className: `flex items-center justify-center w-8 h-8 rounded-full ${buttonClass} transition-colors ${
      !canPlay ? "opacity-50 cursor-not-allowed" : ""
    }`,
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Status Messages */}
      {conversionStatus === "loading" && (
        <div className="mb-1 text-xs text-slate-300">Converting audio...</div>
      )}
      {conversionStatus === "error" && errorMessage && (
        <div className="mb-1 text-xs text-red-500 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      {/* Audio Player - Render controls only on success, but keep layout consistent */}
      <div className="flex h-8 flex-row items-center justify-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
          {...commonDisabledProps}
        >
          {isPlaying ? (
            <PiPauseBold className="h-4 w-4" />
          ) : (
            <PiPlayBold className="h-4 w-4" />
          )}
        </button>

        {/* Progress Bar */}
        <div
          ref={progressRef}
          className={`h-2 w-24 rounded-full ${progressBgClass} ${
            !canPlay ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
          onClick={handleProgressClick} // Disabled internally by status check
        >
          <div
            className={`h-full rounded-full ${progressFillClass}`}
            style={{
              width: `${canPlay ? (currentTime / duration) * 100 : 0}%`,
            }}
          />
        </div>

        {/* Time */}
        <div className="flex flex-row gap-1 text-xs text-slate-300">
          <span className="font-mono w-10 text-start">
            {canPlay ? formatTime(currentTime) : "00:00"}
          </span>
          <span className="text-xs text-slate-300">/</span>
          <span className="font-mono w-10 text-end">
            {canPlay && duration ? formatTime(duration) : "--:--"}
          </span>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          aria-label="Download audio"
          title="Download audio"
          {...commonDisabledProps}
        >
          <PiDownloadBold className="h-4 w-4" />
        </button>
      </div>

      {/* Audio Element - Rendered only when data is ready */}
      {canPlay && audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onError={handleAudioElementError}
          className="hidden" // Hide the default audio controls
        />
      )}
    </div>
  );
};
