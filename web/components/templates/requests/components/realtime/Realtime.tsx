import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { Buffer } from "buffer";
import React, { useState } from "react";
import {
  PiCaretDownBold,
  PiCodeBold,
  PiDownloadBold,
  PiGearBold,
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
}
export const Realtime: React.FC<RealtimeProps> = ({ mappedRequest }) => {
  // Get all messages sorted by timestamp
  const sortedMessages = [
    ...(mappedRequest.schema.request?.messages || []),
    ...(mappedRequest.schema.response?.messages || []),
  ].sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeA - timeB;
  });

  const lastMsg = sortedMessages.findLast((msg) => msg._type === "message");
  const lastSessionUpdate = parseSessionUpdate(lastMsg?.content);

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

  const ModailityIcon = ({ type }: { type: MessageType }) => {
    const icons = {
      audio: <PiMicrophoneBold size={14} className="text-secondary" />,
      functionCall: <PiCodeBold size={14} className="text-secondary" />,
      functionOutput: <PiCodeBold size={14} className="text-secondary" />,
      session: <PiGearBold size={14} className="text-secondary" />,
      text: <PiTextTBold size={14} className="text-secondary" />,
    };
    return icons[type];
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header Section */}
      {lastSessionUpdate && <SessionHeader sessionData={lastSessionUpdate} />}

      {/* Messages Section */}
      <div className="gap-4">
        {sortedMessages.map((message, idx) => {
          const isUser = message.role === "user";
          const isTranscript = message._type === "audio" && message.content;
          const timestamp = message.timestamp
            ? new Date(message.timestamp).toLocaleTimeString()
            : null;
          const messageType = getMessageType(message);

          return (
            <div
              key={`${idx}-${message.timestamp}`}
              className={`flex flex-col ${
                isUser ? "items-end" : "items-start"
              } mb-4 w-full`}
            >
              <div className="flex flex-col gap-1 max-w-[80%]">
                {/* Message Info */}
                <div
                  className={`flex items-center space-x-2 text-xs text-secondary ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <span>{`${isUser ? "User" : "Assistant"} ${
                    isTranscript ? "(Transcript)" : ""
                  }`}</span>
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
                  className={`rounded-lg p-3 ${
                    isUser
                      ? `bg-blue-500 text-white ${
                          messageType === "session" ||
                          messageType === "functionCall" ||
                          messageType === "functionOutput"
                            ? "border-4 border-blue-400 dark:border-blue-600"
                            : ""
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
                  {messageType === "functionCall" && message.tool_calls ? (
                    <FunctionCallContent toolCalls={message.tool_calls} />
                  ) : messageType === "functionOutput" ? (
                    <FunctionOutputContent
                      content={message.content || ""}
                      toolCallId={message.tool_call_id}
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
          );
        })}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                           Session Features Header                          */
/* -------------------------------------------------------------------------- */
type Pill = {
  type: string;
  label: string;
  modality?: string;
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
          icon: <PiMicrophoneBold className="w-3.5 h-3.5" />,
          ...modalityStyle,
        };
      case "text":
        return {
          icon: <PiTextTBold className="w-3.5 h-3.5" />,
          ...modalityStyle,
        };
      default:
        return {
          icon: <PiTextTBold className="w-3.5 h-3.5" />,
          ...modalityStyle,
        };
    }
  }

  // Other types
  switch (type) {
    case "voice":
      return {
        icon: <PiSpeakerHighBold className="w-3.5 h-3.5" />,
        className:
          "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300",
      };
    case "tool":
      return {
        icon: <PiCodeBold className="w-3.5 h-3.5" />,
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

type SessionUpdateData = {
  modalities?: string[];
  voice?: string;
  tools?: Array<{ name: string }>;
  instructions?: string;
};
const parseSessionUpdate = (
  content: string | undefined
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

interface SessionHeaderProps {
  sessionData: SessionUpdateData;
}
const SessionHeader: React.FC<SessionHeaderProps> = ({ sessionData }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const pills: Pill[] = [
    ...(sessionData.modalities?.map((m) => ({
      type: "modality",
      label: m,
    })) || []),
    ...(sessionData.voice ? [{ type: "voice", label: sessionData.voice }] : []),
    ...(sessionData.tools?.map((t) => ({ type: "tool", label: t.name })) || []),
  ];

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col gap-4">
      <div className="text-xs text-secondary uppercase tracking-wider">
        Realtime Session Features
      </div>

      {/* Pills Section */}
      {pills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pills.map(({ type, label }, idx) => {
            const style = getPillStyle(type, label);
            return (
              <span
                key={`${type}-${idx}`}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${style.className}`}
              >
                {style.icon}
                {label}
              </span>
            );
          })}
        </div>
      )}

      {/* Instructions Section */}
      {sessionData.instructions && (
        <div className="flex flex-col gap-2">
          <div
            className="flex items-center gap-2 cursor-pointer select-none hover:underline"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="font-medium text-sm">Instructions</span>
            <PiCaretDownBold
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
          <div
            className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out ${
              isExpanded ? "max-h-96 opacity-100" : "max-h-6 opacity-70"
            }`}
          >
            <ReactMarkdown className="prose dark:prose-invert prose-sm text-secondary">
              {sessionData.instructions}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                         Special Message Components                         */
/* -------------------------------------------------------------------------- */
interface SessionUpdateProps {
  content: string;
}
const SessionUpdate: React.FC<SessionUpdateProps> = ({ content }) => {
  const sessionData = parseSessionUpdate(content);
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
    {
      label: "Instructions",
      value: sessionData.instructions || null,
    },
  ].filter((item) => (item.pills && item.pills.length > 0) || item.value);

  return (
    <div className="flex flex-col divide-y divide-slate-300">
      {items.map(({ label, pills, value }) => (
        <div key={label} className="flex flex-row justify-between gap-4 py-2">
          <span className="font-medium">{label}:</span>
          {pills ? (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {pills.map(({ type, label }, idx) => {
                const { icon, className } = getPillStyle(type, label);
                return (
                  <span
                    key={`${type}-${idx}`}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${className}`}
                  >
                    {icon}
                    {label}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-300 truncate max-w-[16rem]">{value}</p>
          )}
        </div>
      ))}
    </div>
  );
};

interface FunctionCallContentProps {
  toolCalls: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
}
const FunctionCallContent: React.FC<FunctionCallContentProps> = ({
  toolCalls,
}) => {
  if (!toolCalls?.[0]) return null;
  const { name, arguments: args } = toolCalls[0];

  return (
    <div className="font-mono">
      <span className="text-yellow-500 dark:text-yellow-400">{name}</span>
      {args && (
        <span className="text-slate-600 dark:text-slate-300">
          {"({"}
          {Object.entries(args).map(([key, value], i) => (
            <span key={key}>
              {i > 0 && ", "}
              {key}:{" "}
              {typeof value === "string" ? `"${value}"` : JSON.stringify(value)}
            </span>
          ))}
          {"})"}
        </span>
      )}
    </div>
  );
};

interface FunctionOutputContentProps {
  content: string;
  toolCallId?: string;
}
const FunctionOutputContent: React.FC<FunctionOutputContentProps> = ({
  content,
  toolCallId,
}) => {
  return (
    <div className="font-mono">
      <span className="text-green-300">
        {toolCallId ? `[${toolCallId}] ` : ""}
      </span>
      <span className="text-slate-300">{content}</span>
    </div>
  );
};

interface AudioPlayerProps {
  audioData: string; // Base64 encoded audio data
  isUserMessage?: boolean; // Whether this is a user message (for styling)
  audioFormat?: string; // Format hint from the API (pcm16)
}
const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioData,
  isUserMessage = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const progressRef = React.useRef<HTMLDivElement>(null);

  const handlePlayPause = () => {
    if (isPlaying) {
      // If already playing, just stop
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      // Try standard HTML Audio element first
      if (audioRef.current) {
        setError(null);
        audioRef.current.play().catch(() => {
          console.error("Standard audio playback failed, trying Web Audio API");
          // If standard playback fails, try Web Audio API
          playWithWebAudio();
        });
        setIsPlaying(true);
      } else {
        // Fallback to Web Audio API if audio element not available
        playWithWebAudio();
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

  // Convert PCM16 data to WAV format for browser compatibility
  // PCM16 from OpenAI Realtime API is 16-bit, 24kHz, mono, little-endian
  const convertPcm16ToWav = (
    base64PcmData: string,
    sampleRate = 24000
  ): string => {
    try {
      // Use Buffer from 'buffer' package to decode base64 to binary data
      const binaryData = Buffer.from(base64PcmData, "base64");

      // Create WAV header (44 bytes)
      const wavHeader = new Uint8Array(44);
      const headerView = new DataView(wavHeader.buffer);

      // "RIFF" chunk descriptor
      headerView.setUint8(0, 0x52); // 'R'
      headerView.setUint8(1, 0x49); // 'I'
      headerView.setUint8(2, 0x46); // 'F'
      headerView.setUint8(3, 0x46); // 'F'

      // Chunk size (36 + data size)
      const fileSize = 36 + binaryData.length;
      headerView.setUint32(4, fileSize, true);

      // "WAVE" format
      headerView.setUint8(8, 0x57); // 'W'
      headerView.setUint8(9, 0x41); // 'A'
      headerView.setUint8(10, 0x56); // 'V'
      headerView.setUint8(11, 0x45); // 'E'

      // "fmt " sub-chunk
      headerView.setUint8(12, 0x66); // 'f'
      headerView.setUint8(13, 0x6d); // 'm'
      headerView.setUint8(14, 0x74); // 't'
      headerView.setUint8(15, 0x20); // ' '

      // Subchunk1 size (16 for PCM)
      headerView.setUint32(16, 16, true);

      // Audio format (1 for PCM)
      headerView.setUint16(20, 1, true);

      // Number of channels (1 for mono)
      headerView.setUint16(22, 1, true);

      // Sample rate - Use the provided sample rate
      // Both user and assistant audio from OpenAI Realtime API use 24kHz
      headerView.setUint32(24, sampleRate, true);

      // Byte rate (SampleRate * NumChannels * BitsPerSample/8)
      headerView.setUint32(28, sampleRate * 2, true);

      // Block align (NumChannels * BitsPerSample/8)
      headerView.setUint16(32, 2, true);

      // Bits per sample (16)
      headerView.setUint16(34, 16, true);

      // "data" sub-chunk
      headerView.setUint8(36, 0x64); // 'd'
      headerView.setUint8(37, 0x61); // 'a'
      headerView.setUint8(38, 0x74); // 't'
      headerView.setUint8(39, 0x61); // 'a'

      // Subchunk2 size (data size)
      headerView.setUint32(40, binaryData.length, true);

      // Combine header and PCM data
      const wavBytes = new Uint8Array(wavHeader.length + binaryData.length);
      wavBytes.set(wavHeader);
      wavBytes.set(new Uint8Array(binaryData), wavHeader.length);

      // Convert back to base64
      // Use a browser-compatible approach instead of Buffer
      return btoa(
        Array.from(wavBytes)
          .map((byte) => String.fromCharCode(byte))
          .join("")
      );
    } catch (e) {
      console.error("Error converting PCM16 to WAV:", e);
      // Return original data if conversion fails
      return base64PcmData;
    }
  };

  // Convert PCM16 to WAV and create audio source
  const audioSrc = React.useMemo(() => {
    if (!audioData) return "";

    try {
      // OpenAI Realtime API uses 24kHz for both user and assistant audio
      const sampleRate = 24000;
      const wavData = convertPcm16ToWav(audioData, sampleRate);
      return `data:audio/wav;base64,${wavData}`;
    } catch (e) {
      console.error("Error creating audio source:", e);

      // Fallback: try to use the original data directly
      try {
        return `data:audio/wav;base64,${audioData}`;
      } catch (fallbackError) {
        console.error("Fallback audio source also failed:", fallbackError);
        setError("Audio format error");
        return "";
      }
    }
  }, [audioData]);

  // Alternative playback method using Web Audio API
  // This can be used if the standard HTML Audio element approach fails
  const playWithWebAudio = async () => {
    if (!audioData) return;

    try {
      setError(null);

      // Decode base64 to binary
      const binaryString = atob(audioData);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert to 16-bit PCM (Int16Array)
      const pcm16Data = new Int16Array(bytes.buffer);

      // Create audio context
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();

      // OpenAI Realtime API uses 24kHz for both user and assistant audio
      const sampleRate = 24000;

      // Create buffer with correct sample rate
      const audioBuffer = audioContext.createBuffer(
        1,
        pcm16Data.length,
        sampleRate
      );
      const channelData = audioBuffer.getChannelData(0);

      // Convert Int16 to Float32 (Web Audio API format)
      for (let i = 0; i < pcm16Data.length; i++) {
        // Normalize Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
        channelData[i] = pcm16Data[i] / 32768.0;
      }

      // Create source and play
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
      setIsPlaying(true);

      // Handle playback end
      source.onended = () => {
        setIsPlaying(false);
      };
    } catch (error) {
      console.error("Web Audio API playback error:", error);
      setError(
        `Web Audio API error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setIsPlaying(false);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (!audioData) return;

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

  // Handle errors
  const handleError = () => {
    const errorMessage = audioRef.current?.error
      ? `Error code: ${audioRef.current.error.code}, message: ${audioRef.current.error.message}`
      : "Error loading audio";

    console.error("Audio element error:", errorMessage);
    setError(errorMessage);
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-500 dark:text-red-400 mb-1">
          {error}
        </div>
      )}

      {/* Audio Player */}
      <div className="flex flex-row items-center justify-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          className={`flex items-center justify-center w-8 h-8 rounded-full ${buttonClass} transition-colors ${
            error ? "opacity-50 cursor-not-allowed" : ""
          }`}
          aria-label={isPlaying ? "Pause" : "Play"}
          disabled={!!error}
        >
          {isPlaying ? (
            <PiPauseBold className="w-4 h-4" />
          ) : (
            <PiPlayBold className="w-4 h-4" />
          )}
        </button>

        {/* Progress Bar */}
        <div
          ref={progressRef}
          className={`w-24 h-2 rounded-full cursor-pointer ${progressBgClass} ${
            error ? "opacity-50" : ""
          }`}
          onClick={!error ? handleProgressClick : undefined}
        >
          <div
            className={`h-full rounded-full ${progressFillClass}`}
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        {/* Time */}
        <div className="flex flex-row gap-1 text-xs text-slate-300">
          <span className="font-mono w-10 text-start">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs text-slate-300">/</span>
          <span className="font-mono w-10 text-end">
            {duration ? formatTime(duration) : "--:--"}
          </span>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className={`flex items-center justify-center w-8 h-8 rounded-full ${buttonClass} transition-colors`}
          aria-label="Download audio"
          title="Download audio"
        >
          <PiDownloadBold className="w-4 h-4" />
        </button>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onError={handleError}
        className="hidden" // Hide the default audio controls
      />
    </div>
  );
};
