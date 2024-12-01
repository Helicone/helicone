interface ModelSelectorProps {
  modelA: string;
  modelB: string;
  providerA: string;
  providerB: string;
}

const ModelSelector = ({
  modelA,
  modelB,
  providerA,
  providerB,
}: ModelSelectorProps) => {
  return (
    <div className="relative flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-12">
      <div className="flex-1 flex justify-end">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-sm" />
            <div className="text-lg md:text-xl font-bold px-4 py-2 bg-gradient-to-r from-red-500/10 to-transparent rounded-lg">
              {modelA}
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-1 text-right pr-4">
            {providerA.toLowerCase()}
          </div>
        </div>
      </div>

      <div className="w-32 flex justify-center">
        <span className="text-2xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-blue-500 animate-pulse">
          VS
        </span>
      </div>

      <div className="flex-1 flex justify-start">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-sm" />
            <div className="text-lg md:text-xl font-bold px-4 py-2 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg">
              {modelB}
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-1 text-right pr-4 pl-3">
            {providerB.toLowerCase()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
