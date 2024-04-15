import { User } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import AuthLayout from "../components/layout/authLayout";
import PlaygroundPage from "../components/templates/playground/playgroundPage";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import { ReactElement } from "react";

interface PlaygroundProps {
  user: User;
}

const Playground = (props: PlaygroundProps) => {
  const { user } = props;

  const router = useRouter();

  const { request } = router.query;

  // return <PlaygroundV2 />;

  return (
    <div className="flex flex-col">
      <PlaygroundPage request={request as string | undefined} />
    </div>
  );
};

export default Playground;

Playground.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = new SupabaseServerWrapper(context).getClient();
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
