import { getUSDateFromString } from "@/components/shared/utils/utils";
import { MappedLLMRequest } from "@/packages/cost/llm-mappers/types";
import { useState } from "react";
import { updateRequestFeedback } from "../../../services/lib/requests";
import useNotification from "../../shared/notification/useNotification";
import FeedbackButtons from "../feedback/thumbsUpThumbsDown";
import { formatNumber } from "../users/initialColumns";
import CostPill from "./costPill";
import { CustomProperties } from "./customProperties";
import ModelPill from "./modelPill";
import { RenderMappedRequest } from "./RenderHeliconeRequest";
import StatusBadge from "./statusBadge";

interface RequestCardProps {
  request: MappedLLMRequest;
  properties: string[];
}

const RequestCard = (props: RequestCardProps) => {
  const { request, properties } = props;

  const [requestFeedback, setRequestFeedback] = useState<{
    createdAt: string | null;
    id: string | null;
    rating: boolean | null;
  }>(request.heliconeMetadata.feedback);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

  const { setNotification } = useNotification();

  const updateFeedbackHandler = async (requestId: string, rating: boolean) => {
    setIsFeedbackLoading(true);
    updateRequestFeedback(requestId, rating)
      .then((res) => {
        if (res && res.status === 200) {
          setRequestFeedback({
            ...requestFeedback,
            rating: rating,
          });
          setNotification("Feedback submitted", "success");
        }
      })
      .catch((err) => {
        console.error(err);
        setNotification("Error submitting feedback", "error");
      })
      .finally(() => {
        setIsFeedbackLoading(false);
      });
  };

  return (
    <div className="rounded-lg px-4 pb-4 pt-8 flex flex-row justify-between w-full relative gap-8">
      <div className="sticky top-8 flex flex-col space-y-4 h-full w-full max-w-md text-gray-900 dark:text-gray-100">
        <div className=" flex flex-row justify-between items-center w-full border-b border-gray-100 dark:border-gray-900 py-2">
          <div className="flex flex-row items-center gap-2">
            <p className="font-semibold text-xl">
              {getUSDateFromString(request.heliconeMetadata.createdAt)}
            </p>
            <StatusBadge
              statusType={request.heliconeMetadata.status.statusType}
              errorCode={request.heliconeMetadata.status.code}
            />
          </div>
          <FeedbackButtons
            requestId={request.id}
            defaultValue={
              request.heliconeMetadata.scores &&
              request.heliconeMetadata.scores["helicone-score-feedback"]
                ? Number(
                    request.heliconeMetadata.scores["helicone-score-feedback"]
                  ) === 1
                  ? true
                  : false
                : null
            }
          />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <ModelPill model={request.model} />

          <p className="text-sm font-semibold">
            {Number(request.heliconeMetadata.latency) / 1000}s
          </p>
          {!request.heliconeMetadata.cost &&
          request.heliconeMetadata.status.code === 200 ? (
            <CostPill />
          ) : request.heliconeMetadata.cost ? (
            <p className="text-sm font-semibold">
              ${formatNumber(request.heliconeMetadata.cost)}
            </p>
          ) : (
            <p className="text-sm font-semibold"></p>
          )}
        </div>
        <div className="flex flex-col space-y-4">
          <p className="text-sm">
            <span className="font-semibold">User:</span>{" "}
            {request.heliconeMetadata.user}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Total Tokens:</span>{" "}
            {request.heliconeMetadata.totalTokens}{" "}
            <span className="text-gray-600 text-xs">
              (Completion: {request.heliconeMetadata.completionTokens} / Prompt:{" "}
              {request.heliconeMetadata.promptTokens})
            </span>
          </p>

          {request.heliconeMetadata.customProperties &&
            properties.length > 0 && (
              <CustomProperties
                customProperties={
                  request.heliconeMetadata.customProperties as any
                }
                properties={properties}
              />
            )}
        </div>
      </div>
      <div className="w-full max-w-3xl">
        <RenderMappedRequest mapperContent={request} />
      </div>
    </div>
  );
};

export default RequestCard;
