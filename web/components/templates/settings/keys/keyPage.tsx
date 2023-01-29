import {
  InformationCircleIcon,
  KeyIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import { useState } from "react";
import { middleTruncString } from "../../../../lib/stringHelpers";
import { hashAuth } from "../../../../lib/supabaseClient";
import { useKeys } from "../../../../lib/useKeys";
import { Database } from "../../../../supabase/database.types";
import LeftNavLayout from "../../../shared/leftNavLayout";

interface KeyPageProps {}

const KeyPage = (props: KeyPageProps) => {
  const user = useUser();

  const supabaseClient = useSupabaseClient<Database>();
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiKeys = useKeys(supabaseClient);

  async function addKey() {
    if (apiKey === "") {
      setError("Please enter a key");
      return;
    }
    if (!user?.id) {
      setError("Please login to add a key");
      return;
    }
    supabaseClient
      .from("user_api_keys")
      .insert([
        {
          user_id: user?.id!,
          api_key_hash: await hashAuth(apiKey),
          api_key_preview: middleTruncString(apiKey, 8),
        },
      ])
      .then((res) => {
        if (res.error) {
          console.error(res.error);
          setError(
            `Error saving key - please contact us on discord!\n${res.error.message}`
          );
        }
        setApiKey("");
      });
  }

  const [apiKey, setApiKey] = useState("");
  return (
    <LeftNavLayout>
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-sm text-black mt-1">
            Here you can manage what API keys you have saved. You can add as
            many as you like.
          </p>
        </div>
        <div className="pt-4 block w-full max-w-lg">
          <div className="flex flex-col">
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
          </div>
          <button
            onClick={() => {
              addKey();
            }}
            className="mt-2 rounded-md bg-black px-3.5 py-1.5 text-base font-semibold leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Add Key
          </button>
        </div>
        <i
          className="mt-4 text-sm text-black flex flex-row items-center hover:cursor-pointer"
          onClick={() => {
            setShowInfo(!showInfo);
          }}
        >
          your key is never stored on our servers
          <InformationCircleIcon className="h-5 mx-1" />
        </i>
        {showInfo && (
          <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-col gap-2 mt-2">
            <p>
              We log each request to our API using a hashed version of your API
              key. This allows us to identify your account without storing your
              API key.
            </p>
            <p>
              When you paste your API key into the input above, we hash it using
              the same algorithm we use to log requests.
            </p>
          </div>
        )}
        {error && (
          <div className="text-xs text-red-500 flex flex-col gap-2 mt-2 whitespace-pre-line">
            <p>{error}</p>
          </div>
        )}

        <h2>{apiKeys.length > 0 ? "Your keys" : "No keys found"}</h2>
        {apiKeys.map((key) => (
          <div
            className="flex flex-row gap-1 items-center justify-between max-w-sm"
            key={key.api_key_hash}
          >
            <div className="flex flex-row justify-between w-full">
              <a className="text-slate-400">{key.api_key_preview}</a>
              <a>{new Date(key.created_at).toLocaleDateString()}</a>
            </div>
            <a
              onClick={() => {
                supabaseClient
                  .from("user_api_keys")
                  .delete()
                  .eq("api_key_hash", key.api_key_hash)
                  .then((res) => {
                    if (user?.email === "valyrdemo@gmail.com") {
                      setError("You can't delete keys on the demo account");
                      return;
                    }

                    if (res.error) {
                      console.error(res.error);
                      setError(
                        `Error deleting key - please contact us on discord!\n${res.error.message}`
                      );
                    }
                  });
              }}
              className="text-red-500 hover:cursor-pointer"
            >
              <TrashIcon height={16} width={16} />
            </a>
          </div>
        ))}
      </div>
    </LeftNavLayout>
  );
};

export default KeyPage;
