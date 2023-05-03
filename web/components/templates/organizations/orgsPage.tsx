import { Tab } from "@headlessui/react";
import { PlusIcon } from "@heroicons/react/20/solid";
import {
  BuildingOfficeIcon,
  CreditCardIcon,
  KeyIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import generateApiKey from "generate-api-key";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { DEMO_EMAIL } from "../../../lib/constants";
import { hashAuth } from "../../../lib/hashClient";
import { middleTruncString } from "../../../lib/stringHelpers";

import { useGetKeys } from "../../../services/hooks/keys";
import { Database } from "../../../supabase/database.types";
import { clsx } from "../../shared/clsx";
import LoadingAnimation from "../../shared/loadingAnimation";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import ThemedTable from "../../shared/themed/themedTable";
import ThemedTabs from "../../shared/themed/themedTabs";
import { useQuery } from "@tanstack/react-query";
import { Members } from "../../../pages/api/organization/[id]/members";
import { Owner } from "../../../pages/api/organization/[id]/owner";
import { useGetOrgs } from "../../../services/hooks/organizations";

interface OrgsPageProps {
  hideTabs?: boolean;
}

const OrganizationCard = ({
  organization,
  refetchOrganizations,
}: {
  organization: Database["public"]["Tables"]["organization"]["Row"];
  refetchOrganizations: () => void;
}) => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useUser();
  const [member, setMember] = useState("");
  const { setNotification } = useNotification();
  const { data, refetch: refetchMembers } = useQuery({
    queryKey: ["OrganizationsMembers", organization.id],
    queryFn: async (query) => {
      return fetch(`/api/organization/${organization.id}/members`).then(
        (res) => res.json() as Promise<Members>
      );
    },
    refetchOnWindowFocus: false,
  });

  const { data: owner } = useQuery({
    queryKey: ["OrganizationsMembersOwner", organization.id],
    queryFn: async (query) => {
      return fetch(`/api/organization/${organization.id}/owner`).then(
        (res) => res.json() as Promise<Owner>
      );
    },
    refetchOnWindowFocus: false,
  });

  const isOwner = user?.id === organization.owner;
  console.log("MEMBERS", owner);

  return (
    <div className="flex flex-col p-4 border gap-5 w-full">
      <div className="flex flex-row items-center justify-between">
        <h1>Org name: {organization.name}</h1>
        {isOwner && (
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              supabaseClient
                .from("organization")
                .delete()
                .match({ id: organization.id })
                .then((res) => {
                  console.log(res);
                });
            }}
          >
            Delete
          </button>
        )}
      </div>
      <div>
        <h2>Owner: {owner?.data![0].email}</h2>
        <div>
          <h2>Members:</h2>
          <ul>
            {data?.data?.map((d, i) => (
              <li key={i}>{d.email}</li>
            ))}
          </ul>
        </div>
      </div>
      {isOwner && (
        <div className="flex flex-row">
          <input
            type="text"
            placeholder="Member email"
            onChange={(e) => setMember(e.target.value)}
            value={member}
          />
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              fetch(
                `/api/organization/${organization.id}/add_member?email=${member}`
              )
                .then((res) => res.json())
                .then((res) => {
                  refetchMembers();
                  if (res.error) {
                    if (res.error.length < 30) {
                      setNotification(res.error, "error");
                      console.error(res);
                    } else {
                      setNotification(
                        "Error adding user: see console",
                        "error"
                      );
                      console.error(res);
                    }
                  }
                });
            }}
          >
            Add member
          </button>
        </div>
      )}
    </div>
  );
};

const OrgsPage = (props: OrgsPageProps) => {
  const [orgName, setOrgName] = useState("");

  const user = useUser();
  const supabaseClient = useSupabaseClient<Database>();
  const { data, isLoading, refetch } = useGetOrgs();

  const yourOrgs = data?.filter((d) => d.owner === user?.id);
  const otherOrgs = data?.filter((d) => d.owner !== user?.id);

  return (
    <div className="mt-8 flex flex-col text-gray-900 max-w-2xl space-y-8">
      <div className="flex flex-row items-end gap-5">
        <div className="w-full space-y-1.5 text-sm">
          <label htmlFor="api-key">Organization Name</label>
          <input
            type="text"
            name="api-key"
            id="api-key"
            className={clsx(
              "block w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
            )}
            placeholder="Your shiny org name"
            onChange={(e) => setOrgName(e.target.value)}
            value={orgName}
          />
        </div>
        <button className="bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
          Create New Organization
        </button>
      </div>
      <ul className="border-t border-gray-200 py-8">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          data?.map((org) => (
            <li
              key={org.id}
              className="overflow-hidden border border-gray-200 rounded-xl w-full max-w-xs"
            >
              <div className="bg-gray-200 p-4 flex flex-row justify-between">
                <div className="flex flex-row space-x-2 items-center">
                  <BuildingOfficeIcon className="h-8 w-8 bg-white p-1.5 rounded-md" />
                  <p className="text-md font-semibold">{org.name}</p>
                </div>
                <button className="flex flex-row space-x-2 items-center">
                  <PencilIcon className="h-4 w-4" />
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
      <div>Your orgs:</div>

      <div>
        {yourOrgs?.map((d, i) => (
          <div key={i} className="flex flex-row">
            <OrganizationCard organization={d} refetchOrganizations={refetch} />
          </div>
        ))}
      </div>
      <div>Other orgs:</div>
      <div>
        {otherOrgs?.map((d, i) => (
          <div key={i} className="flex flex-row">
            <OrganizationCard organization={d} refetchOrganizations={refetch} />
          </div>
        ))}
      </div>
      <input
        type="text"
        placeholder="Org name"
        onChange={(e) => setOrgName(e.target.value)}
        value={orgName}
      />
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => {
          supabaseClient
            .from("organization")
            .insert([
              {
                name: orgName,
                owner: user?.id!,
              },
            ])
            .then((res) => {
              console.log("res", res);
              refetch();
            });
        }}
      >
        Add org
      </button>
    </div>
  );
};

export default OrgsPage;
