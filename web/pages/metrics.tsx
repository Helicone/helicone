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
import BillingPage from "../components/templates/billing/billingPage";
import MetaData from "../components/shared/metaData";
import AuthLayout from "../components/shared/layout/authLayout";
import MetricsPage from "../components/templates/metrics/metricsPage";

interface MetricsProps {}

const Metrics = (props: MetricsProps) => {
  const {} = props;

  return (
    <MetaData title="Metrics">
      <AuthLayout>
        <MetricsPage />
      </AuthLayout>
    </MetaData>
  );
};

export default Metrics;

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

  return {
    props: {
      initialSession: session,
      user: session.user,
    },
  };
};
