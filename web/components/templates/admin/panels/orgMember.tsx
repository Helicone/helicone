import { TextInput } from "@tremor/react";
import { useState } from "react";

import useNotification from "../../../shared/notification/useNotification";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getJawnClient } from "../../../../lib/clients/jawn";
import { ClipboardIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

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

  const { data, isLoading } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const jawn = getJawnClient();
      return jawn.GET("/v1/admin/admins/query");
    },
    refetchOnWindowFocus: false,
  });

  const { mutate: addAdminToOrg, isLoading: isAddingAdminToOrg } = useMutation({
    mutationKey: ["addAdminToOrg"],
    mutationFn: async ({
      orgId,
      adminIds,
    }: {
      orgId: string;
      adminIds: string[];
    }) => {
      const jawn = getJawnClient();
      const { data, error } = await jawn.POST("/v1/admin/admins/org/query", {
        body: {
          orgId,
          adminIds,
        },
      });
      if (error) {
        setNotification("Failed to add admins to org", "error");
      } else {
        setNotification("Admins added to org", "success");
      }
    },
  });

  // states
  const [orgName, setOrgName] = useState("");
  const [orgId, setOrgId] = useState("");
  const [adminIds, setAdminIds] = useState<string[]>();

  return (
    <>
      <h2 className="text-lg text-white font-semibold">
        Org Member Control Center
      </h2>
      <div className="flex flex-col space-y-2">
        <p className="text-sm">Organization Lookup by Name</p>
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <TextInput
              placeholder="Organization Name"
              value={orgName}
              onValueChange={setOrgName}
            />
          </div>
          <div className="col-span-1">
            <Button
              size={"xs"}
              onClick={async () => {
                if (!orgName) {
                  setNotification("Organization name is required", "error");
                  return;
                }
                findOrgs(orgName);
              }}
              disabled={isFindingOrgs}
            >
              Search for Org Id
            </Button>
          </div>
        </div>
        <ul>
          {orgs?.data?.orgs.map((org) => (
            <li key={org.id} className="flex items-center py-1 space-x-1">
              <span className="text-white text-sm font-semibold">
                {org.name}
              </span>
              <span>-</span>
              <button
                onClick={() => {
                  // copy to clipboard
                  navigator.clipboard.writeText(org.id);
                  setNotification("Copied to clipboard", "success");
                }}
                className="text-white text-sm underline flex items-center"
              >
                {org.id} <ClipboardIcon className="h-4 w-4 ml-1" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col space-y-2 border-t-2 border-gray-300 pt-4">
        <p className="text-sm">Add Admin to Organization by Id</p>
        <div className="w-1/2">
          <TextInput
            placeholder="Organization Id"
            value={orgId}
            onValueChange={setOrgId}
          />
        </div>
        <ul className="pt-4">
          <p className="text-sm">Admins</p>
          {data?.data?.map((admin, index) => (
            <li key={index} className="flex items-center space-x-2 py-1">
              <input
                type="checkbox"
                checked={adminIds?.includes(admin.user_id ?? "")}
                onChange={(e) => {
                  if (e.target.checked) {
                    setAdminIds((prev) => [
                      ...(prev ?? []),
                      admin.user_id ?? "",
                    ]);
                  } else {
                    setAdminIds((prev) =>
                      prev?.filter((id) => id !== admin.user_id)
                    );
                  }
                }}
              />
              <span>{admin.user_email}</span>
            </li>
          ))}
        </ul>

        <div className="">
          <Button
            size={"xs"}
            onClick={async () => {
              if (!orgId) {
                setNotification("Organization Id is required", "error");
                return;
              }
              if (!adminIds) {
                setNotification("Admins are required", "error");
                return;
              }
              addAdminToOrg({ orgId, adminIds });
            }}
          >
            Add Admin(s) to Org
          </Button>
        </div>
      </div>
    </>
  );
};

export default OrgMember;
