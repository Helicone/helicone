import {
  ArrowTopRightOnSquareIcon,
  ChevronDoubleDownIcon,
  ChevronDoubleRightIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  InformationCircleIcon,
  KeyIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { hydrate } from "react-dom";
import { DEMO_EMAIL } from "../../../lib/constants";
import { middleTruncString } from "../../../lib/stringHelpers";
import { hashAuth } from "../../../lib/supabaseClient";
import { useKeys } from "../../../lib/useKeys";
import { Database } from "../../../supabase/database.types";
import ThemedTable from "../../shared/themedTable";

interface KeyPageProps {}

const KeyPage = (props: KeyPageProps) => {
  const user = useUser();

  const supabaseClient = useSupabaseClient<Database>();
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");

  const [keyName, setKeyName] = useState("");
  const [hashedApiKey, setHashedApiKey] = useState("");

  useEffect(() => {
    if (apiKey === "") {
      setHashedApiKey("");
      return;
    }
    hashAuth(apiKey).then((hash) => {
      setHashedApiKey(hash);
    });
  }, [apiKey]);

  const { apiKeys, getKeys } = useKeys(supabaseClient);

  async function addKey() {
    if (hashedApiKey === "") {
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
          api_key_hash: hashedApiKey,
          api_key_preview: middleTruncString(apiKey, 8),
          key_name: keyName,
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
        setError(null);
        setKeyName("");
        getKeys();
      });
  }

  return (
    <div className="flex flex-col gap-2">
      {apiKeys !== undefined && apiKeys.length < 1 && (
        <p className="text-sm text-red-600 pb-2">
          Please add an API key to get started
        </p>
      )}
      <div className="flex flex-col gap-6">
        <div className="w-full sm:w-1/3">
          <label
            htmlFor="openAIKey"
            className="block text-sm font-medium text-black"
          >
            OpenAI Key
          </label>
          <div className="relative mt-1 flex items-center">
            <input
              type="text"
              name="openAIKey"
              id="openAIKey"
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter in your OpenAI API key here"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
            />
          </div>
        </div>
        <div className="relative w-full sm:w-2/3">
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center ">
            <span className="">
              <ChevronDoubleDownIcon
                className="ml-2.5 h-4 w-4 bg-gray-100 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-2/3 gap-4 sm:gap-0">
          <div className="w-full">
            <label
              htmlFor="keyName"
              className="block text-sm font-medium text-black"
            >
              Key Name
            </label>
            <div className="relative mt-1 flex items-center">
              <input
                type="text"
                name="keyName"
                id="keyName"
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Enter in a name for this key"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="w-full">
            <label
              htmlFor="hashedKey"
              className="block text-sm font-medium text-black pl-0 sm:pl-4"
            >
              Hashed Key (generated)
            </label>
            <div className="relative mt-1 flex items-center pl-0 sm:pl-4">
              <input
                readOnly
                type="text"
                name="hashedKey"
                id="hashedKey"
                value={hashedApiKey}
                className="block w-full hover:cursor-not-allowed rounded-md bg-gray-200 border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        <div className="w-full sm:w-2/3 justify-end flex flex-row">
          <button
            onClick={addKey}
            className="rounded-md bg-black px-3.5 py-1.5 text-base font-semibold leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Add Key
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="text-sm text-black flex flex-col gap-2 mt-4">
          <p>
            We log each request to our API using a hashed version of your API
            key. This allows us to identify your account without storing your
            API key.
          </p>
          <Link
            href="https://docs.helicone.ai/getting-started/how-encryption-works"
            target="_blank"
            rel="noopener noreferrer"
            className="underline inline-flex flex-row w-fit"
          >
            <p>Learn More</p>
            <ArrowTopRightOnSquareIcon className="h-4 w-4 mt-0.5 ml-0.5" />
          </Link>
        </div>
      )}
      {error && (
        <div className="text-xs text-red-500 flex flex-col gap-2 mt-2 whitespace-pre-line">
          <p>{error}</p>
        </div>
      )}

      <ThemedTable
        columns={[
          { name: "Name", key: "key_name", hidden: false },
          { name: "Hash", key: "api_key_hash", hidden: true },
          { name: "Preview", key: "api_key_preview", hidden: true },
          { name: "Created", key: "created_at", hidden: false },
        ]}
        rows={apiKeys}
        deleteHandler={(row) => {
          supabaseClient
            .from("user_api_keys")
            .delete()
            .eq("api_key_hash", row.api_key_hash)
            .then((res) => {
              if (user?.email === DEMO_EMAIL) {
                setError("You can't delete keys on the demo account");
                return;
              }

              if (res.error) {
                console.error(res.error);
                setError(
                  `Error deleting key - please contact us on discord!\n${res.error.message}`
                );
                return;
              }
              getKeys();
            });
        }}
      />
    </div>
  );
};

export default KeyPage;
