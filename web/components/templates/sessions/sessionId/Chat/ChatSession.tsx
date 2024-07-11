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

interface ChatSessionProps {
  requests: ReturnType<typeof useGetRequests>;
}

const ChatSession: React.FC<ChatSessionProps> = ({ requests }) => {
  const sortedRequests = [...(requests.requests.data?.data ?? [])].sort(
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
            className="request-item mt-5 border-2 rounded-lg"
          >
            <div>
              {normalizeRequest.render({
                hideTopBar: true,
                messageSlice: idx === 0 ? undefined : "lastTwo",
              })}
            </div>
            <div className="min-w-[350px] p-5">
              <Col className="justify-between h-full">
                <Col className="gap-y-2">
                  <Row className="justify-between">
                    <StatusBadge
                      statusType={normalizeRequest.status.statusType}
                      errorCode={normalizeRequest.status.code}
                    />
                    <FeedbackButtons
                      requestId={normalizeRequest.id}
                      defaultValue={normalizeRequest.feedback.rating}
                    />
                  </Row>

                  <Row className="justify-between">
                    <div className="text-sm text-[#6B7280] font-semibold">
                      Created at
                    </div>
                    <i className="text-sm font-thin text-[#6B7280]">
                      {new Date(request.request_created_at).toLocaleString()}
                    </i>
                  </Row>
                  <Row className="justify-between">
                    <div className="text-sm text-[#6B7280] font-semibold">
                      Cost
                    </div>
                    <div className="text-sm font-thin text-[#6B7280]">
                      $ {normalizeRequest.cost}
                    </div>
                  </Row>
                  <Row className="justify-between">
                    <div className="text-sm text-[#6B7280] font-semibold">
                      Latency
                    </div>
                    <div className="text-sm font-thin text-[#6B7280]">
                      {normalizeRequest.latency} ms
                    </div>
                  </Row>
                  <Col className="justify-between">
                    <div className="text-sm text-[#6B7280] font-semibold">
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
                <Row className="justify-end">
                  <button
                    className="text-sm"
                    onClick={() => {
                      setRequestDrawerRequest(normalizeRequest);
                      setOpen(true);
                    }}
                  >
                    view more {">"}
                  </button>
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
