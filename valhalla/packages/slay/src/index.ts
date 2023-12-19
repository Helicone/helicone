import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import { readFileSync } from "fs";
import http from "http";
import { QueryResolvers } from "./generated/graphql";
import bodyParser from "body-parser";
import { withAuth } from "helicone-shared-ts";
import { IRouterWrapperAuth } from "helicone-shared-ts/dist/routers/iRouterWrapper";
import { GraphQLJSON } from "graphql-type-json";
import { config as dotEnvConfig } from "dotenv";
import { Result, err, ok } from "helicone-shared-ts";
import { ApolloError } from "apollo-server-core";

dotEnvConfig({
  path: "./.env",
});

const graphQLFile =
  process.env.GRAPHQL_SCHEMA_FILE ?? `./packages/slay/src/schema/main.graphql`;
const typeDefs = readFileSync(graphQLFile, { encoding: "utf-8" });
export type HeliconeQueryResolvers = QueryResolvers<
  IRouterWrapperAuth<unknown> | "noAuth"
>;

const queryResolvers: HeliconeQueryResolvers = {
  heliconeRequest: (_, requestArgs, contextValue) => {
    if (contextValue === "noAuth") throw new ApolloError("No auth");
    const { db } = contextValue;

    return [];
  },
  // getIntrospectionQuery: getIntrospectionQuery,
};

const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);

const server = new ApolloServer({
  typeDefs,
  resolvers: {
    JSON: GraphQLJSON,
    Query: queryResolvers,
  },
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();
app.use("/helicone-health", (req, res) => {
  res.send("OK");
});
app.use(
  "/",
  bodyParser.json({ limit: "50mb" }),
  expressMiddleware(server, {
    context: async ({ req, res }) => {
      if (req.body.operationName === "IntrospectionQuery") {
        return "noAuth";
      }

      const auth: Result<
        IRouterWrapperAuth<unknown>,
        string
      > = await new Promise(async (resolve) => {
        try {
          setTimeout(() => {
            resolve(err("Auth timed out"));
          }, 3000);
          await withAuth(async (params) => {
            resolve(ok(params));
          }, true)(req, res);
        } catch (e) {
          resolve(err(`auth error ${JSON.stringify(e)}`));
        }
      });
      if (auth.error || !auth.data) {
        throw new ApolloError(`Auth error: ${auth.error}`);
      }

      return auth.data;
    },
  })
);
await new Promise<void>((resolve) =>
  httpServer.listen(
    {
      port: 4000,
      host: process.env.HOST ?? "127.0.0.1",
    },
    resolve
  )
);

console.log(
  `🚀  Server ready at: http://${process.env.HOST ?? "127.0.0.1"}:${4000}`
);
