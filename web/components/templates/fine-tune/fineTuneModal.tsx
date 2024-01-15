import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { Database } from "../../../supabase/database.types";
import { useOrg } from "../../shared/layout/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import ProviderKeyList from "../enterprise/portal/id/providerKeyList";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { getHeliconeCookie } from "../../../lib/cookies";

interface FineTuneModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  filter: FilterNode;
}
export const FineTuneModal = (props: FineTuneModalProps) => {
  const { open: isOpen, setOpen, filter } = props;

  const { setNotification } = useNotification();
  const orgContext = useOrg();
  const router = useRouter();
  const supabaseClient = useSupabaseClient<Database>();
  const [confirmOrgName, setConfirmOrgName] = useState("");
  const org = useOrg();
  const [providerKeyId, setProviderKeyId] = useState("");

  return (
    <ThemedDrawer open={isOpen} setOpen={setOpen}>
      <div className="flex flex-col gap-4 w-full">
        <p className="font-semibold text-lg">Fine tune you request</p>
        This will fine tune your request with a limit of 10,000 rows using your
        openAPI key.
        <ProviderKeyList
          orgId={org?.currentOrg?.id}
          setProviderKeyCallback={(x) => {
            setProviderKeyId(x);
          }}
          variant="basic"
        />
        <p className="text-gray-700 w-[400px] whitespace-pre-wrap text-sm">
          {/* Organization {` "${orgName}" `} will be deleted from your account. */}
        </p>
        <p className="text-gray-700 w-[400px] whitespace-pre-wrap text-sm">
          This will create a fine-tuned model on your account and you will be
          charged. Are you sure you want to continue?
        </p>
        <button
          onClick={() => {
            if (!providerKeyId) {
              setNotification("must include a providerKey", "error");
            } else {
              const authFromCookie = getHeliconeCookie();
              fetch(
                `${process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE}/v1/fine-tune`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "helicone-authorization": JSON.stringify({
                      _type: "jwt",
                      token: authFromCookie.data?.jwtToken,
                      orgId: org?.currentOrg?.id,
                    }),
                  },
                  body: JSON.stringify({
                    filter: filter,
                    providerKeyId,
                  }),
                }
              ).then((res) => {
                console.log(res.json());
                if (res.ok) {
                  setNotification("fine tune job started!", "success");
                } else {
                  setNotification("error see console", "error");
                }
              });
            }
          }}
          className=" text-center items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Run Fine tune
        </button>
      </div>
    </ThemedDrawer>
  );
};
