import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (supabaseUrl === "" || supabaseAnonKey === "") {
  throw new Error("URL or Anon ENV not set");
}

export async function hashAuth(key: string): Promise<string> {
  key = `Bearer ${key}`;
  const encoder = new TextEncoder();
  const hashedKey = await crypto.subtle.digest(
    { name: "SHA-256" },
    encoder.encode(key)
  );
  const byteArray = Array.from(new Uint8Array(hashedKey));
  const hexCodes = byteArray.map((value) => {
    const hexCode = value.toString(16);
    const paddedHexCode = hexCode.padStart(2, "0");
    return paddedHexCode;
  });
  console.log(hexCodes.join(""));
  return hexCodes.join("");
}

export const supabaseClientAuthHash = async (authhash: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: true },
    global: {
      headers: {
        authhash,
      },
    },
  });
