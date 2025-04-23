import { ReactElement } from "react";
import AuthLayout from "../../../../components/layout/auth/authLayout";
import PromptEditor from "../../../../components/templates/prompts/id/PromptEditor";

type PageParams = {
  requestId: string;
};
export default function Page(props: PageParams) {
  return <PromptEditor requestId={props.requestId} />;
}

Page.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};
