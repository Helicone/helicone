import { InformationCircleIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { middleTruncString } from "../../lib/stringHelpers";
import { hashAuth } from "../../lib/supabaseClient";
import { Database } from "../../supabase/database.types";
import {
  User,
  createServerSupabaseClient,
  SupabaseClient,
} from "@supabase/auth-helpers-nextjs";

import { GetServerSidePropsContext } from "next";
import { useKeys } from "../../lib/useKeys";

export default function Keys() {
  const supabaseClient = useSupabaseClient<Database>();

  return (
    <div className="h-screen flex flex-col items-center">
      <div className="m-12 w-full max-w-5xl border p-5">
        <Step2 />
      </div>
    </div>
  );
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  // Create authenticated Supabase Client
  const supabase = createServerSupabaseClient(ctx);
  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };

  return {
    props: {
      initialSession: session,
      user: session.user,
    },
  };
};

function Step2() {
  const user = useUser();

  const supabaseClient = useSupabaseClient<Database>();
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiKeys = useKeys(supabaseClient);
  async function addKey() {
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
    <div className="flex flex-col gap-2 ">
      <div>
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Here you can manage what API keys you have saved. You can add as many
          as you like.
        </p>
      </div>
      <div className="flex flex-col ">
        <div className="flex flex-row items-end gap-2">
          <input
            className="bg-slate-800 py-2 px-4 rounded-md"
            type="password"
            placeholder="Your OpenAI API key"
            value={apiKey}
            disabled={!user}
            onChange={(e) => {
              setApiKey(e.target.value);
            }}
          />
          <button
            disabled={!user}
            onClick={() => {
              addKey();
            }}
            className={`items-center rounded-md border border-slate-700 ${
              apiKey === ""
                ? "bg-slate-400 hover:cursor-not-allowed opacity-50"
                : "bg-slate-800 hover:cursor-pointer hover:bg-slate-600"
            } px-4 py-2 text-white focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 mt-2`}
          >
            Save
          </button>
        </div>
      </div>
      <i
        className="text-sm text-slate-600 dark:text-slate-300 flex flex-row items-center hover:cursor-pointer"
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
                  if (user?.email === "demo@valyrai.com") {
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
  );
}
