import {
  ArrowTopRightOnSquareIcon,
  ChevronDoubleRightIcon,
  ChevronRightIcon,
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
import { middleTruncString } from "../../../lib/stringHelpers";
import { hashAuth } from "../../../lib/supabaseClient";
import { useKeys } from "../../../lib/useKeys";
import { Database } from "../../../supabase/database.types";
import LeftNavLayout from "../../shared/leftNavLayout";
import ThemedTable from "../../shared/themedTable";

interface KeyPageProps {}

const KeyPage = (props: KeyPageProps) => {
  const user = useUser();

  const supabaseClient = useSupabaseClient<Database>();
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
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
        getKeys();
      });
  }

  return (
    <LeftNavLayout>
      <div className="flex flex-col gap-2">
        {apiKeys !== undefined && apiKeys.length < 1 && (
          <p className="text-sm text-red-600 mt-1">
            Please add an API key to get started
          </p>
        )}
        <div className="pt-4 inline-flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
          <div className="w-2/3">
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
                className="block w-full rounded-md border-gray-300 pr-12 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
              />
            </div>
          </div>
          <ChevronDoubleRightIcon className="h-12 w-12 mt-4 text-black hidden sm:block" />
          <div className="w-full">
            <div className="flex flex-row text-sm font-medium text-black">
              Hashed Key
              <i
                className="text-sm text-black flex flex-row items-center hover:cursor-pointer"
                onClick={() => {
                  setShowInfo(!showInfo);
                }}
              >
                <InformationCircleIcon className="h-5 mx-1" />
              </i>
            </div>
            <div className="relative mt-1 flex items-center">
              <input
                readOnly
                value={hashedApiKey}
                type="text"
                name="hashedKey"
                id="hashedKey"
                className="block w-full p-2 rounded-md border-gray-300 pr-14 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                <button
                  onClick={addKey}
                  className="inline-flex items-center rounded border border-gray-200 px-2 font-sans text-sm font-medium text-white bg-black"
                >
                  Add
                </button>
              </div>
            </div>
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
              href="https://docs.valyrai.com/"
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
            { name: "Hash", key: "api_key_hash", hidden: false },
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
                if (user?.email === "valyrdemo@gmail.com") {
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
    </LeftNavLayout>
  );
};

export default KeyPage;
