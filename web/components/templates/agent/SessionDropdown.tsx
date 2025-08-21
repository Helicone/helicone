import {
  ChevronDown,
  Plus,
  Trash2,
  AlertCircle,
  MessageSquareIcon,
} from "lucide-react";
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
    sessions,
    currentSessionId,
    createNewSession,
    switchToSession,
    deleteSession,
  } = useHeliconeAgent();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-auto items-center gap-2 px-3 py-2 hover:bg-muted"
        >
          <div className="flex w-full flex-col items-start">
            <span className="text-sm font-medium text-foreground">
              Agent Chat
            </span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[400px] w-72 overflow-y-auto"
      >
        <DropdownMenuItem
          onClick={createNewSession}
          className="gap-2 px-2 py-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="text-[13px]">New conversation</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {sessions.length === 0 && (
          <div className="p-3 text-center text-sm text-muted-foreground">
            No conversations yet
          </div>
        )}

        {sessions.map((session) => (
          <DropdownMenuItem
            key={session.id}
            className="group relative flex items-start gap-3"
            onSelect={(e) => {
              e.preventDefault();
              switchToSession(session.id);
            }}
          >
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <MessageSquareIcon className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/80" />
                <span
                  className={
                    currentSessionId === session.id
                      ? "truncate text-[13px] font-semibold text-foreground"
                      : "truncate text-[13px] text-foreground"
                  }
                >
                  {session.name}
                </span>
                {session.escalated && (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                )}
              </div>
              {/* <div className="mt-0.5 text-xs text-muted-foreground">
                {session.messages.length} messages
              </div> */}
            </div>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                deleteSession(session.id);
              }}
              size="sm"
              variant="ghost"
              className="invisible absolute right-0.5 top-1/2 h-6 w-6 -translate-y-1/2 bg-muted p-0 hover:bg-muted group-hover:visible"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
