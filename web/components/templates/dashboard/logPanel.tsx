import { DocumentDuplicateIcon } from "@heroicons/react/24/solid";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { middleTruncString } from "../../../lib/stringHelpers";
import { Request as ValyrRequest } from "../../../schema/request";
import { ValyrResponse } from "../../../schema/resoponse";
import { Database } from "../../../supabase/database.types";

interface Log {
  event: "request" | "response";
  id: string;
  created_at: Date;
  body: string;
}
export function Logs() {
  const client = useSupabaseClient<Database>();
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    const channel = client.channel("db-messages");
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "request" },
      (payload) => {
        console.log("REQUEST", payload);
        const request: ValyrRequest = payload.new as unknown as ValyrRequest;
        setLogs((logs) =>
          logs.concat([
            {
              event: "request",
              id: request.id,
              created_at: new Date(request.created_at),
              body: JSON.stringify(request.body),
            },
          ])
        );
      }
    );
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "response" },
      (payload) => {
        console.log("RESPONSE", payload);
        const response: ValyrResponse = payload.new as unknown as ValyrResponse;
        setLogs((logs) =>
          logs.concat([
            {
              event: "response",
              id: response.id,
              created_at: new Date(response.created_at),
              body: JSON.stringify(response.body),
            },
          ])
        );
      }
    );
    channel.subscribe(async (status) => {
      console.log("STATUS", status);
    });
  }, [client]);

  return (
    <div className="min-h-[100px]">
      {logs.reverse().map((log) => (
        <LogCard log={log} key={log.id} />
      ))}
    </div>
  );
}

function LogCard({ log: l, key }: { log: Log; key: string }): JSX.Element {
  return (
    <div
      key={key}
      className="flex flex-row justify-between items-center border-[1px] border-black rounded-lg px-5 py-3"
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <p className="text-black">{l.event}</p>
          <p className="text-black">{l.created_at.toLocaleString()}</p>
        </div>
        <div className="flex flex-row gap-2">
          <p className="text-black">{middleTruncString(l.body, 50)}</p>
        </div>
      </div>
      <DocumentDuplicateIcon
        className="h-5 w-5 text-black hover:cursor-pointer"
        onClick={() => {
          navigator.clipboard.writeText(l.body);
        }}
      />
    </div>
  );
}
