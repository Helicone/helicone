import { getUSDate, getUSDateFromString } from "../../../shared/utils/utils";
import { formatNumber } from "../../users/initialColumns";
import { NormalizedRequest } from "../builder/abstractRequestBuilder";
import ModelPill from "../modelPill";
import StatusBadge from "../statusBadge";

interface RequestCardProps {
  request: NormalizedRequest;
  properties: string[];
}

const RequestCard = (props: RequestCardProps) => {
  const { request, properties } = props;

  return (
    <div className="rounded-lg px-4 pb-4 pt-8 flex flex-row justify-between w-full relative gap-8">
      <div className="sticky top-8 flex flex-col space-y-4 h-full w-full max-w-md">
        <div className="flex flex-row justify-between items-center w-full border-b border-gray-100 py-2">
          <p className="font-semibold text-xl">
            {new Date(request.createdAt).toLocaleString()}
          </p>
          <StatusBadge
            statusType={request.status.statusType}
            errorCode={request.status.code}
          />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <ModelPill model={request.model} />

          <p className="text-sm font-semibold">
            {Number(request.latency) / 1000}s
          </p>
          <p className="text-sm font-semibold">{`$${formatNumber(
            request.cost || 0
          )}`}</p>
        </div>
        <div className="flex flex-col space-y-4">
          <p className="text-sm">
            <span className="font-semibold">User:</span> {request.user}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Total Tokens:</span>{" "}
            {request.totalTokens}{" "}
            <span className="text-gray-600 text-xs">
              (Completion: {request.completionTokens} / Prompt:{" "}
              {request.promptTokens})
            </span>
          </p>
          {request.customProperties &&
            properties.length > 0 &&
            Object.keys(request.customProperties).length > 0 && (
              <>
                {properties.map((property, i) => {
                  if (
                    request.customProperties &&
                    request.customProperties.hasOwnProperty(property)
                  ) {
                    return (
                      <p className="text-sm" key={i}>
                        <span className="font-semibold">{property}:</span>{" "}
                        {request.customProperties[property] as string}
                      </p>
                    );
                  }
                })}
              </>
            )}
        </div>
      </div>
      <div className="w-full max-w-3xl">{request.render}</div>
    </div>
  );
};

export default RequestCard;
