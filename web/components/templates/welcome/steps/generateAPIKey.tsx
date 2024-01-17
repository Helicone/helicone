import {
  SupabaseClient,
  User,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
import generateApiKey from "generate-api-key";
import { useEffect, useState } from "react";
import { hashAuth } from "../../../../lib/hashClient";
import { Database } from "../../../../supabase/database.types";
import { clsx } from "../../../shared/clsx";
import { useOrg } from "../../../shared/layout/organizationContext";
import useNotification from "../../../shared/notification/useNotification";

interface GenerateAPIKeyProps {
  apiKey: string;
  setApiKey: (apiKey: string) => void;

  nextStep: () => void;
}

const GenerateAPIKey = (props: GenerateAPIKeyProps) => {
  const { apiKey, setApiKey, nextStep } = props;

  const supabaseClient = useSupabaseClient();
  const user = useUser();

  const { setNotification } = useNotification();

  const org = useOrg();

  const [name, setName] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  async function generateAPIKey() {
    const apiKey = `sk-${generateApiKey({
      method: "base32",
      dashes: true,
    }).toString()}`.toLowerCase();
    return apiKey;
  }

  async function generateAndEnsureOnlyOneApiKey(
    supabaseClient: SupabaseClient<Database>,
    user: User,
    keyName: string
  ): Promise<string> {
    const apiKey = await generateAPIKey();

    if (!user || org?.currentOrg?.id === undefined) {
      setNotification("Invalid user", "error");
      console.error("Invalid user");
      return apiKey;
    }

    const res = await supabaseClient.from("helicone_api_keys").insert({
      api_key_hash: await hashAuth(apiKey),
      user_id: user.id,
      api_key_name: keyName,
      organization_id: org.currentOrg?.id,
    });

    if (res.error) {
      setNotification("Failed to generate API key", "error");
      console.error(res.error);
    }

    return apiKey;
  }

  const onGenerateKeyHandler = async () => {
    if (!user) return;
    const key = await generateAndEnsureOnlyOneApiKey(
      supabaseClient,
      user,
      name
    );
    setApiKey(key);
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 500); // delay of 500ms
    return () => clearTimeout(timer); // this will clear Timeout
    // when component unmount like in willComponentUnmount
  }, []);

  return (
    <div
      className={clsx(
        `transition-all duration-700 ease-in-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`,
        "flex flex-col items-center w-full px-2"
      )}
    >
      <p className="text-2xl md:text-5xl font-semibold text-center">
        Simple Integration
      </p>
      <p className="text-md md:text-lg text-gray-500 font-light mt-5 text-center">
        Please generate an API key and store it somewhere safe
      </p>
      <div className="flex flex-col w-full md:w-[450px] mt-16">
        <label
          htmlFor="key-name"
          className="block text-md font-semibold leading-6"
        >
          API Key Name
        </label>
        <div className="mt-2">
          <input
            disabled={apiKey !== ""}
            type="text"
            name="key-name"
            id="key-name"
            onChange={(e) => setName(e.target.value)}
            className={clsx(
              apiKey !== "" && "bg-gray-300 hover:cursor-not-allowed",
              "bg-white dark:bg-black block w-full rounded-md border-0 px-4 py-4 text-md shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:leading-6"
            )}
            placeholder="Your Shiny API Key Name"
            value={name}
          />
        </div>
        {apiKey === "" ? (
          <>
            <button
              onClick={() => {
                if (name === "") {
                  setNotification(
                    "Please enter a name for your API key",
                    "error"
                  );
                  return;
                }
                onGenerateKeyHandler();
              }}
              className="px-28 py-3 bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-gray-300 dark:text-black font-medium text-white rounded-xl mt-8"
            >
              Generate API Key
            </button>
          </>
        ) : (
          <>
            <label
              htmlFor="generated-key"
              className="block text-md font-semibold leading-6 mt-8"
            >
              Your Generated Helicone API Key
            </label>
            <div className="mt-2">
              <input
                disabled
                type="text"
                name="generated-key"
                id="generated-key"
                value={apiKey}
                className="bg-white dark:bg-black block w-full rounded-md border-0 px-4 py-4 text-md shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:leading-6"
              />
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(apiKey);
                setNotification("Copied API key to clipboard", "success");
                nextStep();
              }}
              className="px-28 py-3 bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-gray-300 dark:text-black font-medium text-white rounded-xl mt-8"
            >
              Copy and Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GenerateAPIKey;
