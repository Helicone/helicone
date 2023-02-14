import { InformationCircleIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { middleTruncString } from "../lib/stringHelpers";
import { hashAuth } from "../lib/supabaseClient";
import { Database } from "../supabase/database.types";
import {
  User,
  createServerSupabaseClient,
  SupabaseClient,
} from "@supabase/auth-helpers-nextjs";

import { GetServerSidePropsContext } from "next";
import { useKeys } from "../lib/useKeys";
import KeyPage from "../components/templates/keys/keyPage";
import BillingPage from "../components/templates/usage/usagePage";
import MetaData from "../components/shared/metaData";
import { getUserSettings } from "../services/lib/user";
import { UserSettingsResponse } from "./api/user_settings";

interface UsageProps {
  user: User;
  userSettings: UserSettingsResponse;
}

const Usage = (props: UsageProps) => {
  const { user } = props;

  return (
    <MetaData title="Usage">
      <BillingPage user={user} />
    </MetaData>
  );
};

export default Usage;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  // Create authenticated Supabase Client
  const supabase = createServerSupabaseClient(ctx);
  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };

  // const data = await getUserSettings();

  return {
    props: {
      initialSession: session,
      user: session.user,
      // userSettings: data,
    },
  };
};
