import { KeyIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

interface AddAPIKeyProps {
  onBackHandler: () => void;
  onNextHandler: (apiKey: string) => void;
  keyError?: string;
}

const AddAPIKey = (props: AddAPIKeyProps) => {
  const { onBackHandler, onNextHandler, keyError } = props;
  const [apiKey, setApiKey] = useState("");

  return (
    <>
      <p className="font-mono text-md pb-4 mb-4 border-b border-black">
        Step 3: Add OpenAI key to Valyr account
      </p>

      <div className="flex flex-col border w-full sm:w-2/5 border-black rounded-lg p-8 items-center text-white bg-gray-400">
        <div className="w-full">
          <label
            htmlFor="apiKey"
            className="block text-md font-medium text-black"
          >
            OpenAI Key
          </label>
          <div className="relative mt-1 rounded-md w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <KeyIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="password"
              name="apiKey"
              id="apiKey"
              onChange={(e) => setApiKey(e.target.value)}
              className="text-black block w-full text-md rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="your OpenAI API key"
            />
          </div>
          {keyError && (
            <p className="mt-2 text-sm text-red-600" id="email-error">
              {keyError}
            </p>
          )}
        </div>
      </div>
      <p className="font-mono text-sm mt-8 w-full sm:w-2/5">
        Your key is never stored on our servers. We log each request to our API
        using a hashed version of your API key.
      </p>
      <p className="font-mono text-sm mt-4 w-full sm:w-2/5">
        This allows us to identify your account without storing your API key.
        When you paste your API key into the input above, we hash it using the
        same algorithm we use to log requests.
      </p>

      <div className="mt-8 flex flex-row w-full sm:w-2/5 justify-between">
        <button
          onClick={onBackHandler}
          className="rounded-md bg-gray-100 text-black px-3.5 py-1.5 text-base font-semibold leading-7 shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Back
        </button>
        <button
          onClick={() => onNextHandler(apiKey)}
          className="rounded-md bg-black px-3.5 py-1.5 text-base font-semibold leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Finish
        </button>
      </div>
    </>
  );
};

export default AddAPIKey;
