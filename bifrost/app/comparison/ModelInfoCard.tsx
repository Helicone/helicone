import { ModelDetails } from "@/packages/cost/interfaces/Cost";
import { CubeIcon, CheckIcon } from "@heroicons/react/24/outline";

interface ModelInfoCardProps {
  modelDetails?: ModelDetails;
  title: string;
}

const ModelInfoCard = ({ modelDetails, title }: ModelInfoCardProps) => {
  if (!modelDetails) return null;

  return (
    <div className="w-full flex-1 p-4 bg-white rounded-md shadow border border-slate-200">
      {/* Header */}
      <div className="flex gap-2">
        <CubeIcon className="w-4 h-4 text-slate-500" />
        <div className="space-y-2">
          <h3 className="text-black text-base font-medium font-['Inter'] leading-none">
            {title}
          </h3>
          <p className="text-slate-400 text-sm font-normal font-['Inter'] leading-tight">
            {Object.keys(modelDetails)[0]?.split("-")[0] || "Provider"}
          </p>
        </div>
      </div>

      {/* Description & Stats */}
      <div className="mt-4 px-4">
        <p className="text-slate-400 text-sm py-2">
          {modelDetails.info.description}
        </p>

        <div className="py-2 flex justify-between items-center">
          <span className="text-slate-500 text-sm font-medium">
            Release Date
          </span>
          <span className="text-slate-600 text-sm font-semibold">
            {modelDetails.info.releaseDate}
          </span>
        </div>

        <div className="py-2 flex justify-between items-center">
          <span className="text-slate-500 text-sm font-medium">Max Tokens</span>
          <span className="text-slate-600 text-sm font-semibold">
            {modelDetails.info.maxTokens?.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Performance Section */}
      <div className="p-4 mt-4 bg-sky-50 rounded-md border border-sky-100">
        <h4 className="text-slate-500 text-sm font-medium pb-2">Performance</h4>
        <div className="flex justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">Speed</p>
            <p className="text-sky-500 text-base font-semibold">
              {modelDetails.info.speed ?? "hihi"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Accuracy</p>
            <p className="text-sky-500 text-base font-semibold">
              {modelDetails.info.accuracy ?? "byebye"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Reliability</p>
            <p className="text-sky-500 text-base font-semibold">
              {modelDetails.info.reliability ?? "whwywhy"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <h4 className="text-slate-500 text-sm font-medium py-2">
          Recommended for
        </h4>
        <ul className="space-y-1">
          {modelDetails.info.recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-center gap-2 py-0.5">
              <CheckIcon className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-slate-400 text-sm font-medium">
                {recommendation}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ModelInfoCard;
