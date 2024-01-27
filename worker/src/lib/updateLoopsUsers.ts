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

  const cachedUserEmails: {
    email: string;
    tags: string[];
  }[] = JSON.parse((await env.UTILITY_KV.get("loop_user_emails_v10")) ?? "[]");

  console.log("Found", cachedUserEmails.length, "cached emails");
  const newestUser = allUsers
    .reduce((acc, user) => {
      const existingUser = acc.find((u) => u.email === user.email);
      if (existingUser) {
        existingUser.tags.push(user.tag ?? "");
        return acc;
      } else {
        const tags = user.tag ? [user.tag] : [];
        if (user.msft) {
          tags.push("msft");
        }
        acc.push({
          email: user.email,
          tags: [user.tag ?? ""],
          firstName: user.first_name ?? "",
          lastName: user.last_name ?? "",
          created_at: user.created_at ?? new Date().toISOString(),
          updated_at: user.updated_at ?? new Date().toISOString(),
        });
      }
      return acc;
    }, [] as { email: string; tags: string[]; firstName: string; lastName: string; created_at: string; updated_at: string }[])
    .filter((user) => {
      const found = cachedUserEmails.find((u) => {
        const allTagsMatch = u.tags.every((t) => user.tags.includes(t));
        return u.email === user.email && allTagsMatch;
      });
      return !found;
    })
    .splice(0, 100);

  console.log(`Adding ${newestUser.length} users`);
  // console.log(`Found ${newestUser.filter((u) => u.msft).length} msft users`);
  // console.log(
  //   `Found ${newestUser.filter((u) => !u.msft).length} non-msft users`
  // );
  const newCache = cachedUserEmails.filter((u) =>
    newestUser.find((nu) => {
      return nu.email !== u.email || u.tags.every((t) => nu.tags.includes(t));
    })
  );

  for (const user of newestUser) {
    console.log(`Updating user ${user.email}`);
    const sleepPadding = 0.1;
    const sleepTime = 1000 / MAX_REQUESTS_PER_SECOND;
    await new Promise((resolve) =>
      setTimeout(resolve, sleepTime * (1 + sleepPadding))
    );

    const body: Record<string, unknown> = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      created_at: user.created_at,
    };

    for (const tag of user.tags) {
      body[tag] = true;
    }

    const result = await fetch("https://app.loops.so/api/v1/contacts/update", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${env.LOOPS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    newCache.push({
      email: user.email,
      tags: user.tags,
    });

    console.log(
      `Updated user ${user.email} with result ${await result.text()}`
    );
    console.log(`adding back cached emails`, newCache.length);

    await env.UTILITY_KV.put("loop_user_emails_v10", JSON.stringify(newCache), {
      expirationTtl: 60 * 60 * 24, // 1 day
    });
  }
}
