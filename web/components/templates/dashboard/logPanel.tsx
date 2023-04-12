import {
  DocumentDuplicateIcon,
  MagnifyingGlassCircleIcon,
  QueueListIcon,
} from "@heroicons/react/24/outline";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { middleTruncString } from "../../../lib/stringHelpers";
import { clsx } from "../../shared/clsx";
import ThemedModal from "../../shared/themed/themedModal";
import { getUSDate, getUSDateMin } from "../../shared/utils/utils";

interface LogPanelProps {}

type LiveLogType = {
  event: "request" | "response";
  id: string;
  createdAt: string;
  body: string;
  preview: string;
};

const LogPanel = (props: LogPanelProps) => {
  const {} = props;

  const client = useSupabaseClient();
  const [open, setOpen] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<LiveLogType | null>(null);
  const [liveLogs, setLiveLogs] = useState<LiveLogType[]>([]);

  useEffect(() => {
    const channel = client.channel("db-messages");
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "request" },
      (payload) => {
        console.log("Request!", payload);
        setLiveLogs((logs) =>
          logs.concat([
            {
              event: "request",
              id: payload.new.id,
              createdAt: payload.new.created_at,
              body: JSON.stringify(payload.new.body),
              preview: payload.new.body.prompt || "n/a",
            },
          ])
        );
      }
    );
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "response" },
      (payload) => {
        console.log("Response!", payload);
        setLiveLogs((logs) =>
          logs.concat([
            {
              event: "response",
              id: payload.new.id,
              createdAt: payload.new.created_at,
              body: JSON.stringify(payload.new.body),
              preview: payload.new.body.choices[0].text || "n/a",
            },
          ])
        );
      }
    );
    channel.subscribe();
  }, [client, liveLogs]);

  return (
    <>
      <ul className="divide-y divide-gray-300 flex flex-col space-y-2.5 px-4 pb-2 overflow-auto h-full">
        {liveLogs.length > 0 ? (
          liveLogs.map((log) => (
            <div
              key={log.id}
              className="flex flex-row w-full pt-2.5 justify-between"
            >
              <div className="flex flex-row space-x-2 items-center text-xs w-full">
                <p className="text-xs font-semibold w-14">
                  {getUSDate(log.createdAt)}
                </p>
                <div className="w-20">
                  {log.event === "request" ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 font-semibold text-green-800">
                      {log.event}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 font-semibold text-blue-800">
                      {log.event}
                    </span>
                  )}
                </div>

                <div className="flex-1 truncate overflow-ellipsis">
                  {log.preview}
                </div>
                <button
                  onClick={() => {
                    setOpen(true);
                    setSelectedLog(log);
                  }}
                  className="flex flex-row w-fit justify-center items-center rounded-md bg-gray-200 text-black px-2.5 py-1 text-sm font-medium hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  View
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col h-full w-full justify-center items-center text-gray-600 space-y-4">
            <MagnifyingGlassCircleIcon className="h-10 w-10" />
            <p>Listening for logs...</p>
          </div>
        )}
      </ul>
      {open && selectedLog && (
        <ThemedModal open={open} setOpen={setOpen}>
          <div className="flex flex-col gap-4 w-full min-w-[250px] max-w-xl">
            <p className="font-bold text-lg">Live Log: {selectedLog?.id}</p>
            <pre className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-full max-h-96 leading-6 overflow-auto text-sm">
              {JSON.stringify(JSON.parse(selectedLog.body), null, 4)}
            </pre>
          </div>
        </ThemedModal>
      )}
    </>
  );
};

export default LogPanel;
