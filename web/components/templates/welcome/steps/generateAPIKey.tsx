import {
  SupabaseClient,
  User,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
import generateApiKey from "generate-api-key";
import { useState } from "react";
import { hashAuth } from "../../../../lib/hashClient";
import { Database } from "../../../../supabase/database.types";
import { useOrg } from "../../../layout/organizationContext";
import useNotification from "../../../shared/notification/useNotification";
import HcButton from "../../../ui/hcButton";
import { TextInput } from "@tremor/react";
import { Tooltip } from "@mui/material";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { generateAPIKeyHelper } from "../../../../utlis/generateAPIKeyHelper";

interface GenerateAPIKeyProps {
  apiKey: string;
  setApiKey: (apiKey: string) => void;
  previousStep: () => void;
  nextStep: () => void;
}

const GenerateAPIKey = (props: GenerateAPIKeyProps) => {
  const { apiKey, setApiKey, previousStep, nextStep } = props;

  const supabaseClient = useSupabaseClient();
  const user = useUser();

  const { setNotification } = useNotification();

  const org = useOrg();

  const [name, setName] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  async function generatePublicApiKey() {
    const apiKey = `pk-helicone-${generateApiKey({
      method: "base32",
      dashes: true,
    }).toString()}`.toLowerCase();
    return apiKey;
  }

  const onGenerateKeyHandler = async () => {
    if (!user) return;
    const { res: promiseRes, apiKey } = generateAPIKeyHelper(
      "w",
      org?.currentOrg?.organization_type ?? "",
      user?.id ?? "",
      name,
      window.location.hostname.includes("eu.")
    );

    const res = await promiseRes;

    if (!res.response.ok) {
      setNotification("Failed to generate API key", "error");
      console.error(await res.response.text());
    }

    setApiKey(apiKey);
  };

  return (
    <>
      <div id="content" className="w-full flex flex-col space-y-4">
        <div className="flex flex-col p-4">
          <div className="flex flex-col space-y-8 w-full">
            <h2 className="text-2xl font-semibold">Generate your API key</h2>
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="key-name"
                className="block text-md font-semibold leading-6"
              >
                API Key Name
              </label>
              <div className="flex items-center gap-4">
                <TextInput
                  name="key-name"
                  id="key-name"
                  required
                  placeholder="Your Shiny API Key Name"
                  value={name}
                  onValueChange={(value) => setName(value)}
                />
                <HcButton
                  variant={"secondary"}
                  size={"sm"}
                  title={"Generate API Key"}
                  onClick={() => {
                    onGenerateKeyHandler();
                  }}
                />
              </div>
            </div>
            {apiKey !== "" && (
              <div className="flex flex-col space-y-2">
                <label
                  htmlFor="generated-key"
                  className="block text-md font-semibold leading-6"
                >
                  Your Generated Helicone API Key&nbsp;
                  <Tooltip
                    title={
                      <span>
                        Public vs Secret Keys:{" "}
                        <a
                          href="https://docs.helicone.ai/faq/secret-vs-public-key"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-600"
                        >
                          Learn more
                        </a>
                      </span>
                    }
                    placement="top"
                    arrow
                  >
                    <InformationCircleIcon className="h-4 w-4 text-gray-500 inline" />
                  </Tooltip>
                </label>
                <div className="flex items-center gap-4">
                  <TextInput
                    name="generated-key"
                    id="generated-key"
                    required
                    value={apiKey}
                    disabled
                  />
                  <HcButton
                    variant={"primary"}
                    size={"sm"}
                    title={"Copy API Key"}
                    onClick={() => {
                      navigator.clipboard.writeText(apiKey);
                      setNotification("Copied API key to clipboard", "success");
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center w-full justify-between p-4">
          <HcButton
            variant={"secondary"}
            size={"sm"}
            title={"Back"}
            onClick={() => previousStep()}
          />
          <HcButton
            variant={"primary"}
            size={"sm"}
            title={"Get Integrated"}
            onClick={() => {
              navigator.clipboard.writeText(apiKey);
              setNotification("Copied API key to clipboard", "success");
              nextStep();
            }}
          />
        </div>
      </div>
    </>
  );
};

export default GenerateAPIKey;
