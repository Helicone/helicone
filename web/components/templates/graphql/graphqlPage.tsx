import { ApolloExplorer } from "@apollo/explorer/react";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useState } from "react";
import { BsBoxArrowUpRight } from "react-icons/bs";
import { clsx } from "../../shared/clsx";
import mainTypeDefs from "../../../lib/api/graphql/schema/main.graphql";
import { print } from "graphql/language/printer";
import { useTheme } from "../../../components/shared/theme/themeContext";

interface GraphQLPageProps {}

export const DEFAULT_EXAMPLE_QUERY = `query ExampleQuery($limit: Int, $offset: Int){
  heliconeRequest(
      limit: $limit
      offset: $offset
  ) {
      properties{
        name
      }
      responseBody
      response
  }
}`;

const GraphQLPage = (props: GraphQLPageProps) => {
  //TODO add support for changing query after this https://github.com/apollographql/embeddable-explorer/issues/258
  const router = useRouter();
  const theme = useTheme();

  const [showGraphqlHeader, setShowGraphqlHeader] = useState<boolean>(false);

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-yellow-100 dark:bg-yellow-800 p-2 rounded-lg text-yellow-800 dark:text-yellow-200 w-full">
        Notice: Our GraphQL is now deprecated, and will be completely removed by
        07/01/2024. Please use our new RESTful API at{" "}
        <a href="https://docs.helicone.ai/rest" className="text-blue-500">
          https://docs.helicone.ai/rest
        </a>
        .
        <br />
        <br />
        If you need help migrating, please reach out to us at{" "}
        <a href="mailto:engineering@helicone.ai" className="text-blue-500">
          engineering@helicone.ai
        </a>
        .
      </div>
      <div className="flex flex-row justify-between items-start">
        <h1 className="text-2xl font-semibold flex flex-row gap-2 items-center text-gray-900 dark:text-gray-100">
          GraphQL Sandbox
          <button
            onClick={() => {
              router.push("/api/graphql");
            }}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"
          >
            <BsBoxArrowUpRight className="h-4 w-4" />
          </button>
        </h1>
        <button
          onClick={() => setShowGraphqlHeader(!showGraphqlHeader)}
          className="pb-3"
        >
          {!showGraphqlHeader ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 rotate-180" />
          )}
        </button>
      </div>
      <div className="overflow-hidden h-[calc(90vh)] w-full">
        <ApolloExplorer
          endpointUrl="/api/graphql"
          schema={print(mainTypeDefs)}
          initialState={{
            document: DEFAULT_EXAMPLE_QUERY,
            variables: {
              limit: 10,
              offset: 0,
            },
            headers: {
              "use-cookies": "true",
            },
            displayOptions: {
              // Make theme controlled by global switch
              theme: theme?.theme === "dark" ? "dark" : "light",
              docsPanelState: "closed",
              showHeadersAndEnvVars: false,
            },
          }}
          className={clsx(showGraphqlHeader || "-mt-14", "h-full")}
          runTelemetry={false}
          //@ts-ignore
          includeCookies={true}
        />
      </div>
    </div>
  );
};

export default GraphQLPage;
