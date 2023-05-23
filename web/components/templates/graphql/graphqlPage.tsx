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
    <div className="flex flex-col gap-5">
      <div className="bg-white rounded-lg p-8 flex space-x-10 w-full items-center ">
        <GraphQLLogo className="h-24 w-24" />
        <div className="flex flex-col space-y-4">
          <p>
            Helicone leverages GraphQL, a powerful query language, to expose its
            data.
          </p>
          <p>
            Begin your journey with GraphQL by clicking the
            &quot;ExampleQuery&quot; button below.
          </p>
          <p className="flex space-x-2 items-center gap-1">
            For an immersive playground experience, visit our sandbox at
            <Link
              href="/api/graphql"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              www.helicone.ai/api/graphql
            </Link>
            .
          </p>
          <p className="flex space-x-2 items-center gap-1">
            For a deeper understanding of our GraphQL offering explore our
            documentation
            <Link
              href="https://docs.helicone.ai/graphql-api/getting-started"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              here
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="flex flex-row justify-between">
        <h1 className="text-2xl font-semibold flex flex-row gap-2 items-center">
          GraphQL Sandbox
          <button
            onClick={() => {
              router.push("/api/graphql");
            }}
          >
            <BsBoxArrowUpRight className="h-5 w-5 ml-2" />
          </button>
        </h1>
        <button
          onClick={() => setShowGraphqlHeader(!showGraphqlHeader)}
          className="pb-3"
        >
          {!showGraphqlHeader ? (
            <ChevronDownIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 transform rotate-180" />
          )}
        </button>
      </div>
      <div className="overflow-hidden h-[calc(60vh)] w-full">
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
