import { useRouter } from "next/router";
import { ReactElement } from "react";
import AuthLayout from "../components/layout/auth/authLayout";
import PlaygroundPage from "../components/templates/playground/playgroundPage";

const Playground = () => {
  const router = useRouter();

  const { requestId, promptVersionId, createPrompt } = router.query;

  return (
    <div className="flex flex-col">
      <PlaygroundPage
        requestId={requestId as string | undefined}
        promptVersionId={promptVersionId as string | undefined}
        createPrompt={createPrompt === "true"}
      />
    </div>
  );
};

export default Playground;

Playground.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};
