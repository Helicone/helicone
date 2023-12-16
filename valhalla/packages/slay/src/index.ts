import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import cors from "cors";
import express from "express";
import { readFileSync } from "fs";
import http from "http";
import { QueryResolvers } from "./generated/graphql";
import bodyParser from "body-parser";
import { withAuth } from "helicone-shared-ts";
import { IRouterWrapperAuth } from "helicone-shared-ts/dist/routers/iRouterWrapper";

const graphQLFile =
  process.env.GRAPHQL_SCHEMA_FILE ?? `./packages/slay/src/schema/main.graphql`;
const typeDefs = readFileSync(graphQLFile, { encoding: "utf-8" });

const queryResolvers: QueryResolvers<IRouterWrapperAuth<unknown>> = {
  heliconeRequest: (_, requestArgs, contextValue) => {
    return [];
  },
};

const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);

const server = new ApolloServer({
  typeDefs,
  resolvers: {
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
      const auth: Promise<IRouterWrapperAuth<unknown>> = new Promise(
        async (resolve) => {
          await withAuth((params) => {
            resolve(params);
          })(req, res);
        }
      );
      return auth;
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
