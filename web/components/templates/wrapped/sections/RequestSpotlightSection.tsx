import React, { useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import {
  Sparkles,
  DollarSign,
  MessageSquare,
  Hash,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
  Settings,
} from "lucide-react";
import {
  MostExpensiveRequest,
  ConversationMessage,
} from "../useWrapped";
// Dynamically import ReactMarkdown with no SSR
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
  loading: () => <div className="h-4 w-full animate-pulse rounded bg-white/10" />,
});

// Wrapped-specific markdown components for dark theme
const wrappedMarkdownComponents = {
  code({ className, children, ...props }: any) {
    const isInline = !className?.includes("language-");
    if (isInline) {
      return (
        <code
          className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-sm"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        <code {...props}>{children}</code>
      </pre>
    );
  },
  p({ children }: any) {
    return <p className="leading-6">{children}</p>;
  },
  ul({ children }: any) {
    return <ul className="ml-6 list-disc">{children}</ul>;
  },
  ol({ children }: any) {
    return <ol className="ml-6 list-decimal">{children}</ol>;
  },
  li({ children }: any) {
    return <li>{children}</li>;
  },
  h1({ children }: any) {
    return <h1 className="text-xl font-semibold">{children}</h1>;
  },
  h2({ children }: any) {
    return <h2 className="text-lg font-semibold">{children}</h2>;
  },
  h3({ children }: any) {
    return <h3 className="text-base font-semibold">{children}</h3>;
  },
  blockquote({ children }: any) {
    return (
      <blockquote className="border-l-4 border-white/30 pl-4 italic text-white/70">
        {children}
      </blockquote>
    );
  },
};

interface RequestSpotlightSectionProps {
  request: MostExpensiveRequest | null;
}

const formatCost = (cost: number): string => {
  if (cost >= 1) {
    return `$${cost.toFixed(2)}`;
  }
  if (cost >= 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(6)}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const providerDisplayName = (provider: string): string => {
  const names: Record<string, string> = {
    OPENAI: "OpenAI",
    ANTHROPIC: "Anthropic",
    AZURE: "Azure",
    GOOGLE: "Google",
    COHERE: "Cohere",
    TOGETHER: "Together",
    GROQ: "Groq",
    MISTRAL: "Mistral",
    OPENROUTER: "OpenRouter",
    DEEPINFRA: "DeepInfra",
    PERPLEXITY: "Perplexity",
    BEDROCK: "Bedrock",
  };
  return names[provider.toUpperCase()] || provider;
};

const getRoleIcon = (role: string) => {
  switch (role.toLowerCase()) {
    case "user":
      return <User size={14} />;
    case "assistant":
      return <Bot size={14} />;
    case "system":
      return <Settings size={14} />;
    default:
      return <MessageSquare size={14} />;
  }
};

const getRoleLabel = (role: string): string => {
  switch (role.toLowerCase()) {
    case "user":
      return "You";
    case "assistant":
      return "AI";
    case "system":
      return "System";
    default:
      return role;
  }
};

const MessageBubble: React.FC<{
  message: ConversationMessage;
}> = ({ message }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 500;
  const isLong = message.content.length > maxLength;
  const displayContent = isExpanded
    ? message.content
    : message.content.slice(0, maxLength) + (isLong ? "..." : "");

  const isUser = message.role.toLowerCase() === "user";
  const isSystem = message.role.toLowerCase() === "system";

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} ${
        isSystem ? "justify-center" : ""
      }`}
    >
      <div
        className={`flex max-w-[85%] flex-col gap-1 ${
          isSystem ? "max-w-[95%]" : ""
        }`}
      >
        {/* Role label */}
        <div
          className={`flex items-center gap-1.5 text-xs ${
            isUser ? "justify-end" : "justify-start"
          } ${isSystem ? "justify-center" : ""}`}
        >
          <span
            className={`flex items-center gap-1 ${
              isUser
                ? "text-[#0DA5E8]"
                : isSystem
                  ? "text-white/40"
                  : "text-emerald-400"
            }`}
          >
            {getRoleIcon(message.role)}
            {getRoleLabel(message.role)}
          </span>
        </div>

        {/* Message content */}
        <div
          className={`px-4 py-3 text-sm ${
            isUser
              ? "bg-[#0DA5E8]/20 text-white"
              : isSystem
                ? "border border-white/10 bg-white/5 text-white/60 italic"
                : "bg-white/10 text-white"
          }`}
        >
          <div className="w-full whitespace-pre-wrap break-words text-left">
            <ReactMarkdown components={wrappedMarkdownComponents}>
              {displayContent}
            </ReactMarkdown>
          </div>

          {isLong && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="mt-2 flex items-center gap-1 text-xs text-[#0DA5E8] hover:text-[#0DA5E8]/80"
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={12} />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown size={12} />
                  Show more ({message.content.length - maxLength} more chars)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const RequestSpotlightSection: React.FC<RequestSpotlightSectionProps> = ({
  request,
}) => {
  const router = useRouter();

  if (!request) {
    return null;
  }

  const handleViewRequest = () => {
    router.push(`/requests?requestId=${request.requestId}`);
  };

  const hasConversation =
    request.conversation && request.conversation.messages.length > 0;

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
      <div className="flex w-full max-w-4xl flex-col items-center gap-12">
        {/* Title */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-amber-500/20 p-4">
            <Sparkles className="text-amber-400" size={40} />
          </div>
          <h2
            className="text-5xl font-bold text-white sm:text-6xl md:text-7xl"
          >
            Request Spotlight
          </h2>
          <p className="text-lg text-white/60">
            Your most expensive request (last 3 months)
          </p>
        </div>

        {/* Stats - three separate boxes */}
        <div className="grid w-full grid-cols-3 gap-4">
          {/* Cost box */}
          <div className="flex flex-col items-center gap-2 border border-amber-500/30 bg-amber-500/10 p-6 backdrop-blur-sm">
            <DollarSign className="text-amber-400" size={24} />
            <span className="text-3xl font-bold text-white sm:text-4xl">
              {formatCost(request.cost)}
            </span>
            <span className="text-sm text-white/50">cost</span>
          </div>

          {/* Turns box */}
          <div className="flex flex-col items-center gap-2 border border-[#0DA5E8]/30 bg-[#0DA5E8]/10 p-6 backdrop-blur-sm">
            <Hash className="text-[#0DA5E8]" size={24} />
            <span className="text-3xl font-bold text-white sm:text-4xl">
              {request.conversation?.turnCount ?? 1}
            </span>
            <span className="text-sm text-white/50">
              {(request.conversation?.turnCount ?? 1) === 1 ? "turn" : "turns"}
            </span>
          </div>

          {/* Words box */}
          <div className="flex flex-col items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 p-6 backdrop-blur-sm">
            <FileText className="text-emerald-400" size={24} />
            <span className="text-3xl font-bold text-white sm:text-4xl">
              {(request.conversation?.totalWords ?? 0).toLocaleString()}
            </span>
            <span className="text-sm text-white/50">words</span>
          </div>
        </div>

        {/* Metadata pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span
            className="max-w-[200px] truncate border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white"
            title={request.model}
          >
            {request.model}
          </span>
          <span className="border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white/70">
            {providerDisplayName(request.provider)}
          </span>
          <span className="border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white/70">
            {formatDate(request.createdAt)}
          </span>
        </div>

        {/* Conversation section */}
        {hasConversation && (
          <div className="w-full border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2 text-white/70">
              <MessageSquare size={18} />
              <span className="font-medium">The Conversation</span>
            </div>

            {/* Scrollable messages container */}
            <div className="max-h-[400px] overflow-y-auto pr-2">
              <div className="flex flex-col gap-4">
                {request.conversation!.messages.map((msg, idx) => (
                  <MessageBubble key={idx} message={msg} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fallback note if no conversation */}
        {!hasConversation && (
          <p className="text-sm text-white/40">
            Conversation preview not available
          </p>
        )}

        {/* View full request button */}
        <button
          onClick={handleViewRequest}
          className="flex items-center gap-2 text-[#0DA5E8] transition-colors hover:text-[#0DA5E8]/80"
        >
          <span>View full request</span>
          <ExternalLink size={16} />
        </button>
      </div>
    </section>
  );
};
