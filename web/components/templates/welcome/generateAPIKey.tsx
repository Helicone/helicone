import {
  ChevronRightIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import {
  SupabaseClient,
  User,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
import generateApiKey from "generate-api-key";
import { useState } from "react";
import { hashAuth } from "../../../lib/hashClient";
import { Database } from "../../../supabase/database.types";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import AddHeliconeKeyModal from "../keys/addHeliconeKeyModal";
import { useOrg } from "../../shared/layout/organizationContext";

interface GenerateApiKeyProps {
  apiKey: string;
  setApiKey: (apiKey: string) => void;
  nextStep: () => void;
}

const GenerateApiKey = (props: GenerateApiKeyProps) => {
  const { apiKey, setApiKey, nextStep } = props;
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const [name, setName] = useState<string>("");
  const org = useOrg();

  const { setNotification } = useNotification();

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

    await supabaseClient
      .from("helicone_api_keys")
      .update({
        soft_delete: true,
      })
      .eq("user_id", user.id);

    const res = await supabaseClient.from("helicone_api_keys").insert({
      api_key_hash: await hashAuth(apiKey),
      user_id: user.id,
      api_key_name: keyName,
      organization_id: org?.currentOrg.id!,
    });

    if (res.error) {
      setNotification("Failed to generate API key", "error");
      console.error(res.error);
    }
    console.log("Generated API key", apiKey, res);
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

  return (
    <div className="flex flex-col space-y-16">
      <div className="flex flex-row w-full space-x-4 items-end">
        <div className="w-full space-y-1.5 text-sm">
          <label htmlFor="api-key">Key Name</label>
          <input
            type="text"
            name="api-key"
            id="api-key"
            disabled={apiKey !== ""}
            value={name}
            className={clsx(
              apiKey !== "" ? "bg-gray-100 hover:cursor-not-allowed" : "",
              "block w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
            )}
            placeholder="My Helicone Key"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <button
          disabled={apiKey !== ""}
          onClick={onGenerateKeyHandler}
          className={clsx(
            apiKey !== ""
              ? "bg-gray-500 hover:cursor-not-allowed"
              : "bg-sky-500 hover:bg-sky-400",
            "whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          )}
        >
          Generate Key
        </button>
      </div>
      {apiKey !== "" && (
        <div className="flex flex-col gap-4 space-y-2 w-full">
          <h3 className="text-lg leading-6 text-gray-700 ">
            <div className="flex flex-col space-y-4">
              <p className="font-semibold">Your top-secret API Key:</p>
              <div className="text-sm">
                This will be the <b>only</b> time you can see your API key.
                Please save it somewhere safe and accessible. If you lose your
                API key, you will need to generate a new one.
              </div>
              <div className="flex flex-row items-center gap-3 text-sm">
                <input
                  className="border border-gray-300 rounded-md p-2 w-full"
                  value={apiKey}
                  disabled={true}
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    setNotification("Copied to clipboard!", "success");
                  }}
                />
                <button
                  className="bg-sky-500 hover:bg-sky-400 text-white p-2 gap-2 items-center flex flex-row justify-center rounded-md"
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    setNotification("Copied to clipboard!", "success");
                  }}
                >
                  <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>
          </h3>
        </div>
      )}
      <div className="flex flex-row justify-end items-center">
        {apiKey !== "" && (
          <button
            onClick={nextStep}
            className="items-center flex flex-row gap-2 whitespace-nowrap rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            My key is stored safely
            <ChevronRightIcon className="h-4 w-4 inline" />
          </button>
        )}
      </div>
    </div>
  );
};

export default GenerateApiKey;
