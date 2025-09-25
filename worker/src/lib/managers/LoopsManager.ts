import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
import { safePut } from "../safePut";

const MAX_REQUESTS_PER_SECOND = 10;
const MAX_USERS_PER_PAGE = 1000;
const MAX_USER_PAGES = 100;
const MAX_USERS_PER_RUN = 100; // Limit to 100 users per execution
const ONBOARDING_CHECK_START_DATE = new Date("2025-03-20T00:00:00Z");

// Type definitions
type CachedUser = {
  email: string;
  tags: string[];
  has_onboarded?: boolean;
};

type CachedUserMap = {
  tags: Set<string>;
  hasOnboarded?: boolean;
};

type UserToProcess = {
  email: string;
  id?: string;
  tags: string[];
  firstName: string;
  lastName: string;
  created_at: string;
  updated_at: string;
  hasOnboarded: boolean;
  onboardingStatusChanged: boolean;
  needsUpdate: boolean;
};

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

async function getAllOnboardedOrgs(supabaseServer: SupabaseClient<Database>) {
  const { data: orgs, error } = await supabaseServer
    .from("organization")
    .select("owner, id")
    .eq("has_onboarded", true)
    .eq("is_main_org", true);

  if (error) {
    console.error(`Error fetching organizations: ${error}`);
    return [];
  }

  return orgs || [];
}

export async function updateLoopUsers(env: Env) {
  const supabaseServer = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const allUsers = await getAllUser(supabaseServer);

  if (!allUsers || allUsers.length === 0) {
    console.log("LoopsManager: No matching users found, exiting early");
    return;
  }

  const onboardedOrgs = await getAllOnboardedOrgs(supabaseServer);

  const cachedUserEmails: CachedUser[] = JSON.parse(
    (await env.UTILITY_KV.get("loop_user_emails_v10")) ?? "[]"
  );

  // Create fast lookup maps
  const onboardedOwnersMap = new Map(
    (onboardedOrgs || []).map((org) => [org.owner, true])
  );

  // Create a map of cached users for fast lookup
  const cachedUserEmailMap = new Map<string, CachedUserMap>(
    cachedUserEmails.map((user) => [
      user.email,
      {
        tags: new Set<string>(user.tags),
        hasOnboarded: user.has_onboarded,
      },
    ])
  );

  // Create a map to efficiently merge duplicate users
  const uniqueUsersMap = new Map();

  // First pass - merge duplicate users by email
  for (const user of allUsers) {
    if (!user.email) continue;

    const existing = uniqueUsersMap.get(user.email);

    if (existing) {
      // Merge data
      if (user.tag) existing.tags.push(user.tag);
      if (user.id) existing.id = user.id;
      if (user.first_name) existing.firstName = user.first_name;
      if (user.last_name) existing.lastName = user.last_name;
      if (user.created_at) existing.created_at = user.created_at;
      if (user.updated_at) existing.updated_at = user.updated_at;
    } else {
      // Create new entry
      uniqueUsersMap.set(user.email, {
        email: user.email,
        id: user.id,
        tags: user.tag ? [user.tag] : user.msft ? ["msft"] : [],
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.updated_at || new Date().toISOString(),
        hasOnboarded: false, // Will be set in second pass
        onboardingStatusChanged: false, // Will be set in second pass
        needsUpdate: false, // Will be set in second pass
      });

      if (user.msft && !user.tag) {
        uniqueUsersMap.get(user.email).tags.push("msft");
      }
    }
  }

  // Second pass - determine which users need updates
  const usersToProcess: UserToProcess[] = [];

  // Log date check info
  const currentDate = new Date();
  const checkingOnboardingEnabled = currentDate >= ONBOARDING_CHECK_START_DATE;
  console.log(
    `LoopsManager: Onboarding check enabled: ${checkingOnboardingEnabled} (current date: ${currentDate.toISOString()}, start date: ${ONBOARDING_CHECK_START_DATE.toISOString()})`
  );

  // Early exit optimization: stop processing once we have MAX_USERS_PER_RUN users to update
  for (const [email, userData] of uniqueUsersMap.entries()) {
    // Early exit check - stop processing once we have enough users
    if (usersToProcess.length >= MAX_USERS_PER_RUN) {
      console.log(
        `LoopsManager: Early exit - found ${MAX_USERS_PER_RUN} users to update, stopping processing`
      );
      break;
    }

    const cachedUser = cachedUserEmailMap.get(email);
    const hasOnboarded = userData.id
      ? onboardedOwnersMap.has(userData.id)
      : false;

    // Set the onboarded status
    userData.hasOnboarded = hasOnboarded;

    let needsUpdate = false;
    let onboardingStatusChanged = false;

    if (cachedUser) {
      // Check if onboarding status changed
      const currentDate = new Date();
      const shouldCheckOnboarding = currentDate >= ONBOARDING_CHECK_START_DATE;

      if (shouldCheckOnboarding && hasOnboarded !== cachedUser.hasOnboarded) {
        console.log(
          `LoopsManager: User ${email} onboarding status changed: ${cachedUser.hasOnboarded} -> ${hasOnboarded}`
        );
        onboardingStatusChanged = true;
        needsUpdate = true;
      } else if (hasOnboarded !== cachedUser.hasOnboarded) {
        console.log(
          `LoopsManager: User ${email} onboarding status changed but check is disabled: ${cachedUser.hasOnboarded} -> ${hasOnboarded}`
        );
      }

      // Check if tags changed
      const userTagsSet = new Set<string>(userData.tags);
      const tagsAdded = userData.tags.filter(
        (t: string) => !cachedUser.tags.has(t)
      );
      const tagsRemoved = Array.from(cachedUser.tags).filter(
        (t: string) => !userTagsSet.has(t)
      );

      if (tagsAdded.length > 0 || tagsRemoved.length > 0) {
        console.log(`LoopsManager: User ${email} tags changed:`);
        if (tagsAdded.length > 0)
          console.log(`  Added: ${tagsAdded.join(", ")}`);
        if (tagsRemoved.length > 0)
          console.log(`  Removed: ${tagsRemoved.join(", ")}`);
        needsUpdate = true;
      }
    } else {
      // New user
      console.log(`LoopsManager: New user ${email}`);
      needsUpdate = true;
    }

    userData.onboardingStatusChanged = onboardingStatusChanged;
    userData.needsUpdate = needsUpdate;

    // Only add users that need updates to the processing list
    if (needsUpdate) {
      usersToProcess.push(userData);
    }
  }

  // Since we're exiting early, we don't need to slice the array anymore
  const loopsUpdates = usersToProcess;

  // Update local cache
  const cacheMap = new Map(cachedUserEmails.map((user) => [user.email, user]));

  // Process in batches
  const batchSize = MAX_REQUESTS_PER_SECOND;
  for (let i = 0; i < loopsUpdates.length; i += batchSize) {
    const batch = loopsUpdates.slice(i, i + batchSize);

    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
        loopsUpdates.length / batchSize
      )}`
    );

    // Process Loops updates in parallel
    await Promise.all(
      batch.map(async (user) => {
        const body: Record<string, unknown> = {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          has_onboarded: user.hasOnboarded,
          created_at: user.created_at,
        };

        for (const tag of user.tags) {
          body[tag] = true;
        }

        try {
          await fetch("https://app.loops.so/api/v1/contacts/update", {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${env.LOOPS_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });

          // Update cache
          cacheMap.set(user.email, {
            email: user.email,
            tags: user.tags,
            has_onboarded: user.hasOnboarded,
          });

          console.log(`LoopsManager: Updated user ${user.email} in Loops`);
        } catch (error) {
          console.error(`Error updating user ${user.email} in Loops:`, error);
        }
      })
    );

    // Update KV cache after each batch
    await safePut({
      key: env.UTILITY_KV,
      keyName: "loop_user_emails_v10",
      value: JSON.stringify(Array.from(cacheMap.values())),
      options: { expirationTtl: 60 * 60 * 24 }, // 1 day
    });

    // Respect rate limits
    if (i + batchSize < loopsUpdates.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
