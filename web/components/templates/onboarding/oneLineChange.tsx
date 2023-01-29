import { ArrowDownIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/solid";

interface OneLineChangeProps {
  onBackHandler: () => void;
  onNextHandler: () => void;
}

const OneLineChange = (props: OneLineChangeProps) => {
  const { onBackHandler, onNextHandler } = props;

  return (
    <>
      <p className="font-mono text-md pb-4 mb-4 border-b border-black">
        Step 2: Replace your OpenAI URL with Valyr
      </p>
      <div className="flex flex-col border border-black rounded-lg p-8 items-center text-white text-lg sm:text-2xl bg-gray-400">
        <div className="flex flex-row bg-red-900">
          <MinusIcon className="h-4 w-4 mt-4 mx-4" />
          <code className="py-2 px-4 bg-red-800">
            <span className="p-1 rounded-md bg-red-700">api.openai</span>
            .com/v1
          </code>
        </div>

        <ArrowDownIcon className="h-6 w-6 my-2 text-black" />
        <div className="flex flex-row bg-green-900">
          <PlusIcon className="h-4 w-4 mt-4 mx-4" />
          <code className="py-2 px-4  bg-green-800">
            <span className="p-1 rounded-md bg-green-700">oai.valyrai</span>
            .com/v1
          </code>
        </div>
      </div>
      <div className="mt-8 flex flex-row w-full sm:w-2/5 justify-between">
        <button
          onClick={onBackHandler}
          className="rounded-md bg-gray-100 text-black px-3.5 py-1.5 text-base font-semibold leading-7 shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Back
        </button>
        <button
          onClick={onNextHandler}
          className="rounded-md bg-black px-3.5 py-1.5 text-base font-semibold leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Next
        </button>
      </div>
    </>
  );
};

export default OneLineChange;
