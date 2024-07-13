import type { NextApiRequest, NextApiResponse } from "next";

type UserRecord = {
  id: string;
  email: string | null;
  email_confirmed_at: string | null;
  invited_at: string | null;
  last_sign_in_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  phone: string | null;
  confirmed_at: string | null;
  raw_user_meta_data: {
    name?: string;
    email?: string;
    full_name?: string;
    picture?: string;
    avatar_url?: string;
    provider_id?: string;
    email_verified?: boolean;
  } | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const payload = req.body;

    if (payload.type !== "INSERT") {
      return res
        .status(400)
        .json({ message: "Only INSERT payloads are processed" });
    }

    const record = payload.record as UserRecord;

    await postToClay({
      email: record.email || record.raw_user_meta_data?.email || undefined,
      name: record.raw_user_meta_data?.name || undefined,
      full_name: record.raw_user_meta_data?.full_name || undefined,
      avatar_url:
        record.raw_user_meta_data?.avatar_url ||
        record.raw_user_meta_data?.picture ||
        undefined,
      source: "google", // Assuming this is always a Google sign-up
      email_confirmed_at: record.email_confirmed_at || undefined,
      invited_at: record.invited_at || undefined,
      last_sign_in_at: record.last_sign_in_at || undefined,
      created_at: record.created_at || undefined,
      updated_at: record.updated_at || undefined,
      phone: record.phone || undefined,
      confirmed_at: record.confirmed_at || undefined,
    });

    res.status(200).json({ message: "Data posted to Clay successfully" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function postToClay(data: {
  email?: string;
  name?: string;
  full_name?: string;
  avatar_url?: string;
  source: string;
  email_confirmed_at?: string;
  invited_at?: string;
  last_sign_in_at?: string;
  created_at?: string;
  updated_at?: string;
  phone?: string;
  confirmed_at?: string;
}) {
  if (!process.env.CLAY_WEBHOOK_URL) {
    throw new Error("CLAY_WEBHOOK_URL is not defined");
  }

  const response = await fetch(process.env.CLAY_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to post to Clay");
  }
}
