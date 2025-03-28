import { TextInput } from "@tremor/react";
import { useState } from "react";

import useNotification from "../../../shared/notification/useNotification";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getJawnClient } from "../../../../lib/clients/jawn";
import { ClipboardIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { H3, P, Small, Muted } from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
    <Card className="w-full">
      <CardHeader>
        <H3>Org Member Control Center</H3>
        <Muted>Manage organization admin access</Muted>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col space-y-4">
          <Small className="font-medium">Organization Lookup by Name</Small>
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
                size={"sm"}
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
          {orgs?.data?.orgs && orgs.data.orgs.length > 0 && (
            <div className="rounded-md border border-border p-4 bg-muted/40">
              <Small className="font-medium mb-2 block">Search Results</Small>
              <ul className="space-y-2">
                {orgs?.data?.orgs.map((org) => (
                  <li key={org.id} className="flex items-center py-1 gap-2">
                    <span className="font-medium">{org.name}</span>
                    <span className="text-muted-foreground">-</span>
                    <code className="px-1 py-0.5 bg-muted rounded text-xs font-mono">
                      {org.id}
                    </code>
                    <button
                      onClick={() => {
                        // copy to clipboard
                        navigator.clipboard.writeText(org.id);
                        setOrgId(org.id);
                        setNotification("Copied to clipboard", "success");
                      }}
                      className="text-foreground hover:text-primary flex items-center"
                    >
                      <ClipboardIcon className="h-4 w-4 ml-1" />
                      <span className="sr-only">Copy ID</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <div className="flex flex-col space-y-4">
          <Small className="font-medium">Add Admin to Organization by Id</Small>
          <div className="w-1/2">
            <TextInput
              placeholder="Organization Id"
              value={orgId}
              onValueChange={setOrgId}
            />
          </div>

          <div className="space-y-2 rounded-md border border-border p-4">
            <Small className="font-medium">Admins</Small>
            {isLoading ? (
              <div className="py-4 flex justify-center">
                <div className="animate-pulse h-5 w-24 bg-muted rounded"></div>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-2 mt-2">
                {data?.data?.map((admin, index) => (
                  <li key={index} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id={`admin-${index}`}
                      className="rounded text-primary focus:ring-primary"
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
                    <label htmlFor={`admin-${index}`} className="text-sm">
                      {admin.user_email}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pt-2">
            <Button
              size={"default"}
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
              disabled={isAddingAdminToOrg}
            >
              Add Admin(s) to Org
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrgMember;
