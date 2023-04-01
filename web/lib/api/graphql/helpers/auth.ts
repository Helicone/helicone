import { ApolloError } from "apollo-server-errors";
import { hashAuth } from "../../../hashGraphQL";

import { supabaseServer } from "../../../supabaseServer";

export async function getUserOrThrow(auth: string): Promise<string> {
  if (!auth.includes("Bearer ")) {
    throw new ApolloError(
      "Authorization must include the Bearer keyword. More information at docs.helicone.ai/playground.",
      "UNAUTHENTICATED"
    );
  }
  const removedBearer = auth.replace("Bearer ", "").trim();
  const hashedApiKey = await hashAuth(removedBearer);
  const { data, error } = await supabaseServer
    .from("helicone_api_keys")
    .select("*")
    .eq("api_key_hash", hashedApiKey)
    .single();

  if (error != null) {
    throw new ApolloError(
      "Need to add the authentication header. More information at docs.helicone.ai/playground.",
      "UNAUTHENTICATED"
    );
  }
  return data.user_id;
}
