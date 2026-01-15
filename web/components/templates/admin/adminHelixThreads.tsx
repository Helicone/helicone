import { useOrg } from "@/components/layout/org/organizationContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { H3, H4, Muted, Small } from "@/components/ui/typography";
import { getJawnClient } from "@/lib/clients/jawn";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crown,
  MessageSquare,
  Pencil,
  Search,
  Send,
  User,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import MessageRenderer from "../agent/MessageRenderer";
import { toast } from "sonner";

interface ThreadSummary {
  id: string;
  user_id: string;
  org_id: string;
  created_at: string;
  updated_at: string;
  escalated: boolean;
  message_count: number;
  first_message: string | null;
  last_message: string | null;
  user_email: string | null;
  org_name: string | null;
  org_tier: string | null;
}

const getTierColor = (tier: string | null) => {
  switch (tier?.toLowerCase()) {
    case "enterprise":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "pro-20240913":
    case "pro":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "growth":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "free":
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
};

const ADMIN_NAME_KEY = "helix-admin-reply-name";

type StatusFilter = "all" | "escalated" | "resolved";
type TierFilter = "all" | "free" | "pro" | "growth" | "enterprise";

const AdminHelixThreads = () => {
  const [sessionId, setSessionId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("escalated");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [page, setPage] = useState(0);
  const [replyMessage, setReplyMessage] = useState("");
  const [adminName, setAdminName] = useState<string>("");
  const [isEditingName, setIsEditingName] = useState(false);
  const pageSize = 25;
  const router = useRouter();
  const selectedSessionId = router.query.sessionId as string;
  const queryClient = useQueryClient();

  useEffect(() => {
    // Load admin name from localStorage on mount
    const savedName = localStorage.getItem(ADMIN_NAME_KEY);
    if (savedName) {
      setAdminName(savedName);
    }
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      setSessionId(selectedSessionId);
    }
  }, [selectedSessionId]);

  const handleSaveAdminName = (name: string) => {
    setAdminName(name);
    localStorage.setItem(ADMIN_NAME_KEY, name);
    setIsEditingName(false);
    toast.success("Name saved");
  };

  const org = useOrg();

  // Fetch list of all threads
  const { data: threadsList, isLoading: isLoadingList } = useQuery({
    queryKey: ["helix-threads-list", statusFilter, tierFilter, page, pageSize],
    queryFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.GET("/v1/admin/helix-threads", {
        params: {
          query: {
            limit: pageSize,
            offset: page * pageSize,
            status: statusFilter,
            tier: tierFilter,
          },
        },
      });
    },
  });

  // Fetch selected thread details
  const { data: selectedThread, isLoading: isLoadingThread } = useQuery({
    queryKey: ["helix-thread", selectedSessionId],
    queryFn: () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.GET(`/v1/admin/helix-thread/{sessionId}`, {
        params: { path: { sessionId: selectedSessionId } },
      });
    },
    enabled: !!selectedSessionId,
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async (message: string) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.POST(`/v1/admin/helix-thread/{sessionId}/reply`, {
        params: { path: { sessionId: selectedSessionId } },
        body: { message, name: adminName || undefined },
      });
    },
    onSuccess: () => {
      setReplyMessage("");
      queryClient.invalidateQueries({
        queryKey: ["helix-thread", selectedSessionId],
      });
      toast.success("Reply sent", {
        description: "Your message has been added to the thread.",
      });
    },
    onError: (error) => {
      toast.error("Failed to send reply", {
        description: String(error),
      });
    },
  });

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: async (resolved: boolean) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.POST(`/v1/admin/helix-thread/{sessionId}/resolve`, {
        params: { path: { sessionId: selectedSessionId } },
        body: { resolved },
      });
    },
    onSuccess: (_, resolved) => {
      queryClient.invalidateQueries({
        queryKey: ["helix-thread", selectedSessionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["helix-threads-list"],
      });
      toast.success(resolved ? "Thread resolved" : "Thread reopened", {
        description: resolved
          ? "The thread has been marked as resolved."
          : "The thread has been reopened.",
      });
    },
    onError: (error) => {
      toast.error("Failed to update thread status", {
        description: String(error),
      });
    },
  });

  const handleSelectThread = (threadId: string) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, sessionId: threadId },
      },
      undefined,
      { shallow: true }
    );
  };

  const handleBack = () => {
    router.push(
      {
        pathname: router.pathname,
        query: {},
      },
      undefined,
      { shallow: true }
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionId.trim()) {
      handleSelectThread(sessionId.trim());
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const handleSendReply = () => {
    if (replyMessage.trim()) {
      replyMutation.mutate(replyMessage.trim());
    }
  };

  const threads = threadsList?.data?.data?.threads ?? [];
  const totalThreads = threadsList?.data?.data?.total ?? 0;
  const totalPages = Math.ceil(totalThreads / pageSize);

  return (
    <div className="flex h-full min-h-screen w-full flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selectedSessionId && (
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ChevronLeft size={16} />
              Back to list
            </Button>
          )}
          <H3>Helix Support Threads</H3>
          <Badge variant="secondary">{totalThreads} total</Badge>
        </div>

        <div className="flex items-center gap-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <Input
                placeholder="Enter session ID..."
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-64 pl-8"
              />
            </div>
            <Button type="submit" size="sm">
              View
            </Button>
          </form>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Thread List */}
        <Card className="w-[420px] flex-shrink-0">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <H4>Recent Threads</H4>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft size={14} />
                    </Button>
                    <Small className="text-muted-foreground">
                      {page + 1} / {totalPages}
                    </Small>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={(value: StatusFilter) => {
                    setStatusFilter(value);
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="h-8 w-[110px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={tierFilter}
                  onValueChange={(value: TierFilter) => {
                    setTierFilter(value);
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="h-8 w-[110px]">
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-220px)]">
              {isLoadingList ? (
                <div className="flex flex-col gap-2 p-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : threads.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-8 text-center">
                  <MessageSquare className="text-muted-foreground" size={32} />
                  <Muted>No threads found</Muted>
                </div>
              ) : (
                <div className="flex flex-col">
                  {threads.map((thread: ThreadSummary) => (
                    <button
                      key={thread.id}
                      onClick={() => handleSelectThread(thread.id)}
                      className={cn(
                        "flex flex-col gap-1 border-b p-3 text-left transition-colors hover:bg-muted/50",
                        selectedSessionId === thread.id && "bg-muted"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-muted-foreground" />
                          <Small className="max-w-[160px] truncate font-medium">
                            {thread.user_email || "Unknown user"}
                          </Small>
                        </div>
                        <div className="flex items-center gap-1">
                          {thread.org_tier && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0",
                                getTierColor(thread.org_tier)
                              )}
                            >
                              {thread.org_tier === "pro-20240913"
                                ? "Pro"
                                : thread.org_tier}
                            </Badge>
                          )}
                          {thread.escalated && (
                            <Badge
                              variant="destructive"
                              className="px-1.5 py-0 text-[10px]"
                            >
                              <AlertCircle size={10} className="mr-0.5" />
                              Esc
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Muted className="truncate text-xs">
                        {thread.org_name || thread.org_id}
                      </Muted>

                      <Muted className="line-clamp-2 text-xs">
                        {thread.first_message
                          ? thread.first_message.substring(0, 100) +
                            (thread.first_message.length > 100 ? "..." : "")
                          : "No messages"}
                      </Muted>

                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{thread.message_count} messages</span>
                        <span>
                          {formatDistanceToNow(new Date(thread.updated_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Thread Detail */}
        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardContent className="flex h-full flex-col p-0">
            {!selectedSessionId ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
                <MessageSquare className="text-muted-foreground" size={48} />
                <H4>Select a thread</H4>
                <Muted className="text-center">
                  Choose a thread from the list or enter a session ID to view
                  the conversation
                </Muted>
              </div>
            ) : isLoadingThread ? (
              <div className="flex flex-col gap-4 p-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-3/4" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : selectedThread?.data?.data ? (
              <>
                {/* Thread Header */}
                <div className="border-b bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <H4>Thread Details</H4>
                        {selectedThread.data.data.escalated ? (
                          <Badge variant="destructive">
                            <AlertCircle size={12} className="mr-1" />
                            Escalated
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          >
                            <CheckCircle size={12} className="mr-1" />
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <Muted className="font-mono text-xs">
                        {selectedThread.data.data.id}
                      </Muted>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        variant={
                          selectedThread.data.data.escalated
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          resolveMutation.mutate(
                            selectedThread.data.data.escalated
                          )
                        }
                        disabled={resolveMutation.isPending}
                      >
                        {selectedThread.data.data.escalated ? (
                          <>
                            <CheckCircle size={14} className="mr-1" />
                            {resolveMutation.isPending
                              ? "Resolving..."
                              : "Mark Resolved"}
                          </>
                        ) : (
                          <>
                            <AlertCircle size={14} className="mr-1" />
                            {resolveMutation.isPending
                              ? "Reopening..."
                              : "Reopen"}
                          </>
                        )}
                      </Button>
                      <div className="flex flex-col items-end gap-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">User:</span>
                          <span>{selectedThread.data.data.user_id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Org:</span>
                          <span className="font-mono text-xs">
                            {selectedThread.data.data.org_id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>
                      Created:{" "}
                      {new Date(
                        selectedThread.data.data.created_at
                      ).toLocaleString()}
                    </span>
                    <span>
                      Updated:{" "}
                      {new Date(
                        selectedThread.data.data.updated_at
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="flex flex-col gap-4">
                    {(selectedThread.data.data.chat as any)?.messages?.map(
                      (message: any, index: number) => (
                        <div key={message.id || index} className="group relative">
                          <MessageRenderer
                            message={message}
                            messageIndex={index}
                            onQuickstartHelp={() => {}}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute -right-2 top-0 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() =>
                              handleCopyMessage(
                                typeof message.content === "string"
                                  ? message.content
                                  : JSON.stringify(message.content)
                              )
                            }
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                      )
                    ) ?? (
                      <Muted className="text-center">
                        No messages in this thread
                      </Muted>
                    )}
                  </div>
                </ScrollArea>

                {/* Reply Input */}
                <div className="border-t bg-muted/30 p-4">
                  {/* Admin name row */}
                  <div className="mb-2 flex items-center gap-2">
                    <Small className="text-muted-foreground">Replying as:</Small>
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <Input
                          autoFocus
                          placeholder="Your name"
                          defaultValue={adminName}
                          className="h-7 w-40"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveAdminName(e.currentTarget.value);
                            } else if (e.key === "Escape") {
                              setIsEditingName(false);
                            }
                          }}
                          onBlur={(e) => {
                            if (e.currentTarget.value.trim()) {
                              handleSaveAdminName(e.currentTarget.value);
                            } else {
                              setIsEditingName(false);
                            }
                          }}
                        />
                        <Muted className="text-xs">Enter to save</Muted>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-sm font-medium hover:bg-muted"
                      >
                        {adminName || "Set your name"}
                        <Pencil size={12} className="text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="min-h-[80px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.metaKey) {
                          handleSendReply();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendReply}
                      disabled={
                        !replyMessage.trim() || replyMutation.isPending
                      }
                      className="self-end"
                    >
                      <Send size={16} className="mr-2" />
                      {replyMutation.isPending ? "Sending..." : "Send"}
                    </Button>
                  </div>
                  <Muted className="mt-2 text-xs">
                    Press Cmd+Enter to send
                  </Muted>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
                <AlertCircle className="text-destructive" size={48} />
                <H4>Thread not found</H4>
                <Muted className="text-center">
                  The thread with ID &quot;{selectedSessionId}&quot; could not
                  be found
                </Muted>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminHelixThreads;
