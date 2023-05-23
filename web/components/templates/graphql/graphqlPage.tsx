import { ApolloExplorer } from "@apollo/explorer/react";

import { ApolloSandbox } from "@apollo/sandbox/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { clsx } from "../../shared/clsx";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { BsGearFill } from "react-icons/bs";
import GraphQLLogo from "./logo";
import { BsBoxArrowUpRight } from "react-icons/bs";

interface GraphQLPageProps {}

const DEFAULT_EXAMPLE_QUERY = `query {
  user(id: "1") {
    id
    name
    email
  }
}`;

const GraphQLPage = (props: GraphQLPageProps) => {
  //TODO add support for changing query after this https://github.com/apollographql/embeddable-explorer/issues/258
  const router = useRouter();

  const [showGraphqlHeader, setShowGraphqlHeader] = useState<boolean>(false);
  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white w-full rounded-md p-10 flex flex-row gap-5">
        <GraphQLLogo className="h-10" />
        <div className="flex flex-col"></div>
      </div>

      <div className="flex flex-row justify-between">
        <h1 className="text-2xl font-semibold flex flex-row gap-2 items-center">
          GraphQL Playground
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
          <BsGearFill className="h-5 w-5" />
        </button>
      </div>
      <div className="overflow-hidden h-[calc(60vh)] w-full">
        <ApolloExplorer
          graphRef={"helicone@main"}
          initialState={{
            document: DEFAULT_EXAMPLE_QUERY,
            displayOptions: {
              theme: "light",
              docsPanelState: "closed",
              showHeadersAndEnvVars: false,
            },
          }}
          className={clsx(showGraphqlHeader || "-mt-14", "h-full")}
          runTelemetry={false}
        />
      </div>
    </div>
  );
};

export default GraphQLPage;
