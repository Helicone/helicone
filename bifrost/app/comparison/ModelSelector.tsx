interface ModelSelectorProps {
  modelA: string;
  modelB: string;
}

const ModelSelector = ({ modelA, modelB }: ModelSelectorProps) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-12">
      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="w-3 h-3 bg-red-500 rounded-sm" />
        <div className="text-lg md:text-xl font-bold px-4 py-2 bg-gradient-to-r from-red-500/10 to-transparent rounded-lg">
          {modelA}
        </div>
      </div>

      <span className="text-2xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-blue-500 animate-pulse px-4">
        VS
      </span>

      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="w-3 h-3 bg-blue-500 rounded-sm" />
        <div className="text-lg md:text-xl font-bold px-4 py-2 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg">
          {modelB}
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
