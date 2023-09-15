import { useState } from "react";
import { User } from "@supabase/auth-helpers-nextjs";
import AuthHeader from "@/components/shared/authHeader";
import AuthLayout from "@/components/shared/layout/authLayout";
import MetaData from "@/components/shared/metaData";
import CodeIntegration from "@/components/templates/welcome/steps/codeIntegration";
import { PROVIDER_METHODS } from "@/lib/constants";
import type { UnionProviderMethods } from "@/types";

interface CodeExamplesProps {
  user: User;
}

const PAGE_TITLE = "Code Integration";

const Page = (props: CodeExamplesProps) => {
  const { user } = props;

  const [providerMethod, setProviderMethod] = useState("openai-proxy");

  return (
    <MetaData title={PAGE_TITLE}>
      <AuthLayout user={user}>
        <AuthHeader
          title={PAGE_TITLE}
          actions={
            <select
              value={providerMethod}
              onChange={(e) => setProviderMethod(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
            >
              {PROVIDER_METHODS.map((provider) => (
                <option key={provider.val} value={provider.val}>
                  {provider.label}
                </option>
              ))}
            </select>
          }
        />
        <CodeIntegration
          providerMethod={providerMethod as UnionProviderMethods}
        />
      </AuthLayout>
    </MetaData>
  );
};

export default Page;
