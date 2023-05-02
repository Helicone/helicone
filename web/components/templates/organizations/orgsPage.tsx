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

interface OrgsPageProps {
  hideTabs?: boolean;
}

const OrganizationCard = ({
  organization,
}: {
  organization: Database["public"]["Tables"]["organization"]["Row"];
}) => {
  const supabaseClient = useSupabaseClient<Database>();
  const [member, setMember] = useState("");
  return (
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
          supabaseClient

            .from("organization_members")
            .insert([
              {
                organization_id: orgId,
                user_id: member,
              },
            ])
            .then((res) => {
              console.log(res);
            });
        }}
      >
        Add member
      </button>
    </div>
  );
};

const OrgsPage = (props: OrgsPageProps) => {
  const [orgName, setOrgName] = useState("");

  const user = useUser();
  const supabaseClient = useSupabaseClient<Database>();
  const { data, isLoading: hasConvertedLoading } = useQuery({
    queryKey: ["HasConvertedToHeliconeKeys"],
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

  return (
    <>
      <div>Your orgs:</div>

      <div>
        {data?.map((d, i) => (
          <div key={i} className="flex flex-row">
            <OrganizationCard orgId={d.id} />
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
            });
        }}
      >
        Add org
      </button>
    </>
  );
};

export default OrgsPage;
