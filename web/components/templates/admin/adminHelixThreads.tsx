import { useOrg } from "@/components/layout/org/organizationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getJawnClient } from "@/lib/clients/jawn";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import MessageRenderer from "../agent/MessageRenderer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const AdminHelixThreads = () => {
  const [sessionId, setSessionId] = useState<string>("");
  const router = useRouter();
  const selectedSessionId = router.query.sessionId as string;

  useEffect(() => {
    setSessionId(selectedSessionId);
  }, [selectedSessionId]);

  const org = useOrg();

  const { data: threads } = useQuery({
    queryKey: ["helix-threads", selectedSessionId],
    queryFn: () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.GET(`/v1/admin/helix-thread/{sessionId}`, {
        params: { path: { sessionId: selectedSessionId } },
      });
    },
    enabled: !!selectedSessionId,
  });

  return (
    <div className="flex h-full min-h-screen w-full flex-col">
      <div className="flex flex-col space-y-4">
        <div className="text-xl font-semibold">Session ID</div>
        <form
          className="flex flex-row space-x-2"
          onSubmit={(e) => {
            e.preventDefault();
            router.push({
              pathname: router.pathname,
              query: { ...router.query, sessionId },
            });
          }}
        >
          <Input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
          />
          <Button type="submit">Show Thread</Button>
        </form>
      </div>

      {threads?.data && (
        <div className="flex flex-col space-y-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Details</AccordionTrigger>
              <AccordionContent>
                <ul className="list-inside list-disc">
                  <li>
                    <strong>User ID:</strong> {threads.data.data?.user_id}
                  </li>
                  <li>
                    <strong>Org ID:</strong> {threads.data.data?.org_id}
                  </li>
                  <li>
                    <strong>Created At:</strong> {threads.data.data?.created_at}
                  </li>
                  <li>
                    <strong>Updated At:</strong> {threads.data.data?.updated_at}
                  </li>
                  <li>
                    <strong>Metadata:</strong>{" "}
                    {JSON.stringify(threads.data.data?.metadata)}
                  </li>
                  <li>
                    <strong>Escalated:</strong>{" "}
                    {threads.data.data?.escalated ? "Yes" : "No"}
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          {(threads.data.data?.chat as any)?.messages.map(
            (message: any, index: number) => (
              <MessageRenderer
                message={message}
                key={message.id}
                messageIndex={index}
                onQuickstartHelp={() => {}}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default AdminHelixThreads;
