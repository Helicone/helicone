import { User } from "@supabase/auth-helpers-nextjs";

import { GetServerSidePropsContext } from "next";
import AuthHeader from "../components/shared/authHeader";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import KeyPage from "../components/templates/keys/keyPage";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import GraphQLPage from "../components/templates/graphql/graphqlPage";
import { LightBulbIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useLocalStorage } from "../services/hooks/localStorage";

interface KeysProps {
  user: User;
}

const Keys = (props: KeysProps) => {
  const { user } = props;
  const [showBetaWarning, setShowBetaWarning] = useLocalStorage(
    "showBetaWarning",
    true
  );

  return (
    <MetaData title="Keys">
      <AuthLayout user={user}>
        <AuthHeader
          title={"GraphQL"}
          actions={
            showBetaWarning || (
              <button
                onClick={() => setShowBetaWarning(true)}
                className="font-semibold text-black text-sm items-center flex flex-row hover:text-sky-700"
              >
                Beta - Subject to change
              </button>
            )
          }
        />
        {showBetaWarning && (
          <div className="bg-cyan-300 p-5 mb-5 rounded-md font-semibold max-w-2xl w-full mx-auto  items-end flex flex-col">
            <button onClick={() => setShowBetaWarning(false)}>Dismiss</button>
            <div className=" flex flex-row items-center gap-7">
              <LightBulbIcon className="h-16 w-16 inline mr-2" />
              <div>
                Please note our GraphQL API is currently in beta. If you have
                any questions or feedback, please reach out to us on{" "}
                <Link
                  href="https://discord.gg/zsSTcH2qhG"
                  className="text-blue-500 hover:text-blue-700 underline"
                >
                  discord
                </Link>{" "}
                or{" "}
                <Link
                  href="mailto:sales@helicone.ai"
                  className="text-blue-500 hover:text-blue-700 underline"
                >
                  email us
                </Link>
                .
              </div>
            </div>
          </div>
        )}
        <GraphQLPage />
      </AuthLayout>
    </MetaData>
  );
};

export default Keys;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  // Create authenticated Supabase Client
  const supabase = new SupabaseServerWrapper(ctx).getClient();
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
