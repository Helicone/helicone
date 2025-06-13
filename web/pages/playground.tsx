import { useRouter } from "next/router";
import { ReactElement } from "react";
import AuthLayout from "../components/layout/auth/authLayout";
import PlaygroundPage from "../components/templates/playground/playgroundPage";

const Playground = () => {
  const router = useRouter();

  const { requestId } = router.query;

  return (
    <div className="flex flex-col">
      <PlaygroundPage
        requestId={requestId as string | undefined}
        showNewButton={true}
      />
    </div>
  );
};

export default Playground;

Playground.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};
