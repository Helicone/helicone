import { ModelDetails } from "@/packages/cost/interfaces/Cost";

interface ModelInfoCardProps {
  modelDetails?: ModelDetails;
  title: string;
}

const ModelInfoCard = ({ modelDetails, title }: ModelInfoCardProps) => {
  if (!modelDetails) return null;

  // Extract model name from title for mocking
  const modelName = title.split(" ")[0];

  console.log(modelDetails);

  return (
    <div className="w-[400px] p-[17px] bg-white rounded-md shadow border border-slate-200 flex-col justify-start items-start gap-4 inline-flex">
      {/* Header */}
      <div className="self-stretch h-11 flex-col justify-start items-start gap-2 flex">
        <div className="justify-start items-center gap-2 inline-flex">
          <div className="w-4 h-4 relative"></div>
          <div className="text-black text-base font-medium font-['Inter'] leading-none">
            {title}
          </div>
        </div>
        <div className="justify-start items-center gap-2 inline-flex">
          <div className="w-3.5 h-3.5 relative opacity-10"></div>
          <div className="text-slate-400 text-sm font-normal font-['Inter'] leading-tight">
            {Object.keys(modelDetails)[0]?.split("-")[0] || "Provider"}
          </div>
        </div>
      </div>

      {/* Model Info Section */}
      <div className="self-stretch h-[242px] flex-col justify-start items-end gap-[9px] flex">
        <div className="self-stretch h-[116px] px-4 flex-col justify-start items-start flex">
          <div className="self-stretch py-1.5 bg-white justify-start items-center gap-2 inline-flex">
            <div className="grow shrink basis-0 text-slate-400 text-sm font-normal font-['Inter'] leading-tight">
              {modelDetails.info.description}
            </div>
          </div>
          <div className="self-stretch py-1.5 bg-white justify-start items-center gap-2 inline-flex">
            <div className="grow shrink basis-0 text-slate-500 text-sm font-medium font-['Inter'] leading-tight">
              Release Date
            </div>
            <div className="text-[#6b8c9c] text-sm font-semibold font-['Inter'] leading-[16.80px]">
              {modelDetails.info.releaseDate}
            </div>
          </div>
          <div className="self-stretch py-1.5 bg-white justify-start items-center gap-2 inline-flex">
            <div className="grow shrink basis-0 text-slate-500 text-sm font-medium font-['Inter'] leading-tight">
              Max Tokens
            </div>
            <div className="text-[#6b8c9c] text-sm font-semibold font-['Inter'] leading-[16.80px]">
              {modelDetails.info.maxTokens?.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Performance Section */}
        <div className="self-stretch h-[117px] p-4 bg-[#f2f9fc] rounded-md border border-[#e3eff2] flex-col justify-start items-start flex">
          <div className="self-stretch pb-1.5 justify-start items-center gap-2 inline-flex">
            <div className="grow shrink basis-0 text-slate-500 text-sm font-medium font-['Inter'] leading-tight">
              Performance
            </div>
          </div>
          <div className="self-stretch justify-between items-center inline-flex">
            <div className="py-1.5 bg-[#f2f9fc] flex-col justify-center items-start gap-2 inline-flex">
              <div className="self-stretch text-slate-400 text-sm font-medium font-['Inter'] leading-tight">
                Speed
              </div>
              <div className="text-[#0da5e8] text-base font-semibold font-['Inter'] leading-tight">
                {modelDetails.info.speed}
              </div>
            </div>
            <div className="py-1.5 bg-[#f2f9fc] flex-col justify-center items-start gap-2 inline-flex">
              <div className="text-slate-400 text-sm font-medium font-['Inter'] leading-tight">
                Accuracy
              </div>
              <div className="text-[#0da5e8] text-base font-semibold font-['Inter'] leading-tight">
                {modelDetails.info.accuracy}
              </div>
            </div>
            <div className="py-1.5 bg-[#f2f9fc] flex-col justify-center items-start gap-2 inline-flex">
              <div className="text-slate-400 text-sm font-medium font-['Inter'] leading-tight">
                Reliability
              </div>
              <div className="text-[#0da5e8] text-base font-semibold font-['Inter'] leading-tight">
                {modelDetails.info.reliability}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="self-stretch h-[120px] px-4 pb-4 flex-col justify-start items-start flex">
        <div className="w-[143px] py-1.5 justify-center items-center gap-2.5 inline-flex">
          <div className="grow shrink basis-0 text-slate-500 text-sm font-medium font-['Inter'] leading-tight">
            Recommended for
          </div>
        </div>
        {modelDetails.info.recommendedFor.map((recommendation, index) => (
          <div
            key={index}
            className="self-stretch py-0.5 bg-white justify-start items-center gap-2 inline-flex"
          >
            <div className="w-3.5 h-3.5 relative text-slate-400">•</div>
            <div className="grow shrink basis-0 text-slate-400 text-sm font-medium font-['Inter'] leading-tight">
              {recommendation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelInfoCard;
