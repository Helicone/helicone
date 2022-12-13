import {
  ArrowDownIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { useState } from "react";
import { middleTruncString } from "../lib/stringHelpers";
import { hashAuth } from "../lib/supabaseClient";

export function OnBoarding({
  setAuthHash,
  setAuthPreview,
}: {
  setAuthHash: (client: string | null) => void;
  setAuthPreview: (auth: string) => void;
}) {
  const [authLocal, setAuthLocal] = useState("");
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border-[1px] border-slate-700 rounded-lg px-5 py-3 flex flex-col items-center">
          <h3 className="text-xl mb-5">Replace your OpenAI url</h3>
          <code className="bg-slate-800 p-1  px-3 text-md  text-slate-200">
            api.openai.com/v1
          </code>
          <ArrowDownIcon className="h-4" />
          <code className="bg-slate-800 py-1  px-3 text-md text-slate-200 ">
            oai.valyrai.com/v1
          </code>
          <i className="text-xs">
            <a href="https://github.com/bhunkio/app-ideas-valyr-demo/commit/d7443e5e6d2721a08863df82b34775e7e936ad30">
              example
            </a>
          </i>
        </div>
        <div className="border-[1px] border-slate-700 rounded-lg px-5 py-5 gap-3 flex flex-col items-center justify-between ">
          <h3 className="text-xl mb-5">Paste your OpenAI API key</h3>
          <div className="flex flex-col items-end">
            <input
              className="bg-slate-800 p-1  px-2"
              type="password"
              placeholder="Your OpenAI API key"
              onChange={(e) => {
                setAuthLocal(e.target.value);
              }}
            />
          </div>
          <button
            className="px-4 py-2 rounded-full text-slate-600 dark:text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-slate-100"
            onClick={() => {
              setAuthPreview(middleTruncString(authLocal, 8));
              hashAuth(authLocal).then((hash) => setAuthHash(hash));
            }}
          >
            view dashboard
          </button>
          <i className="text-sm text-slate-600 dark:text-slate-300 flex flex-row items-center">
            your key is never stored on our servers
            <InformationCircleIcon className="h-5 mx-1" />
          </i>
        </div>
      </div>
      {/* Demo button */}
      <div className="flex flex-row justify-center items-center gap-4 mt-8">
        <button
          className="px-4 py-2 rounded-full text-slate-600 dark:text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-slate-100"
          onClick={() => {
            setAuthHash(
              "1155382dfb904996467a32e42a28adf9cc0033b13874697d03527c09916a4bc7"
            );
            setAuthPreview("Demo...Demo");
          }}
        >
          Use demo API key
        </button>
      </div>
    </div>
  );
}
