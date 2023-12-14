import { User } from "@supabase/auth-helpers-nextjs";

import { LightBulbIcon } from "@heroicons/react/24/outline";
import { GetServerSidePropsContext } from "next";
import Link from "next/link";
import AuthHeader from "../components/shared/authHeader";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import GraphQLPage from "../components/templates/graphql/graphqlPage";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import { useLocalStorage } from "../services/hooks/localStorage";
import { XMarkIcon } from "@heroicons/react/20/solid";
import GraphQLLogo from "../components/templates/graphql/logo";

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
    <MetaData title="GraphQL">
      <AuthLayout user={user}>
        <AuthHeader
          title={"GraphQL"}
          actions={
            showBetaWarning || (
              <button
                onClick={() => setShowBetaWarning(true)}
                className="font-semibold text-black dark:text-white text-sm items-center flex flex-row hover:text-sky-700"
              >
                Beta - Subject to change
              </button>
            )
          }
        />
        {showBetaWarning && (
          <div className="bg-violet-200 dark:bg-violet-800 p-6 rounded-lg font-semibold max-w-2xl w-full flex flex-col relative mb-8">
            <button
              className="absolute top-4 right-4"
              onClick={() => setShowBetaWarning(false)}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
            <div className="flex flex-row items-start gap-4 text-sm">
              <GraphQLLogo className="h-16 w-16 -mt-2" />
              <div className="flex flex-col space-y-6 dark:text-gray-100">
                <p>
                  Please note our GraphQL API is currently in beta. If you have
                  any questions or feedback, please reach out to us on{" "}
                  <Link
                    href="https://discord.gg/zsSTcH2qhG"
                    target="_blank"
                    rel="noopener noreferrer"
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
                </p>
                <p>
                  For an immersive playground experience, visit our sandbox at
                  <Link
                    href="/api/graphql"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 underline inline pl-1"
                  >
                    www.helicone.ai/api/graphql
                  </Link>
                  .
                </p>
                <p>
                  For a deeper understanding of our GraphQL offering explore our
                  documentation
                  <Link
                    href="https://docs.helicone.ai/graphql-api/getting-started"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 underline pl-1"
                  >
                    here
                  </Link>
                  .
                </p>
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
