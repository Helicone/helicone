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

  async function generateAPIKey() {
    const apiKey = `sk-helicone-${generateApiKey({
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
                  Your Generated Helicone API Key
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
