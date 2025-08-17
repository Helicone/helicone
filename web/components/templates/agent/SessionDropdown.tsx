import { ChevronDown, Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHeliconeAgent } from "./HeliconeAgentContext";

export function SessionDropdown() {
  const {
    tools,
    executeTool,
    sessions,
    currentSession,
    currentSessionId,
    messages,
    createNewSession,
    updateCurrentSessionMessages,
    switchToSession,
    deleteSession,
  } = useHeliconeAgent();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <span className="font-medium">Agent Chat</span>
          {currentSession && (
            <span className="text-xs text-muted-foreground">
              ({currentSession.name})
            </span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="h-full max-h-[300px] w-64 overflow-y-auto"
      >
        <DropdownMenuItem onClick={createNewSession} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>New conversation</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {sessions.length === 0 && (
          <div className="p-2 text-center text-sm text-muted-foreground">
            No conversations yet
          </div>
        )}

        {sessions.map((session) => (
          <DropdownMenuItem
            key={session.id}
            className="group flex items-start gap-2 p-2"
            onSelect={(e) => {
              e.preventDefault();
              switchToSession(session.id);
            }}
          >
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-1">
                <span
                  className={
                    currentSessionId === session.id
                      ? "truncate text-sm font-semibold"
                      : "truncate text-sm"
                  }
                >
                  {session.name}
                </span>
                {session.escalated && (
                  <AlertCircle className="h-3 w-3 shrink-0 text-orange-500" />
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {session.messages.length} messages
              </div>
            </div>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                deleteSession(session.id);
              }}
              size="sm"
              variant="ghost"
              className="invisible h-6 w-6 p-0 group-hover:visible"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
