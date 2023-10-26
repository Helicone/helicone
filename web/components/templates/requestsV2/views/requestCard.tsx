import { getUSDate, getUSDateFromString } from "../../../shared/utils/utils";
import { NormalizedRequest } from "../builder/abstractRequestBuilder";
import ModelPill from "../modelPill";

interface RequestCardProps {
  request: NormalizedRequest;
}

const RequestCard = (props: RequestCardProps) => {
  const { request } = props;

  return (
    <div className="rounded-lg px-4 pb-4 pt-8 flex flex-row justify-between relative">
      <div className="sticky top-8 flex flex-col space-y-4 h-full">
        <p className="font-semibold text-xl">
          {new Date(request.createdAt).toLocaleString()}
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <ModelPill model={request.model} />
          <p className="text-sm">{`${request.latency} ms`}</p>
          <p className="text-sm">{`$${request.cost}`}</p>
        </div>
      </div>
      <div className="w-full max-w-3xl">{request.render}</div>
    </div>
  );
};

export default RequestCard;
