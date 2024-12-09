import React, { useState } from "react";
import { useGetRequests } from "../../../../../services/hooks/requests";
import getNormalizedRequest from "../../../requestsV2/builder/requestBuilder";
import { Row } from "../../../../layout/common/row";
import { Col } from "../../../../layout/common/col";
import RequestDrawerV2 from "../../../requestsV2/requestDrawerV2";
import { useGetPropertiesV2 } from "../../../../../services/hooks/propertiesV2";
import FeedbackButtons from "../../../feedback/thumbsUpThumbsDown";
import StatusBadge from "../../../requestsV2/statusBadge";
import { CustomPropertiesCard } from "../../../requestsV2/customProperties";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface ChatSessionProps {
  requests: ReturnType<typeof useGetRequests>;
}

const ChatSession: React.FC<ChatSessionProps> = ({ requests }) => {
  const sortedRequests = [...(requests.requests.requests ?? [])].sort(
    (a, b) =>
      new Date(a.request_created_at).getTime() -
      new Date(b.request_created_at).getTime()
  );

  const [requestDrawerRequest, setRequestDrawerRequest] = useState<
    ReturnType<typeof getNormalizedRequest> | undefined
  >(undefined);
  const [open, setOpen] = useState(false);

  const properties = useGetPropertiesV2(() => []);

  return (
    <div className="chat-session">
      {sortedRequests.map((request, idx) => {
        const normalizeRequest = getNormalizedRequest(request);
        return (
          <Row
            key={request.request_id}
            className="request-item mb-4 shadow-sm border-y border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          >
            <div className="flex-1">
              {normalizeRequest.render({
                hideTopBar: true,
                messageSlice: idx === 0 ? undefined : "lastTwo",
                className: "",
              })}
            </div>
            <div className="lg:min-w-[350px] p-5 rounded-lg bg-slate-100 dark:bg-black">
              <Col className="justify-between h-full">
                <Col className="gap-y-2">
                  <Row className="justify-between mb-2 w-full">
                    <StatusBadge
                      statusType={normalizeRequest.status.statusType}
                      errorCode={normalizeRequest.status.code}
                    />
                    <FeedbackButtons
                      requestId={normalizeRequest.id}
                      defaultValue={
                        normalizeRequest.scores &&
                        normalizeRequest.scores["helicone-score-feedback"]
                          ? Number(
                              normalizeRequest.scores["helicone-score-feedback"]
                            ) === 1
                            ? true
                            : false
                          : null
                      }
                    />
                  </Row>

                  <Row className="justify-between flex-wrap">
                    <div className="text-sm text-slate-500 dark:text-slate-200 font-medium w-full sm:w-auto">
                      Created at
                    </div>
                    <i className="text-sm font-light text-slate-500 dark:text-slate-200 w-full sm:w-auto">
                      {new Date(request.request_created_at).toLocaleString()}
                    </i>
                  </Row>
                  <Row className="justify-between flex-wrap">
                    <div className="text-sm text-slate-500 dark:text-slate-200 font-medium">
                      Cost
                    </div>
                    <div className="text-sm font-light text-slate-500 dark:text-slate-200 w-full sm:w-auto">
                      $ {normalizeRequest.cost}
                    </div>
                  </Row>
                  <Row className="justify-between flex-wrap">
                    <div className="text-sm text-slate-500 dark:text-slate-200 font-medium">
                      Latency
                    </div>
                    <div className="text-sm font-light text-slate-500 dark:text-slate-200 w-full sm:w-auto">
                      {normalizeRequest.latency} ms
                    </div>
                  </Row>
                  <Col className="justify-between flex-wrap">
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-200 w-full sm:w-auto">
                      Custom Properties
                    </div>
                    {normalizeRequest.customProperties &&
                      properties.properties &&
                      properties.properties.length > 0 && (
                        <CustomPropertiesCard
                          customProperties={Object.entries(
                            normalizeRequest.customProperties
                          )
                            .filter(
                              ([key]) => !key.includes("Helicone-Session")
                            )
                            .reduce((acc, [key, value]) => {
                              acc[key] = value as string;
                              return acc;
                            }, {} as Record<string, string>)}
                          properties={properties.properties}
                        />
                      )}
                  </Col>
                </Col>
                <Row className="justify-end mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    onClick={() => {
                      setRequestDrawerRequest(normalizeRequest);
                      setOpen(true);
                    }}
                  >
                    <span className="mr-1 font-medium">View more</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Row>
              </Col>
            </div>
          </Row>
        );
      })}
      <RequestDrawerV2
        open={open}
        setOpen={(open) => setOpen(open)}
        request={requestDrawerRequest}
        properties={properties.properties}
      />
    </div>
  );
};

export default ChatSession;
