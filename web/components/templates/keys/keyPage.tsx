import {
  ArrowTopRightOnSquareIcon,
  ChevronDoubleDownIcon,
  InformationCircleIcon,
  KeyIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";

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
import useNotification from "../../shared/notification/useNotification";
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

  const { apiKeys, refreshKeys } = useKeys(supabaseClient);
  const { setNotification } = useNotification();

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
          setNotification("Error saving key", "error");
          return;
        }
        setNotification("Key Created", "success");
        setApiKey("");
        setError(null);
        setKeyName("");
        refreshKeys();
      });
  }

  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row w-full sm:w-2/3 gap-4">
          <div className="w-full">
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
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter in your OpenAI API key here"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
              />
            </div>
          </div>
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
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Enter in a name for this key"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
              />
            </div>
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
                className="h-4 w-4 bg-gray-100 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-2/3 gap-4 sm:gap-0">
          <div className="w-full">
            <div className="flex flex-row gap-1">
              <label
                htmlFor="hashedKey"
                className="block text-sm font-medium text-black pl-0"
              >
                Hashed Key (generated){" "}
              </label>
              <button className="inline" onClick={toggleInfo}>
                <InformationCircleIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mt-1 flex items-center pl-0">
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
            className="rounded-md bg-black px-3.5 py-1.5 text-base font-medium leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Add Hashed Key
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="mt-2 w-full sm:w-2/3 border-2 p-4 text-sm rounded-md flex flex-row items-center text-gray-600 border-gray-300 gap-4">
          <LightBulbIcon className="hidden sm:flex h-8 w-8 text-gray-600" />
          <p>
            We log each request to our API using a hashed version of your API
            key. This allows us to identify your account without storing your
            API key.{" "}
            <Link
              as="span"
              href="https://docs.helicone.ai/getting-started/how-encryption-works"
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex flex-row w-fit"
            >
              <p>Learn More</p>
            </Link>
          </p>
        </div>
      )}
      {error && (
        <div className="text-xs text-red-500 flex flex-col gap-2 mt-2 whitespace-pre-line">
          <p>{error}</p>
        </div>
      )}
      {apiKeys !== undefined && apiKeys.length < 1 ? (
        <div className="mt-10 relative block w-full rounded-lg border-2 border-dashed border-red-300 p-12 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          <div className="w-full justify-center align-middle items-center">
            <KeyIcon className="h-10 w-10 mx-auto text-red-500" />
          </div>

          <span className="mt-2 block text-sm font-medium text-red-500">
            Add a key to get started using Helicone
          </span>
        </div>
      ) : (
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
                  setNotification("Demo key can not be deleted", "error");
                  return;
                }

                if (res.error) {
                  console.error(res.error);
                  setNotification("Error deleting key", "error");
                  return;
                }
                setNotification("Key successfully deleted", "success");
                refreshKeys();
              });
          }}
        />
      )}
    </div>
  );
};

export default KeyPage;
