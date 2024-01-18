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
import ThemedModal from "../../shared/themed/themedModal";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

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
  const [error, setError] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [resultLink, setResultLink] = useState("");
  const [loading, setLoading] = useState(false);

  const [accepted, setAccepted] = useState(false);

  return (
    <ThemedDrawer open={isOpen} setOpen={setOpen}>
      <div className="flex flex-col gap-4 w-full">
        <p className="font-semibold text-lg">Fine tune you request</p>
        This will fine tune your request with a limit of 1,000 rows using your
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
              return;
            } else {
              setConfirmModalOpen(true);
            }
          }}
          className=" text-center items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Run Fine tune
        </button>
        {error && <div className="text-red-500">{error}</div>}
        {loading && <div className="animate-pulse">...loading</div>}
        {resultLink && (
          <div className="text-green-500">
            Job is completed! You can view your new model here: {resultLink}
          </div>
        )}
        <ThemedModal setOpen={setConfirmModalOpen} open={confirmModalOpen}>
          <div className="max-w-md flex flex-col items-center gap-2">
            <div className="flex flex-col items-center p-3 border-2 rounded-md border-amber-500">
              <div className="flex flex-row  text-amber-500">
                <ExclamationTriangleIcon className="h-7 w-7" />
                <div>WARNING!</div>
              </div>
              <div className="text-sm text-center ">
                This will be ran on your OpenAI account and will charge your
                OpenAI account money. To learn more about fine tuning and its
                pricing see{" "}
                <Link
                  className="text-blue-500"
                  href="https://platform.openai.com/docs/guides/fine-tuning"
                >
                  OpenAI finetuning documentation
                </Link>
                .
              </div>
            </div>
            <i className="flex flex-row items-center text-xs">
              Helicone is not responsible for any calls that may incur while
              finetuning and is not liable or responsible for the result quality
              or cost of finetuning. Helicone source code is available so you
              can see how we fine tune. Please use at your own risk.
            </i>

            <button
              className="mx-auto text-center items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={() => {
                setNotification(
                  "Sorry, our fine tuning service is down right now",
                  "error"
                );
                return;
                if (!accepted) {
                  setNotification("please accept before continuing", "error");
                  return;
                }
                if (!providerKeyId) {
                  setNotification("must include a providerKey", "error");
                } else {
                  setConfirmModalOpen(false);
                  setError("");
                  setLoading(true);
                  setResultLink("");
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
                  )
                    .then((res) => {
                      setLoading(false);
                      res.json().then((x) => {
                        if (res.ok) {
                          setResultLink(x?.data?.url);
                        } else {
                          console.error(x);
                          setError(x.error);
                        }
                      });

                      if (res.ok) {
                        setNotification("fine tune job started!", "success");
                      } else {
                        setNotification("error see console", "error");
                      }
                    })
                    .catch((res: any) => {
                      setLoading(false);
                      setError(JSON.stringify(res));
                      setNotification("error see console", "error");
                    });
                }
              }}
            >
              Confirm OpenAI charge
            </button>
            <i className="flex flex-row mx-auto gap-2 items-center text-sm">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => {
                  setAccepted(!accepted);
                }}
                className="h-4 w-4 rounded border-gray-500 text-sky-600 focus:ring-sky-600"
              />
              I have read and understand the terms above
            </i>
          </div>
        </ThemedModal>
      </div>
    </ThemedDrawer>
  );
};
