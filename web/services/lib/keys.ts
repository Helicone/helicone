import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { middleTruncString } from "../../lib/stringHelpers";
import { Database } from "../../supabase/database.types";

const useKeys = () => {
  const supabaseClient = useSupabaseClient<Database>();

  const addKey = async (
    apiKey: string,
    hashedApiKey: string,
    userId: string,
    callback?: () => void,
    errorCallback?: (error: string) => void
  ) => {
    supabaseClient
      .from("user_api_keys")
      .insert([
        {
          user_id: userId,
          api_key_hash: hashedApiKey,
          api_key_preview: middleTruncString(apiKey, 8),
        },
      ])
      .then((res) => {
        if (res.error && errorCallback) {
          console.error(res.error);
          errorCallback(
            `Error saving key - please contact us on discord!\n${res.error.message}`
          );
        }
        if (callback) callback();
      });
  };

  const getKeys = async (errorCallback?: (error: string) => void) => {
    const { data, error } = await supabaseClient
      .from("user_api_keys")
      .select("*");
    if (error && errorCallback) {
      errorCallback(
        `Error getting keys - please contact us on discord!\n${error.message}`
      );
    }
    if (!data) {
      return [];
    }
    data.forEach((key) => {
      key.created_at = new Date(key.created_at).toLocaleString();
    });
    return data;
  };

  const apiKeys = getKeys();

  return {
    apiKeys,
    addKey,
    getKeys,
  };
};

export default useKeys;
