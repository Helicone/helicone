import { TextInput } from "@tremor/react";
import { title } from "process";
import { SimpleTable } from "../../../shared/table/simpleTable";
import { ThemedSwitch } from "../../../shared/themed/themedSwitch";
import { getUSDate } from "../../../shared/utils/utils";
import HcButton from "../../../ui/hcButton";
import { useState } from "react";
import {
  useAlertBanners,
  useCreateAlertBanner,
  useUpdateAlertBanner,
} from "../../../../services/hooks/admin";
import useNotification from "../../../shared/notification/useNotification";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useMutation } from "@tanstack/react-query";
import { getJawnClient } from "../../../../lib/clients/jawn";

interface OrgMemberProps {}

const OrgMember = (props: OrgMemberProps) => {
  const {} = props;

  const { setNotification } = useNotification();
  const supabaseClient = useSupabaseClient();

  const {
    mutate: findOrgs,
    isLoading: isFindingOrgs,
    data: orgs,
  } = useMutation({
    mutationKey: ["searchOrgId"],
    mutationFn: async (orgName: string) => {
      const jawn = getJawnClient();
      const orgs = await jawn.POST("/v1/admin/orgs/query", {
        body: {
          orgName,
        },
      });

      return orgs;
    },
  });

  // states
  const [orgName, setOrgName] = useState("");

  return (
    <>
      <h2 className="text-lg text-white font-semibold">
        Org Member Control Center
      </h2>
      <div className="flex flex-col space-y-2">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <TextInput
              placeholder="Organization Name"
              value={orgName}
              onValueChange={setOrgName}
            />
          </div>
          <div className="col-span-1">
            <HcButton
              variant={"primary"}
              size={"xs"}
              onClick={async () => {
                if (!orgName) {
                  setNotification("Organization name is required", "error");
                  return;
                }
                findOrgs(orgName);
              }}
              loading={isFindingOrgs}
              title={"Search for Org Id"}
            />
          </div>
        </div>
        <ul>
          {orgs?.data?.orgs.map((org) => (
            <li key={org.id} className="flex flex-col space-y-2">
              <span className="text-white text-lg font-semibold">
                {org.name}
              </span>
              <span className="text-white text-sm font-light">{org.id}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-4 gap-4 border-t-2 border-gray-300 pt-4">
        <div className="col-span-2">
          <TextInput
            placeholder="Organization Id"
            // value={orgName}
            // onValueChange={setOrgName}
          />
        </div>
        <div className="col-span-1">
          <HcButton
            variant={"primary"}
            size={"xs"}
            onClick={async () => {
              //   if (!title || !message) {
              //     setNotification("Title and message are required", "error");
              //     return;
              //   }
              //   createBanner({ title, message });
            }}
            // loading={isCreatingBanner}
            title={"Search for Org Id"}
          />
        </div>
      </div>
    </>
  );
};

export default OrgMember;
