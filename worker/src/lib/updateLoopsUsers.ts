import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Env } from "..";
import { Database } from "../../supabase/database.types";

const MAX_REQUESTS_PER_SECOND = 10;
const MAX_USERS_PER_PAGE = 1000;
const MAX_USER_PAGES = 100;

async function getAllUser(supabaseServer: SupabaseClient<Database>) {
  const allUsers: {
    email: string;
    msft: boolean;
    first_name?: string;
    last_name?: string;
    created_at?: string;
    updated_at?: string;
    tag?: string;
  }[] = [];

  const { data: contactUs, error: contactUsError } = await supabaseServer
    .from("contact_submissions")
    .select("*");

  if (contactUsError) {
    console.error(`Error fetching contact_us: ${contactUsError}`);
    return [];
  }
  allUsers.push(
    ...contactUs.map((user) => ({
      msft: user.tag === "mfs",
      tag: user.tag ?? undefined,
      email: user.email_address ?? "",
      first_name: user.first_name ?? undefined,
      last_name: user.last_name ?? undefined,
      created_at: user.created_at ?? undefined,
    }))
  );

  for (let i = 0; i < MAX_USER_PAGES; i++) {
    const { data: users, error } = await supabaseServer.auth.admin.listUsers({
      page: i,
      perPage: MAX_USERS_PER_PAGE,
    });
    if (error) {
      console.error(`Error fetching users: ${error}`);
      return [];
    }

    if (!users || users.length === 0) {
      break;
    }

    allUsers.push(
      ...users.users
        .filter(
          (user) =>
            user.email !== undefined &&
            user.email !== null &&
            user.email.length > 0 &&
            allUsers.find((u) => u.email === user.email) === undefined
        )
        .map((user) => ({
          msft: false,
          email: user.email ?? "",
          created_at: user.created_at,
          updated_at: user.updated_at,
        }))
    );
  }
  return allUsers;
}
export async function updateLoopUsers(env: Env) {
  const supabaseServer = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
  const allUsers = await getAllUser(supabaseServer);

  const cachedUserEmails: string[] = JSON.parse(
    (await env.UTILITY_KV.get("loop_user_emails")) ?? "[]"
  );

  const newestUser = allUsers
    .filter((user) => cachedUserEmails.includes(user.email) === false)
    .filter((user) => {
      if (user.created_at === undefined) {
        return false;
      }
      const createdAt = new Date(user.created_at);
      // Get new users in the last 7 days
      return createdAt.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
    });

  console.log(`Found ${newestUser.length} users`);
  console.log(`Found ${newestUser.filter((u) => u.msft).length} msft users`);
  console.log(
    `Found ${newestUser.filter((u) => !u.msft).length} non-msft users`
  );

  for (const user of newestUser) {
    const sleepPadding = 0.1;
    const sleepTime = 1000 / MAX_REQUESTS_PER_SECOND;
    await new Promise((resolve) =>
      setTimeout(resolve, sleepTime * (1 + sleepPadding))
    );
    const result = await fetch("https://app.loops.so/api/v1/contacts/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.LOOPS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userGroup: user.tag,
        created_at: new Date(user.created_at ?? 0).toISOString(),
        updated_at: new Date(user.updated_at ?? 0).toISOString(),
      }),
    });

    const resultJson = await result.json<{
      message?: string;
      result: "success" | "error";
    }>();

    if (
      resultJson.result === "success" ||
      resultJson.message?.includes("Email already on list")
    ) {
      cachedUserEmails.push(user.email);
    }

    await env.UTILITY_KV.put(
      "loop_user_emails",
      JSON.stringify(cachedUserEmails)
    );
  }
}
