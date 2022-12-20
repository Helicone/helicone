import {
  User,
  createServerSupabaseClient,
} from "@supabase/auth-helpers-nextjs";
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "../supabase/database.types";

import { GetServerSidePropsContext } from "next";

export default function Profile({ user }: { user: User }) {
  const supabaseClient = useSupabaseClient<Database>();

  return (
    <div>
      <button onClick={() => supabaseClient.auth.signOut()}>Sign out</button>
      Hello {user.email}
    </div>
  );
}

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
        destination: "/",
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
