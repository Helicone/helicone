import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import ProgressBar from "./progressBar";

interface CreateAccountProps {
  onNextHandler: (email: string, password: string) => void;
  onBackHandler: () => void;
  authError?: string;
}

const CreateAccount = (props: CreateAccountProps) => {
  const { onNextHandler, onBackHandler, authError } = props;
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  return (
    <>
      <p className="font-mono text-md pb-4 mb-4 border-b border-black">
        Step 2: Get started with Valyr
      </p>
      <div className="flex flex-col border w-full sm:w-2/5 border-black rounded-lg p-8 items-center text-white bg-gray-400">
        <div className="w-full">
          <label
            htmlFor="email"
            className="block text-md font-medium text-black"
          >
            Email
          </label>
          <div className="relative mt-1 rounded-md w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <EnvelopeIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <input
              type="email"
              name="email"
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              className="text-black block w-full text-md rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>
        </div>
        <div className="w-full mt-4">
          <label
            htmlFor="password"
            className="block text-md font-medium text-black"
          >
            Password
          </label>
          <div className="relative mt-1 rounded-md w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <LockClosedIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <input
              type="password"
              name="password"
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              className="text-black block w-full text-md rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="password"
            />
          </div>
        </div>
        {authError && (
          <div className="mt-4 text-sm text-red-600 w-full">
            <p>{authError}</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-row w-full sm:w-2/5 justify-between">
        <button
          onClick={onBackHandler}
          className="rounded-md bg-gray-100 text-black px-3.5 py-1.5 text-base font-semibold leading-7 shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Back
        </button>
        <button
          onClick={() => onNextHandler(email, password)}
          className="rounded-md bg-black px-3.5 py-1.5 text-base font-semibold leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Next
        </button>
      </div>
    </>
  );
};

export default CreateAccount;
