import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseServer } from "../../../lib/supabaseServer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed", data: null });
  }

  const { firstName, lastName, email, companyName, companyDescription, tag } =
    req.body;

  const { error } = await supabaseServer().from("contact_submissions").insert({
    first_name: firstName,
    last_name: lastName,
    email_address: email,
    company_name: companyName,
    company_description: companyDescription,
    tag: tag,
  });

  if (error) {
    console.error("Failed to submit contact form");
    res.status(500).json({
      error: "Failed to submit contact form",
      data: null,
    });
    return;
  }

  res.status(200).json({
    error: null,
    data: "Success",
  });
}
