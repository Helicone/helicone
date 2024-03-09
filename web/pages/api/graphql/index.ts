import mainTypeDefs from "../../../lib/api/graphql/schema/main.graphql";

import { makeExecutableSchema } from "@graphql-tools/schema";
import {
  ApolloError,
  ApolloServerPluginLandingPageProductionDefault,
} from "apollo-server-core";
import { ApolloServer } from "apollo-server-micro";
import { GraphQLJSON } from "graphql-type-json";
import { NextApiRequest, NextApiResponse } from "next";

// import "ts-tiny-invariant";

import NextCors from "nextjs-cors";
import { getOrgIdOrThrow as getOrgIdOrThrowFromApiKey } from "../../../lib/api/graphql/helpers/auth";
import { heliconeRequest } from "../../../lib/api/graphql/query/heliconeRequest";
import { queryUser } from "../../../lib/api/graphql/query/user";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";
import { DEFAULT_EXAMPLE_QUERY } from "../../../components/templates/graphql/graphqlPage";
import { aggregatedHeliconeRequest } from "../../../lib/api/graphql/query/aggregatedHeliconeRequest";
import { heliconeJob } from "../../../lib/api/graphql/query/heliconeJob";
import { heliconeNode } from "../../../lib/api/graphql/query/heliconeNode";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import { PostHog } from "posthog-node";

const resolvers = {
  JSON: GraphQLJSON,

  Query: {
    heliconeRequest: heliconeRequest,
    aggregatedHeliconeRequest: aggregatedHeliconeRequest,
    user: queryUser,
    heliconeJob: heliconeJob,
    heliconeNode: heliconeNode,
  },
  // Mutation: {
  //   // requestNewPrompt,
  // },
};

export interface Context {
  getOrgIdOrThrow: () => Promise<string>;
}

async function getOrgIdOrThrow(req: NextApiRequest, res: NextApiResponse) {
  if (req.headers["use-cookies"] === "true") {
    const supabaseClient = new SupabaseServerWrapper({
      req,
      res,
    });
    const { data, error } = await supabaseClient.getUserAndOrg();

    if (error !== null || !data.orgId || !data.userId) {
      throw new ApolloError("Unauthorized", "401");
    }
    return data.orgId;
  } else {
    return await getOrgIdOrThrowFromApiKey(req.headers.authorization ?? "");
  }
}

async function getContext(orgId: string): Promise<Context> {
  return {
    getOrgIdOrThrow: async () => orgId,
  };
}

async function checkRateLimit(orgId: string) {
  const ratelimit = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(100, "60 s"),
  });

  return ratelimit.limit(orgId);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{}>
): Promise<void> {
  let context: Promise<Context> | null = null;
  if (req.method === "POST") {
    let orgId = "";
    try {
      orgId = await getOrgIdOrThrow(req, res);
    } catch (e) {
      res.status(401).json({ error: "Unauthorized", data: null });
      return;
    }
    context = getContext(orgId);

    const rateLimit = await checkRateLimit(`graphql-${orgId}`);

    if (process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
      const client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
        host: "https://app.posthog.com",
      });

      client.capture({
        distinctId: "server",
        event: "graphql",
        properties: {
          orgId,
          wasRateLimited: rateLimit.success,
          url: req.url,
          method: req.method,
          body: req.body,
        },
      });
    }
    if (!rateLimit.success) {
      console.error("Rate limit exceeded", orgId);
      res.status(429).json({
        error:
          "Rate limit exceeded, contact support@helicone.ai to increase your rate limit",
        data: null,
      });
      return;
    }
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
        document: DEFAULT_EXAMPLE_QUERY,
        variables: {
          limit: 10,
          offset: 0,
        },
        includeCookies: true,
        graphRef: "helicone@main",
        embed: {
          persistExplorerState: true,
        },
      }),
    ],
    context: () => context,
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
