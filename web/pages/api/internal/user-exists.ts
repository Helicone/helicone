import type { NextApiRequest, NextApiResponse } from "next";
import { dbExecute } from "@/lib/api/db/dbExecute";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Missing or invalid email" });
  }
  try {
    const { data, error } = await dbExecute(
      "SELECT id FROM \"user\" WHERE email = $1 LIMIT 1",
      [email]
    );
    if (error) {
      console.error("Error querying user existence:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.status(200).json({ exists: !!(data && data.length > 0) });
  } catch (e) {
    console.error("Error checking user existence:", e);
    res.status(500).json({ error: "Internal server error" });
  }
} 