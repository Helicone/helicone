import mainTypeDefs from "../../../lib/api/graphql/schema/main.graphql";

import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServer } from "apollo-server-micro";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { NextApiRequest, NextApiResponse } from "next";
import { GraphQLJSON } from "graphql-type-json";

// import "ts-tiny-invariant";

import NextCors from "nextjs-cors";
import { queryUser } from "../../../lib/api/graphql/query/user";
import { heliconeRequest } from "../../../lib/api/graphql/query/heliconeRequest";

// TODO BHU-21 We need to fix our N+1 queries and also have look aheads for what is queried. For now it is fine.

const resolvers = {
  JSON: GraphQLJSON,

  Query: {
    // apiKeys: () => {},
    // apiKey,
    heliconeRequest: heliconeRequest,
    user: queryUser,
    // requests:,
    // requestedPrompt,
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

const apolloServer = new ApolloServer({
  typeDefs: makeExecutableSchema({
    typeDefs: [mainTypeDefs],
    resolvers,
  }),
  resolvers,
  introspection: true,
  csrfPrevention: true,
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  context: contextFunction,
});
const startServer = apolloServer.start();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{}>
): Promise<void> {
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
