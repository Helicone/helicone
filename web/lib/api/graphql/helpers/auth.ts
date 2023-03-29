import { ApolloError } from "apollo-server-errors";
import { hashAuth } from "../../../supabaseClient";
import { supabaseServer } from "../../../supabaseServer";

export async function getUserOrThrow(auth: string): Promise<string> {
  const removedBearer = auth.replace("Bearer ", "").trim();
  const hashedApiKey = await hashAuth(removedBearer);
  const { data, error } = await supabaseServer
    .from("helicone_api_keys")
    .select("*")
    .eq("api_key_hash", hashedApiKey)
    .single();

  if (error != null) {
    throw new ApolloError(
      "Need to add the authentication header. More information at docs.bhunk.io/playground.",
      "UNAUTHENTICATED"
    );
  }
  return data.user_id;
}
