import { ApolloExplorer } from "@apollo/explorer/react";

import { ChevronDownIcon, LightBulbIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useState } from "react";
import { BsBoxArrowUpRight } from "react-icons/bs";
import { clsx } from "../../shared/clsx";
import GraphQLLogo from "./logo";
import Link from "next/link";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import mainTypeDefs from "../../../lib/api/graphql/schema/main.graphql";
import { print } from "graphql/language/printer";

interface GraphQLPageProps {}

export const DEFAULT_EXAMPLE_QUERY = `query ExampleQuery($limit: Int, $offset: Int){
  heliconeRequest(
      limit: $limit
      offset: $offset
  ) {
      prompt
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

  const [showGraphqlHeader, setShowGraphqlHeader] = useState<boolean>(false);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-row justify-between items-start">
        <h1 className="text-2xl font-semibold flex flex-row gap-2 items-center">
          GraphQL Sandbox
          <button
            onClick={() => {
              router.push("/api/graphql");
            }}
            className="p-2 hover:bg-gray-200 rounded-lg"
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
              cookie: "hello",
            },
            displayOptions: {
              theme: "light",
              docsPanelState: "closed",
              showHeadersAndEnvVars: false,
            },
          }}
          className={clsx(showGraphqlHeader || "-mt-14", "h-full")}
          runTelemetry={false}
          includeCookies={true}
        />
      </div>
    </div>
  );
};

export default GraphQLPage;
