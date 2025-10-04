import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HeliconeRequest,
  MappedLLMRequest,
} from "@helicone-package/llm-mapper/types";
import { heliconeRequestToMappedContent } from "@helicone-package/llm-mapper/utils/getMappedContent";
import React, { useMemo, useState } from "react";
import { FaChevronRight } from "react-icons/fa";
import { Session } from "../../../../../lib/sessions/sessionTypes";
import { useGetPropertiesV2 } from "../../../../../services/hooks/propertiesV2";
import { useGetRequests } from "../../../../../services/hooks/requests";
import { Col } from "../../../../layout/common/col";
import { Row } from "../../../../layout/common/row";
import FeedbackAction from "../../../feedback/thumbsUpThumbsDown";
import { CustomPropertiesCard } from "../../../requests/customProperties";
import RequestDrawer from "../../../requests/RequestDrawer";
import StatusBadge from "../../../requests/statusBadge";

interface ChatSessionProps {
  session?: Session;
  requests: ReturnType<typeof useGetRequests>;
  realtimeData: {
    isRealtime: boolean;
    effectiveRequests: HeliconeRequest[];
    originalRequest: HeliconeRequest | null;
  };
}
const ChatSession: React.FC<ChatSessionProps> = ({
  requests,
  session,
  realtimeData,
}) => {
  const [requestDrawerRequest, setRequestDrawerRequest] = useState<
    MappedLLMRequest | undefined
  >(undefined);
  const [open, setOpen] = useState(false);

  const properties = useGetPropertiesV2(() => []);

  const { isRealtime, originalRequest } = realtimeData;

  const sortedRequests = useMemo(() => {
    // Use the original requests array when not in realtime mode
    const requestsToSort = isRealtime
      ? [originalRequest]
      : requests.requests.requests || [];

    return [...requestsToSort]
      .filter((req): req is HeliconeRequest => req !== null)
      .sort(
        (a, b) =>
          new Date(a?.request_created_at || "").getTime() -
          new Date(b?.request_created_at || "").getTime(),
      );
  }, [isRealtime, requests.requests.requests, originalRequest]);

  return (
    <ScrollArea className="h-full pb-12">
      <div className="chat-session">
        {sortedRequests.map((request, idx) => {
          const mappedRequest = heliconeRequestToMappedContent(request);
          return (
            <Row
              key={request.request_id}
              className="request-item mb-4 border-y border-slate-300 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <div className="flex-1">
                <RequestDrawer
                  request={mappedRequest}
                  onCollapse={() => {}}
                  showCollapse={false}
                />
              </div>
              <div className="rounded-lg bg-slate-100 p-5 dark:bg-black lg:min-w-[350px]">
                <Col className="h-full justify-between">
                  <Col className="gap-y-2">
                    <Row className="mb-2 w-full justify-between">
                      <StatusBadge
                        statusType={
                          mappedRequest.heliconeMetadata.status.statusType
                        }
                        errorCode={mappedRequest.heliconeMetadata.status.code}
                      />
                      <FeedbackAction
                        id={mappedRequest.id}
                        type="request"
                        defaultValue={
                          mappedRequest.heliconeMetadata.scores &&
                          mappedRequest.heliconeMetadata.scores[
                            "helicone-score-feedback"
                          ]
                            ? Number(
                                mappedRequest.heliconeMetadata.scores[
                                  "helicone-score-feedback"
                                ],
                              ) === 1
                              ? true
                              : false
                            : null
                        }
                      />
                    </Row>

                    <Row className="flex-wrap justify-between">
                      <div className="w-full text-sm font-medium text-slate-500 dark:text-slate-200 sm:w-auto">
                        Created at
                      </div>
                      <i className="w-full text-sm font-light text-slate-500 dark:text-slate-200 sm:w-auto">
                        {new Date(request.request_created_at).toLocaleString()}
                      </i>
                    </Row>
                    <Row className="flex-wrap justify-between">
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-200">
                        Cost
                      </div>
                      <div className="w-full text-sm font-light text-slate-500 dark:text-slate-200 sm:w-auto">
                        $ {mappedRequest.heliconeMetadata.cost}
                      </div>
                    </Row>
                    <Row className="flex-wrap justify-between">
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-200">
                        Latency
                      </div>
                      <div className="w-full text-sm font-light text-slate-500 dark:text-slate-200 sm:w-auto">
                        {mappedRequest.heliconeMetadata.latency} ms
                      </div>
                    </Row>
                    <Col className="flex-wrap justify-between">
                      <div className="w-full text-sm font-medium text-slate-500 dark:text-slate-200 sm:w-auto">
                        Custom Properties
                      </div>
                      {mappedRequest.heliconeMetadata.customProperties &&
                        properties.properties &&
                        properties.properties.length > 0 && (
                          <CustomPropertiesCard
                            customProperties={Object.entries(
                              mappedRequest.heliconeMetadata.customProperties,
                            )
                              .filter(
                                ([key]) => !key.includes("Helicone-Session"),
                              )
                              .reduce(
                                (acc, [key, value]) => {
                                  acc[key] = value as string;
                                  return acc;
                                },
                                {} as Record<string, string>,
                              )}
                            properties={properties.properties}
                          />
                        )}
                    </Col>
                  </Col>
                  <Row className="mt-4 justify-end">
                    <button
                      className="flex items-center text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      onClick={() => {
                        setRequestDrawerRequest(mappedRequest);
                        setOpen(true);
                      }}
                    >
                      <span className="mr-1 font-medium">View more</span>{" "}
                      <FaChevronRight />
                    </button>
                  </Row>
                </Col>
              </div>
            </Row>
          );
        })}
        <RequestDrawer request={requestDrawerRequest} onCollapse={() => {}} />
      </div>
    </ScrollArea>
  );
};

export default ChatSession;
