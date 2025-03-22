import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Env } from "../..";
import { Database } from "../../../supabase/database.types";
import { safePut } from "../safePut";

const MAX_REQUESTS_PER_SECOND = 10;
const MAX_USERS_PER_PAGE = 1000;
const MAX_USER_PAGES = 100;
const MAX_USERS_PER_RUN = 100; // Limit to 100 users per execution
const ONBOARDING_CHECK_START_DATE = new Date("2025-03-20T00:00:00Z");

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
    .select("owner")
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
  const onboardedOrgs = await getAllOnboardedOrgs(supabaseServer);

  const cachedUserEmails: {
    email: string;
    tags: string[];
    has_onboarded?: boolean;
  }[] = JSON.parse((await env.UTILITY_KV.get("loop_user_emails_v10")) ?? "[]");

  // Log initial stats
  console.log(
    `LoopsManager: Processing ${allUsers.length} users, ${
      cachedUserEmails.length
    } cached users, ${onboardedOrgs?.length || 0} onboarded orgs`
  );

  // Create fast lookup maps
  const onboardedOwnersMap = new Map();
  if (onboardedOrgs) {
    onboardedOrgs.forEach((org) => {
      onboardedOwnersMap.set(org.owner, true);
    });
  }
  console.log(
    `LoopsManager: Created onboarded owners map with ${onboardedOwnersMap.size} entries`
  );

  // Create a map of cached users for fast lookup
  const cachedUserEmailMap = new Map();
  cachedUserEmails.forEach((user) => {
    cachedUserEmailMap.set(user.email, {
      user,
      tagSet: new Set(user.tags),
      hasOnboarded: user.has_onboarded,
    });
  });
  console.log(
    `LoopsManager: Created cached user map with ${cachedUserEmailMap.size} entries`
  );

  // Track stats for debugging
  let mergedUsers = 0;
  let skippedUnchangedUsers = 0;
  let includedChangedUsers = 0;
  let newUsers = 0;

  // Process users more efficiently
  const newestUsers = allUsers.reduce((acc, user) => {
    const email = user.email;
    const existingUserIndex = acc.findIndex((u) => u.email === email);

    if (existingUserIndex >= 0) {
      // Just add tag to existing entry in accumulator
      if (user.tag) acc[existingUserIndex].tags.push(user.tag);
      mergedUsers++;
      return acc;
    } else {
      // Prepare new user entry
      const tags = user.tag ? [user.tag] : [];
      if (user.msft) tags.push("msft");

      // Check if we should include this user (pre-filter)
      const cachedUser = cachedUserEmailMap.get(email);
      if (cachedUser) {
        // O(1) lookups instead of array iterations
        const hasOnboarded = user.id ? onboardedOwnersMap.has(user.id) : false;

        const currentDate = new Date();
        const shouldCheckOnboarding =
          currentDate >= ONBOARDING_CHECK_START_DATE;

        // Log comparison details for debugging
        if (shouldCheckOnboarding && hasOnboarded !== cachedUser.hasOnboarded) {
          console.log(
            `LoopsManager: User ${email} onboarding status changed: ${cachedUser.hasOnboarded} -> ${hasOnboarded}`
          );
          includedChangedUsers++;
        } else {
          // Check for identical tag sets
          const userTags = new Set(tags);
          const cachedTags = cachedUser.tagSet;
          const tagsAdded = tags.filter((t) => !cachedTags.has(t));
          const tagsRemoved = Array.from(cachedTags as Set<string>).filter(
            (t) => !userTags.has(t)
          );

          // Log tag changes for debugging
          if (tagsAdded.length > 0 || tagsRemoved.length > 0) {
            console.log(`LoopsManager: User ${email} tags changed:`);
            if (tagsAdded.length > 0)
              console.log(`  Added: ${tagsAdded.join(", ")}`);
            if (tagsRemoved.length > 0)
              console.log(`  Removed: ${tagsRemoved.join(", ")}`);
            includedChangedUsers++;
          } else {
            console.log(`LoopsManager: Skipping unchanged user ${email}`);
            skippedUnchangedUsers++;
            return acc;
          }
        }
      } else {
        console.log(`LoopsManager: New user ${email}`);
        newUsers++;
      }

      // User is new or changed, add to result
      acc.push({
        email,
        id: user.id,
        tags,
        firstName: user.first_name ?? "",
        lastName: user.last_name ?? "",
        created_at: user.created_at ?? new Date().toISOString(),
        updated_at: user.updated_at ?? new Date().toISOString(),
      });

      return acc;
    }
  }, [] as { email: string; id?: string; tags: string[]; firstName: string; lastName: string; created_at: string; updated_at: string }[]);

  // Log final results
  console.log(`LoopsManager: Processing complete`);
  console.log(`  Total users: ${allUsers.length}`);
  console.log(`  Merged users: ${mergedUsers}`);
  console.log(`  Skipped unchanged: ${skippedUnchangedUsers}`);
  console.log(`  Changed users: ${includedChangedUsers}`);
  console.log(`  New users: ${newUsers}`);
  console.log(`  Final output size: ${newestUsers.length}`);

  // Create a Set of user IDs who have onboarded their organization
  const onboardedOwnerIds = new Set(
    onboardedOrgs?.map((org) => org.owner) || []
  );

  // Convert cache to a Map for efficient updates
  const cacheMap = new Map(cachedUserEmails.map((user) => [user.email, user]));

  // Limit to MAX_USERS_PER_RUN to prevent timeouts
  let usersToProcess = newestUsers;
  if (newestUsers.length > MAX_USERS_PER_RUN) {
    console.log(
      `Limiting to ${MAX_USERS_PER_RUN} users out of ${newestUsers.length} total. Remaining users will be processed in future runs.`
    );
    usersToProcess = newestUsers.slice(0, MAX_USERS_PER_RUN);
  }

  // Process in batches of 10 (MAX_REQUESTS_PER_SECOND)
  const batchSize = MAX_REQUESTS_PER_SECOND;
  for (let i = 0; i < usersToProcess.length; i += batchSize) {
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
        usersToProcess.length / batchSize
      )}`
    );

    const batch = usersToProcess.slice(i, i + batchSize);

    // Process batch in parallel
    await Promise.all(
      batch.map(async (user) => {
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

        try {
          await fetch("https://app.loops.so/api/v1/contacts/update", {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${env.LOOPS_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });

          // Update cache - simple Map set
          cacheMap.set(user.email, {
            email: user.email,
            tags: user.tags,
            has_onboarded: isOnboarded,
          });
        } catch (error) {
          console.error(`Error updating user ${user.email} in Loops:`, error);
        }
      })
    );

    // Update KV once per batch
    await safePut({
      key: env.UTILITY_KV,
      keyName: "loop_user_emails_v10",
      value: JSON.stringify(Array.from(cacheMap.values())),
      options: { expirationTtl: 60 * 60 * 24 }, // 1 day
    });

    // Wait 1 second between batches to respect rate limit
    if (i + batchSize < usersToProcess.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
