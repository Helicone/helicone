import { User } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { ReactElement } from "react";
import AuthLayout from "../components/layout/auth/authLayout";
import PlaygroundPage from "../components/templates/playground/playgroundPage";

interface PlaygroundProps {
  user: User;
}

const Playground = (props: PlaygroundProps) => {
  const router = useRouter();

  const { request } = router.query;

  return (
    <div className="flex flex-col">
      <PlaygroundPage
        request={request as string | undefined}
        showNewButton={true}
      />
    </div>
  );
};

export default Playground;

Playground.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};
