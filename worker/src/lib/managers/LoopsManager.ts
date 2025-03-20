import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Env } from "../..";
import { Database } from "../../../supabase/database.types";
import { safePut } from "../safePut";

const MAX_REQUESTS_PER_SECOND = 10;
const MAX_USERS_PER_PAGE = 1000;
const MAX_USER_PAGES = 100;

async function getAllUser(supabaseServer: SupabaseClient<Database>) {
  const allUsers: {
    id?: string;
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
          id: user.id,
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

  const { data: onboardedOrgs } = await supabaseServer
    .from("organization")
    .select("owner")
    .eq("has_onboarded", true)
    .eq("is_main_org", true);

  const cachedUserEmails: {
    email: string;
    tags: string[];
    has_onboarded?: boolean;
  }[] = JSON.parse((await env.UTILITY_KV.get("loop_user_emails_v10")) ?? "[]");

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
          id: user.id,
          tags: [user.tag ?? ""],
          firstName: user.first_name ?? "",
          lastName: user.last_name ?? "",
          created_at: user.created_at ?? new Date().toISOString(),
          updated_at: user.updated_at ?? new Date().toISOString(),
        });
      }
      return acc;
    }, [] as { email: string; id?: string; tags: string[]; firstName: string; lastName: string; created_at: string; updated_at: string }[])
    .filter((user) => {
      const found = cachedUserEmails.find((u) => {
        const allTagsMatch = u.tags.every((t) => user.tags.includes(t));
        const sameOnboardingStatus =
          u.has_onboarded ===
          (user.id
            ? onboardedOrgs?.some((org) => org.owner === user.id) ?? false
            : false);
        return u.email === user.email && allTagsMatch && sameOnboardingStatus;
      });
      return !found;
    });

  const newCache = cachedUserEmails.filter((u) =>
    newestUser.find((nu) => {
      return nu.email !== u.email || u.tags.every((t) => nu.tags.includes(t));
    })
  );

  // Create a Set of user IDs who have onboarded their organization
  const onboardedOwnerIds = new Set(
    onboardedOrgs?.map((org) => org.owner) || []
  );

  for (const user of newestUser) {
    const sleepPadding = 0.1;
    const sleepTime = 1000 / MAX_REQUESTS_PER_SECOND;
    await new Promise((resolve) =>
      setTimeout(resolve, sleepTime * (1 + sleepPadding))
    );

    const isOnboarded = user.id ? onboardedOwnerIds.has(user.id) : false;

    const body: Record<string, unknown> = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      has_onboarded: isOnboarded,
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
      has_onboarded: isOnboarded,
    });

    await safePut({
      key: env.UTILITY_KV,
      keyName: "loop_user_emails_v10",
      value: JSON.stringify(newCache),
      options: { expirationTtl: 60 * 60 * 24 }, // 1 day
    });
  }
}
