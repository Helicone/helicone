import mainTypeDefs from "../../../lib/api/graphql/schema/main.graphql";

import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServer } from "apollo-server-micro";
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageProductionDefault,
} from "apollo-server-core";
import { NextApiRequest, NextApiResponse } from "next";
import { GraphQLJSON } from "graphql-type-json";

// import "ts-tiny-invariant";

import NextCors from "nextjs-cors";
import { queryUser } from "../../../lib/api/graphql/query/user";
import { heliconeRequest } from "../../../lib/api/graphql/query/heliconeRequest";

const resolvers = {
  JSON: GraphQLJSON,

  Query: {
    heliconeRequest: heliconeRequest,
    user: queryUser,
  },
  // Mutation: {
  //   // requestNewPrompt,
  // },
};

export interface Context {
  auth: string;
}

function contextFunction(ctx: any): Context {
  return {
    auth: ctx.req.headers.authorization ?? "",
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{}>
): Promise<void> {
  if (req.url === "/api/graphql") {
    console.log("redirecting to playground");
  }
  const apolloServer = new ApolloServer({
    typeDefs: makeExecutableSchema({
      typeDefs: [mainTypeDefs],
      resolvers,
    }),
    resolvers,
    introspection: true,
    csrfPrevention: true,
    plugins: [
      // self hosting playground is deprecated :(
      // https://www.apollographql.com/docs/apollo-server/api/plugin/landing-pages/#graphql-playground-landing-page
      // so now we have to use this hosted crappy version
      ApolloServerPluginLandingPageProductionDefault({
        footer: false,
        document: "HELLO",
        includeCookies: true,
        graphRef: "helicone@main",
        embed: {
          persistExplorerState: true,
          displayOptions: {
            theme: "light",
            showHeadersAndEnvVars: false,
            docsPanelState: "closed",
          },
        },
      }),
    ],
    context: contextFunction,
  });
  const startServer = apolloServer.start();

  await NextCors(req, res, {
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    origin: "*",
    optionsSuccessStatus: 200,
  });
  await startServer;
  await apolloServer.createHandler({
    path: "/api/graphql",
  })(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
