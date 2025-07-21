import { ReactElement } from "react";
import AuthLayout from "@/components/layout/auth/authLayout";
import CreateRouterPage from "@/components/templates/gateway/createRouterPage";

const CreateRouter = () => {
  return (
    <div className="flex flex-col">
      <CreateRouterPage />
    </div>
  );
};

export default CreateRouter;

CreateRouter.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};
