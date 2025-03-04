import { RenderHeliconeRequest } from "@/components/templates/requests/RenderHeliconeRequest";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HeliconeRequest, MappedLLMRequest } from "@/packages/llm-mapper/types";
import { heliconeRequestToMappedContent } from "@/packages/llm-mapper/utils/getMappedContent";
import React, { useMemo, useState } from "react";
import { FaChevronRight } from "react-icons/fa";
import { Session } from "../../../../../lib/sessions/sessionTypes";
import { useGetPropertiesV2 } from "../../../../../services/hooks/propertiesV2";
import { useGetRequests } from "../../../../../services/hooks/requests";
import { Col } from "../../../../layout/common/col";
import { Row } from "../../../../layout/common/row";
import FeedbackButtons from "../../../feedback/thumbsUpThumbsDown";
import { CustomPropertiesCard } from "../../../requests/customProperties";
import RequestDrawerV2 from "../../../requests/requestDrawerV2";
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

  const { isRealtime, effectiveRequests, originalRequest } = realtimeData;

  const sortedRequests = useMemo(() => {
    return [...effectiveRequests].sort(
      (a, b) =>
        new Date(a.request_created_at).getTime() -
        new Date(b.request_created_at).getTime()
    );
  }, [effectiveRequests]);

  // Create a memoized mapped content for the original request to avoid multiple transformations
  const mappedOriginalRequest = useMemo(() => {
    if (!originalRequest) return null;
    return heliconeRequestToMappedContent(originalRequest);
  }, [originalRequest]);

  const handleViewMore = (mappedRequest: MappedLLMRequest) => {
    setRequestDrawerRequest(mappedRequest);
    setOpen(true);
  };

  return (
    <div className="chat-session">
      {/* For realtime sessions, show the original request with all messages */}
      {isRealtime && originalRequest && mappedOriginalRequest && (
        <RequestCard
          request={originalRequest}
          mappedRequest={mappedOriginalRequest}
          isRealtime={isRealtime}
          properties={properties.properties || []}
          onViewMore={handleViewMore}
        />
      )}

      {/* For non-realtime sessions, show all requests */}
      {!isRealtime &&
        sortedRequests.map((request) => {
          const mappedRequest = heliconeRequestToMappedContent(request);
          return (
            <RequestCard
              key={request.request_id}
              request={request}
              mappedRequest={mappedRequest}
              isRealtime={isRealtime}
              properties={properties.properties || []}
              onViewMore={handleViewMore}
            />
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

// Reusable component for displaying request information
interface RequestCardProps {
  request: HeliconeRequest;
  mappedRequest: MappedLLMRequest;
  isRealtime: boolean;
  properties: any[];
  onViewMore: (mappedRequest: MappedLLMRequest) => void;
  className?: string;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  mappedRequest,
  isRealtime,
  properties,
  onViewMore,
  className = "",
}) => {
  // Only show the custom properties panel for non-simulated requests
  const showCustomProperties =
    !request.properties["_helicone_simulated_realtime"];

  return (
    <Row
      className={`h-full request-item bg-slate-50 dark:bg-slate-950  ${className}`}
    >
      <ScrollArea className="max-h-[600px] p-4">
        <RenderHeliconeRequest
          heliconeRequest={request}
          hideTopBar={true}
          className={isRealtime ? "realtime-request" : ""}
        />
      </ScrollArea>
      <div className="lg:min-w-[350px] p-5 rounded-lg bg-slate-100 dark:bg-black">
        <Col className="justify-between h-full">
          <Col className="gap-y-2">
            <Row className="justify-between mb-2 w-full">
              <StatusBadge
                statusType={mappedRequest.heliconeMetadata.status.statusType}
                errorCode={mappedRequest.heliconeMetadata.status.code}
              />
              {!isRealtime && (
                <FeedbackButtons
                  requestId={mappedRequest.id}
                  defaultValue={
                    mappedRequest.heliconeMetadata.scores &&
                    mappedRequest.heliconeMetadata.scores[
                      "helicone-score-feedback"
                    ]
                      ? Number(
                          mappedRequest.heliconeMetadata.scores[
                            "helicone-score-feedback"
                          ]
                        ) === 1
                        ? true
                        : false
                      : null
                  }
                />
              )}
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
                $ {mappedRequest.heliconeMetadata.cost}
              </div>
            </Row>
            <Row className="justify-between flex-wrap">
              <div className="text-sm text-slate-500 dark:text-slate-200 font-medium">
                {isRealtime ? "Duration" : "Latency"}
              </div>
              <div className="text-sm font-light text-slate-500 dark:text-slate-200 w-full sm:w-auto">
                {`${mappedRequest.heliconeMetadata.latency} ms`}
              </div>
            </Row>
            {showCustomProperties && (
              <Col className="justify-between flex-wrap">
                <div className="text-sm font-medium text-slate-500 dark:text-slate-200 w-full sm:w-auto">
                  Custom Properties
                </div>
                {mappedRequest.heliconeMetadata.customProperties &&
                  properties &&
                  properties.length > 0 && (
                    <CustomPropertiesCard
                      customProperties={Object.entries(
                        mappedRequest.heliconeMetadata.customProperties || {}
                      )
                        .filter(
                          ([key]) =>
                            !key.includes("Helicone-Session") &&
                            !key.includes("_helicone_")
                        )
                        .reduce((acc, [key, value]) => {
                          acc[key] = value as string;
                          return acc;
                        }, {} as Record<string, string>)}
                      properties={properties}
                    />
                  )}
              </Col>
            )}
            {isRealtime && request.properties["_helicone_realtime_role"] && (
              <Row className="justify-between flex-wrap">
                <div className="text-sm text-slate-500 dark:text-slate-200 font-medium">
                  Role
                </div>
                <div className="text-sm font-light text-slate-500 dark:text-slate-200 w-full sm:w-auto">
                  {request.properties["_helicone_realtime_role"]}
                </div>
              </Row>
            )}
          </Col>
          <Row className="justify-end mt-4">
            <button
              className="text-sm flex items-center text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              onClick={() => onViewMore(mappedRequest)}
            >
              <span className="mr-1 font-medium">View more</span>{" "}
              <FaChevronRight />
            </button>
          </Row>
        </Col>
      </div>
    </Row>
  );
};
