import { ChevronDown, Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatSession } from "./HeliconeAgentContext";

interface SessionDropdownProps {
  sessions: ChatSession[];
  currentSession: ChatSession | undefined;
  currentSessionId: string | null;
  onCreateSession: () => void;
  onSwitchSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  isLoading?: boolean;
}

export function SessionDropdown({
  sessions,
  currentSession,
  currentSessionId,
  onCreateSession,
  onSwitchSession,
  onDeleteSession,
  isLoading = false,
}: SessionDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <span className="font-semibold">Agent Chat</span>
          {currentSession && (
            <span className="text-xs text-muted-foreground">
              ({currentSession.name})
            </span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuItem 
          onClick={onCreateSession} 
          className="gap-2"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4" />
          <span>New conversation</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        
        {sessions.length === 0 && !isLoading && (
          <div className="p-2 text-center text-sm text-muted-foreground">
            No conversations yet
          </div>
        )}

        {isLoading && (
          <div className="p-2 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        )}
        
        {sessions.map((session) => (
          <DropdownMenuItem
            key={session.session_id}
            className="group flex items-start gap-2 p-2"
            onSelect={(e) => {
              e.preventDefault();
              onSwitchSession(session.session_id);
            }}
          >
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-1">
                <span className={
                  currentSessionId === session.session_id 
                    ? "font-semibold text-sm truncate" 
                    : "text-sm truncate"
                }>
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
                onDeleteSession(session.session_id);
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