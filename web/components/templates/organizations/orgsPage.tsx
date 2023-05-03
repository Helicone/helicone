import { Tab } from "@headlessui/react";
import { PlusIcon } from "@heroicons/react/20/solid";
import {
  BuildingOfficeIcon,
  CreditCardIcon,
  KeyIcon,
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
  const {
    data,
    isLoading: hasConvertedLoading,
    refetch,
  } = useQuery({
    queryKey: ["Organizations"],
    queryFn: async (query) => {
      const { data, error } = await supabaseClient
        .from("organization")
        .select(`*`);
      if (error) {
        throw error;
      }
      return data;
    },
    refetchOnWindowFocus: false,
  });
  console.log("data", data);
  const yourOrgs = data?.filter((d) => d.owner === user?.id);
  const otherOrgs = data?.filter((d) => d.owner !== user?.id);

  return (
    <>
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
    </>
  );
};

export default OrgsPage;
